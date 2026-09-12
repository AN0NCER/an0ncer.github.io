import { TEvents } from "../pages/watch/utils/util.event.js";
import { Collections as API } from "./api.tunime.js";
import { Hub } from "../core/hub.core.js";
import { OAuth } from "../core/main.core.js";
import { Favorites, Users } from "./api.shiki.js";
import { Sleep } from "./functions.js";

/**
 * Управление коллекциями пользователя (замена modules/Collection.js).
 *
 * localStorage здесь кэш, а не хранилище: интерфейс рисуется из него
 * мгновенно, данные подтягиваются следом.
 *
 * Синхронизация идёт по маркеру (`rev`), а не выгрузкой всего списка:
 * клиент отправляет своё значение, и если оно совпало с серверным, ответ
 * приходит без данных — Firestore на той стороне не читается вовсе.
 * Маркер приезжает из /login, /login/confirm, /keep-alive и /shiki/auth
 * через Hub.onMeta, а также в ответах собственных мутаций.
 *
 * Маркер всегда хранится в паре с `uid`: счётчики у разных пользователей
 * растут независимо и значения легко совпадают, поэтому при смене аккаунта
 * на устройстве кэш сбрасывается целиком — иначе новый пользователь увидел
 * бы чужие коллекции и избранное.
 *
 * Структура:
 *   SyncSource    - база: очередь неотправленных операций и их досылка
 *   TunimeSource  - коллекции на сервере Tunime, сверка по updatedAt
 *   ShikiSource   - избранное Shikimori, сверка по составу списка
 *   Collections   - фасад: единый список, общий sync, события наружу
 */

/** Ключи в localStorage */
const KEY = {
    DATA: 'tun-collections',
    QUEUE: 'tun-collections-queue',
    FAV: 'tun-favourites',
    FAV_QUEUE: 'tun-favourites-queue',
    SYNC: 'tun-collections-sync',
    REV: 'tun-collections-rev'
};

/** Идентификатор виртуальной коллекции избранного Shikimori */
const FAVOURITES = 'favourites';

/** Как часто разрешаем автосинхронизацию (мс) */
const SYNC_COOLDOWN = 60000;

/**
 * Сколько вкладка должна пробыть скрытой, чтобы возвращение на неё
 * считалось поводом обновиться принудительно. Без этого порога быстрое
 * переключение между вкладками дёргало бы сеть на каждый щелчок.
 */
const HIDDEN_THRESHOLD = 15000;

/**
 * Как часто игнорировать маркер и выкачивать всё целиком.
 *
 * Маркер живёт в RTDB, а сами коллекции в Firestore — атомарно вместе они
 * не пишутся. Если данные записались, а маркер не поднялся, клиент будет
 * считать себя актуальным. Одна полная сверка в сутки лечит такой случай.
 */
const FULL_SYNC_INTERVAL = 24 * 60 * 60 * 1000;

const iso = () => new Date().toISOString();

/** Свежее ли a, чем b */
const isNewer = (a, b) => (Date.parse(a ?? 0) || 0) > (Date.parse(b ?? 0) || 0);

/**
 * Одно значение или список — к массиву чисел без дублей и мусора
 * @param {number|number[]} value
 * @returns {number[]}
 */
const toList = (value) => [...new Set(
    (Array.isArray(value) ? value : [value])
        .map(Number)
        .filter(id => Number.isFinite(id) && id > 0)
)];

