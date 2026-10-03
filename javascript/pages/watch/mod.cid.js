import { OAuth } from "../../core/main.core.js";
import { Collections as API } from "../../modules/api.tunime.js";
import Collections from "../../modules/tun.collections.js";
import WCollectionViewer from "../../windows/collections/win.viewer.js";
import { $CID, $ID } from "../watch.js";
import { createControls } from "./mod.cid/mod.controls.js";
import { createOwner } from "./mod.cid/mod.owner.js";
import { createSource } from "./mod.cid/mod.source.js";
import { createStrip } from "./mod.cid/mod.strip.js";

/**
 * Лента коллекции на странице просмотра.
 *
 * Показывается, только когда аниме открыли из коллекции — по `?cid=`.
 * Без этого параметра модуль вообще не загружается, поэтому здесь нет
 * проверок «а есть ли cid».
 */

const ROOT = '.cid-collection';

/** Избранное Shikimori: своё — `favourites`, чужое — `favourites:{uid}` */
const FAVOURITES = 'favourites';

/**
 * Коллекция целиком.
 *
 * Своя лежит в кэше, за чужой делаем запрос, а избранное вообще не наше:
 * своё собирает фасад, чужое приходится спрашивать у Shikimori
 */
const fetchCollection = async (cid) => {
    const [prefix, uid] = String(cid).split(':');

    if (prefix === FAVOURITES && uid) {
        // Свой же uid в ссылке — это своё избранное: берём из кэша,
        // а не идём за ним к Shikimori заново
        if (String(uid) === String(OAuth.user?.id)) return Collections.get(FAVOURITES);

        return Collections.favouritesOf(uid);
    }

    const known = Collections.get(cid);
    if (known) return known;

    const response = await API.entity(cid).GET();
    return response.complete ? response.value?.data ?? null : null;
};

/**
 * Чей список смотрим. У своего избранного владельца нет — оно
 * виртуальное, — но подписать его собой всё равно правильно
 */
const ownerOf = (collection, cid) => {
    if (collection?.owner) return collection.owner;

    return cid === FAVOURITES ? OAuth.user?.id ?? null : null;
};

/**
 * Состав по порядку.
 *
 * Пока у аниме внутри коллекции нет своего порядка, опираемся на время
 * добавления: ключи карты его не гарантируют, и лента перетасовывалась
 * бы между заходами
 *
 * @param {Object} collection
 * @returns {number[]}
 */
const orderedIds = (collection) => {
    if (Array.isArray(collection?.list)) return collection.list.map(Number).filter(Boolean);

    return Object.entries(collection?.items ?? {})
        .sort(([, a], [, b]) => (a?.at ?? a ?? 0) - (b?.at ?? b ?? 0))
        .map(([id]) => Number(id))
        .filter(Boolean);
};

/** Сколько соседей вокруг текущего держим загруженными */
const WINDOW = 10;

const state = {
    /** @type {Object | null} */
    collection: null,
    /** @type {number[]} */
    ids: [],
    /** Текущее аниме страницы */
    aid: Number($ID),
    /** @type {ReturnType<createSource> | null} */
    source: null
};

/**
 * Соседи текущего аниме — грузить всю коллекцию ради ленты незачем,
 * а до дальних карточек пользователь сперва должен долистать
 *
 * @param {number} [size]
 */
const around = (size = WINDOW) => {
    const index = state.ids.indexOf(state.aid);
    if (index === -1) return state.ids.slice(0, size);

    return state.ids.slice(Math.max(index - size, 0), index + size + 1);
};

/** Заголовок, счётчик и переход к полному списку */
const head = (collection) => {
    const root = document.querySelector(ROOT);
    if (!root) return;

    root.querySelector('.cid-title').textContent = collection.title ?? '';
    root.querySelector('.cid-open span').textContent = `Все ${state.ids.length}`;

    // Открывает вся шапка, а не только «Все N»: по названию коллекции
    // нажимают чаще, чем по подписи справа
    root.querySelector('.cid-title-wrapper')?.addEventListener('click', () => {
        WCollectionViewer($CID, { collection }).catch(() => null);
    });
};

export const InitCidCollection = async () => {
    const root = document.querySelector(ROOT);
    if (!root) return;

    const collection = await fetchCollection($CID);

    // Коллекции нет, она приватная или аниме в ней уже не лежит — ленты
    // тоже нет: показывать чужой список без связи с открытым аниме незачем
    if (!collection) return;

    state.collection = collection;
    state.ids = orderedIds(collection);

    if (!state.ids.includes(state.aid)) return;

    // Коллекция из одного аниме — это и есть открытое: листать некуда,
    // а лента с единственной карточкой только занимает экран
    if (state.ids.length <= 1) return;

    head(collection);
    root.classList.add('-show');

    // Ревизией кэша служит updatedAt: он меняется при любой правке
    // коллекции, так что разойтись с сервером кэш не может
    state.source = createSource($CID, collection.updatedAt ?? null);

    const strip = createStrip(root.querySelector('.cid-collection-viewer'), state.source, {
        ids: state.ids,
        current: state.aid,
        cid: $CID,
        onNeed: async (ids) => {
            await state.source.load(ids);
            strip.fill();
        }
    });

    createControls(root.querySelector('.cid-collection-controller'), {
        ids: state.ids,
        current: state.aid,
        cid: $CID,
        onCurrent: () => strip.toCurrent({ smooth: true })
    });

    // Автор грузится параллельно ленте: ради плашки в панели нет смысла
    // держать карточки в ожидании
    createOwner(root).load(ownerOf(collection, $CID));

    // Сначала пустая лента, потом данные: так текущая карточка встаёт
    // на место сразу, а не прыгает после ответа Shikimori
    strip.draw();
    strip.toCurrent();

    await state.source.load(around());

    strip.fill();
    strip.toCurrent();
};

export default InitCidCollection;
