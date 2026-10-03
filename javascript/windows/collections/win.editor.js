import { TWindow } from "../../core/window.core.js";
import Collections from "../../modules/tun.collections.js";
import { pressable } from "../../modules/tun.animate.js";
import { Template } from "../../modules/tun.template.js";
import { WindowIntercator } from "../../modules/win.module.js";
import { confirmRemove } from "./mod.confirm.js";
import { WAnimeList } from "./win.anime.js";
import { createDraft } from "./win.editor/mod.draft.js";
import { createTypeSwitch } from "./win.editor/mod.type.js";

const config = {
    tpl: '/collections/win.editor.tpl',
    css: 'win.editor.css',
    cssPath: 'style/win/css/collections/',
    ell: '.window-collection-editor'
};

/** Заголовок окна зависит от режима */
const TITLE = {
    create: 'Создание коллекции',
    edit: 'Настройка коллекции'
};

/**
 * Подписи кнопки подтверждения.
 *
 * При редактировании коротко: «Применить» рядом с «Отменить» помещается,
 * а «Редактировать коллекцию» растянуло бы кнопку на всю ширину строки.
 */
const SUBMIT = {
    create: 'Создать коллекцию',
    edit: 'Применить'
};

/**
 * Режим окна: заводим новую коллекцию или правим существующую.
 * @typedef {'create' | 'edit'} TEditorMode
 */

/**
 * Что произошло в окне. Отдельно от режима: в режиме `edit` пользователь
 * может не сохранить, а удалить коллекцию — это разные исходы.
 * @typedef {'created' | 'updated' | 'removed' | null} TEditorAction
 */

/**
 * Результат работы окна.
 *
 * @typedef {Object} TEditorResult
 * @property {boolean} accepted - довёл ли пользователь дело до конца.
 *  `false` — окно закрыли крестиком, свайпом или отменой
 * @property {TEditorMode} mode - чем окно открывали
 * @property {TEditorAction} action - что реально сделали
 * @property {string | null} cid - идентификатор коллекции. При создании
 *  появляется только после сохранения, поэтому до него `null`
 * @property {Object | null} collection - коллекция целиком: название,
 *  приватность, состав. Отдельные поля не дублируем — всё есть здесь
 */

/** @type {{ mode: TEditorMode, cid: string | null, promise: Promise<TEditorResult>, resolve: Function, result?: TEditorResult, win: TWindow } | null} */
let instance = null;

/** @param {TEditorMode} mode @param {string | null} cid */
const empty = (mode, cid) => ({ accepted: false, mode, action: null, cid, collection: null });

/**
 * Открыть окно создания или редактирования коллекции.
 *
 * Промис завершается при закрытии окна. Отмена — штатный исход:
 * `accepted: false` и `action: null`, промис при этом не отклоняется.
 *
 * Окно одно на всё приложение: повторный вызов с теми же режимом и
 * коллекцией вернёт существующий промис, с другими — будет отклонён
 * с `ALREADY_OPEN`.
 *
 * @param {TEditorMode} mode
 * @param {{cid?: string}} [opts] - `cid` обязателен для режима `edit`
 * @returns {Promise<TEditorResult>}
 *
 * @example
 * const { accepted, cid } = await WCollectionEditor('create');
 * if (accepted) console.log('создана коллекция', cid);
 *
 * @example
 * const { action } = await WCollectionEditor('edit', { cid: 'C1' });
 * if (action === 'removed') console.log('коллекция удалена');
 */
export function WCollectionEditor(mode, { cid = null } = {}) {
    if (mode !== 'create' && mode !== 'edit') {
        return Promise.reject({ code: 'BAD_MODE', msg: 'Режим: create или edit' });
    }

    if (mode === 'edit' && !cid) {
        return Promise.reject({ code: 'CID_REQUIRED', msg: 'Для редактирования нужен cid' });
    }

    const target = mode === 'edit' ? String(cid) : null;

    if (instance) {
        if (instance.mode === mode && instance.cid === target) return instance.promise;

        return Promise.reject({
            code: 'ALREADY_OPEN',
            msg: 'Окно уже открыто',
            mode: instance.mode,
            cid: instance.cid
        });
    }

    let settle;
    const promise = new Promise((resolve) => { settle = resolve; });

    // До первого await: иначе два синхронных вызова создали бы два окна
    instance = { mode, cid: target, promise, resolve: settle, win: null };

    open(mode, target).catch((err) => {
        instance = null;
        settle(empty(mode, target));
        console.error('[win.editor] не удалось открыть окно', err);
    });

    return promise;
}

/**
 * @param {TEditorMode} mode
 * @param {string | null} cid
 */