const storage = {
    read(key, fallback = null) {
        try {
            return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback;
        } catch {
            localStorage.removeItem(key);
            return fallback;
        }
    },
    write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

/**
 * Общая часть источников: очередь операций, не доехавших до сервера,
 * и их повтор при следующей синхронизации.
 *
 * События источника: 'error', плюс свои у наследников.
 */
class SyncSource extends TEvents {
    /**
     * @param {string} queueKey ключ очереди в localStorage
     */
    constructor(queueKey) {
        super();
        this.queueKey = queueKey;
    }

    /**
     * Очередь не держится в памяти: источник истины — localStorage.
     * Иначе вкладки затирали бы работу друг друга, а после отправки из
     * соседней вкладки локальная копия воскрешала бы уже отправленное.
     * @type {Array<Object>}
     */
    get queue() {
        return storage.read(this.queueKey, []) ?? [];
    }

    /** Сколько операций ждёт отправки */
    get pending() {
        return this.queue.length;
    }

    /**
     * Отправка с откладыванием при неудаче.
     * @param {() => Promise<{complete:boolean, status:number}>} request
     * @param {Object} op описание операции для повтора
     */
    async send(request, op) {
        if (!navigator.onLine) {
            this.enqueue(op);
            return null;
        }

        const response = await request();

        // 5xx и сетевые — повторим позже; 4xx повторять бессмысленно
        if (!response.complete && (response.status >= 500 || response.status === 600)) {
            this.enqueue(op);
        } else if (!response.complete) {
            this.trigger('error', { type: op.op, response });
        }

        return response;
    }

    enqueue(op) {
        const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        const queue = this.queue;

        queue.push({ ...op, id, ts: Date.now() });
        storage.write(this.queueKey, queue);
    }

    /** Прогон очереди. Неудачные операции остаются до следующего раза. */
    async flush() {
        const queue = this.queue;

        if (queue.length === 0 || !navigator.onLine) return;

        // Замок: без него две вкладки отправили бы одну операцию дважды
        // (для create это дало бы дубль коллекции)
        if (!this.#lock()) return;

        const failed = [];

        try {
            for (const op of queue) {
                try {
                    const done = await this.applyOp(op);
                    if (!done) failed.push(op);
                } catch {
                    failed.push(op);
                }
            }
        } finally {
            // Пока отправляли, соседняя вкладка могла добавить свои
            // операции — их не трогаем, убираем только обработанные
            const processed = new Set(queue.map(op => op.id));
            const fresh = this.queue.filter(op => !processed.has(op.id));

            storage.write(this.queueKey, [...fresh, ...failed]);
            this.#unlock();
        }
    }

    get #lockKey() {
        return `${this.queueKey}:lock`;
    }

    /** @returns {boolean} удалось ли взять замок */
    #lock() {
        const held = storage.read(this.#lockKey, 0);

        // Просроченный замок (вкладку закрыли посреди отправки) — забираем
        if (held && Date.now() - held < 30000) return false;

        storage.write(this.#lockKey, Date.now());
        return true;
    }

    #unlock() {
        localStorage.removeItem(this.#lockKey);
    }

    /**
     * Выполнить отложенную операцию. Переопределяется наследником.
     * @param {Object} op
     * @returns {Promise<boolean>} удалось ли
     */
    async applyOp() {
        return true;
    }
}

/**
 * Коллекции на сервере Tunime.
 * События: 'create', 'rename', 'remove', 'change', 'error'
 */
class TunimeSource extends SyncSource {
    /** @type {Array<Object>} */
    list = [];

    /**
     * Маркер изменений вместе с владельцем: { uid, rev, fullAt }.
     *
     * uid обязателен — счётчики у разных пользователей растут независимо
     * и значения легко совпадают. Без проверки владельца сервер честно
     * ответил бы «не менялось», и новый пользователь увидел бы чужие
     * коллекции, оставшиеся в кэше от предыдущего.
     */
    marker = { uid: null, rev: null, fullAt: 0 };

    constructor() {
        super(KEY.QUEUE);
        this.list = storage.read(KEY.DATA, { list: [] })?.list ?? [];
        this.marker = storage.read(KEY.REV, { uid: null, rev: null, fullAt: 0 });
    }

    /**
     * Маркер, который можно отправить серверу.
     * Возвращает null, если владелец сменился или пришло время полной сверки.
     * @param {string|null} uid текущий владелец
     */
    revFor(uid) {
        const owner = uid ? String(uid) : null;

        if (!owner || this.marker.uid !== owner) return null;
        if (Date.now() - (this.marker.fullAt || 0) > FULL_SYNC_INTERVAL) return null;

        return this.marker.rev ?? null;
    }

    /**
     * Запомнить маркер. Пишется только вместе с данными — иначе можно
     * сохранить «я актуален», не сохранив сам список.
     * @param {string|number|null} uid
     * @param {number|null} rev
     * @param {{full?: boolean}} [opts] full — это была полная выгрузка
     */
    setRev(uid, rev, { full = false } = {}) {
        this.marker = {
            uid: uid ? String(uid) : null,
            rev: rev ?? null,
            fullAt: full ? Date.now() : (this.marker.fullAt || 0)
        };

        storage.write(KEY.REV, this.marker);
    }

    /**
     * Мутации возвращают новый маркер в ответе. Забираем его здесь, одним
     * местом на все операции: иначе собственная правка расходилась бы с
     * сервером и клиент выкачивал бы весь список на ближайшей сверке.
     */
    async send(request, op) {
        const response = await super.send(request, op);

        if (!response?.complete || !response.parsed) return response;

        if (response.value?.rev !== undefined) {
            this.setRev(OAuth.user?.id ?? this.marker.uid, response.value.rev);
        }

        // Сервер возвращает коллекцию после правки. Берём её вместо своей:
        // count считает транзакция, обложку сервер пересобирает по своим
        // правилам — локальные догадки иначе понемногу расходятся
        this.adopt(response.value?.data, op);

        return response;
    }

    /**
     * Заменить локальную запись серверной.
     * @param {Object} value коллекция из ответа
     * @param {Object} [op] описание операции (для удаления не применяем)
     */
    adopt(value, op = {}) {
        if (!value?.cid || op.op === 'remove') return;

        const index = this.list.findIndex(x => x.cid === value.cid);
        if (index === -1) return;

        // items приходят не всегда (в preview их нет) — сохраняем свои
        this.list[index] = { ...this.list[index], ...value };
        this.save();
        this.trigger('change', this.list[index]);
    }

    /**
     * Владелец сменился (вход под другим аккаунтом или логаут) — чужой кэш
     * держать нельзя.
     * @param {string|null} uid
     */
    resetFor(uid) {
        this.list = [];
        this.save();
        this.setRev(uid, null);
    }

    /**
     * Забрать коллекции с сервера и слить с локальными по updatedAt.
     *
     * Сначала отправляем свой маркер: если он совпал с серверным, ответ
     * приходит без данных и Firestore на той стороне не читается вовсе.
     *
     * @param {{uid?: string|null}} [opts] владелец, для которого синхронизируемся
     * @returns {Promise<{added:string[], updated:string[], removed:string[]} | null>}
     */
    async pull({ uid = null } = {}) {
        const sent = this.revFor(uid);
        const full = sent === null;

        const response = await API.list(sent === null ? {} : { rev: sent });

        if (!response.complete || !response.parsed) {
            this.trigger('error', { type: 'sync', response });
            return null;
        }

        // Маркер совпал — данные не приходили, кэш остаётся как есть
        if (response.value.modified === false) {
            this.setRev(uid, response.value.rev);
            return { added: [], updated: [], removed: [], modified: false };
        }

        const remote = response.value.data ?? [];

        // modified: сервер прислал данные. Пустые added/updated/removed при
        // этом не значат «ничего не менялось» — список мог прийти впервые
        const changes = { added: [], updated: [], removed: [], modified: true };

        const local = new Map(this.list.map(x => [x.cid, x]));
        const next = [];

        for (const server of remote) {
            const mine = local.get(server.cid);
            local.delete(server.cid);

            if (!mine) {
                changes.added.push(server.cid);
                next.push(server);
                continue;
            }

            // Локальная может быть свежее, если правка сделана офлайн
            // и всё ещё лежит в очереди
            if (isNewer(mine.updatedAt, server.updatedAt)) {
                next.push(mine);
            } else {
                if (isNewer(server.updatedAt, mine.updatedAt)) changes.updated.push(server.cid);
                next.push(server);
            }
        }

        // Осталось локально, но нет на сервере
        for (const [cid, mine] of local) {
            // Ещё не создана на сервере — держим, иначе созданное офлайн
            // потерялось бы
            if (this.queue.some(op => op.cid === cid)) {
                next.push(mine);
                continue;
            }
            changes.removed.push(cid);
        }

        this.list = next;
        this.save();

        // Маркер сохраняем ТОЛЬКО вместе с данными: иначе можно записать
        // «я актуален», не сохранив сам список
        this.setRev(uid, response.value.rev, { full });

        return changes;
    }

    get(cid) {
        return this.list.find(x => x.cid === cid);
    }

    /** @param {string} cid */
    isSpecial(cid) {
        return this.get(cid)?.kind === 'recommend';
    }

    async create(title, visibility, anime = []) {
        // Временный id до ответа сервера — интерфейсу нужно за что-то держаться
        const cid = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        // Состав уходит вместе с созданием: отдельные запросы на добавление
        // могли бы не дойти и оставить коллекцию пустой
        const now = Date.now();
        const ids = [...new Set(toList(anime).map(Number).filter(x => x > 0))];
        const items = Object.fromEntries(ids.map(id => [String(id), now]));

        const collection = {
            cid,
            owner: String(OAuth.user?.id ?? ''),
            kind: 'custom',
            title,
            visibility,
            items,
            count: ids.length,
            cover: ids.slice(0, 4),
            coverMode: 'auto',
            createdAt: iso(),
            updatedAt: iso()
        };

        this.list.push(collection);
        this.save();
        this.trigger('create', collection);

        const response = await this.send(
            () => API.create({ title, visibility, anime: ids }),
            { cid, op: 'create', title, visibility, anime: ids }
        );

        if (response?.complete && response.parsed) {
            const created = response.value.data;
            const index = this.list.findIndex(x => x.cid === cid);
            if (index !== -1) this.list[index] = created;
            this.save();
            this.trigger('create', created);
            return created;
        }

        return collection;
    }

    async rename(cid, title) {
        const collection = this.get(cid);
        if (!collection || this.isSpecial(cid)) return false;

        collection.title = title;
        collection.updatedAt = iso();
        this.save();
        this.trigger('rename', collection);

        await this.send(() => API.entity(cid).rename(title), { cid, op: 'rename', title });
        return true;
    }

    async visibility(cid, visibility) {
        const collection = this.get(cid);
        if (!collection || this.isSpecial(cid)) return false;

        collection.visibility = visibility;
        collection.updatedAt = iso();
        this.save();

        // Отдельное событие, а не 'change': тот сообщает об изменении состава
        // и обновляет счётчик, а здесь меняется вид строки и её попадание
        // в фильтр по приватности
        this.trigger('visibility', collection);

        await this.send(() => API.entity(cid).visibility(visibility), { cid, op: 'visibility', visibility });
        return true;
    }

    async remove(cid) {
        if (this.isSpecial(cid)) return false;

        const index = this.list.findIndex(x => x.cid === cid);
        if (index === -1) return false;

        this.list.splice(index, 1);
        this.save();
        this.trigger('remove', { cid });

        await this.send(() => API.entity(cid).DELETE(), { cid, op: 'remove' });
        return true;
    }

    /**
     * Добавить одно или несколько аниме — одним запросом.
     *
     * Список полезен не только для скорости: сервер на каждую правку
     * поднимает маркер и пересобирает обложку, поэтому N отдельных
     * запросов дали бы N лишних оборотов.
     *
     * @param {number|number[]} aid
     * @param {string} cid
     * @returns {Promise<number>} сколько реально добавлено
     */
    async animeAdd(aid, cid) {
        const collection = this.get(cid);
        if (!collection) return 0;

        // Уже лежащие пропускаем: сервер их всё равно отклонит
        const ids = toList(aid).filter(id => collection.items[String(id)] === undefined);
        if (ids.length === 0) return 0;

        for (const id of ids) collection.items[String(id)] = Date.now();

        this.#touch(collection);
        this.trigger('change', collection);

        await this.send(() => API.entity(cid).anime.add(ids), { cid, op: 'anime.add', aid: ids });
        return ids.length;
    }

    /**
     * Убрать одно или несколько аниме — одним запросом
     * @param {number|number[]} aid
     * @param {string} cid
     * @returns {Promise<number>} сколько реально убрано
     */
    async animeRemove(aid, cid) {
        const collection = this.get(cid);
        if (!collection) return 0;

        const ids = toList(aid).filter(id => collection.items[String(id)] !== undefined);
        if (ids.length === 0) return 0;

        for (const id of ids) delete collection.items[String(id)];

        this.#touch(collection);
        this.trigger('change', collection);

        await this.send(() => API.entity(cid).anime.remove(ids), { cid, op: 'anime.remove', aid: ids });
        return ids.length;
    }

    /**
     * Правка одного аниме сразу в нескольких коллекциях.
     *
     * Один запрос вместо N: сервер применяет всё одной транзакцией и
     * поднимает маркер однократно. Локально изменения тоже применяются
     * разом, до ответа — интерфейс не ждёт сеть.
     *
     * @param {number} aid
     * @param {{add?: string[], remove?: string[]}} changes
     * @returns {Promise<{added: string[], removed: string[]}>}
     */
    async animeApply(aid, { add = [], remove = [] } = {}) {
        const id = Number(aid);
        const key = String(id);

        // Отсеиваем то, что уже в нужном состоянии — сервер такие
        // всё равно отклонит
        const added = add.filter(cid => this.get(cid)?.items[key] === undefined);
        const removed = remove.filter(cid => this.get(cid)?.items[key] !== undefined);

        if (added.length === 0 && removed.length === 0) {
            return { added: [], removed: [] };
        }

        for (const cid of added) {
            const collection = this.get(cid);
            collection.items[key] = Date.now();
            this.#touch(collection);
            this.trigger('change', collection);
        }

        for (const cid of removed) {
            const collection = this.get(cid);
            delete collection.items[key];
            this.#touch(collection);
            this.trigger('change', collection);
        }

        await this.send(
            () => API.apply(id, { add: added, remove: removed }),
            { op: 'anime.apply', aid: id, add: added, remove: removed }
        );

        return { added, removed };
    }

    /**
     * Рекомендации идут отдельным путём: сервер сам заводит коллекцию
     * и обновляет плоские записи со счётчиками, поэтому локально не
     * угадываем результат, а перечитываем состояние.
     */
    async recommend(aid, add = true) {
        const entity = API.recommend();
        const response = add ? await entity.anime.add(aid) : await entity.anime.remove(aid);

        if (!response.complete) {
            this.trigger('error', { type: 'recommend', response });
            return false;
        }

        return true;
    }

    /** @param {Object} op */
    async applyOp(op) {
        const entity = API.entity(op.cid);

        switch (op.op) {
            case 'create': {
                const response = await API.create({
                    title: op.title,
                    visibility: op.visibility,
                    anime: op.anime ?? []
                });
                if (!response.complete) return false;

                // Временный cid меняем на настоящий
                const index = this.list.findIndex(x => x.cid === op.cid);
                if (index !== -1) {
                    this.list[index] = response.value.data;
                    this.save();
                }
                return true;
            }
            case 'rename': return (await entity.rename(op.title)).complete;
            case 'visibility': return (await entity.visibility(op.visibility)).complete;
            case 'remove': return (await entity.DELETE()).complete;
            case 'anime.add': return (await entity.anime.add(op.aid)).complete;
            case 'anime.remove': return (await entity.anime.remove(op.aid)).complete;
            case 'anime.apply': return (await API.apply(op.aid, { add: op.add, remove: op.remove })).complete;
            default: return true;
        }
    }

    /** Обновляет счётчик, дату и обложку после правки состава */
    #touch(collection) {
        collection.count = Object.keys(collection.items).length;
        collection.updatedAt = iso();

        if (collection.coverMode !== 'manual') {
            collection.cover = Object.entries(collection.items)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([aid]) => Number(aid));
        }

        this.save();
    }

    save() {
        storage.write(KEY.DATA, { updatedAt: iso(), list: this.list });
    }

    restore() {
        this.list = storage.read(KEY.DATA, { list: [] })?.list ?? [];
    }
}

