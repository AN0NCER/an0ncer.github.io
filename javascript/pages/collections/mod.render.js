import { GraphQl } from "../../modules/api.shiki.js";
import { Sleep } from "../../modules/functions.js";
import { coverIds, drawPreview } from "./mod.preview.js";

/**
 * Отрисовка списка коллекций.
 *
 * Карточки и группы клонируются из шаблонов страницы, постеры обложек
 * приезжают отдельно: сперва показываем названия и счётчики, а коллажи
 * заполняются, когда ответит Shikimori.
 */

const TEMPLATE = {
    card: '#tpl-collection-card',
    group: '#tpl-collection-group'
};

/** Shikimori не отдаёт больше 50 записей за раз */
const CHUNK = 50;

/** Иконка у названия — только у особых коллекций */
const ICONS = {
    shikimori: '#i-shikimori',
    recommend: '#i-box-archive'
};

/** Подпись под названием */
const TYPES = {
    shikimori: 'Shikimori',
    public: 'Публичная коллекция',
    private: 'Приватная коллекция'
};

/** Превью постеров: одно аниме попадает в несколько коллекций */
const posters = new class {
    #cache = new Map();

    get(id) {
        return this.#cache.get(Number(id));
    }

    /** @param {number[]} ids */
    async load(ids = []) {
        const need = [...new Set(ids.map(Number).filter(id => id > 0 && !this.#cache.has(id)))];
        if (need.length === 0) return false;

        for (let i = 0; i < need.length; i += CHUNK) {
            const response = await this.#ask(need.slice(i, i + CHUNK));

            if (response?.failed || response?.errors) return false;

            for (const anime of response?.data?.animes ?? []) {
                this.#cache.set(Number(anime.id), anime.poster?.previewUrl ?? null);
            }
        }

        return true;
    }

    async #ask(ids, retry = true) {
        const response = await GraphQl
            .animes({ ids: `"${ids.join(',')}"`, limit: ids.length })
            .POST(['id', { poster: ['previewUrl'] }]);

        // Shikimori режет частые обращения: одна попытка после паузы
        if (response.failed && response.status === 429 && retry) {
            await Sleep(1000);
            return this.#ask(ids, false);
        }

        return response;
    }
}();

/** Сколько аниме в коллекции — у избранного счётчика нет, считаем сами */
const countOf = (collection) => collection.count
    ?? (Array.isArray(collection.list)
        ? collection.list.length
        : Object.keys(collection.items ?? {}).length);

/**
 * Когда обновляли. Свежее — «сегодня», «2 дня назад», старое — датой:
 * относительный формат хорош для недавнего и бесполезен для прошлого года
 *
 * @param {string} iso
 */
const updated = (iso) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';

    const days = Math.floor((Date.now() - date.getTime()) / 86400000);

    if (days <= 0) return 'обновлена сегодня';
    if (days === 1) return 'обновлена вчера';
    if (days < 7) return `обновлена ${days} дня назад`;

    return `обновлена ${date.toLocaleDateString('ru-RU')}`;
};

/** Число с правильным словом: 1 аниме, 2 аниме — слово не склоняется */
const animes = (count) => `${count} Аниме`;

/**
 * @param {Object} [opts]
 * @param {string} [opts.dom] - контейнер списка
 * @param {(cid: string, collection: Object) => void} [opts.onOpen]
 */
export function createRender({ dom = '.list-wrapper', own = true, onOpen = () => { } } = {}) {
    const root = document.querySelector(dom);
    const empty = root?.querySelector('.collection-empty');

    // Заглушка говорит разное на своей и чужой странице: у себя это
    // приглашение создать коллекцию, у другого — что их просто нет
    if (empty) empty.dataset.owner = own ? 'own' : 'foreign';

    /** Что нарисовано сейчас — по нему обновляем обложки */
    const drawn = new Map();

    /** Карточки, чьи обложки ждут загрузки */
    const pending = new Set();

    let timer = null;

    /**
     * Догрузить обложки подошедших карточек.
     *
     * Собираем пачкой с небольшой задержкой: при быстрой прокрутке
     * наблюдатель успевает отдать десяток карточек, и один запрос на всех
     * лучше десяти по одной
     */
    const flush = async () => {
        timer = null;

        const cards = [...pending];
        pending.clear();

        if (cards.length === 0) return;

        const ids = cards.flatMap(cid => coverIds(drawn.get(cid)?.collection ?? {}));
        if (!await posters.load(ids)) return;

        for (const cid of cards) {
            const item = drawn.get(cid);
            if (!item) continue;

            const urls = coverIds(item.collection).map(id => posters.get(id) ?? null);
            drawPreview(item.el.querySelector('.collection-preview'), urls);
        }
    };

    /**
     * Обложки грузим по мере прокрутки: у человека может быть сотня
     * коллекций, а запросы к Shikimori не бесплатны
     */
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;

            const cid = entry.target.dataset.cid;
            if (!cid) continue;

            // Один раз на карточку: ссылки осядут в кэше, и повторно
            // спрашивать их незачем
            observer.unobserve(entry.target);
            pending.add(cid);
        }

        if (pending.size > 0 && !timer) timer = setTimeout(flush, 80);
    }, { rootMargin: '300px' });

    /** @param {Object} collection */
    const card = (collection, matches = null) => {
        const el = document.querySelector(TEMPLATE.card).content.firstElementChild.cloneNode(true);

        el.dataset.cid = collection.cid;
        el.dataset.kind = collection.kind ?? 'custom';
        el.dataset.visibility = collection.visibility ?? 'private';

        // Иконка есть только у особых коллекций: у обычных перед
        // названием не должно быть пустого места
        const symbol = ICONS[collection.kind];
        const icon = el.querySelector('.collection-title > .icon');

        if (symbol) icon?.querySelector('use')?.setAttribute('href', symbol);
        else icon?.remove();

        el.querySelector('.collection-title > span').textContent = collection.title ?? '';
        el.querySelector('.collection-type > span').textContent =
            TYPES[collection.kind] ?? TYPES[collection.visibility] ?? '';

        el.querySelector('.anime-count').textContent = animes(countOf(collection));
        el.querySelector('.collection-update').textContent = updated(collection.updatedAt);

        // Счётчик совпадений — только в выдаче поиска по составу
        const result = el.querySelector('.in-collection-result');

        if (matches?.length > 0) {
            result.textContent = `Совпадений: ${matches.length}`;
            result.classList.remove('-hide');
        }

        // Коллаж рисуем сразу тем, что есть в кэше: заглушки заменятся,
        // когда приедут постеры
        const ids = coverIds(collection);
        drawPreview(el.querySelector('.collection-preview'), ids.map(id => posters.get(id) ?? null));

        drawn.set(collection.cid, { el, collection });

        return el;
    };

    /**
     * @param {{title: string, items: Array<Object>, note?: boolean}} group
     *  note — подпись «автогруппа». У разделов поиска её быть не должно
     */
    const section = (group) => {
        const el = document.querySelector(TEMPLATE.group).content.firstElementChild.cloneNode(true);

        el.querySelector('.group-title').textContent = group.title ?? '';

        if (group.note === false) el.querySelector('.group-note')?.remove();

        const list = el.querySelector('.group-list');
        for (const collection of group.items) list.append(card(collection, group.matches?.get(collection.cid)));

        return el;
    };

    /**
     * Взять карточки под наблюдение. Те, чьи обложки уже в кэше,
     * нарисованы сразу при создании — их и наблюдать не нужно
     */
    const watch = () => {
        for (const { el, collection } of drawn.values()) {
            const ids = coverIds(collection);

            if (ids.length === 0) continue;
            if (ids.every(id => posters.get(id) !== undefined)) continue;

            observer.observe(el);
        }
    };

    const onClick = (e) => {
        const el = e.target.closest('.collection-h-card[data-cid]');
        if (!el || !root.contains(el)) return;

        const cid = el.dataset.cid;
        onOpen(cid, drawn.get(cid)?.collection ?? null);
    };

    root?.addEventListener('click', onClick);

    return {
        /**
         * Перерисовать список.
         *
         * @param {Object} view
         * @param {Array<{title: string, items: Array<Object>, note?: boolean, matches?: Map}>} [view.groups]
         * @param {Array<Object>} [view.rest] - коллекции вне групп
         * @param {boolean | null} [view.empty] - показывать заглушку.
         *  Решает страница: избранное — это карточка, но своих коллекций
         *  при нём может не быть ни одной. `null` — считать по карточкам
         */
        draw({ groups = [], rest = [], empty: force = null } = {}) {
            if (!root) return;

            drawn.clear();
            pending.clear();
            observer.disconnect();

            // Пустое состояние живёт в разметке — его не трогаем,
            // остальное строим заново
            root.querySelectorAll('.collection-h-card, .collection-group').forEach(el => el.remove());

            const fragment = document.createDocumentFragment();

            for (const collection of rest) fragment.append(card(collection));
            for (const group of groups) fragment.append(section(group));

            root.append(fragment);

            // Заглушка лежит в разметке до карточек, но показывать её
            // надо после них — иначе приглашение создать коллекцию
            // оказывается над уже существующими
            if (empty) root.append(empty);

            empty?.classList.toggle('hide', force === null ? drawn.size > 0 : !force);

            watch();
        },

        /** Обновить одну карточку, не перерисовывая список */
        update(collection) {
            const item = drawn.get(collection?.cid);
            if (!item) return;

            item.el.replaceWith(card(collection));
        },

        get count() {
            return drawn.size;
        },

        destroy() {
            root?.removeEventListener('click', onClick);
            drawn.clear();
            pending.clear();
            observer.disconnect();
        }
    };
}

export default createRender;
