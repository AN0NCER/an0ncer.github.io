/**
 * Липкая боковая колонка, которая может быть выше окна (профиль студии, панель каталога).
 *
 * Обычный `position: sticky; top: 0` у высокой колонки прячет её низ навсегда,
 * а `max-height` + своя прокрутка обрезает карточки посередине. Здесь колонка
 * едет вместе со страницей и прилипает, когда показался её низ: CSS ставит
 * `top: min(0px, calc(100dvh - меню - высота колонки))`, а высоту колонки
 * (`--side-h`) держит актуальной этот модуль.
 *
 * @param {HTMLElement|null} el - колонка (в CSS у неё `top` через --side-h)
 */
export function stickySide(el) {
    if (!el) return;

    const set = () => el.style.setProperty('--side-h', `${Math.ceil(el.getBoundingClientRect().height)}px`);
    new ResizeObserver(set).observe(el);
    set();
}
