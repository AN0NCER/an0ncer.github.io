import tmpl from "../../library/tmpl.lib.js";

const TEMPLATE = {
    item: '#tpl-collection-item',
    preview: '#tpl-collection-preview',
    empty: '#tpl-collection-empty'
};

/** Обложка коллажа — четыре превью: одно крупное и три мелких */
const COVERS = 4;

/**
 * Расставить обложки в готовой плитке.
 *
 * Отдельно от создания, потому что постеры приезжают позже самой плитки:
 * сначала показываем название и счётчик, потом заполняем коллаж
 *
 * @param {HTMLElement} el - плитка
 * @param {string[]} [bgs] - до четырёх ссылок на превью
 */
function covers(el, bgs = []) {
    if (!el) return;

    const block1 = el.querySelector('.bg-collection > .block-1');
    const block2 = el.querySelector('.bg-collection > .block-2');

    if (block1 && bgs[0]) {
        block1.style.setProperty('--bg-image', `url(${bgs[0]})`);
        block1.classList.remove('loading');
    }

    if (!block2) return;

    const previews = [...block2.querySelectorAll('.preview')];

    for (let i = 1; i < COVERS; i++) {
        const preview = previews[i - 1];
        if (!preview || !bgs[i]) continue;

        preview.style.setProperty('--bg-image', `url(${bgs[i]})`);
        preview.classList.remove('loading');
    }
}

/**
 * Плитка коллекции.
 *
 * Без `bgs` возвращается та же плитка, но с заглушками вместо постеров —
 * это и есть состояние загрузки, отдельной разметки для него не нужно
 *
 * @param {{id: string, title: string, count?: number, bgs?: string[]}} data
 * @returns {HTMLElement}
 */
function item({ id, title, count = 0, bgs = [] } = {}) {
    const el = tmpl(TEMPLATE.item).el;

    el.dataset.id = id;
    el.querySelector('.bg-collection').classList.add(`count-${count}`);
    el.querySelector('.collection-name').textContent = title ?? '';
    el.querySelector('.collection-counts').textContent = `${count} Аниме`;

    // Мелких превью ровно столько, сколько аниме сверх первого: у
    // коллекции из двух не должно быть четырёх пустых плашек
    const block2 = el.querySelector('.bg-collection > .block-2');
    const slots = Math.min(Math.max(count - 1, 0), COVERS - 1);

    for (let i = 0; i < slots; i++) {
        block2.append(tmpl(TEMPLATE.preview).el);
    }

    if (bgs.length > 0) covers(el, bgs);

    return el;
}

/** Заглушка «ничего не найдено» — одна на список */
class NotFoundCollection {
    #selector = '.item-collection.not-found';

    get dom() {
        return this.#selector;
    }

    Get() {
        return tmpl(TEMPLATE.empty).el;
    }

    Show(path) {
        const element = $(`${path} > ${this.dom}`);

        if (element.length > 0) element.show();
        else $(path).append(this.Get());
    }

    Hide(path) {
        const element = $(`${path} > ${this.dom}`);
        if (element.length > 0) element.hide();
    }
}

export const HCollection = {
    Iteam: item,
    Load: item,
    Covers: covers,
    NotFound: new NotFoundCollection()
};

export class ISearch {
    constructor() {
        this.dom = $('#active-icon');
        this.#SetStatus('default');
    }

    Search() {
        this.#SetStatus('load');
    }

    Result(count = 0) {
        $('#active-icon > .wrapper > .num').text(count);
        this.#SetStatus('result');
    }

    Empty() {
        $('#active-icon > .wrapper > .num').text('Очистить');
        this.#SetStatus('empty');
    }

    Clear() {
        this.#SetStatus('default');
    }

    #SetStatus(status) {
        this.status = status;
        this.dom.attr('data-status', this.status);
    }
}
