import { TWindow } from "../../core/window.core.js";
import { pressable } from "../../modules/tun.animate.js";
import { Template } from "../../modules/tun.template.js";
import { WindowIntercator } from "../../modules/win.module.js";
import { WNotification } from "../win.notification.js";
import { createEmpty } from "./win.anime/mod.empty.js";
import { createList } from "./win.anime/mod.list.js";
import { createSearch } from "./win.anime/mod.search.js";
import { createSelection } from "./win.anime/mod.selection.js";
import { createSource } from "./win.anime/mod.source.js";

const config = {
    tpl: '/collections/win.anime.tpl',
    css: 'win.anime.css',
    cssPath: 'style/win/css/collections/',
    ell: '.window-anime-list'
};

/**
 * Результат работы окна.
 *
 * `anime` — итоговый набор, им наполняется коллекция. `added` и `removed`
 * посчитаны относительно переданного `selected`: вызывающему коду они
 * нужны, чтобы отправить на сервер только изменения, а не весь список.
 *
 * @typedef {Object} TAnimePickerResult
 * @property {boolean} accepted - подтвердил ли пользователь выбор.
 *  `false` — окно закрыли крестиком, свайпом или отменой
 * @property {number[]} anime - выбранные id, целиком
 * @property {number[]} added - что появилось относительно исходного набора
 * @property {number[]} removed - что убрали
 */

/** @type {{ promise: Promise<TAnimePickerResult>, resolve: Function, selection: ReturnType<createSelection>, result?: TAnimePickerResult, win: TWindow } | null} */
let instance = null;

/** @param {number[]} selected - исходный набор, он же результат отмены */
const empty = (selected) => ({ accepted: false, anime: [...selected], added: [], removed: [] });

/**
 * Открыть окно выбора аниме.
 *
 * Промис завершается при закрытии окна. Отмена — штатный исход: приходит
 * исходный набор без изменений, промис не отклоняется.
 *
 * Окно одно на всё приложение: повторный вызов вернёт существующий промис.
 *
 * @param {{selected?: number[]}} [opts] - что уже выбрано; эти аниме
 *  открываются отмеченными
 * @returns {Promise<TAnimePickerResult>}
 *
 * @example
 * const { accepted, anime } = await WAnimeList({ selected: [41084, 38040] });
 * if (accepted) draft.anime = anime;
 */
export function WAnimeList({ selected = [] } = {}) {
    const start = [...new Set(selected.map(Number).filter(id => Number.isFinite(id) && id > 0))];

    // Окно не привязано к сущности, поэтому повторный вызов просто отдаёт
    // тот же промис: показывать второй список поверх первого бессмысленно
    if (instance) return instance.promise;

    let settle;
    const promise = new Promise((resolve) => { settle = resolve; });

    // До первого await: иначе два синхронных вызова создали бы два окна
    instance = { promise, resolve: settle, selection: createSelection(start), win: null, start };

    open(start).catch((err) => {
        instance = null;
        settle(empty(start));
        console.error('[win.anime] не удалось открыть окно', err);
    });

    return promise;
}

/** @param {number[]} start */
async function open(start) {
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

                resolve?.(result ?? empty(start));
            }
        }
    }, config.ell);

    win.module.add(WindowIntercator);

    // Содержимое подключаем после конструктора: oninit вызывается внутри
    // него, и переменная win там ещё недоступна
    const wrapper = win.$win[0];

    detach = bind(wrapper, instance.selection);

    win.show();

    instance.win = win;

    return win;
}

/**
 * Обработчики окна.
 *
 * @param {HTMLElement} wrapper
 * @param {ReturnType<createSelection>} selection
 * @returns {() => void} отписка
 */
