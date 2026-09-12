import { TWindow } from "../../core/window.core.js";
import { pressable } from "../../modules/tun.animate.js";
import Collections from "../../modules/tun.collections.js";
import { Template } from "../../modules/tun.template.js";
import { WindowIntercator } from "../../modules/win.module.js";
import { confirmRemove } from "./mod.confirm.js";
import { WCollectionEditor } from "./win.editor.js";
import { TypeFilter } from "./win.selector/mod.filter.js";
import { createList } from "./win.selector/mod.list.js";
import { createSearch } from "./win.selector/mod.search.js";
import { createSelection } from "./win.selector/mod.selection.js";
import { createSwipe } from "./win.selector/mod.swipe.js";

const config = {
    tpl: '/collections/win.selector.tpl',
    css: 'win.selector.css',
    cssPath: 'style/win/css/collections/',
    ell: '.window-collection-selector'
};

/**
 * Результат работы окна.
 *
 * @typedef {Object} TSelectorResult
 * @property {boolean} accepted - подтвердил ли пользователь выбор.
 *  `false` — окно закрыли крестиком, свайпом или отменой
 * @property {number} id - аниме, для которого открывали окно
 * @property {string[]} added - cid коллекций, куда аниме добавили
 * @property {string[]} removed - cid коллекций, откуда аниме убрали
 */

/** @type {{ id: number, promise: Promise<TSelectorResult>, resolve: Function, result?: TSelectorResult, win: TWindow } | null} */
let instance = null;

const empty = (id) => ({ accepted: false, id, added: [], removed: [] });

/**
 * Открыть окно выбора коллекций.
 *
 * Промис завершается при закрытии окна: подтверждением или отменой.
 * Отмена — штатный исход, промис при ней не отклоняется.
 *
 * Окно одно на всё приложение: повторный вызов с тем же аниме вернёт
 * существующий промис, с другим — будет отклонён с `ALREADY_OPEN`.
 *
 * @param {number} id - идентификатор аниме (Shikimori)
 * @param {Object} [opts] - зарезервировано под настройки окна
 * @returns {Promise<TSelectorResult>}
 *
 * @example
 * const { accepted, added } = await WCollectionSelector(41084);
 */
export function WCollectionSelector(id, opts = {}) {
    const anime = Number(id);

    if (!Number.isFinite(anime) || anime <= 0) {
        return Promise.reject({ code: 'BAD_ANIME_ID', msg: 'Нужен идентификатор аниме' });
    }

    if (instance) {
        if (instance.id === anime) return instance.promise;

        return Promise.reject({
            code: 'ALREADY_OPEN',
            msg: 'Окно уже открыто',
            id: instance.id
        });
    }

    let settle;
    const promise = new Promise((resolve) => { settle = resolve; });

    // До первого await: иначе два синхронных вызова создали бы два окна
    instance = { id: anime, promise, resolve: settle, win: null };

    open(anime, opts).catch((err) => {
        instance = null;
        settle(empty(anime));
        console.error('[win.selector] не удалось открыть окно', err);
    });

    return promise;
}

async function open(anime, opts) {
    const html = (await Template(config.tpl)).css(config.css, config.cssPath).text();
    $('body').append(html);

    const selection = createSelection(anime);

    /** Снять подписки на Collections при закрытии окна */
    let detach = () => { };

    const win = new TWindow({
        animate: {
            // Единственная точка завершения промиса — как бы окно ни закрыли
            animhide: () => {
                const { resolve, result, id } = instance ?? {};

                detach();
                win.destroy();
                instance = null;

                resolve?.(result ?? empty(id ?? anime));
            }
        }
    }, config.ell);

    win.module.add(WindowIntercator);

    // Содержимое подключаем после конструктора: oninit вызывается внутри
    // него, и переменная win там ещё недоступна
    const wrapper = win.$win[0];

    detach = bind(wrapper, selection);

    // Список уже отрисован из кэша — окно появляется сразу с содержимым
    win.show();

    instance.win = win;
    instance.selection = selection;

    return win;
}

