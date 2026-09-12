import { createCard } from "./mod.card.js";

/**
 * Список карточек в окне.
 *
 * Контейнер один, а наборов два — выбранные и результаты поиска. Поэтому
 * список не решает, что показывать: ему передают готовый порядок id, а он
 * достаёт данные из источника и рисует.
 *
 * @param {HTMLElement} dom - контейнер `.anime-list`
 * @param {ReturnType<import("./mod.source.js").createSource>} source
 * @param {ReturnType<import("./mod.selection.js").createSelection>} selection
 * @param {{onToggle?: (id: number, state: boolean) => void, onMore?: (mode: 'selected'|'search') => void}} [opts]
 *  onMore — доскроллили до низа, пора грузить продолжение. Что именно
 *  догружать, решает окно: находки следующей страницы или следующую
 *  порцию выбранных
 */
export function createList(dom, source, selection, { onToggle = () => { }, onMore = () => { } } = {}) {
    /** Позиция прокрутки каждого режима: при возврате список не должен прыгать наверх */
    const scroll = { selected: 0, search: 0 };

    let mode = 'selected';

    /**
     * Прокручивается не ближайший враппер, а контейнер окна. Отдать
     * наблюдателю не тот элемент — значит считать последнюю карточку
     * видимой всегда, и страницы посыпятся одна за другой
     */
    const scrollable = (el) => {
        for (let node = el?.parentElement; node; node = node.parentElement) {
            const { overflowY } = getComputedStyle(node);
            if (overflowY === 'auto' || overflowY === 'scroll') return node;
        }
        return null;
    };

    const scroller = scrollable(dom);
    const loader = dom.parentElement?.querySelector('.anime-list-loader');

    // Догрузка по появлению последней карточки. Наблюдаем именно за
    // карточкой, а не за скроллом: событий меньше, а срабатывает раньше,
    // чем пользователь упрётся в конец
    const observer = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) onMore(mode);
    }, { root: scroller, rootMargin: '200px' });

    /** Следить только за последней карточкой — она и есть край списка */
    const watchLast = () => {
        observer.disconnect();

        const last = dom.lastElementChild;
        if (last) observer.observe(last);
    };

    /**
     * @param {number[]} ids - порядок задаёт вызывающий код: Shikimori
     *  возвращает по-своему, а пользователь ждёт свой порядок
     */
    const draw = (ids = []) => {
        observer.disconnect();
        dom.innerHTML = '';

        add(ids);
    };

    /**
     * Дописать карточки в конец. Отдельно от `draw`, потому что для
     * следующей страницы перерисовывать весь список нельзя: картинки
     * загрузятся заново и список мигнёт целиком
     *
     * @param {number[]} ids
     */
    const add = (ids = []) => {
        const fragment = document.createDocumentFragment();

        for (const id of ids) {
            const anime = source.get(id);
            if (!anime) continue;

            fragment.append(createCard(anime));
        }

        dom.append(fragment);

        selection.repaint(dom);
        watchLast();
    };

    const onClick = (e) => {
        // Кнопка статуса управляет списком на Shikimori — к выбору в окне
        // она отношения не имеет
        if (e.target.closest('.btn-status')) return;

        const card = e.target.closest('.card-anime-h[data-id]');
        if (!card || !dom.contains(card)) return;

        const id = Number(card.dataset.id);
        const state = selection.toggle(id);

        card.classList.toggle('is-selected', state);
        onToggle(id, state);
    };

    dom.addEventListener('click', onClick);

    return {
        draw,
        add,

        get mode() {
            return mode;
        },

        /** Сколько карточек нарисовано — от этого зависит, нужна ли заглушка */
        get count() {
            return dom.childElementCount;
        },

        /**
         * Сменить режим, запомнив прокрутку прежнего
         * @param {'selected' | 'search'} next
         */
        setMode(next) {
            if (next === mode) return;

            if (scroller) scroll[mode] = scroller.scrollTop;
            mode = next;
        },

        /** Вернуть прокрутку текущего режима — после отрисовки */
        restore() {
            if (scroller) scroller.scrollTop = scroll[mode] ?? 0;
        },

        /**
         * Крутилка под списком на время догрузки
         * @param {boolean} state
         */
        loading(state) {
            if (loader) loader.dataset.state = state ? 'loading' : 'idle';
        },

        /** Перестать ждать следующую страницу: находки кончились */
        stop() {
            observer.disconnect();
            if (loader) loader.dataset.state = 'idle';
        },

        destroy() {
            observer.disconnect();
            dom.removeEventListener('click', onClick);
        }
    };
}

export default createList;
