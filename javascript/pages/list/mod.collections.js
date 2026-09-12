import { GraphQl } from "../../modules/api.shiki.js";
import { Sleep } from "../../modules/functions.js";
import { ShowInfo } from "../../modules/Popup.js";
import Collections from "../../modules/tun.collections.js";
import { WindowManagement } from "../../modules/Windows.js";
import WCollectionViewer from "../../windows/collections/win.viewer.js";
import { HCollection } from "./mod_html.js";

/** Полоса под заголовком — превью нескольких коллекций */
const ROW = '.span-row';

/** Полный список в окне «Коллекции» */
const LIST = '.list-collection';

/** Сколько коллекций показываем в полосе */
const PREVIEW = 5;

/** Столько постеров в коллаже обложки */
const COVERS = 4;

/** Shikimori не отдаёт больше 50 записей за раз */
const CHUNK = 50;

/**
 * Превью постеров для обложек.
 *
 * Кэш общий на страницу: одно аниме попадает в несколько коллекций, и
 * без него мы бы запрашивали его постер столько раз, во скольких оно
 * лежит.
 */
const posters = new class {
    #cache = new Map();

    /** @param {number} id */
    get(id) {
        return this.#cache.get(Number(id));
    }

    /**
     * Догрузить недостающие
     * @param {number[]} ids
     */
    async load(ids = []) {
        const need = [...new Set(ids.map(Number).filter(id => id > 0 && !this.#cache.has(id)))];
        if (need.length === 0) return;

        for (let i = 0; i < need.length; i += CHUNK) {
            const chunk = need.slice(i, i + CHUNK);
            const response = await this.#ask(chunk);

            if (response?.failed || response?.errors) return;

            for (const anime of response?.data?.animes ?? []) {
                this.#cache.set(Number(anime.id), anime.poster?.previewUrl ?? null);
            }
        }
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

/**
 * Что показывать на обложке.
 *
 * Берём `cover` коллекции, а не первые аниме состава: у коллекций с
 * ручной обложкой это разные наборы, и до сих пор показывался не тот
 *
 * @param {Object} collection
 * @returns {number[]}
 */
const coverIds = (collection) => {
    const cover = Array.isArray(collection?.cover) ? collection.cover : [];
    const ids = cover.length > 0 ? cover : Collections.ids(collection.cid);

    return ids.map(Number).filter(Boolean).slice(0, COVERS);
};

/** Ссылки на превью тех обложек, что уже в кэше */
const coverUrls = (collection) => coverIds(collection)
    .map(id => posters.get(id))
    .filter(Boolean);

/**
 * Плитки коллекций в полосе и в окне со списком.
 *
 * Обложки приезжают отдельно от плиток: сперва показываем название и
 * счётчик, а постеры дорисовываем, когда ответит Shikimori.
 */
class Board {
    #drawn = { row: [], list: [] };

    /** Полоса: первые несколько коллекций */
    preview() {
        const list = Collections.list.slice(0, PREVIEW);

        this.#draw(ROW, list, 'row');
        this.covers(list);
    }

    /** Окно со списком: все коллекции, включая уже показанные в полосе */
    all() {
        const list = Collections.list;

        this.#draw(LIST, list, 'list');
        this.covers(list);
    }

    /** Есть ли уже плитка этой коллекции в полосе */
    inRow(cid) {
        return this.#drawn.row.includes(cid);
    }

    /**
     * Добавить плитку в полосу, если её там ещё нет
     * @param {Object} collection
     */
    add(collection) {
        if (this.inRow(collection.cid)) {
            return $(`${ROW} > .item-collection[data-id="${collection.cid}"]`).show();
        }

        $(ROW).append(this.#item(collection));
        this.#drawn.row.push(collection.cid);
    }

    /**
     * Убрать из полосы всё, чего нет в списке. Коллекции, попавшие туда
     * при первой отрисовке, остаются: полоса — их постоянное место
     * @param {string[]} keep
     */
    trim(keep = []) {
        const base = Collections.list.slice(0, PREVIEW).map(x => x.cid);

        $(`${ROW} > .item-collection[data-id]`).each((_, el) => {
            const cid = el.dataset.id;
            if (base.includes(cid) || keep.includes(cid)) return;

            el.remove();
            this.#drawn.row = this.#drawn.row.filter(x => x !== cid);
        });
    }

    /**
     * Догрузить постеры и проставить их в уже нарисованные плитки
     * @param {Array<Object>} list
     */
    async covers(list = []) {
        const ids = list.flatMap(coverIds);
        if (ids.length === 0) return;

        await posters.load(ids);

        for (const collection of list) {
            const urls = coverUrls(collection);
            if (urls.length === 0) continue;

            $(`.item-collection[data-id="${collection.cid}"]`).each((_, el) => {
                HCollection.Covers(el, urls);
            });
        }
    }

    /** Перерисовать всё, что сейчас на экране */
    refresh() {
        this.#drawn = { row: [], list: [] };

        if ($(ROW).children().length > 0) this.preview();
        if ($(LIST).children().length > 0) this.all();
    }

    /**
     * @param {string} target - контейнер
     * @param {Array<Object>} list
     * @param {'row' | 'list'} kind
     */
    #draw(target, list, kind) {
        $(target).empty();

        for (const collection of list) {
            $(target).append(this.#item(collection));
        }

        this.#drawn[kind] = list.map(x => x.cid);
    }

    /** @param {Object} collection */
    #item(collection) {
        return HCollection.Iteam({
            id: collection.cid,
            title: collection.title,
            count: collection.count ?? Collections.ids(collection.cid).length,
            bgs: coverUrls(collection)
        });
    }
}

/**
 * Поиск коллекций рядом с поиском аниме.
 *
 * Работает в две волны: сперва по названию коллекции, а если нашлось
 * меньше лимита — добирает те, где лежат найденные аниме. Отсюда и
 * `Next`: аниме приезжают страницами, и каждая может добавить коллекций.
 */
class Search {
    #callbacks = { found: [] };

    /** @type {Board} */
    #board = null;

    /** Что показано по текущему запросу — сверх постоянных плиток полосы */
    #shown = [];

    #limit = PREVIEW;

    /** @param {Board} board */
    init(board) {
        this.#board = board;
    }

    /**
     * Первая волна: название плюс коллекции найденных аниме
     * @param {{title: string, animes?: Array<{id: string|number}>}} data
     */
    Search({ title, animes = [] } = {}) {
        let ids = Collections.findAll(title).slice(0, this.#limit).map(x => x.cid);

        for (const anime of animes) {
            if (ids.length >= this.#limit) break;
            ids = [...new Set([...ids, ...Collections.find(anime.id)])];
        }

        this.#dispatch('found', ids.slice(0, this.#limit));
    }

    /**
     * Следующая страница аниме — вдруг добавит коллекций
     * @param {Array<{id: string|number}>} animes
     */
    Next(animes = []) {
        if (this.#shown.length >= this.#limit) return;

        let ids = [...this.#shown];

        for (const anime of animes) {
            if (ids.length >= this.#limit) break;
            ids = [...new Set([...ids, ...Collections.find(anime.id)])];
        }

        this.Load(ids);
    }

    /**
     * Показать в полосе только эти коллекции
     * @param {string[]} ids
     */
    Load(ids = []) {
        if (!this.#board) return;

        const list = ids.map(cid => Collections.get(cid)).filter(Boolean);

        HCollection.NotFound.Hide(ROW);
        $(`${ROW} > .item-collection`).hide();

        for (const collection of list) this.#board.add(collection);

        this.#shown = list.map(x => x.cid);
        this.#board.trim(this.#shown);

        $(`${ROW} > .item-collection`).hide();
        for (const cid of this.#shown) {
            $(`${ROW} > .item-collection[data-id="${cid}"]`).show();
        }

        this.#board.covers(list);
    }

    /**
     * Поиск по названию на лету — пока пользователь печатает
     * @param {string} title
     */
    Entry(title) {
        const list = Collections.findAll(title).slice(0, this.#limit);

        if (list.length === 0) {
            $(`${ROW} > .item-collection`).hide();
            return HCollection.NotFound.Show(ROW);
        }

        this.Load(list.map(x => x.cid));
    }

    /** Вернуть полосу в исходный вид */
    Clear() {
        if (!this.#board) return;

        HCollection.NotFound.Hide(ROW);

        this.#shown = [];
        this.#board.trim([]);

        $(`${ROW} > .item-collection`).show();
    }

    /**
     * @param {'found'} event
     * @param {Function} callback
     */
    on(event, callback) {
        if (typeof callback !== 'function') return;

        this.#callbacks[event] ??= [];
        this.#callbacks[event].push(callback);
    }

    #dispatch(event, data) {
        this.#callbacks[event]?.forEach(callback => callback(data));
    }
}

const board = new Board();
const search = new Search();

/** Окно со всем списком коллекций */
const windowList = new WindowManagement({
    init: function () {
        $('.bar-collection > .close-btn').on('click', () => this.hide());

        let last = '';

        $('.collection-search > .wrapper > input').on('keyup', (e) => {
            const value = e.target.value.trim();
            if (value === last) return;

            last = value;

            if (!value) return $(`${LIST} > .item-collection`).show();

            // Фильтруем уже нарисованное, а не перерисовываем список:
            // так не мигают обложки и не сбрасывается прокрутка
            const found = Collections.findAll(value).map(x => x.cid);

            $(`${LIST} > .item-collection`).each((_, el) => {
                $(el).toggle(found.includes(el.dataset.id));
            });
        });
    },
    show: function () { windowList.show(); },
    hide: function () { windowList.hide(); },
    verif: function () { return true; },
    anim: {
        showed: function () { board.all(); },
        hided: function () { }
    }
}, '.window-collection');

/** Открыть коллекцию: окно просмотра само сходит за составом */
const openCollection = async (cid) => {
    if (Collections.ids(cid).length === 0) {
        return ShowInfo('Коллекция пуста', 'collection-empty');
    }

    const item = $(`.item-collection[data-id="${cid}"]`);

    item.addClass('loading');
    await WCollectionViewer(cid).catch(() => null);
    item.removeClass('loading');
};

export const InitCollections = () => {
    // Клик ловим на контейнерах: плитки перерисовываются, и вешать
    // обработчик на каждую заново — лишняя работа и источник утечек
    $(document).on('click', `${ROW} > .item-collection[data-id], ${LIST} > .item-collection[data-id]`, function () {
        openCollection($(this).data('id'));
    });

    $('.title-block.collections').on('click', () => windowList.target.show());

    search.init(board);

    // Первая отрисовка из кэша, не дожидаясь сети: коллекции уже могли
    // быть загружены на другой странице
    Collections.on('loaded', () => board.preview(), { replay: true });

    for (const event of ['sync', 'create', 'rename', 'remove', 'visibility', 'change']) {
        Collections.on(event, () => board.refresh());
    }

    if (!Collections.loaded) Collections.init();
    else Collections.sync();
};

export const CSearch = () => search;
