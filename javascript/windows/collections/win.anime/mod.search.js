import { animateWidth, pressable } from "../../../modules/tun.animate.js";

/**
 * Поиск аниме в нижней панели окна.
 *
 * Строка свёрнута в кнопку-лупу: по нажатию разъезжается на всю ширину
 * панели действий, по крестику — обратно.
 *
 * В отличие от поиска по коллекциям здесь запрос уходит на сервер, а не
 * фильтрует готовый список. Поэтому модуль ничего не решает сам и только
 * зовёт callback'и: окно само выбирает, что показать на запрос, что на
 * пустой ввод и что после сворачивания строки.
 *
 * @param {HTMLElement} wrapper - корень окна
 * @param {Object} [opts]
 * @param {(value: string) => void} [opts.onInput] - запрос изменился, с дребезгом
 * @param {() => void} [opts.onShow] - строка развернулась
 * @param {(value: string) => void} [opts.onHide] - строка свернулась;
 *  аргумент — что было введено до сворачивания
 * @param {number} [opts.debounce] - пауза в наборе перед `onInput`, мс.
 *  Очистка поля срабатывает сразу, её ждать незачем
 */
export function createSearch(wrapper, {
    onInput = () => { },
    onShow = () => { },
    onHide = () => { },
    debounce = 1000
} = {}) {
    const actions = wrapper.querySelector('.win-actions');
    const open = wrapper.querySelector('.filter-action');
    const close = wrapper.querySelector('.filter-close');
    const input = wrapper.querySelector('.search-wrapper input');

    const unpress = pressable([open, close].filter(Boolean));

    let shown = false;
    let timer = null;

    const show = () => {
        if (shown || !actions) return;
        shown = true;

        animateWidth(actions, '100%', {
            onBegin: () => actions.classList.add('-filter-mode'),
            onComplete: () => input?.focus()
        });

        onShow();
    };

    const hide = () => {
        if (!shown || !actions) return;
        shown = false;

        animateWidth(actions, 'auto', {
            onBegin: () => actions.classList.remove('-filter-mode')
        });

        // Запрос в пути гасим: строки уже нет, а результат приехал бы
        // поверх обычного списка
        const value = input?.value.trim() ?? '';

        clearTimeout(timer);
        last = null;
        if (input) input.value = '';

        close?.classList.remove('-check');

        onHide(value);
    };

    let last = null;

    // Ждём паузы в наборе: каждый символ — обращение к API, а Shikimori
    // за частые запросы отвечает 429
    const onKey = () => {
        clearTimeout(timer);

        const value = input.value.trim();

        // Очистку поля отрабатываем сразу: возврат к прежнему списку
        // ничего не запрашивает, ждать нечего
        if (!value) {
            last = '';
            onInput('');
            return;
        }

        timer = setTimeout(() => {
            // Тот же запрос повторно не гоняем: пробел в конце или
            // возврат к прежнему тексту ничего не меняют
            if (value === last) return;

            last = value;
            onInput(value);
        }, debounce);
    };

    open?.addEventListener('click', show);
    close?.addEventListener('click', hide);
    input?.addEventListener('input', onKey);

    return {
        get value() {
            return input?.value.trim() ?? '';
        },

        /**
         * Пометить кнопку закрытия: запрос отработал и на экране находки.
         * Снимается сама при сворачивании строки
         *
         * @param {boolean} state
         */
        check(state) {
            close?.classList.toggle('-check', Boolean(state));
        },

        /** Развёрнута ли строка */
        get shown() {
            return shown;
        },

        show,
        hide,

        toggle() {
            shown ? hide() : show();
        },

        destroy() {
            clearTimeout(timer);
            unpress();

            open?.removeEventListener('click', show);
            close?.removeEventListener('click', hide);
            input?.removeEventListener('input', onKey);
        }
    };
}

export default createSearch;