async function open(mode, cid) {
    const html = (await Template(config.tpl)).css(config.css, config.cssPath).text();
    $('body').append(html);

    /** Снять подписки и обработчики при закрытии окна */
    let detach = () => { };

    const win = new TWindow({
        animate: {
            // Единственная точка завершения промиса — как бы окно ни закрыли
            animhide: () => {
                const { resolve, result } = instance ?? {};

                detach();
                win.destroy();
                instance = null;

                resolve?.(result ?? empty(mode, cid));
            }
        }
    }, config.ell);

    win.module.add(WindowIntercator);

    // Содержимое подключаем после конструктора: oninit вызывается внутри
    // него, и переменная win там ещё недоступна
    const wrapper = win.$win[0];

    detach = bind(wrapper, mode, cid);

    win.show();

    instance.win = win;

    return win;
}

/**
 * Обработчики окна.
 *
 * Возвращает функцию отписки: Collections — синглтон, а окно открывается
 * многократно, поэтому подписки обязаны сниматься при закрытии.
 *
 * @param {HTMLElement} wrapper
 * @param {TEditorMode} mode
 * @param {string | null} cid
 * @returns {() => void} отписка
 */
function bind(wrapper, mode, cid) {
    const title = wrapper.querySelector('.window-title');
    const input = wrapper.querySelector('.editor-input input');
    const submit = wrapper.querySelector('.btn-action[data-type="accept"]');
    const cancel = wrapper.querySelector('.btn-action[data-type="cancel"]');
    const close = wrapper.querySelector('.window-close');
    const remove = wrapper.querySelector('.btn-action[data-type="remove"]');
    const pick = wrapper.querySelector('.anime-selector .btn');
    const counter = wrapper.querySelector('.select-value');

    const draft = createDraft(mode, cid);

    // Запрос в процессе — на это время окно не принимает новых действий
    let busy = false;

    /** Счётчик аниме и доступность кнопки подтверждения */
    const refresh = () => {
        if (counter) counter.textContent = `${draft.anime.length} Аниме`;

        // Кнопка активна, только когда есть что сохранять: у создания это
        // непустое название, у редактирования — отличие от исходного
        submit?.classList.toggle('-dissable', busy || !draft.dirty);
    };

    /** Блокировка на время запроса — оформление за CSS */
    const lock = (state) => {
        busy = state;
        submit?.classList.toggle('-loading', state);
        refresh();
    };

    // Подписи зависят от режима: одна и та же кнопка заводит коллекцию
    // или сохраняет правки
    if (title) title.textContent = TITLE[mode];
    if (submit) submit.lastChild.textContent = SUBMIT[mode];

    // Удалять можно только существующую коллекцию
    remove?.classList.toggle('hide', mode !== 'edit');

    if (input) input.value = draft.title;

    const type = createTypeSwitch(wrapper.querySelector('.editor-type-selector'), {
        value: draft.visibility,
        onChange: (value) => {
            draft.visibility = value;
            refresh();
        }
    });

    const unpress = pressable([pick, cancel, submit, remove].filter(Boolean));

    const onTitle = () => {
        draft.title = input.value;
        refresh();
    };

    const onPick = async () => {
        const result = await WAnimeList({ selected: draft.anime }).catch(() => null);

        if (!result?.accepted) return;

        draft.anime = result.anime;
        refresh();
    };

    const onSubmit = async () => {
        if (busy || !draft.dirty) return;

        lock(true);

        try {
            const collection = mode === 'create'
                ? await createCollection(draft)
                : await updateCollection(cid, draft);

            if (!collection) return;

            WCollectionEditor.done({
                action: mode === 'create' ? 'created' : 'updated',
                cid: collection.cid,
                collection
            });
        } finally {
            lock(false);
        }
    };

    const onRemove = async () => {
        if (busy) return;

        // Название берём из черновика: пользователь мог его переписать,
        // и вопрос должен звучать про то, что он видит перед собой
        if (!await confirmRemove(cid, draft.title)) return;

        lock(true);

        try {
            await Collections.remove(cid);
            WCollectionEditor.done({ action: 'removed', cid });
        } finally {
            lock(false);
        }
    };

    const onCancel = () => {
        if (!busy) WCollectionEditor.close();
    };

    input?.addEventListener('input', onTitle);
    pick?.addEventListener('click', onPick);
    submit?.addEventListener('click', onSubmit);
    cancel?.addEventListener('click', onCancel);

    // Крестик в шапке закрывает так же, как «Отменить»: правки уходят
    // только по кнопке подтверждения
    close?.addEventListener('click', onCancel);
    remove?.addEventListener('click', onRemove);

    refresh();

    return () => {
        input?.removeEventListener('input', onTitle);
        pick?.removeEventListener('click', onPick);
        submit?.removeEventListener('click', onSubmit);
        cancel?.removeEventListener('click', onCancel);
        close?.removeEventListener('click', onCancel);
        remove?.removeEventListener('click', onRemove);

        type.destroy();
        unpress();
    };
}

