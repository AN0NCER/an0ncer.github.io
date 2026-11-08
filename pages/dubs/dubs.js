import { TMenu } from "/javascript/core/menu.core.js";
import { TScrollbar } from "/javascript/modules/tun.scrollbar.js";
import { stickySide } from "/javascript/modules/dubs/dubs.sticky.js";
import { getStudios } from "/javascript/modules/dubs/api.dubs.js";
import { isFav, toggleFav } from "/javascript/modules/dubs/dubs.favorites.js";
import { num, plural } from "/javascript/modules/dubs/dubs.format.js";
import { markFav, message, render, skeleton } from "./modules/mod.render.js";
import { apply, countKinds, KINDS, SORTS, state, syncUrl } from "./modules/mod.state.js";
import { initSortSide, WSort } from "./windows/win.sort.js";

TMenu.init();

// Свой тонкий скроллбар страницы на ПК (на телефоне ничего не делает)
TScrollbar();

// Панель типов и сортировки слева на ПК может быть выше окна — едет со страницей и прилипает низом
stickySide(document.querySelector('.side-panel'));

const $chips = document.querySelector('.kind-chips');
const $kindSide = document.querySelector('.kind-side .kind-list');
const $count = document.querySelector('.studios-count');
const $sortLabel = document.querySelector('.sort-btn .label');
const $search = document.querySelector('#studio-search');
const $headSub = document.querySelector('.page-title-wrapper .sub');

const STUDIOS = ['студия', 'студии', 'студий'];

/** @type {import('/javascript/modules/dubs/api.dubs.js').TStudio[]} */
let all = [];

const STAR = '<svg class="icon star" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-star"></use></svg>';

/**
 * Типы студий в двух видах: чипы над списком (телефон) и список
 * в левой колонке (ПК). Показывает нужный CSS, данные и выбор общие.
 * Числа появятся, когда придут данные.
 */
function drawKinds(counts = null) {
    $chips.replaceChildren(...KINDS.map(([key, label]) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'chip';
        el.dataset.kind = key;

        if (key === 'fav') el.innerHTML = STAR;
        el.append(label);

        if (counts) {
            const c = document.createElement('span');
            c.className = 'c';
            c.textContent = num(counts[key] || 0);
            el.append(' ', c);
        }
        return el;
    }));

    $kindSide.replaceChildren(...KINDS.map(([key, label]) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'kind-item';
        el.dataset.kind = key;
        el.innerHTML = `${key === 'fav' ? STAR : ''}<span class="label"></span><span class="c"></span>`;
        el.querySelector('.label').textContent = label;
        el.querySelector('.c').textContent = counts ? num(counts[key] || 0) : '';
        return el;
    }));

    markKinds();
}

/** Подсветить выбранный тип и в чипах, и в левой колонке */
function markKinds() {
    document.querySelectorAll('.kind-chips .chip, .kind-list .kind-item').forEach((el) => {
        const on = el.dataset.kind === state.kind;
        el.classList.toggle('-on', on);
        el.setAttribute('aria-pressed', String(on));
    });
}

/** Выбрали тип — в чипах или в левой колонке */
function pickKind(e) {
    const el = e.target.closest('[data-kind]');
    if (!el || el.dataset.kind === state.kind) return;

    state.kind = el.dataset.kind;
    syncUrl();
    markKinds();

    if (all.length) update();
    window.scrollTo({ top: 0 });
}

/** Перерисовать список под текущие тип, поиск и сортировку */
function update() {
    const list = apply(all);
    render(list);

    $count.textContent = state.q || state.kind !== 'all'
        ? `Найдено ${num(list.length)} из ${num(all.length)}`
        : `${num(list.length)} ${plural(list.length, STUDIOS)}`;
}

async function load() {
    skeleton();
    $count.textContent = 'Загрузка…';

    try {
        all = await getStudios();
    } catch (err) {
        console.error('[dubs] не удалось загрузить студии', err);
        $count.textContent = '';
        message({
            title: 'Не удалось загрузить студии',
            text: 'Сервер озвучек не ответил. Проверьте подключение и попробуйте ещё раз.',
            action: { label: 'Повторить', run: load },
        });
        return;
    }

    $headSub.textContent = `${num(all.length)} ${plural(all.length, STUDIOS)}`;
    drawKinds(countKinds(all));
    update();
}

/** Число у «Избранного» (чип и левая колонка) — только по студиям, которые есть в списке */
function updateFavChip() {
    const n = num(all.filter(s => isFav(s.id)).length);
    document.querySelectorAll('[data-kind="fav"] .c').forEach(($c) => { $c.textContent = n; });
}

/* ---------- обработчики ---------- */

// Enter на строке/карточке (фокус с клавиатуры) — тоже на страницу студии
document.querySelector('.studio-list').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.closest('.fav-btn')) return;
    const item = e.target.closest('[data-id]');
    if (item) openStudio(item);
});

/** Страница студии */
const openStudio = (el, newTab = false) => {
    const url = `/studio.html?id=${encodeURIComponent(el.dataset.id)}`;
    if (newTab) window.open(url, '_blank', 'noopener');
    else location.href = url;
};

document.querySelector('.studio-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.fav-btn');
    if (!btn) {
        // Клик по строке/карточке — на страницу студии (Ctrl/⌘ — в новой вкладке)
        const item = e.target.closest('[data-id]');
        if (item) openStudio(item, e.ctrlKey || e.metaKey);
        return;
    }

    const on = toggleFav(Number(btn.closest('[data-id]').dataset.id));
    markFav(btn, on);
    updateFavChip();

    // В самом избранном убранная студия сразу пропадает из списка
    if (state.kind === 'fav') update();
});

$chips.addEventListener('click', pickKind);
$kindSide.addEventListener('click', pickKind);

let typing = 0;
$search.addEventListener('input', () => {
    clearTimeout(typing);
    typing = setTimeout(() => {
        state.q = $search.value;
        if (all.length) update();
    }, 120);
});

// Enter на телефоне прячет клавиатуру
$search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $search.blur();
});

/** Сортировка сменилась — в шторке на телефоне или в панели слева на ПК */
function onSort() {
    $sortLabel.textContent = SORTS[state.sort].label;
    syncUrl();
    if (all.length) update();
    window.scrollTo({ top: 0 });
}

initSortSide(onSort);
document.querySelector('.sort-btn').addEventListener('click', () => WSort());

document.querySelector('.page-controll-wrapper .btn').addEventListener('click', () => {
    const fromHere = document.referrer && new URL(document.referrer).origin === location.origin;
    if (fromHere && history.length > 1) history.back();
    else location.href = '/';
});

$sortLabel.textContent = SORTS[state.sort].label;
drawKinds();
load();