/**
 * Подписки и обработчики окна.
 *
 * Collections — синглтон, а окно открывается многократно, поэтому здесь
 * возвращается функция отписки: без неё обработчики копились бы с каждым
 * открытием и писали в уже уничтоженный DOM.
 *
 * @param {HTMLElement} wrapper
 * @param {ReturnType<createSelection>} selection
 * @returns {() => void} отписка
 */
function bind(wrapper, selection) {
    const dom = wrapper.querySelector('.collections-list');
    const accept = wrapper.querySelector('.btn-action[data-type="accept"]');
    const cancel = wrapper.querySelector('.btn-action[data-type="cancel"]');
    const close = wrapper.querySelector('.window-close');

    // Тап по строке приходит из свайпа: он сам отличает нажатие от
    // протяжки и гасит клик, оставшийся после жеста
    const swipe = createSwipe(dom, {
        onTap: (item) => {
            const state = selection.toggle(item.dataset.cid);

            item.classList.toggle('is-selected', state);
            accept.classList.toggle('-dissable', !selection.dirty);
        }
    });

    const list = createList(dom, selection, swipe);

    const refresh = () => list.render();
    const onChange = (collection) => list.count(collection);

    // Фильтр по типу и поиск по названию — оба сводятся к одному отбору
    const filter = new TypeFilter(wrapper.querySelector('.type-filter-wrapper'), {
        onChange: (type) => list.setFilter({ type })
    });

    const search = createSearch(wrapper, {
        onInput: (query) => list.setFilter({ query })
    });

    const creators = [...wrapper.querySelectorAll('.create-collection')];
    const unpress = pressable([accept, cancel, ...creators]);

    // Действия под строкой открываются свайпом
    const onAction = async (e) => {
        const button = e.target.closest('.btn-item[data-type]');
        if (!button) return;

        const item = button.closest('.item[data-cid]');
        if (!item) return;

        const cid = item.dataset.cid;
        swipe.closeAll();

        if (button.dataset.type === 'remove') {
            if (await confirmRemove(cid)) await Collections.remove(cid);
            return;
        }

        // Редактор — отдельное окно поверх этого. Список обновит подписка
        // на Collections, так что результат здесь не нужен
        if (button.dataset.type === 'edit') {
            await WCollectionEditor.edit(cid).catch(() => { });
        }
    };

    // Созданная коллекция сразу отмечается: её и заводили ради текущего
    // аниме, иначе пришлось бы искать её в списке и тыкать второй раз
    const onCreate = async () => {
        const result = await WCollectionEditor.create().catch(() => null);

        if (!result?.accepted || !result.cid) return;

        // Сначала отрисовка: она пересобирает исходное состояние, и отметка,
        // поставленная до неё, потерялась бы
        list.render();
        selection.add(result.cid);
        selection.repaint(dom);

        accept.classList.toggle('-dissable', !selection.dirty);
    };

    dom.addEventListener('click', onAction);
    creators.forEach(btn => btn.addEventListener('click', onCreate));

    Collections.on('loaded', refresh, { replay: true });
    Collections.on('sync', refresh);
    Collections.on('create', refresh);
    Collections.on('remove', refresh);
    Collections.on('rename', refresh);
    Collections.on('visibility', refresh);
    Collections.on('change', onChange);

    // Пока запрос в пути, кнопка помечается '-loading' — оформление за CSS
    let applying = false;

    const onAccept = async () => {
        if (applying || !selection.dirty) return;

        const changes = selection.changes();

        applying = true;
        accept.classList.add('-loading', '-dissable');

        try {
            // Одним запросом и одной транзакцией: поштучно это было бы N
            // обращений и частичное применение при обрыве связи.
            // Имена полей разные: наружу окно отдаёт added/removed —
            // «что произошло», а модуль принимает add/remove — «что сделать»
            await Collections.anime.apply(selection.anime, {
                add: changes.added,
                remove: changes.removed
            });

            WCollectionSelector.accept(changes);
        } finally {
            // Окно закрывается и уничтожается, но при ошибке остаётся —
            // тогда кнопку надо вернуть в рабочее состояние
            applying = false;
            accept.classList.remove('-loading');
            accept.classList.toggle('-dissable', !selection.dirty);
        }
    };

    // Отмена во время отправки заблокирована: изменения уже применены
    // локально, а закрытие окна оборвало бы обратную связь по запросу
    const onCancel = () => {
        if (applying) return;
        WCollectionSelector.close();
    };

    accept.addEventListener('click', onAccept);
    cancel.addEventListener('click', onCancel);

    // Крестик в шапке закрывает так же, как «Отменить»: во время
    // отправки оба заблокированы
    close?.addEventListener('click', onCancel);

    // Рисуем сразу из кэша, не дожидаясь событий: окно могли открыть на
    // странице, где Collections.init() ещё не вызывали — тогда 'loaded'
    // с replay не пришло бы вовсе и список остался бы пустым
    list.render();

    if (!Collections.loaded) Collections.init();
    else Collections.sync();

    return () => {
        Collections.off('loaded', refresh);
        Collections.off('sync', refresh);
        Collections.off('create', refresh);
        Collections.off('remove', refresh);
        Collections.off('rename', refresh);
        Collections.off('visibility', refresh);
        Collections.off('change', onChange);

        dom.removeEventListener('click', onAction);
        creators.forEach(btn => btn.removeEventListener('click', onCreate));

        accept.removeEventListener('click', onAccept);
        cancel.removeEventListener('click', onCancel);
        close?.removeEventListener('click', onCancel);

        // Снимают слушатели документа, ResizeObserver и draggable
        swipe.destroy();
        search.destroy();
        filter.destroy();
        unpress();
    };
}