/**
 * Создание: состав уходит вместе с названием одним запросом — иначе при
 * обрыве связи осталась бы пустая коллекция
 * @param {ReturnType<createDraft>} draft
 */
async function createCollection(draft) {
    return Collections.create(draft.title, {
        visibility: draft.visibility,
        anime: draft.anime
    });
}

/**
 * Сохранение правок: отправляем только изменившееся
 * @param {string} cid
 * @param {ReturnType<createDraft>} draft
 */
async function updateCollection(cid, draft) {
    const { title, visibility, add, remove } = draft.changes;

    if (title !== undefined) await Collections.rename(cid, title);
    if (visibility !== undefined) await Collections.visibility(cid, visibility);

    if (add.length > 0) await Collections.anime.add(add, cid);
    if (remove.length > 0) await Collections.anime.remove(remove, cid);

    return Collections.get(cid);
}

/**
 * Закрыть окно программно. Промис завершится отменой.
 * @returns {boolean} было ли что закрывать
 */
WCollectionEditor.close = () => {
    if (!instance?.win) return false;

    instance.win.hide();
    return true;
};

/**
 * Завершить работу окна с результатом и закрыть его.
 *
 * Сохранение отдаёт `created` или `updated`, удаление — `removed`.
 *
 * @param {{action: TEditorAction, cid?: string, collection?: Object}} result
 * @returns {boolean}
 */
WCollectionEditor.done = ({ action, cid = null, collection = null } = {}) => {
    if (!instance?.win) return false;

    // Результат кладём заранее — забирает его animhide при закрытии
    instance.result = {
        accepted: true,
        mode: instance.mode,
        action,
        cid: cid ?? instance.cid,
        collection
    };

    instance.win.hide();
    return true;
};

/**
 * Создание новой коллекции
 * @returns {Promise<TEditorResult>}
 */
WCollectionEditor.create = () => WCollectionEditor('create');

/**
 * Редактирование существующей
 * @param {string} cid
 * @returns {Promise<TEditorResult>}
 */
WCollectionEditor.edit = (cid) => WCollectionEditor('edit', { cid });

/** Открыто ли окно сейчас */
Object.defineProperty(WCollectionEditor, 'isOpen', {
    get: () => instance !== null
});

/** Режим открытого окна (null, если закрыто) */
Object.defineProperty(WCollectionEditor, 'mode', {
    get: () => instance?.mode ?? null
});

/** Какую коллекцию правим (null при создании или когда закрыто) */
Object.defineProperty(WCollectionEditor, 'cid', {
    get: () => instance?.cid ?? null
});

export default WCollectionEditor;

/**
 * УПРАВЛЕНИЕ ОКНОМ
 *
 * Экземпляр один на всё приложение, поэтому управление статическое.
 *
 *   WCollectionEditor.create()                 открыть создание
 *   WCollectionEditor.edit(cid)                открыть редактирование
 *   WCollectionEditor.done({ action, cid })    завершить с результатом
 *   WCollectionEditor.close()                  закрыть с отменой
 *   WCollectionEditor.isOpen                   открыто ли сейчас
 *   WCollectionEditor.mode                     'create' | 'edit' | null
 *   WCollectionEditor.cid                      какую коллекцию правим
 *
 * Результат различает режим и исход: окно открывали на редактирование
 * (`mode: 'edit'`), а пользователь нажал «Удалить» (`action: 'removed'`).
 * Поэтому судить по режиму о том, что произошло, нельзя:
 *
 *   создали      -> { accepted: true,  mode: 'create', action: 'created', cid }
 *   сохранили    -> { accepted: true,  mode: 'edit',   action: 'updated', cid }
 *   удалили      -> { accepted: true,  mode: 'edit',   action: 'removed', cid }
 *   закрыли      -> { accepted: false, mode,           action: null }
 *
 * Тот же пустой результат приходит, когда окно закрывают крестиком,
 * свайпом или тапом по подложке — все способы отмены неотличимы.
 *
 * @example
 * // Из окна выбора, по кнопке «Изменить» в строке
 * const { action, cid } = await WCollectionEditor.edit(collection.cid);
 * if (action === 'removed') list.render();
 */
