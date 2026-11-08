import { TWindow } from "/javascript/core/window.core.js";
import { WindowIntercator } from "/javascript/modules/win.module.js";
import { SORTS, state } from "../modules/mod.state.js";

const ELL = '.window-dubs-sort';

/** @type {TWindow|null} */
let win = null;

/** Что делать после выбора — задаёт dubs.js */
let onPick = (_sort) => { };

/**
 * Сортировка живёт в двух местах с одним и тем же списком:
 * на телефоне — шторка (WSort), на ПК — панель слева (initSortSide).
 *
 * @param {(sort: string) => void} pick - вызывается, когда сортировка сменилась
 */
export function initSortSide(pick) {
    onPick = pick;

    const $list = document.querySelector('.side-panel .sort-list');
    fill($list);
    $list.addEventListener('click', (e) => choose(e));

    markSort();
}

/** Шторка на телефоне. Разметка в dubs.html, окно создаётся один раз */
export function WSort() {
    if (!win) win = create();

    markSort();
    win.show();
}

/** Подсветить текущую сортировку во всех списках */
export function markSort() {
    document.querySelectorAll('.sort-item').forEach((el) => {
        const on = el.dataset.sort === state.sort;
        el.classList.toggle('-on', on);
        el.setAttribute('aria-selected', String(on));
    });
}

/** Пункты сортировки в список */
function fill($list) {
    $list.replaceChildren(...Object.entries(SORTS).map(([key, { label, hint, icon }]) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'sort-item';
        el.dataset.sort = key;
        el.setAttribute('role', 'option');
        el.innerHTML = `<span class="bubble"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${icon}"></path></svg></span>`
            + '<span class="text"><span class="label"></span><span class="hint"></span></span>';
        el.querySelector('.label').textContent = label;
        el.querySelector('.hint').textContent = hint;
        return el;
    }));
}

/**
 * Клик по пункту.
 * @returns {boolean} попали ли в пункт
 */
function choose(e) {
    const item = e.target.closest('.sort-item');
    if (!item) return false;

    const key = item.dataset.sort;
    if (key !== state.sort) {
        state.sort = key;
        markSort();
        onPick(key);
    }
    return true;
}

function create() {
    const $root = document.querySelector(ELL);
    const $list = $root.querySelector('.sort-list');
    fill($list);

    const w = new TWindow({}, ELL);
    w.module.add(WindowIntercator);

    $list.addEventListener('click', (e) => {
        if (choose(e)) w.hide();
    });

    $root.querySelector('.window-close').addEventListener('click', () => w.hide());

    // Окно растянули до ПК — сортировка уже видна сбоку, шторку закрываем
    // обычным hide(), чтобы с body снялась блокировка прокрутки
    matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
        if (e.matches && w.showed) w.hide();
    });

    return w;
}
