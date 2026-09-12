import { animateWidth, pressable } from "../../../modules/tun.animate.js";

/**
 * Поиск по названию коллекции.
 *
 * Строка поиска сворачивается в кнопку-лупу: по нажатию разъезжается на
 * всю ширину панели действий, по крестику — обратно.
 *
 * @param {HTMLElement} wrapper - корень окна
 * @param {{onInput?: (value: string) => void}} [opts]
 */
export function createSearch(wrapper, { onInput = () => { } } = {}) {
    const actions = wrapper.querySelector('.win-actions');
    const open = wrapper.querySelector('.filter-action');
    const close = wrapper.querySelector('.filter-close');
    const input = wrapper.querySelector('.search-wrapper input');

    const unpress = pressable([open, close]);

    let shown = false;
    let timer = null;

    const show = () => {
        if (shown) return;
        shown = true;

        animateWidth(actions, '100%', {
            onBegin: () => actions.classList.add('-filter-mode'),
            onComplete: () => input?.focus()
        });
    };

    const hide = () => {
        if (!shown) return;
        shown = false;

        animateWidth(actions, 'auto', {
            onBegin: () => actions.classList.remove('-filter-mode')
        });

        // Свернули строку — фильтр по названию снимается, иначе список
        // остался бы отфильтрованным без видимой причины
        if (input?.value) {
            input.value = '';
            onInput('');
        }
    };

    // Дребезг: ввод идёт посимвольно, а перерисовка списка не бесплатная
    const onKey = () => {
        clearTimeout(timer);
        timer = setTimeout(() => onInput(input.value.trim()), 120);
    };

    open.addEventListener('click', show);
    close.addEventListener('click', hide);
    input?.addEventListener('input', onKey);

    return {
        get value() {
            return input?.value.trim() ?? '';
        },

        show,
        hide,

        destroy() {
            clearTimeout(timer);
            unpress();
            open.removeEventListener('click', show);
            close.removeEventListener('click', hide);
            input?.removeEventListener('input', onKey);
        }
    };
}

export default createSearch;