/**
 * Избранное Shikimori — виртуальная коллекция.
 * На сервере Tunime не хранится: источник истины у Shikimori,
 * там же его правят из веба и других клиентов.
 *
 * События: 'change', 'error'
 */
class ShikiSource extends SyncSource {
    /** @type {{cid:string, list:number[]} | null} */
    favourites = null;

    constructor() {
        super(KEY.FAV_QUEUE);
        const raw = storage.read(KEY.FAV);
        this.favourites = Array.isArray(raw?.list) ? raw : null;
    }

    get list() {
        return [...(this.favourites?.list ?? [])];
    }

    has(aid) {
        return Boolean(this.favourites?.list.includes(Number(aid)));
    }

    /**
     * Забрать избранное и сверить с кэшем.
     * Отметок времени у элементов нет, поэтому сверяем состав списка.
     * @returns {Promise<{added:number[], removed:number[]} | null>}
     */
    pull() {
        if (!OAuth.auth || !OAuth.user?.id || !navigator.onLine) return Promise.resolve(null);

        return new Promise((resolve) => {
            Users.favourites(OAuth.user.id, async (response) => {
                if (response.failed) {
                    if (response.status === 429) {
                        await Sleep(1000);
                        return resolve(this.pull());
                    }
                    this.trigger('error', { type: 'favourites', response });
                    return resolve(null);
                }

                const before = this.favourites?.list ?? [];
                const remote = this.#applyPending((response.animes ?? []).map(anime => anime.id));

                const added = remote.filter(id => !before.includes(id));
                const removed = before.filter(id => !remote.includes(id));

                this.favourites = this.#build(remote);
                this.save();

                if (added.length > 0 || removed.length > 0) {
                    this.trigger('change', this.favourites);
                }

                resolve({ added, removed });
            }).GET();
        });
    }

