import { OAuth } from "../../core/main.core.js";
import { TWindow } from "../../core/window.core.js";
import { Collections as API, Tunime } from "../../modules/api.tunime.js";
import { pressable } from "../../modules/tun.animate.js";
import { Popup } from "../../modules/tun.popup.js";
import Collections from "../../modules/tun.collections.js";
import { Template } from "../../modules/tun.template.js";
import { WindowIntercator } from "../../modules/win.module.js";
import { WAnimeList } from "./win.anime.js";
import { WCollectionEditor } from "./win.editor.js";
import { createGrid } from "./win.viewer/mod.grid.js";
import { createOwner } from "./win.viewer/mod.owner.js";
import { createSource } from "./win.viewer/mod.source.js";

const config = {
    tpl: '/collections/win.viewer.tpl',
    css: 'win.viewer.css',
    cssPath: 'style/win/css/collections/',
    ell: '.window-collection-viewer'
};

/** Свои коллекции у Shikimori: избранное чужого пользователя — `favourites:{uid}` */
const FAVOURITES = 'favourites';

/** Иконка перед названием — только у особых коллекций */
const ICONS = {
    favourites: '#i-shikimori',
    shikimori: '#i-shikimori',
    recommend: '#i-box-archive'
};

/** Столько аниме догружаем за раз — предел Shikimori на запрос */
const CHUNK = 50;

/**
 * Результат работы окна.
 *
 * @typedef {Object} TViewerResult
 * @property {boolean} copied - завёл ли пользователь себе копию
 * @property {string | null} cid - копия, если её создали
 * @property {Object | null} collection - сама копия
 */

/** @type {{promise: Promise<TViewerResult>, resolve: Function, cid: string, result?: TViewerResult, win: TWindow} | null} */
let instance = null;

const empty = () => ({ copied: false, cid: null, collection: null });

/**
 * Состав коллекции одним списком id.
 *
 * У коллекций Tunime это карта `items`, у избранного Shikimori — массив
 * `list`: оно виртуальное и живёт по своим правилам
 *
 * @param {Object | null} collection
 * @returns {number[]}
 */
const idsOf = (collection) => {
    const raw = Array.isArray(collection?.list)
        ? collection.list
        : Object.keys(collection?.items ?? {});

    return raw.map(Number).filter(Boolean);
};

/**
 * Открыть коллекцию на просмотр — свою или чужую.
 *
 * Промис завершается при закрытии окна. Обычный исход — просто закрыли,
 * тогда `copied` будет `false`.
 *
 * Окно одно на всё приложение: повторный вызов с той же коллекцией
 * вернёт существующий промис, с другой — отклонится.
 *
 * @param {string} cid
 * @param {{collection?: Object}} [opts] - коллекция целиком, если она
 *  уже есть на руках: тогда окно не пойдёт за ней на сервер
 * @returns {Promise<TViewerResult>}
 *
 * @example
 * const { copied, cid } = await WCollectionViewer('AbC123');
 */
export function WCollectionViewer(cid, { collection = null } = {}) {
    if (!cid) {
        return Promise.reject({ code: 'CID_REQUIRED', msg: 'Нужен cid коллекции' });
    }

    const target = String(cid);

    if (instance) {
        if (instance.cid === target) return instance.promise;

        return Promise.reject({
            code: 'ALREADY_OPEN',
            msg: 'Окно уже открыто',
            cid: instance.cid
        });
    }

    let settle;
    const promise = new Promise((resolve) => { settle = resolve; });

    // До первого await: иначе два синхронных вызова создали бы два окна
    instance = { promise, resolve: settle, cid: target, win: null };

    open(target, collection).catch((err) => {
        instance = null;
        settle(empty());
        console.error('[win.viewer] не удалось открыть окно', err);
    });

    return promise;
}

/**
 * @param {string} cid
 * @param {Object | null} collection
 */