function bind(wrapper, selection) {
    const submit = wrapper.querySelector('.btn-action[data-type="accept"]');
    const counter = wrapper.querySelector('.window-bar .win-bar-count');
    const close = wrapper.querySelector('.window-close');
    const empty = createEmpty(wrapper);
    const source = createSource();

    /** Что сейчас в списке: выбранное или результаты поиска */
    const view = { query: '', page: 1, loading: false, failed: false, done: false, results: [] };

    /**
     * Выбранные показываем порциями. Их id известны сразу, а вот данные
     * нет: коллекция может быть на сотни аниме, и тянуть их все до показа
     * значит десятки запросов подряд и почти гарантированный 429.
     */
    const picked = { shown: 0, done: false };

    /** Столько выбранных догружаем за раз — предел Shikimori на запрос */
    const PICKED_CHUNK = 50;

    /**
     * Какую заглушку показать. `null` — на экране есть карточки, и
     * заглушка не нужна вовсе.
     */
    const state = () => {
        if (list.count > 0) return null;

        if (view.loading) return 'loading';
        if (view.failed) return 'error';

        // Без запроса список показывает выбранное, и пусто он бывает
        // только пока ничего не выбрали
        return view.query ? 'nofound' : 'idle';
    };

    /** Счётчик, подпись кнопки и пустое состояние */
    const refresh = () => {
        const size = selection.size;

        if (counter) counter.textContent = size;
        if (submit) submit.textContent = `Установить ${size} аниме`;

        empty.set(state(), view.query);
    };

    const list = createList(wrapper.querySelector('.anime-list'), source, selection, {
        // Отметка меняет счётчик, а в режиме выбранных ещё и состав
        // списка — но перерисовывать под пальцем нельзя, карточка уедет
        // из-под курсора. Строку убираем при следующей отрисовке
        onToggle: refresh,
        onMore: (mode) => mode === 'search' ? more() : morePicked()
    });

    /**
     * Следующая порция выбранных. «Страница» здесь — просто следующие id
     * из списка выбора: что грузить, известно заранее, спрашивать сервер
     * о существовании продолжения не нужно
     */
    const morePicked = async () => {
        if (view.loading || picked.done || list.mode !== 'selected') return;

        const ids = selection.list;
        const next = ids.slice(picked.shown, picked.shown + PICKED_CHUNK);

        if (next.length === 0) {
            picked.done = true;
            list.stop();
            return;
        }

        view.loading = true;
        list.loading(true);
        refresh();

        const { ok, missing } = await source.preload(next);

        view.loading = false;
        view.failed = !ok;
        list.loading(false);

        if (!ok) return refresh();

        // Чего нет на Shikimori — нет и в окне: показать такую карточку
        // нечем, а держать её в выборе значит вернуть коллекции мусор
        for (const id of missing) selection.set(id, false);

        const first = picked.shown === 0;
        picked.shown += next.length;

        // Режим мог смениться, пока ждали ответ
        if (list.mode === 'selected') {
            list.add(next);

            // Прокрутку возвращаем, когда есть куда: на пустом списке
            // она сбросилась бы в ноль
            if (first) list.restore();
        }

        refresh();
    };

    /** Перерисовать список тем, что положено текущему режиму */
    const render = () => {
        if (list.mode === 'search') {
            list.draw(view.results);
            list.restore();
            refresh();
            return;
        }

        // Выбранные набираем заново с первой порции: у уже загруженных
        // данные в кэше, так что дальше первой порции запросов не будет
        Object.assign(picked, { shown: 0, done: false });

        list.draw([]);
        morePicked();
    };

    const onSubmit = () => WAnimeList.done();
    const onClose = () => WAnimeList.close();

    /**
     * Закрытие с несохранённым выбором.
     *
     * Крестик и клик по фону выглядят как «свернуть», а не «выбросить»,
     * поэтому спрашиваем — но только когда есть что терять
     */
    const onGuard = async (e) => {
        if (!e.target.closest('.window-close, .hide-window')) return;
        if (!selection.dirty) return;

        // Перехват в фазе погружения: обработчик закрытия висит на самих
        // элементах и без этого успел бы отработать первым
        e.preventDefault();
        e.stopPropagation();

        const { win } = await WNotification({
            content: 'Закрыть без сохранения?<br />Выбранные аниме не будут добавлены.'
        });

        if (win === 1) WAnimeList.close();
    };

    wrapper.addEventListener('click', onGuard, true);

    submit?.addEventListener('click', onSubmit);
    close?.addEventListener('click', onClose);

    // Крестик в шапке без отклика на нажатие: там кнопки бара, у них
    // своё оформление, и подпрыгивающая иконка выбивается из шапки
    const unpress = pressable([submit].filter(Boolean));

    /** Следующая страница находок — прежние остаются на месте */
    const more = async () => {
        if (view.loading || view.done || !view.query) return;

        view.loading = true;
        list.loading(true);

        const page = view.page + 1;

        const { aborted, failed, ids } = await source.search(view.query, page);
        if (aborted) return;

        view.loading = false;
        list.loading(false);

        // Пусто — дальше страниц нет. Наблюдателя снимаем, иначе он будет
        // дёргать тот же пустой ответ на каждое движение списка
        if (failed || ids.length === 0) {
            view.done = true;
            list.stop();
            return;
        }

        view.page = page;

        const fresh = ids.filter(id => !view.results.includes(id));
        view.results = [...view.results, ...fresh];

        // Дописываем только новые: полная перерисовка заставила бы
        // перезагрузиться все картинки, и список мигал бы целиком
        list.add(fresh);
        refresh();
    };

    // Строка поиска разъезжается на всю панель по кнопке-лупе.
    // Пустой запрос — это не «ничего не нашли», а возврат к обычному
    // списку, поэтому оба случая разведены по разным веткам
    const search = createSearch(wrapper, {
        onInput: async (value) => {
            Object.assign(view, {
                query: value, page: 1,
                loading: value.length > 0,
                failed: false, done: false, results: []
            });

            list.setMode(value ? 'search' : 'selected');
            render();

            // Новый запрос — прежняя пометка недействительна
            search.check(false);

            if (!value) return;

            const { aborted, failed, ids } = await source.search(value);

            // Оборвали — значит, уже летит запрос посвежее, и это его дело
            // решать, что показать
            if (aborted) return;

            Object.assign(view, { loading: false, failed, results: ids });
            render();

            // Запрос отработал и находки на экране — помечаем крестик
            search.check(!failed && ids.length > 0);

            // Первая страница пришла неполной — второй не будет
            if (ids.length === 0) list.stop();
        },
        onHide: () => {
            Object.assign(view, {
                query: '', page: 1,
                loading: false, failed: false, done: false, results: []
            });

            list.setMode('selected');
            render();
        }
    });

    // Первая порция выбранных: окно открывается сразу, остальные
    // подтягиваются прокруткой
    render();

    return () => {
        submit?.removeEventListener('click', onSubmit);
        close?.removeEventListener('click', onClose);
        wrapper.removeEventListener('click', onGuard, true);

        search.destroy();
        list.destroy();
        source.destroy();
        unpress();
    };
}

