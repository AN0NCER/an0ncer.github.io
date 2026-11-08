import { isFav } from "/javascript/modules/dubs/dubs.favorites.js";
import { ago, hue, num, plural } from "/javascript/modules/dubs/dubs.format.js";
import { KIND_LABEL, KIND_NAME, state } from "./mod.state.js";

/** Сколько студий дорисовывать за раз: их почти тысяча */
const CHUNK = 50;

/** С этой ширины — карточки вместо строк (совпадает с медиазапросом в _cards.scss) */
const DESKTOP = matchMedia('(min-width: 900px)');

const $list = document.querySelector('.studio-list');
const $sentinel = document.querySelector('.studio-list-sentinel');
/** @type {HTMLTemplateElement} */
const tplRow = document.querySelector('#tpl-studio');
/** @type {HTMLTemplateElement} */
const tplCard = document.querySelector('#tpl-studio-card');

/** Что показано сейчас и сколько уже нарисовано */
let current = [];
let shown = 0;

/** Что в списке: заглушки, студии или сообщение — чтобы перерисовать при смене ширины */
let view = 'list';

const TITLES = ['тайтл', 'тайтла', 'тайтлов'];
const BRANCHES = ['ветка', 'ветки', 'веток'];
/** Тайтлы, которые озвучила только эта студия */
const EXCLUSIVES = ['эксклюзивное аниме', 'эксклюзивных аниме', 'эксклюзивных аниме'];

/** Число по сортировке: справа в строке, третьей плиткой в карточке */
const METRIC = {
    episodes: (s) => [num(s.episodes), plural(s.episodes, ['серия', 'серии', 'серий'])],
    exclusives: (s) => [num(s.exclusives), plural(s.exclusives, EXCLUSIVES)],
    active30: (s) => [num(s.active30), 'активны за 30 дн.'],
};

/** Плитки карточки: тайтлы, онгоинги и эксклюзивы (или число сортировки) */
const KPI = {
    titles: (s) => [num(s.titles), plural(s.titles, TITLES)],
    ongoing: (s) => [num(s.ongoing), plural(s.ongoing, ['онгоинг', 'онгоинга', 'онгоингов'])],
    ...METRIC,
};

/* ---------- общие куски ---------- */

/** @param {HTMLElement} el @param {import('/javascript/modules/dubs/api.dubs.js').TStudio} s */
function fillCommon(el, s) {
    el.dataset.id = s.id;
    // Строка/карточка ведёт на страницу студии (клик и Enter — в dubs.js)
    el.setAttribute('role', 'link');
    el.tabIndex = 0;
    el.setAttribute('aria-label', `Студия ${s.name}`);
    markFav(el.querySelector('.fav-btn'), isFav(s));

    const $av = el.querySelector('.avatar');
    $av.textContent = s.short;
    $av.style.setProperty('--h', hue(s.name));

    const $name = el.querySelector('.name');
    $name.textContent = s.name;
    $name.title = s.name;

    const when = ago(s.lastUpdate);
    el.querySelector('.updated').textContent = when ? `обновление ${when} назад` : 'обновлений не было';
}

const branchesText = (s) => {
    const n = s.members?.length || 0;
    return n > 1 ? `${n} ${plural(n, BRANCHES)}` : '';
};

/* ---------- телефон: строка ---------- */

/** @param {import('/javascript/modules/dubs/api.dubs.js').TStudio} s */
function row(s) {
    const el = tplRow.content.firstElementChild.cloneNode(true);
    fillCommon(el, s);

    const $kind = el.querySelector('.kind');
    if ((state.kind === 'all' || state.kind === 'fav') && KIND_LABEL[s.kind]) $kind.textContent = KIND_LABEL[s.kind];
    else $kind.remove();

    const $br = el.querySelector('.branches');
    const br = branchesText(s);
    if (br) {
        $br.textContent = br;
        $br.title = s.members.map(m => m.name).join(', ');
    } else $br.remove();

    const meta = [`${num(s.titles)} ${plural(s.titles, TITLES)}`];
    if (s.ongoing) meta.push(`${num(s.ongoing)} онг.`);
    // При сортировке по эксклюзивам их число и так стоит справа
    if (s.exclusives && state.sort !== 'exclusives') meta.push(`${num(s.exclusives)} ${plural(s.exclusives, EXCLUSIVES)}`);
    // Пробелы внутри пункта неразрывные: переносится весь пункт, а не «648 / эксклюзивных аниме»
    el.querySelector('.meta').textContent = meta.map(m => m.replace(/ /g, ' ')).join(' · ');

    const $metric = el.querySelector('.metric');
    const metric = METRIC[state.sort]?.(s);
    if (metric) {
        const [value, label] = metric;
        $metric.append(
            Object.assign(document.createElement('b'), { textContent: value }),
            Object.assign(document.createElement('span'), { textContent: label }),
        );
    } else $metric.remove();

    return el;
}