    async add(aid) {
        const id = Number(aid);
        if (this.has(id)) return false;

        this.#local((list) => [id, ...list.filter(x => x !== id)]);
        await this.send(() => this.request('POST', id), { cid: FAVOURITES, op: 'fav.add', aid: id });
        return true;
    }

    async remove(aid) {
        const id = Number(aid);
        if (!this.has(id)) return false;

        this.#local((list) => list.filter(x => x !== id));
        await this.send(() => this.request('DELETE', id), { cid: FAVOURITES, op: 'fav.remove', aid: id });
        return true;
    }

    /** @param {Object} op */
    async applyOp(op) {
        const response = await this.request(op.op === 'fav.add' ? 'POST' : 'DELETE', op.aid);
        return response.complete;
    }

    /**
     * Запрос к Shikimori в том же виде, что отдаёт Hub.fetch —
     * тогда send() из базового класса работает без оговорок.
     */
    request(method, aid) {
        return new Promise((resolve) => {
            Favorites.favorites("Anime", aid, async (response) => {
                if (response.failed) {
                    if (response.status === 429) {
                        await Sleep(1000);
                        return resolve(this.request(method, aid));
                    }
                    return resolve({ complete: false, parsed: false, status: response.status ?? 600 });
                }
                resolve({ complete: true, parsed: true, status: 200 });
            })[method]();
        });
    }