/**
 * Закрыть окно программно. Промис завершится отменой.
 * @returns {boolean} было ли что закрывать
 */
WAnimeList.close = () => {
    if (!instance?.win) return false;

    instance.win.hide();
    return true;
};

/**
 * Подтвердить выбор и закрыть окно.
 * @returns {boolean}
 */
WAnimeList.done = () => {
    if (!instance?.win) return false;

    const { selection } = instance;

    // Результат кладём заранее — забирает его animhide при закрытии
    instance.result = {
        accepted: true,
        anime: selection.list,
        ...selection.changes
    };

    instance.win.hide();
    return true;
};

/** Открыто ли окно сейчас */
Object.defineProperty(WAnimeList, 'isOpen', {
    get: () => instance !== null
});

/** Сколько аниме выбрано прямо сейчас (null, если закрыто) */
Object.defineProperty(WAnimeList, 'size', {
    get: () => instance?.selection.size ?? null
});

export default WAnimeList;

/**
 * УПРАВЛЕНИЕ ОКНОМ
 *
 * Экземпляр один на всё приложение, поэтому управление статическое.
 *
 *   WAnimeList({ selected })   открыть, отметив уже выбранные
 *   WAnimeList.done()          подтвердить и закрыть
 *   WAnimeList.close()         закрыть с отменой
 *   WAnimeList.isOpen          открыто ли сейчас
 *   WAnimeList.size            сколько выбрано прямо сейчас
 *
 * Результат всегда содержит полный набор — и при подтверждении, и при
 * отмене (тогда это исходный набор без изменений). Вызывающему коду не
 * нужно разбирать случаи: можно просто взять `anime`, а `added` и
 * `removed` использовать, когда важно отправить только разницу.
 *
 *   подтвердили -> { accepted: true,  anime: [...], added: [...], removed: [...] }
 *   закрыли     -> { accepted: false, anime: [...исходные], added: [], removed: [] }
 *
 * @example
 * // Из окна редактора, по кнопке «Выбрать аниме»
 * const { accepted, anime } = await WAnimeList({ selected: draft.anime });
 * if (accepted) draft.anime = anime;
 */
