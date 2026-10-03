import { ACard } from "../../../modules/AnimeCard.js";

/**
 * Сетка постеров коллекции.
 *
 * Карточки строит `ACard.GenV2` — та же вёрстка и те же стили, что на
 * остальных страницах. Отсюда и `<a>`: работает открытие в новой вкладке
 * и предпросмотр по долгому нажатию, а снимать при закрытии окна нечего.
 *
 * @param {HTMLElement} dom - контейнер `.viewer-list`
 * @param {ReturnType<import("./mod.source.js").createSource>} source
 * @param {{cid?: string, onMore?: () => void}} [opts]
 *  cid дописывается к ссылкам: страница аниме будет знать, из какой
 *  коллекции на неё пришли
 */
export function createGrid(dom, source, { cid = null, onMore = () => { } } = {}) {
    /**
     * Прокручивается контейнер окна, а не ближайший враппер: отдать
     * наблюдателю не тот элемент — значит считать последнюю карточку
     * видимой всегда, и порции посыпятся одна за другой
     */
    const scrollable = (el) => {
        for (let node = el?.parentElement; node; node = node.parentElement) {
            const { overflowY } = getComputedStyle(node);
            if (overflowY === 'auto' || overflowY === 'scroll') return node;
        }
        return null;
    };

    const scroller = scrollable(dom);
    const loader = dom.parentElement?.querySelector('.viewer-list-loader');

    const observer = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) onMore();
    }, { root: scroller, rootMargin: '300px' });

    /** Следить только за последней карточкой — она и есть край списка */
    const watchLast = () => {
        observer.disconnect();

        const last = dom.lastElementChild;
        if (last) observer.observe(last);
    };

    /**
     * Дописать карточки в конец
     * @param {number[]} ids - порядок задаёт коллекция
     */
    const add = (ids = []) => {
        const html = [];

        for (const id of ids) {
            const anime = source.get(id);
            if (!anime) continue;

            // У части тайтлов нет русского названия — тогда показываем
            // оригинальное, иначе в карточке было бы пусто
            html.push(ACard.GenV2({
                anime: { ...anime, russian: anime.russian || anime.name },
                query: { cid }
            }));
        }

        if (html.length === 0) return;

        dom.insertAdjacentHTML('beforeend', html.join(''));
        watchLast();
    };

    return {
        add,

        clear() {
            observer.disconnect();
            dom.innerHTML = '';
        },

        get count() {
            return dom.childElementCount;
        },

        /**
         * Крутилка под сеткой
         * @param {boolean} state
         */
        loading(state) {
            if (loader) loader.dataset.state = state ? 'loading' : 'idle';
        },

        /** Порции кончились — ждать больше нечего */
        stop() {
            observer.disconnect();
            if (loader) loader.dataset.state = 'idle';
        },

        destroy() {
            observer.disconnect();
        }
    };
}

export default createGrid;
