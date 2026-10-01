import { ACard } from "../../../modules/AnimeCard.js";
import { pressable } from "../../../modules/tun.animate.js";

/**
 * Кнопки под лентой: соседи по коллекции и возврат к текущему.
 *
 * Разметка живёт в `watch.html`, здесь только поведение — кнопки
 * находятся по `data-type`.
 *
 * @param {HTMLElement} dom - контейнер `.cid-collection-controller`
 * @param {Object} opts
 * @param {number[]} opts.ids - состав коллекции по порядку
 * @param {number} opts.current
 * @param {string} opts.cid
 * @param {() => void} [opts.onCurrent] - показать текущее в ленте
 */
export function createControls(dom, { ids = [], current, cid, onCurrent = () => { } } = {}) {
    const index = ids.indexOf(current);

    const prev = index > 0 ? ids[index - 1] : null;
    const next = index !== -1 && index < ids.length - 1 ? ids[index + 1] : null;

    const buttons = {
        prev: dom.querySelector('.cid-btn[data-type="prev"]'),
        current: dom.querySelector('.cid-btn[data-type="current"]'),
        next: dom.querySelector('.cid-btn[data-type="next"]')
    };

    // У первого и последнего аниме сосед есть не с обеих сторон —
    // кнопку не прячем, иначе панель прыгала бы по ширине
    buttons.prev?.classList.toggle('-dissable', prev === null);
    buttons.next?.classList.toggle('-dissable', next === null);

    const go = (id) => {
        if (id) location.href = ACard.Url(id, { cid });
    };

    const onPrev = () => go(prev);
    const onNext = () => go(next);

    buttons.prev?.addEventListener('click', onPrev);
    buttons.next?.addEventListener('click', onNext);
    buttons.current?.addEventListener('click', onCurrent);

    // Отклик на нажатие тот же, что у кнопок в окнах
    const unpress = pressable(Object.values(buttons).filter(Boolean), { scale: 1.06 });

    return {
        destroy() {
            buttons.prev?.removeEventListener('click', onPrev);
            buttons.next?.removeEventListener('click', onNext);
            buttons.current?.removeEventListener('click', onCurrent);

            unpress();
        }
    };
}

export default createControls;
