import tmpl from "../../library/tmpl.lib.js";

const TEMPLATE = {
    card: '#collection-v-card'
};

/** Больше четырёх коллаж не показывает */
const COVERS = 4;

/** Битая ссылка — заглушка вместо пустой плитки */
const NOIMAGE = '/images/noanime.png';

/** Значок в углу — только у особых коллекций */
const ICONS = {
    shikimori: '#i-shikimori'
};

/** Сколько аниме в коллекции — у избранного счётчика нет, считаем сами */
const countOf = (collection) => collection.count
    ?? (Array.isArray(collection.list)
        ? collection.list.length
        : Object.keys(collection.items ?? {}).length);

/**
 * Когда обновляли. Коротко: карточка узкая, и подпись делит строку со
 * значком приватности
 *
 * @param {string} iso
 */
const updated = (iso) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';

    const days = Math.floor((Date.now() - date.getTime()) / 86400000);

    if (days <= 0) return 'сегодня';
    if (days === 1) return 'вчера';
    if (days < 7) return `${days} дня назад`;

    return date.toLocaleDateString('ru-RU');
};

/**
 * Расставить обложки в готовой карточке.
 *
 * Отдельно от создания, потому что постеры приезжают позже самой карточки:
 * сначала показываем название и счётчик, потом заполняем коллаж
 *
 * @param {HTMLElement} el - карточка
 * @param {string[]} [bgs] - до четырёх ссылок на превью
 */
function covers(el, bgs = []) {
    const root = el?.querySelector('.collection-preview');
    if (!root) return;

    const list = bgs.filter(Boolean).slice(0, COVERS);

    root.dataset.count = String(list.length);
    root.innerHTML = '';

    const fragment = document.createDocumentFragment();

    // Постеров нет — четыре пустые плитки: нумерацию по ним рисует CSS
    // через data-count="0", это же и состояние загрузки
    for (let i = 0; i < (list.length || COVERS); i++) {
        const anime = document.createElement('div');
        anime.className = 'anime';

        if (list[i]) {
            const img = document.createElement('img');

            img.loading = 'lazy';
            img.alt = '';
            img.src = list[i];
            img.addEventListener('error', () => { img.src = NOIMAGE; }, { once: true });

            anime.append(img);
        }

        fragment.append(anime);
    }

    root.append(fragment);
}

/**
 * Карточка коллекции.
 *
 * Без `bgs` возвращается та же карточка с пустым коллажем — это и есть
 * состояние загрузки, отдельной разметки для него не нужно
 *
 * @param {Object} collection - коллекция из фасада
 * @param {string[]} [bgs] - ссылки на превью обложки
 * @returns {HTMLElement}
 */
function item(collection = {}, bgs = []) {
    const el = tmpl(TEMPLATE.card).el;

    el.dataset.cid = collection.cid ?? '';
    el.dataset.kind = collection.kind ?? 'custom';
    el.dataset.visibility = collection.visibility ?? 'private';

    // Значок показываем только у особых коллекций, у остальных он
    // остаётся скрытым
    const symbol = ICONS[collection.kind];
    const icon = el.querySelector('.abs-icon');

    if (symbol && icon) {
        icon.querySelector('use')?.setAttribute('href', symbol);
        icon.classList.remove('-hide');
    }

    el.querySelector('.meta-title').textContent = collection.title ?? '';
    el.querySelector('.meta-count').textContent = `${countOf(collection)} Аниме`;
    el.querySelector('.meta-date').textContent = updated(collection.updatedAt);

    covers(el, bgs);

    return el;
}

/** Заглушка «ничего не найдено» — одна на список */
class NotFoundCollection {
    #selector = '.collection-v-card.-notfound';

    get dom() {
        return this.#selector;
    }

    /**
     * Та же карточка коллекции, только без cid: иначе её ловили бы клик
     * и чистка полосы как обычную коллекцию
     */
    Get() {
        const el = tmpl(TEMPLATE.card).el;

        el.classList.add('-notfound');
        el.removeAttribute('data-cid');

        el.querySelector('.meta-title').textContent = 'Ничего не найдено';
        el.querySelector('.meta-count').textContent = '';

        const preview = el.querySelector('.collection-preview');

        if (preview) {
            const anime = document.createElement('div');
            anime.className = 'anime';

            preview.dataset.count = '1';
            preview.replaceChildren(anime);
        }

        return el;
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
