/**
 * Свой скроллбар для ПК — тонкий полупрозрачный ползунок без стрелок,
 * в стиле world.tunime.app.
 *
 * Работает только там, где его подключили:
 *
 *   import { TScrollbar } from "/javascript/modules/tun.scrollbar.js";
 *   TScrollbar();            // прокрутка всей страницы
 *   TScrollbar(element);     // прокрутка внутри элемента (overflow-y: auto)
 *
 * На сенсорных экранах ничего не делает: там системный скроллбар и так
 * появляется только во время прокрутки. Стили вставляет сам, отдельный css не нужен.
 *
 * @param {HTMLElement|null} [target] - прокручиваемый элемент; без него — вся страница
 * @returns {{ update: () => void, destroy: () => void }}
 */
export function TScrollbar(target = null) {
    const page = !target;
    const scroller = page ? document.scrollingElement : target;

    let bar = null;

    const enable = () => {
        if (!bar) bar = mount(scroller, page);
    };

    const disable = () => {
        bar?.destroy();
        bar = null;
    };

    const onMedia = () => (PC.matches ? enable() : disable());
    PC.addEventListener('change', onMedia);
    onMedia();

    return {
        update: () => bar?.update(),
        destroy: () => {
            PC.removeEventListener('change', onMedia);
            disable();
        },
    };
}

/** Мышь и наведение — значит, ПК */
const PC = matchMedia('(hover: hover) and (pointer: fine)');

/** Короче не делаем — иначе за ползунок трудно ухватиться на длинных списках */
const MIN_THUMB = 32;

/** Сколько ползунок остаётся ярче после прокрутки, мс */
const ACTIVE_MS = 900;

const CSS = `
html.t-sb-page { scrollbar-width: none; }
html.t-sb-page::-webkit-scrollbar { display: none; }
.t-sb-host { scrollbar-width: none; }
.t-sb-host::-webkit-scrollbar { display: none; }

.t-sb-rail {
    position: absolute;
    top: 0;
    right: 0;
    width: 12px;
    z-index: 250;
    padding: 4px 0;
    box-sizing: border-box;
    cursor: default;
    transition: opacity .2s;
}
.t-sb-rail.-page {
    position: fixed;
    top: 0;
    bottom: var(--menu-height-safe, 0px);
}
.t-sb-rail.-off {
    opacity: 0;
    pointer-events: none;
}
.t-sb-track {
    position: relative;
    height: 100%;
}
.t-sb-thumb {
    position: absolute;
    top: 0;
    right: 3px;
    width: 5px;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.15);
    will-change: transform;
    transition: width .15s, background .2s;
}
.t-sb-rail.-active .t-sb-thumb { background: rgba(255, 255, 255, 0.24); }
.t-sb-rail:hover .t-sb-thumb { width: 7px; background: rgba(255, 255, 255, 0.3); }
.t-sb-rail.-drag .t-sb-thumb { width: 7px; background: rgba(255, 255, 255, 0.42); }
html.t-sb-dragging, html.t-sb-dragging * { user-select: none !important; cursor: default !important; }
`;

function injectCss() {
    if (document.getElementById('t-scrollbar-css')) return;

    const style = document.createElement('style');
    style.id = 't-scrollbar-css';
    style.textContent = CSS;
    document.head.append(style);
}

/**
 * Нарисовать скроллбар и подписаться на всё, что меняет его размер или место.
 * @param {HTMLElement} scroller
 * @param {boolean} page
 */
