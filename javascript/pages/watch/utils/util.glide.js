/**
 * Плавная прокрутка контейнера с инерцией от колеса мыши.
 *
 * Зачем своё вместо `scrollIntoView` и `scroll-behavior: smooth`:
 * первый тянет за собой все прокручиваемые предки и спорит с
 * примагничиванием, второй перезапускается на каждом щелчке колеса и
 * оттого дёргается. Здесь одна анимация на всё, и любой новый вызов
 * перехватывает предыдущий, а не борется с ним.
 *
 * Не привязано ни к ленте коллекции, ни к странице просмотра — годится
 * для любого прокручиваемого контейнера.
 */

/** Строка в пикселях: у мыши шаг бывает в строках или страницах */
const LINE = 16;

/**
 * @typedef {Object} TGlideOptions
 * @property {'x' | 'y'} [axis] - вдоль какой оси прокручиваем
 * @property {number} [ease] - доля оставшегося пути за кадр: меньше —
 *  мягче и дольше, больше — резче
 * @property {boolean} [wheel] - крутить колесом мыши
 * @property {string} [busy] - класс на время анимации. Нужен, когда у
 *  контейнера примагничивание: оно тянет ленту назад на каждом кадре,
 *  и на время движения его снимают
 */

/**
 * @param {HTMLElement} dom - прокручиваемый контейнер
 * @param {TGlideOptions} [opts]
 */
export function createGlide(dom, { axis = 'x', ease = 0.18, wheel = true, busy = '-glide' } = {}) {
    const isX = axis === 'x';

    const prop = isX ? 'scrollLeft' : 'scrollTop';
    const size = isX ? 'clientWidth' : 'clientHeight';
    const full = isX ? 'scrollWidth' : 'scrollHeight';
    const offset = isX ? 'offsetLeft' : 'offsetTop';
    const length = isX ? 'offsetWidth' : 'offsetHeight';

    // Системная настройка «уменьшить движение» — тогда без анимации вовсе
    const allowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /** Куда едем: копится по щелчкам колеса, догоняется покадрово */
    let target = null;
    let frame = null;

    const max = () => Math.max(dom[full] - dom[size], 0);

    const limit = (value) => Math.min(Math.max(value, 0), max());

    const stop = () => {
        if (frame) cancelAnimationFrame(frame);

        frame = null;
        target = null;

        if (busy) dom.classList.remove(busy);
    };

    const tick = () => {
        const diff = target - dom[prop];

        // Доехали — снимаем блокировку, и примагничивание (если оно есть)
        // доводит контейнер до ближайшего элемента
        if (Math.abs(diff) < 0.5) {
            dom[prop] = target;
            return stop();
        }

        dom[prop] += diff * ease;
        frame = requestAnimationFrame(tick);
    };

    /**
     * Доехать до позиции
     * @param {number} value
     * @param {boolean} [animated]
     */
    const to = (value, animated = true) => {
        stop();

        const next = limit(value);

        if (!animated || !allowed) {
            dom[prop] = next;
            return;
        }

        target = next;
        if (busy) dom.classList.add(busy);

        frame = requestAnimationFrame(tick);
    };

    /**
     * Колесо мыши прокручивает контейнер.
     *
     * У края событие отдаётся странице: иначе контейнер съедал бы
     * прокрутку и страница вставала бы намертво под курсором
     */
    const onWheel = (e) => {
        const main = isX ? e.deltaY : e.deltaX;
        const cross = isX ? e.deltaX : e.deltaY;

        // Жест тачпада вдоль нашей оси браузер обработает сам
        if (Math.abs(cross) > Math.abs(main)) return;

        const step = e.deltaMode === 1 ? main * LINE
            : e.deltaMode === 2 ? main * dom[size]
                : main;

        // Запас в пиксель: дробная прокрутка при масштабировании
        // страницы никогда не совпадёт с краем точно
        const from = target ?? dom[prop];
        const edge = (step < 0 && from <= 1) || (step > 0 && from >= max() - 1);

        if (max() <= 0 || edge) return;

        e.preventDefault();

        // Щелчки складываются: быстрая прокрутка уносит дальше, а не
        // начинает путь заново с каждого события
        to((target ?? dom[prop]) + step);
    };

    if (wheel) {
        dom.addEventListener('wheel', onWheel, { passive: false });

        // Тронули пальцем или мышью — анимация больше не хозяин
        dom.addEventListener('pointerdown', stop);
    }

    return {
        to,
        stop,

        /**
         * Показать элемент по центру контейнера
         * @param {HTMLElement} el
         * @param {{animated?: boolean}} [opts]
         */
        center(el, { animated = true } = {}) {
            if (!el) return;

            to(el[offset] - (dom[size] - el[length]) / 2, animated);
        },

        /**
         * Показать элемент, если он вне видимой части. Уже видимый не
         * трогаем — иначе список дёргался бы без причины
         *
         * @param {HTMLElement} el
         * @param {{animated?: boolean}} [opts]
         */
        reveal(el, { animated = true } = {}) {
            if (!el || this.visible(el)) return;

            this.center(el, { animated });
        },

        /**
         * Виден ли элемент целиком
         * @param {HTMLElement} el
         */
        visible(el) {
            if (!el) return false;

            const start = el[offset] - dom[prop];
            return start >= 0 && start + el[length] <= dom[size];
        },

        /** @param {'start' | 'end'} edge */
        toEdge(edge) {
            to(edge === 'start' ? 0 : max());
        },

        destroy() {
            stop();

            dom.removeEventListener('wheel', onWheel);
            dom.removeEventListener('pointerdown', stop);
        }
    };
}

export default createGlide;