async function open(cid, collection) {
    const html = (await Template(config.tpl)).css(config.css, config.cssPath).text();
    $('body').append(html);

    /** Снять обработчики при закрытии окна */
    let detach = () => { };

    const win = new TWindow({
        animate: {
            // Единственная точка завершения промиса — как бы окно ни закрыли
            animhide: () => {
                const { resolve, result } = instance ?? {};

                detach();
                win.destroy();
                instance = null;

                resolve?.(result ?? empty());
            }
        }
    }, config.ell);

    win.module.add(WindowIntercator);

    // Содержимое подключаем после конструктора: oninit вызывается внутри
    // него, и переменная win там ещё недоступна
    const wrapper = win.$win[0];

    detach = bind(wrapper, cid, collection);

    win.show();

    instance.win = win;

    return win;
}

/**
 * Обработчики окна.
 *
 * @param {HTMLElement} wrapper
 * @param {string} cid
 * @param {Object | null} known - коллекция, переданная снаружи
 * @returns {() => void} отписка
 */
function bind(wrapper, cid, known) {
    const title = wrapper.querySelector('.window-title');
    const counter = wrapper.querySelector('.window-subtitle .count');
    const icon = wrapper.querySelector('.name-wrapper .icon');
    const copy = wrapper.querySelector('.btn-action[data-type="copy"]');
    const edit = wrapper.querySelector('.btn-action[data-type="edit"]');
    const addanime = wrapper.querySelector('.btn-action[data-type="addanime"]');
    const share = wrapper.querySelector('.collection-share');
    const close = wrapper.querySelector('.window-close');
    const state = wrapper.querySelector('.viewer-empty-wrapper');

    const source = createSource();
    const owner = createOwner(wrapper);

    const view = { collection: null, ids: [], shown: 0, loading: false, failed: false, busy: false };

    const grid = createGrid(wrapper.querySelector('.viewer-list'), source, {
        cid,
        onMore: () => more()
    });

    /** Заглушка нужна, только когда в сетке пусто */
    const empty = () => {
        if (!state) return;

        if (grid.count > 0) return state.dataset.state = 'none';
        if (view.loading) return state.dataset.state = 'loading';

        state.dataset.state = view.failed ? 'error' : 'idle';
    };

    /** Особую коллекцию копировать нечем: она не наша и не хранится у нас */
    const special = () => view.collection && view.collection.kind !== 'custom';

    /**
     * Своя ли коллекция. Сравниваем владельца, а не наличие в кэше: кэш
     * мог не успеть догрузиться, а владелец в коллекции есть всегда —
     * кроме избранного, оно виртуальное и владельца не хранит
     */
    const mine = () => {
        if (!view.collection) return false;
        if (cid === FAVOURITES) return true;

        const me = OAuth.user?.id;
        return Boolean(me && String(view.collection.owner) === String(me));
    };

    /** Название, приватность и удаление есть только у обычных коллекций */
    const editable = () => mine() && view.collection?.kind === 'custom';

    /**
     * Состав правится и у избранного — просто уходит на Shikimori.
     * А вот «Рекомендую» наполняется со страницы аниме, не отсюда
     */
    const fillable = () => mine() && view.collection?.kind !== 'recommend';

    const refresh = () => {
        const collection = view.collection;

        if (title) title.textContent = collection?.title ?? '';
        if (counter) counter.textContent = collection?.count ?? view.ids.length;

        const symbol = ICONS[collection?.cid] ?? ICONS[collection?.kind];

        icon?.classList.toggle('hide', !symbol);
        if (symbol) icon?.querySelector('use')?.setAttribute('href', symbol);

        // Свою коллекцию правят, а не копируют
        copy?.classList.toggle('-hide', mine());
        edit?.classList.toggle('-hide', !editable());
        addanime?.classList.toggle('-hide', !fillable());

        // Копировать можно только обычную коллекцию, и только когда
        // известно, что копировать
        copy?.classList.toggle('-dissable', view.busy || special() || view.ids.length === 0);
        copy?.classList.toggle('-loading', view.busy);

        edit?.classList.toggle('-dissable', view.busy || !collection);
        addanime?.classList.toggle('-dissable', view.busy || !collection);

        empty();
    };

    /** Следующая порция аниме */
    const more = async () => {
        if (view.loading) return;

        const next = view.ids.slice(view.shown, view.shown + CHUNK);

        if (next.length === 0) {
            grid.stop();
            return;
        }

        view.loading = true;
        grid.loading(true);
        refresh();

        const { ok, missing } = await source.load(next);

        view.loading = false;
        view.failed = !ok;
        grid.loading(false);

        if (!ok) return refresh();

        view.shown += next.length;

        // Пропавшие с Shikimori просто не рисуем: карточку показать нечем
        grid.add(next.filter(id => !missing.includes(id)));
        refresh();
    };

    /** Коллекция: своя есть в кэше, за чужой идём на сервер */
    const load = async () => {
        view.loading = true;
        refresh();

        const collection = known
            ?? await fetchFavourites(cid)
            ?? Collections.get(cid)
            ?? await fetchCollection(cid);

        view.loading = false;

        if (!collection) {
            view.failed = true;
            return refresh();
        }

        view.collection = collection;
        view.ids = idsOf(collection);

        refresh();

        // Свою коллекцию себе же не подписывают. Автор рисуется отдельно:
        // ради плашки внизу нет смысла держать всю сетку в ожидании
        if (!mine()) owner.load(collection.owner);

        more();
    };

    /** Перечитать состав после правок и перерисовать сетку с начала */
    const reload = () => {
        const collection = Collections.get(cid);
        if (!collection) return WCollectionViewer.close();

        view.collection = collection;
        view.ids = idsOf(collection);
        view.shown = 0;

        grid.clear();
        refresh();
        more();
    };

    const onEdit = async () => {
        if (view.busy || !editable()) return;

        const result = await WCollectionEditor.edit(cid).catch(() => null);

        // Коллекции больше нет — смотреть тут нечего
        if (result?.action === 'removed') return WCollectionViewer.close();

        reload();
    };

    const onAddAnime = async () => {
        if (view.busy || !fillable()) return;

        const result = await WAnimeList({ selected: view.ids }).catch(() => null);
        if (!result?.accepted) return;

        const { added, removed } = result;
        if (added.length === 0 && removed.length === 0) return;

        view.busy = true;
        refresh();

        try {
            if (added.length > 0) await Collections.anime.add(added, cid);
            if (removed.length > 0) await Collections.anime.remove(removed, cid);
        } finally {
            view.busy = false;
            reload();
        }
    };

    const onCopy = async () => {
        if (view.busy || special() || view.ids.length === 0) return;

        view.busy = true;
        refresh();

        try {
            // Копия всегда приватная: чужая коллекция публичной стала по
            // решению автора, а не того, кто её себе забрал
            const created = await Collections.create(view.collection.title, {
                visibility: 'private',
                anime: view.ids
            });

            if (!created) return;

            WCollectionViewer.copied(created);
        } finally {
            view.busy = false;
            refresh();
        }
    };

    const onShare = () => {
        const link = Tunime.share.collection(cid);

        try {
            navigator.share({ title: view.collection?.title ?? document.title, url: link });
        } catch {
            navigator?.clipboard?.writeText(link)
                .then(() => new Popup('copy-clipboard', 'Ссылка скопирована.'))
                .catch((err) => console.log(err));
        }
    };

    const onClose = () => {
        if (!view.busy) WCollectionViewer.close();
    };

    copy?.addEventListener('click', onCopy);
    edit?.addEventListener('click', onEdit);
    addanime?.addEventListener('click', onAddAnime);
    share?.addEventListener('click', onShare);
    close?.addEventListener('click', onClose);

    // Крестик в шапке без отклика: там кнопки бара со своим оформлением,
    // а вот «поделиться» — действие, и нажатие должно отзываться
    const unpress = pressable([copy, edit, addanime, share].filter(Boolean));

    load();

    return () => {
        copy?.removeEventListener('click', onCopy);
        edit?.removeEventListener('click', onEdit);
        addanime?.removeEventListener('click', onAddAnime);
        share?.removeEventListener('click', onShare);
        close?.removeEventListener('click', onClose);

        grid.destroy();
        source.destroy();
        owner.destroy();
        unpress();
    };
}

