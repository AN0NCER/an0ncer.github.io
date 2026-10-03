import { pressable } from "../../modules/tun.animate.js";
import WCollectionEditor from "../../windows/collections/win.editor.js";

/**
 * Кнопка создания коллекции.
 *
 * Отклик на нажатие тот же, что у кнопок в окнах — чтобы страница и окна
 * ощущались одинаково.
 *
 * @param {Object} [opts]
 * @param {string} [opts.dom] - селектор кнопки
 * @param {(result: Object) => void} [opts.oncreate] - коллекцию создали
 */
export function createButton({ dom = '#create-collection', oncreate = () => { } } = {}) {
    const el = document.querySelector(dom);
    if (!el) return { destroy() { } };

    let busy = false;

    const onClick = async () => {
        // Окно одно на приложение: второй вызов вернул бы тот же промис,
        // но повторный клик по кнопке всё равно незачем пропускать
        if (busy) return;
        busy = true;

        el.classList.add('-dissable');

        try {
            const result = await WCollectionEditor.create().catch(() => null);

            // Закрыли крестиком или отменой — создавать нечего
            if (result?.accepted && result.cid) oncreate(result);
        } finally {
            busy = false;
            el.classList.remove('-dissable');
        }
    };

    el.addEventListener('click', onClick);

    const unpress = pressable([el], { scale: 1.12 });

    return {
        get element() {
            return el;
        },

        destroy() {
            el.removeEventListener('click', onClick);
            unpress();
        }
    };
}

export default createButton;