/* ---------- ПК: карточка ---------- */

/** @param {import('/javascript/modules/dubs/api.dubs.js').TStudio} s */
function card(s) {
    const el = tplCard.content.firstElementChild.cloneNode(true);
    fillCommon(el, s);

    const $kindLine = el.querySelector('.kind-line');
    $kindLine.textContent = [KIND_NAME[s.kind], branchesText(s)].filter(Boolean).join(' · ');
    if (s.members?.length > 1) $kindLine.title = s.members.map(m => m.name).join(', ');

    // Третья плитка — то, по чему отсортировано, если этого числа нет среди первых двух
    const keys = ['titles', 'ongoing', METRIC[state.sort] ? state.sort : 'exclusives'];

    el.querySelector('.kpis').append(...keys.map((key) => {
        const [value, label] = KPI[key](s);
        const tile = document.createElement('span');
        tile.className = 'kpi';
        // Подсветка только у выбранной вручную сортировки: по умолчанию все плитки ровные
        tile.classList.toggle('-sorted', key === state.sort && state.sort !== 'titles');
        tile.append(
            Object.assign(document.createElement('span'), { className: 'v', textContent: value }),
            Object.assign(document.createElement('span'), { className: 'l', textContent: label }),
        );
        return tile;
    }));

    return el;
}

/**
 * Звёздочка: залита — студия в избранном. У кнопки в карточке есть подпись.
 * @param {HTMLElement} btn
 * @param {boolean} on
 */
export function markFav(btn, on) {
    btn.classList.toggle('-on', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Убрать из избранного' : 'Добавить в избранное');
    btn.title = on ? 'В избранном' : 'В избранное';

    const $label = btn.querySelector('.label');
    if ($label) $label.textContent = on ? 'В избранном' : 'В избранное';
}

/* ---------- список ---------- */

/** Дорисовать следующую порцию */
function more() {
    if (view !== 'list' || shown >= current.length) return;

    const build = DESKTOP.matches ? card : row;
    const frag = document.createDocumentFragment();
    for (const s of current.slice(shown, shown + CHUNK)) frag.append(build(s));
    shown += CHUNK;

    $list.append(frag);
}

new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) more();
}, { rootMargin: '800px 0px' }).observe($sentinel);

// Перешли через границу телефон/ПК — пересобрать тем же списком
DESKTOP.addEventListener('change', () => {
    if (view === 'list') render(current);
    else if (view === 'skeleton') skeleton();
});

/**
 * Показать список с начала.
 * @param {import('/javascript/modules/dubs/api.dubs.js').TStudio[]} list
 */
export function render(list) {
    current = list;
    shown = 0;
    view = 'list';
    $list.replaceChildren();
    $list.classList.remove('-state');

    if (!list.length && state.kind === 'fav' && !state.q) {
        message({
            title: 'Избранное пусто',
            text: 'Нажмите на звёздочку у студии — она появится здесь. Избранное хранится на этом устройстве.',
        });
        return;
    }

    if (!list.length) {
        message({
            title: 'Ничего не нашлось',
            text: state.q ? `Нет студий по запросу «${state.q}»${state.kind !== 'all' ? ' среди выбранного типа' : ''}.` : 'В этом разделе пока нет студий.',
        });
        return;
    }

    more();
}

/** Заглушки, пока список грузится */
export function skeleton(n = DESKTOP.matches ? 9 : 8) {
    view = 'skeleton';
    $list.classList.remove('-state');

    const html = DESKTOP.matches
        ? '<div class="card-head"><span class="avatar sk"></span><span class="info"><span class="sk line w60"></span><span class="sk line w40"></span></span></div><div class="kpis"><span class="kpi sk"></span><span class="kpi sk"></span><span class="kpi sk"></span></div><span class="sk line w40"></span>'
        : '<span class="avatar sk"></span><span class="info"><span class="sk line w60"></span><span class="sk line w80"></span><span class="sk line w40"></span></span>';

    $list.replaceChildren(...Array.from({ length: n }, () => {
        const el = document.createElement('div');
        el.className = `${DESKTOP.matches ? 'studio-card' : 'studio'} -skeleton`;
        el.innerHTML = html;
        return el;
    }));
}

/**
 * Пустой список или ошибка.
 * @param {{title: string, text: string, action?: {label: string, run: () => void}}} opts
 */
export function message({ title, text, action }) {
    view = 'state';

    const el = document.createElement('div');
    el.className = 'studios-empty';
    el.innerHTML = '<b></b><p></p>';
    el.querySelector('b').textContent = title;
    el.querySelector('p').textContent = text;

    if (action) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip';
        btn.textContent = action.label;
        btn.addEventListener('click', action.run, { once: true });
        el.append(btn);
    }

    $list.classList.add('-state');
    $list.replaceChildren(el);
}