/**
 * Чужая коллекция — только с сервера. Приватная чужая приходит как 404,
 * поэтому отличить «нет такой» от «не для тебя» нельзя, и это верно
 * @param {string} cid
 */
async function fetchCollection(cid) {
    const response = await API.entity(cid).GET();
    return response.complete ? response.value?.data ?? null : null;
}

/**
 * Чужое избранное. У нас оно не хранится вовсе — собирает его фасад,
 * сходив к Shikimori
 *
 * @param {string} cid - `favourites:{uid}`
 * @returns {Promise<Object | null>} `null`, если cid не про избранное
 */
async function fetchFavourites(cid) {
    const [prefix, uid] = String(cid).split(':');
    if (prefix !== FAVOURITES || !uid) return null;

    return Collections.favouritesOf(uid);
}

/**
 * Закрыть окно программно. Промис завершится без копии.
 * @returns {boolean} было ли что закрывать
 */
WCollectionViewer.close = () => {
    if (!instance?.win) return false;

    instance.win.hide();
    return true;
};

/**
 * Завершить работу окна созданной копией и закрыть его.
 * @param {Object} collection - копия, вернувшаяся от сервера
 * @returns {boolean}
 */
WCollectionViewer.copied = (collection) => {
    if (!instance?.win) return false;

    // Результат кладём заранее — забирает его animhide при закрытии
    instance.result = {
        copied: true,
        cid: collection?.cid ?? null,
        collection: collection ?? null
    };

    instance.win.hide();
    return true;
};