    /**
     * Накладывает неотправленные операции на список из Shikimori —
     * иначе только что снятое сердечко вернулось бы обратно при
     * первой же синхронизации.
     */
    #applyPending(list) {
        let result = [...list];

        for (const op of this.queue) {
            if (op.op === 'fav.add' && !result.includes(op.aid)) result.unshift(op.aid);
            if (op.op === 'fav.remove') result = result.filter(x => x !== op.aid);
        }

        return result;
    }

    #build(list = []) {
        return {
            cid: FAVOURITES,
            kind: 'shikimori',
            title: 'Избранное',
            visibility: 'public',
            list,
            count: list.length,
            updatedAt: iso()
        };
    }

    #local(mutate) {
        this.favourites = this.#build(mutate(this.list));
        this.save();
        this.trigger('change', this.favourites);
    }

    save() {
        storage.write(KEY.FAV, this.favourites);
    }

    /**
     * Сбросить кэш избранного. Оно принадлежит аккаунту Shikimori,
     * поэтому при смене владельца устройства держать его нельзя —
     * иначе новый пользователь увидит чужие сердечки.
     */
    reset() {
        this.favourites = null;
        localStorage.removeItem(KEY.FAV);
    }

    restore() {
        const raw = storage.read(KEY.FAV);
        this.favourites = Array.isArray(raw?.list) ? raw : null;
    }
}