/**
 * Закрыть окно программно. Промис завершится отменой.
 * @returns {boolean} было ли что закрывать
 */
WCollectionSelector.close = () => {
    if (!instance?.win) return false;

    instance.win.hide();
    return true;
};

/**
 * Подтвердить выбор и закрыть окно.
 * @param {{added?: string[], removed?: string[]}} changes
 * @returns {boolean}
 */
WCollectionSelector.accept = ({ added = [], removed = [] } = {}) => {
    if (!instance?.win) return false;

    instance.result = { accepted: true, id: instance.id, added, removed };
    instance.win.hide();
    return true;
};

/** Открыто ли окно сейчас */
Object.defineProperty(WCollectionSelector, 'isOpen', {
    get: () => instance !== null
});

/** Для какого аниме открыто окно (null, если закрыто) */
Object.defineProperty(WCollectionSelector, 'animeId', {
    get: () => instance?.id ?? null
});

export default WCollectionSelector;

/**
 * УПРАВЛЕНИЕ ОКНОМ
 *
 * Экземпляр один на всё приложение, поэтому управление статическое —
 * держать ссылку на окно не нужно, достаточно импортировать функцию.
 *
 *   WCollectionSelector.accept({ added, removed })  подтвердить и закрыть
 *   WCollectionSelector.close()                     закрыть с отменой
 *   WCollectionSelector.isOpen                      открыто ли сейчас
 *   WCollectionSelector.animeId                     для какого аниме открыто
 *
 * `accept` и `close` возвращают `false`, если окна нет — вызывать их
 * вслепую безопасно.
 *
 * Обе закрывают окно через `win.hide()`, а промис завершает `animhide`
 * после анимации. Разница только в том, что `accept` заранее кладёт
 * результат, а `close` оставляет его пустым:
 *
 *   accept({ added: ['C1'] })  ->  { accepted: true,  added: ['C1'], removed: [] }
 *   close()                    ->  { accepted: false, added: [],     removed: [] }
 *
 * Тот же пустой результат приходит, когда пользователь закрывает окно
 * сам — крестиком, свайпом или тапом по подложке. Для вызывающего кода
 * все способы отмены выглядят одинаково.
 *
 * @example
 * // Кнопка «Готово» в разметке окна
 * accept.addEventListener('click', () => {
 *     const { add, remove } = Selection.process();
 *     WCollectionSelector.accept({ added: add, removed: remove });
 * });
 *
 * @example
 * // Закрыть снаружи, например при выходе из аккаунта
 * if (WCollectionSelector.isOpen) WCollectionSelector.close();
 */