/**
 * Избранное Shikimori: своё или чужое.
 *
 * Отдельный вход, потому что у нас оно не хранится — ни своё, ни чужое.
 * Своё лежит в кэше коллекций, чужое приходится спрашивать у Shikimori.
 *
 * @param {string | number} [uid] - чьё избранное; без аргумента своё
 * @returns {Promise<TViewerResult>}
 *
 * @example
 * WCollectionViewer.favourites();          // своё
 * WCollectionViewer.favourites(1383110);   // чужое
 */
WCollectionViewer.favourites = (uid = null) => {
    const me = OAuth.user?.id;
    const own = !uid || String(uid) === String(me);

    return WCollectionViewer(own ? FAVOURITES : `${FAVOURITES}:${uid}`);
};

/** Открыто ли окно сейчас */
Object.defineProperty(WCollectionViewer, 'isOpen', {
    get: () => instance !== null
});

/** Какую коллекцию смотрим (null, если закрыто) */
Object.defineProperty(WCollectionViewer, 'cid', {
    get: () => instance?.cid ?? null
});

export default WCollectionViewer;

/**
 * УПРАВЛЕНИЕ ОКНОМ
 *
 * Экземпляр один на всё приложение, поэтому управление статическое.
 *
 *   WCollectionViewer(cid)                   открыть коллекцию
 *   WCollectionViewer(cid, { collection })   открыть, не ходя на сервер
 *   WCollectionViewer.favourites(uid)        избранное Shikimori
 *   WCollectionViewer.copied(collection)     завершить созданной копией
 *   WCollectionViewer.close()                просто закрыть
 *   WCollectionViewer.isOpen                 открыто ли сейчас
 *   WCollectionViewer.cid                    какую коллекцию смотрим
 */