/**
 * Фасад: единый список, общая синхронизация, события в одном месте.
 */
export const Collections = new class extends TEvents {
    #tunime = new TunimeSource();
    #shiki = new ShikiSource();

    #loaded = false;
    #syncing = null;
    #withFavourites = true;

    /**
     * Время последней синхронизации живёт в localStorage, а не в памяти:
     * сайт многостраничный, и при каждом переходе модуль создаётся заново.
     * Иначе интервал обнулялся бы и запрос уходил на каждой странице.
     */
    #lastSyncAt = storage.read(KEY.SYNC, { at: 0 })?.at ?? 0;

    /** Когда вкладку скрыли (для порога HIDDEN_THRESHOLD) */
    #hiddenAt = 0;

    constructor() {
        super();
        this.#forward();
        this.#storageEvent();
        this.#visibilityEvent();
        this.#metaEvent();
    }

    /**
     * Метаданные от сервера: приезжают из /login, /login/confirm,
     * /keep-alive и /shiki/auth. Модулю не важно, из какого именно —
     * Hub собирает их в одном месте.
     */
    #metaEvent() {
        Hub.onMeta(({ uid, collectionsRev }) => {
            const known = this.#tunime.marker.uid;

            // Сменился владелец (вход под другим аккаунтом или логаут) —
            // чужие коллекции в кэше держать нельзя
            if (known !== null && known !== uid) {
                this.#tunime.resetFor(uid);
                this.#shiki.reset();          // избранное тоже принадлежит аккаунту
                this.trigger('storage', this.list);

                if (uid) this.sync({ force: true });
                return;
            }

            if (!uid || collectionsRev === null || collectionsRev === undefined) return;

            // Сервер сообщил маркер свежее нашего — значит правили с другого
            // устройства. Не ждём истечения интервала.
            if (this.#loaded && collectionsRev !== this.#tunime.marker.rev) {
                this.sync({ force: true });
            }
        });
    }

    /** События источников пробрасываем наружу как свои */
    #forward() {
        for (const event of ['create', 'rename', 'visibility', 'remove', 'change', 'error']) {
            this.#tunime.on(event, (data) => this.trigger(event, data));
        }
        for (const event of ['change', 'error']) {
            this.#shiki.on(event, (data) => this.trigger(event, data));
        }
    }

    // ─── Состояние ──────────────────────────────────────────────────────

    get loaded() {
        return this.#loaded;
    }

    /** Все коллекции + избранное, свежие сверху */
    get list() {
        const list = [...this.#tunime.list]
            .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

        return this.#shiki.favourites ? [this.#shiki.favourites, ...list] : list;
    }

    /** Сколько операций ждёт отправки (оба источника) */
    get pending() {
        return this.#tunime.pending + this.#shiki.pending;
    }

    /** Прямой доступ к источникам, если нужно тонко */
    get sources() {
        return { tunime: this.#tunime, shiki: this.#shiki };
    }

    // ─── Инициализация и синхронизация ──────────────────────────────────

    /** Когда синхронизировались в последний раз (переживает перезагрузку) */
    get lastSync() {
        return this.#lastSyncAt ? new Date(this.#lastSyncAt) : null;
    }

    /** Пора ли обновляться */
    get stale() {
        return Date.now() - this.#lastSyncAt >= SYNC_COOLDOWN;
    }

    /**
     * Поднимает кэш и запускает синхронизацию.
     *
     * force НЕ включён по умолчанию намеренно: страницы перезагружаются
     * при каждом переходе, и без интервала запрос уходил бы каждый раз.
     *
     * @param {{favourites?: boolean, force?: boolean}} [opts]
     */
    async init({ favourites = true, force = false } = {}) {
        this.#withFavourites = favourites;
        this.#loaded = true;

        // replay: подписавшийся позже всё равно получит состояние
        this.trigger('loaded', this.list, { replay: true });

        return this.sync({ force });
    }

    /**
     * @param {{force?: boolean}} [opts] force — игнорировать интервал
     */
    sync({ force = false } = {}) {
        if (this.#syncing) return this.#syncing;

        // Неотправленные правки важнее интервала — иначе они провисят
        // до истечения кулдауна
        const mustFlush = this.pending > 0;

        if (!force && !mustFlush && !this.stale) {
            return Promise.resolve(null);
        }

        this.#syncing = this.#sync().finally(() => {
            this.#syncing = null;
            this.#mark();
        });

        return this.#syncing;
    }

    /** Запоминает момент синхронизации — в памяти и в localStorage */
    #mark() {
        this.#lastSyncAt = Date.now();
        storage.write(KEY.SYNC, { at: this.#lastSyncAt });
    }

    async #sync() {
        if (!OAuth.auth || !navigator.onLine) return null;

        // Сначала досылаем то, что не ушло раньше — иначе сервер отдаст
        // старые данные и затрёт локальные изменения
        await Promise.all([this.#tunime.flush(), this.#shiki.flush()]);

        const uid = OAuth.user?.id ? String(OAuth.user.id) : null;

        const [collections, favourites] = await Promise.all([
            this.#tunime.pull({ uid }),
            this.#withFavourites ? this.#shiki.pull() : Promise.resolve(null)
        ]);

        const changes = {
            ...(collections ?? { added: [], updated: [], removed: [], modified: false }),
            favourites
        };

        this.trigger('sync', changes, { replay: true });
        return changes;
    }

    // ─── Поиск ──────────────────────────────────────────────────────────

    /** @param {string} cid */
    get(cid) {
        return cid === FAVOURITES ? this.#shiki.favourites : this.#tunime.get(cid);
    }

    /**
     * Состав коллекции одним списком id.
     *
     * У коллекций Tunime это карта `items`, у избранного Shikimori —
     * массив `list`: оно виртуальное и живёт по своим правилам
     *
     * @param {string} cid
     * @returns {number[]}
     */
    /**
     * Избранное другого пользователя.
     *
     * У нас оно не хранится вовсе, поэтому идём прямо к Shikimori и
     * собираем такую же виртуальную коллекцию, как для своего. Своё
     * избранное сюда не ходит — оно лежит в кэше под cid `favourites`.
     *
     * @param {string | number} uid
     * @returns {Promise<Object | null>}
     */
    async favouritesOf(uid) {
        if (!uid) return null;

        const response = await new Promise((resolve) => {
            Users.favourites(uid, resolve).GET();
        });

        if (response.failed) return null;

        const list = (response.animes ?? []).map(x => Number(x.id)).filter(Boolean);

        return {
            cid: `${FAVOURITES}:${uid}`,
            kind: 'shikimori',
            title: 'Избранное',
            visibility: 'public',
            owner: String(uid),
            list,
            count: list.length
        };
    }

    ids(cid) {
        const collection = this.get(cid);

        const raw = Array.isArray(collection?.list)
            ? collection.list
            : Object.keys(collection?.items ?? {});

        return raw.map(Number).filter(Boolean);
    }

    /**
     * В каких коллекциях лежит аниме
     * @param {number} aid
     * @returns {string[]}
     */
    find(aid) {
        const id = String(Number(aid));
        const list = this.#tunime.list.filter(x => x.items?.[id] !== undefined).map(x => x.cid);

        if (this.#shiki.has(aid)) list.unshift(FAVOURITES);

        return list;
    }

    /** @param {string} value */
    findAll(value) {
        if (typeof value !== "string") return [];
        const query = value.toLowerCase().trim();
        return this.list.filter(x => String(x.title).toLowerCase().includes(query));
    }

    /**
     * @param {number} aid
     * @param {string} cid
     */
    has(aid, cid) {
        if (cid === FAVOURITES) return this.#shiki.has(aid);
        return this.#tunime.get(cid)?.items?.[String(Number(aid))] !== undefined;
    }

    // ─── Изменения ──────────────────────────────────────────────────────

    /**
     * @param {string} title
     * @param {{visibility?: 'private'|'public', anime?: number[]}} [opts]
     *  anime — состав, с которым коллекция создаётся сразу
     */
    create(title, { visibility = 'private', anime = [] } = {}) {
        const name = String(title ?? '').trim();
        if (!name) return Promise.resolve(null);

        return this.#tunime.create(name, visibility, anime);
    }

    /**
     * @param {string} cid
     * @param {string} title
     */
    rename(cid, title) {
        const name = String(title ?? '').trim();
        if (!name || cid === FAVOURITES) return Promise.resolve(false);

        return this.#tunime.rename(cid, name);
    }

    /**
     * @param {string} cid
     * @param {'private'|'public'} visibility
     */
    visibility(cid, visibility) {
        if (cid === FAVOURITES) return Promise.resolve(false);
        return this.#tunime.visibility(cid, visibility);
    }

    /** @param {string} cid */
    remove(cid) {
        if (cid === FAVOURITES) return Promise.resolve(false);
        return this.#tunime.remove(cid);
    }

    anime = {
        /**
         * Добавить аниме — одно или списком.
         *
         * Для коллекций Tunime список уходит одним запросом. Избранное
         * Shikimori так не умеет: там на каждое аниме свой вызов API,
         * поэтому идём по одному.
         *
         * @param {number|number[]} aid
         * @param {string} cid
         * @returns {Promise<number>} сколько добавлено
         */
        add: async (aid, cid) => {
            if (cid !== FAVOURITES) return this.#tunime.animeAdd(aid, cid);

            let done = 0;
            for (const id of toList(aid)) {
                if (await this.#shiki.add(id)) done++;
            }
            return done;
        },

        /**
         * Убрать аниме — одно или списком
         * @param {number|number[]} aid
         * @param {string} cid
         * @returns {Promise<number>} сколько убрано
         */
        remove: async (aid, cid) => {
            if (cid !== FAVOURITES) return this.#tunime.animeRemove(aid, cid);

            let done = 0;
            for (const id of toList(aid)) {
                if (await this.#shiki.remove(id)) done++;
            }
            return done;
        },

        /**
         * Разложить аниме по нескольким коллекциям за один раз.
         *
         * Коллекции Tunime уходят одним запросом и одной транзакцией,
         * избранное Shikimori — отдельно, у него свой API.
         *
         * @param {number} aid
         * @param {{add?: string[], remove?: string[]}} changes
         * @returns {Promise<{added: string[], removed: string[]}>}
         */
        apply: async (aid, { add = [], remove = [] } = {}) => {
            const id = Number(aid);

            const result = await this.#tunime.animeApply(id, {
                add: add.filter(cid => cid !== FAVOURITES),
                remove: remove.filter(cid => cid !== FAVOURITES)
            });

            if (add.includes(FAVOURITES) && await this.#shiki.add(id)) {
                result.added.push(FAVOURITES);
            }

            if (remove.includes(FAVOURITES) && await this.#shiki.remove(id)) {
                result.removed.push(FAVOURITES);
            }

            return result;
        },

        /** Синоним has() — для совместимости со старым Collection.Anime.Is */
        is: (aid, cid) => this.has(aid, cid)
    };

    recommend = {
        /** Коллекция «Рекомендую» текущего пользователя */
        get: () => this.#tunime.list.find(x => x.kind === 'recommend'),

        /** @param {number} aid */
        has: (aid) => {
            const collection = this.recommend.get();
            return Boolean(collection && collection.items[String(Number(aid))] !== undefined);
        },

        /** @param {number} aid */
        add: async (aid) => {
            const done = await this.#tunime.recommend(Number(aid), true);
            if (done) await this.sync({ force: true });
            return done;
        },

        /** @param {number} aid */
        remove: async (aid) => {
            const done = await this.#tunime.recommend(Number(aid), false);
            if (done) await this.sync({ force: true });
            return done;
        }
    };

    favourites = {
        /** Обновить из Shikimori */
        load: () => this.#shiki.pull(),

        /** Текущий список id (из кэша, доступен сразу) */
        list: () => this.#shiki.list,

        /** @param {number} aid */
        add: (aid) => this.#shiki.add(aid),

        /** @param {number} aid */
        remove: (aid) => this.#shiki.remove(aid),

        /** @param {number} aid */
        has: (aid) => this.#shiki.has(aid)
    };

    /**
     * Возвращение на вкладку после паузы — повод обновиться, не дожидаясь
     * интервала: пока вкладка была скрыта, коллекции могли поменять
     * с телефона или другого браузера.
     */
    #visibilityEvent() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') {
                this.#hiddenAt = Date.now();
                return;
            }

            if (!this.#loaded) return;

            const hidden = this.#hiddenAt ? Date.now() - this.#hiddenAt : 0;
            this.#hiddenAt = 0;

            if (hidden < HIDDEN_THRESHOLD) return;

            this.sync({ force: true });
        });
    }

    /** Изменения из другой вкладки — подхватываем без перезагрузки */
    #storageEvent() {
        window.addEventListener('storage', (event) => {
            // Соседняя вкладка синхронизировалась — считаем это и нашей
            // синхронизацией, повторный запрос не нужен
            if (event.key === KEY.SYNC) {
                this.#lastSyncAt = storage.read(KEY.SYNC, { at: 0 })?.at ?? 0;
                return;
            }

            if (event.key === KEY.DATA) {
                this.#tunime.restore();
            } else if (event.key === KEY.FAV) {
                this.#shiki.restore();
            } else {
                // Очереди перечитываются сами (источник истины —
                // localStorage), отдельная обработка не нужна
                return;
            }

            this.trigger('storage', this.list);
        });
    }
}();

export default Collections;