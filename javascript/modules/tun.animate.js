import { animate, spring, utils } from "../library/anime.esm.min.js";

/**
 * Общие анимации интерфейса. Не привязаны к конкретному окну или странице.
 */

/**
 * Анимация ширины к значению, которое нельзя анимировать напрямую
 * (`auto`, `100%`, `fit-content`).
 *
 * Приём: конечная ширина замеряется в пикселях, а анимация идёт между
 * двумя px-значениями. По завершении выставляется исходная строка, чтобы
 * элемент дальше жил по обычным правилам раскладки.
 *
 * @param {HTMLElement} el
 * @param {string} target - целевая ширина, напр. '100%' или 'auto'
 * @param {Object} [opts] - параметры animate, включая onBegin/onComplete
 */
export function animateWidth(el, target, opts = {}) {
    utils.remove(el, 'width');   // убить предыдущую анимацию

    const from = el.getBoundingClientRect().width;

    const prev = el.style.width;
    el.style.width = target;
    const to = el.getBoundingClientRect().width;
    el.style.width = prev;
    el.getBoundingClientRect();

    el.style.width = `${from}px`;

    return animate(el, {
        width: [`${from}px`, `${to}px`],
        ease: spring({ bounce: 0.43, duration: 400 }),
        ...opts,
        onComplete: (a) => {
            el.style.width = target;
            opts.onComplete?.(a);
        }
    });
}

/**
 * Отклик на нажатие: элемент подрастает под пальцем и возвращается
 * пружиной, когда отпустили.
 *
 * @param {string | Element | Iterable<Element>} targets
 * @param {{scale?: number, bounce?: number, duration?: number, zIndex?: number}} [opts]
 * @returns {() => void} снять обработчики
 */
export function pressable(targets, opts = {}) {
    const {
        scale = 1.2,
        bounce = 0.43,
        duration = 300,
        zIndex = 10
    } = opts;

    const ease = spring({ bounce, duration });

    const els = (
        typeof targets === 'string' ? document.querySelectorAll(targets)
            : targets instanceof Element ? [targets]
                : targets ?? []
    );

    const cleanups = [];

    for (const el of els) {
        if (!(el instanceof Element)) continue;

        el.style.willChange = 'transform';
        const originalZIndex = el.style.zIndex;

        const to = (value) => {
            utils.remove(el, 'scale');
            animate(el, { scale: value, ease });
        };

        const down = (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            el.style.zIndex = zIndex;
            to(scale);
            el.setPointerCapture?.(e.pointerId);
        };

        const up = () => {
            el.style.zIndex = originalZIndex;
            to(1);
        };

        el.addEventListener('pointerdown', down);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('pointerleave', up);
        el.addEventListener('blur', up);

        cleanups.push(() => {
            el.removeEventListener('pointerdown', down);
            ['pointerup', 'pointercancel', 'pointerleave', 'blur']
                .forEach((t) => el.removeEventListener(t, up));
            utils.remove(el, 'scale');
        });
    }

    return () => cleanups.forEach((fn) => fn());
}