function mount(scroller, page) {
    injectCss();

    const rail = document.createElement('div');
    rail.className = `t-sb-rail${page ? ' -page' : ''} -off`;
    rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = '<div class="t-sb-track"><div class="t-sb-thumb"></div></div>';

    const track = rail.firstElementChild;
    const thumb = track.firstElementChild;

    /** Прокрутку страницы слушаем на window, элемента — на нём самом */
    const scrollSource = page ? window : scroller;

    // Скрываем системный скроллбар; у элемента рельс живёт внутри него
    let restorePosition = null;
    if (page) {
        document.documentElement.classList.add('t-sb-page');
        document.body.append(rail);
    } else {
        scroller.classList.add('t-sb-host');
        if (getComputedStyle(scroller).position === 'static') {
            restorePosition = scroller.style.position;
            scroller.style.position = 'relative';
        }
        scroller.append(rail);
    }

    /** Текущие размеры: пересчитываются в update() */
    let geo = { view: 0, total: 0, trackH: 0, thumbH: 0 };

    const update = () => {
        // Содержимое элемента могли перерисовать целиком вместе с рельсом
        if (!page && !rail.isConnected) scroller.append(rail);

        const view = scroller.clientHeight;
        const total = scroller.scrollHeight;
        const scrollable = total - view > 1;

        rail.classList.toggle('-off', !scrollable);
        if (!scrollable) return;

        if (!page) {
            // Рельс внутри прокрутки: двигаем его вместе с ней, чтобы стоял на месте
            rail.style.height = `${view}px`;
            rail.style.transform = `translateY(${scroller.scrollTop}px)`;
        }

        const trackH = track.clientHeight;
        const thumbH = Math.max(MIN_THUMB, Math.round(trackH * view / total));
        const max = total - view;
        const y = max > 0 ? (trackH - thumbH) * (scroller.scrollTop / max) : 0;

        thumb.style.height = `${thumbH}px`;
        thumb.style.transform = `translateY(${Math.round(y)}px)`;

        geo = { view, total, trackH, thumbH };
    };

    let frame = 0;
    const schedule = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            update();
        });
    };

    // Во время прокрутки ползунок чуть ярче
    let idle = 0;
    const onScroll = () => {
        if (!page) update(); // сразу, без кадра задержки — иначе рельс внутри элемента дрожит
        else schedule();

        rail.classList.add('-active');
        clearTimeout(idle);
        idle = setTimeout(() => rail.classList.remove('-active'), ACTIVE_MS);
    };

    scrollSource.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', schedule);

    // Размер содержимого меняется без прокрутки: догрузили список, открыли блок
    const resize = new ResizeObserver(schedule);
    resize.observe(page ? document.body : scroller);

    const mutate = new MutationObserver(schedule);
    mutate.observe(page ? document.body : scroller, { childList: true, subtree: true });

    /* ---------- перетаскивание и клик по дорожке ---------- */

    const maxScroll = () => geo.total - geo.view;

    let drag = null;

    const onDown = (e) => {
        if (e.button !== 0) return;
        e.preventDefault();

        if (e.target === thumb) {
            drag = { y: e.clientY, scroll: scroller.scrollTop };
            rail.classList.add('-drag');
            document.documentElement.classList.add('t-sb-dragging');
            rail.setPointerCapture(e.pointerId);
            return;
        }

        // Клик мимо ползунка — прокрутить так, чтобы он встал центром под курсор
        const rect = track.getBoundingClientRect();
        const room = geo.trackH - geo.thumbH;
        const ratio = room > 0 ? (e.clientY - rect.top - geo.thumbH / 2) / room : 0;
        const top = Math.min(1, Math.max(0, ratio)) * maxScroll();
        const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;

        (page ? window : scroller).scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    };

    const onMove = (e) => {
        if (!drag) return;

        const room = geo.trackH - geo.thumbH;
        if (room <= 0) return;

        scroller.scrollTop = drag.scroll + (e.clientY - drag.y) * (maxScroll() / room);
    };

    const onUp = (e) => {
        if (!drag) return;

        drag = null;
        rail.classList.remove('-drag');
        document.documentElement.classList.remove('t-sb-dragging');
        if (rail.hasPointerCapture(e.pointerId)) rail.releasePointerCapture(e.pointerId);
    };

    rail.addEventListener('pointerdown', onDown);
    rail.addEventListener('pointermove', onMove);
    rail.addEventListener('pointerup', onUp);
    rail.addEventListener('pointercancel', onUp);

    update();

    return {
        update,
        destroy() {
            cancelAnimationFrame(frame);
            clearTimeout(idle);
            scrollSource.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', schedule);
            resize.disconnect();
            mutate.disconnect();
            rail.remove();

            if (page) document.documentElement.classList.remove('t-sb-page');
            else {
                scroller.classList.remove('t-sb-host');
                if (restorePosition !== null) scroller.style.position = restorePosition;
            }
        },
    };
}
