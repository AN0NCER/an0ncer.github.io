import { TWindow } from "/javascript/core/window.core.js";
import { WindowIntercator } from "/javascript/modules/win.module.js";
import { getStudioGenres } from "/javascript/modules/dubs/api.dubs.js";
import { num, plural } from "/javascript/modules/dubs/dubs.format.js";
import { AGE_HINT, AGE_LABEL, AUDIENCE_HINT, AGES, CENSORED_AGES, CENSORED_GENRES, COLLAPSED_ROWS, GROUPS, LABEL, OTHER } from "../modules/mod.genres.js";
import { CENSORED, esc } from "../modules/mod.ui.js";
import { createSlider } from "../modules/mod.slider.js";
import { animateWidth, pressable } from "/javascript/modules/tun.animate.js";

/**
 * Окно «Жанры и темы»: у каждого жанра «+» (аниме должно его иметь) и «−» (не должно).
 * Аудитория — плитками: нажатие по кругу «+ есть» → «− нет» → сброс.
 * Возрастной рейтинг — чипами со значком, нажатие тоже по кругу «+ есть» → «− нет» → сброс:
 * «+» у нескольких — любой из них, «−» — без этих рейтингов.
 * Жанры «+» — должны быть все; аудитории и рейтинги «+» — любой из них
 * (см. mod.titles.js → genreQuery).
 * Выбор применяется кнопкой «Готово · N» (N — сколько тайтлов останется);
 * закрыли окно иначе — выбор не меняется.
 *
 * Разметка каркаса — в studio.html (.window-genres), содержимое собирается здесь.
 *
 * На ПК (от 900 px) окно — большое по центру: поиск, легенда, «Сбросить» и «Готово»
 * в шапке; аудитория и рейтинг карточками, жанры облаком, темы колонками;
 * выбранное — чипами внизу.
 */

const ELL = '.window-genres';

/**
 * @typedef {Object} TGenresContext
 * @property {number} studioId
 * @property {TPicked} picked - уже применённый выбор
 * @property {(picked: TPicked, signal: AbortSignal) => Promise<number|null>} count
 *  сколько тайтлов будет с таким выбором (null — посчитать нельзя)
 * @property {(picked: TPicked) => void} apply
 */

/**
 * @typedef {Object} TPicked
 * @property {string[]} include - жанры «есть»
 * @property {string[]} exclude - жанры «нет»
 * @property {string[]} ageIn - возрастной рейтинг «любой из»
 * @property {string[]} ageOut - возрастной рейтинг «не эти»
 */

/** Рейтинг в общем выборе хранится с приставкой, чтобы не путаться с жанрами */
const AGE = 'age:';

/** @type {TWindow|null} */
let win = null;
/** @type {TGenresContext|null} */
let ctx = null;

/** Выбор в окне: жанр или «age:PG» → 'in' | 'out' */
let pick = new Map();

/** Жанры и рейтинги студии с числами (без скрытых цензурой) и для какой студии загружены */
let genres = [];
/** @type {{name: string, count: number}[]} рейтинги, name — «age:PG» */
let ages = [];
let loadedFor = null;

/** Раскрытые группы («Ещё N») и строка поиска */
const expanded = new Set();
let query = '';

let countTimer = 0;
let countAbort = null;

/** @type {ReturnType<typeof createSlider>|null} подсветка быстрого перехода */
let slider = null;
/** @type {{reset: () => void}} поиск в нижней панели */
let search = { reset: () => { } };

/** Раскладка для ПК */
const DESK = matchMedia('(min-width: 900px)');

const $root = () => document.querySelector(ELL);
const $body = () => document.querySelector(`${ELL} .genres-body`);

/**
 * Открыть окно.
 * @param {TGenresContext} opts
 */
export async function WGenres(opts) {
    ctx = opts;
    const { include, exclude, ageIn, ageOut } = opts.picked;
    pick = new Map([
        ...include.map((g) => [g, 'in']), ...exclude.map((g) => [g, 'out']),
        ...ageIn.map((a) => [AGE + a, 'in']), ...ageOut.map((a) => [AGE + a, 'out']),
    ]);
    query = '';
    expanded.clear();

    if (!win) win = create();
    search.reset();
    // Тянуть за шапку (закрыть свайпом) — только у шторки на телефоне, окно по центру на ПК не двигаем
    const drag = win.module.get('windowintercator');
    if (drag) drag.enable = !DESK.matches;
    win.show();

    if (loadedFor !== opts.studioId) {
        $body().innerHTML = '<div class="genres-loading"><span class="sk line w60"></span><span class="sk line w80"></span><span class="sk line w40"></span></div>';
        setFootEnabled(false);
        try {
            const res = await getStudioGenres(opts.studioId);
            genres = res.items.filter((g) => !(CENSORED && CENSORED_GENRES.has(g.name)));
            ages = (res.ages || [])
                .filter((a) => AGES.includes(a.name) && !(CENSORED && CENSORED_AGES.has(a.name)))
                .map((a) => ({ name: AGE + a.name, count: a.count }));
            loadedFor = opts.studioId;
        } catch (err) {
            console.warn('[studio] жанры не загрузились', err);
            $body().innerHTML = `<div class="studios-empty"><b>${err.status === 404
                ? 'Фильтр по жанрам пока недоступен'
                : 'Не удалось загрузить жанры'}</b><p>${err.status === 404
                ? 'Попробуйте позже.'
                : 'Сервер озвучек не ответил. Попробуйте ещё раз позже.'}</p></div>`;
            return;
        }
    }

    // Жанр или рейтинг мог прийти из ссылки, а у студии его нет или он скрыт цензурой
    const known = (name) => genres.some((g) => g.name === name) || ages.some((a) => a.name === name);
    for (const name of [...pick.keys()]) if (!known(name)) pick.delete(name);

    drawBody();
    setFootEnabled(true);
    updateFoot();
}

/* ---------- каркас ---------- */

function create() {
    const w = new TWindow({}, ELL);
    w.module.add(WindowIntercator);

    const root = $root();
    root.querySelector('.window-close').addEventListener('click', () => w.hide());
    // «Сбросить» и «Готово» — по две: в нижней панели (телефон) и в шапке (ПК)
    root.querySelectorAll('.genres-reset').forEach((el) => el.addEventListener('click', () => {
        pick.clear();
        drawSections();
        drawSummary();
        updateFoot();
    }));
    root.querySelectorAll('.genres-apply').forEach((el) => el.addEventListener('click', () => {
        if (!ctx) return;
        ctx.apply(picked());
        w.hide();
    }));

    // ПК: строка поиска в шапке
    const $desk = root.querySelector('.genres-desk-input');
    let deskTimer = 0;
    $desk.addEventListener('input', () => {
        clearTimeout(deskTimer);
        deskTimer = setTimeout(() => setQuery($desk.value), 120);
    });

    // ПК: Esc закрывает окно
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && w.showed && DESK.matches) w.hide();
    });

    // Перешли между телефоном и ПК с открытым окном — другая раскладка разделов
    DESK.addEventListener('change', () => {
        const drag = w.module.get('windowintercator');
        if (drag) drag.enable = !DESK.matches;
        if (w.showed && $body().querySelector('.genres-sections')) drawSections();
    });

    // Все клики внутри содержимого — одним обработчиком
    root.querySelector('.genres-body').addEventListener('click', onBodyClick);
    // ПК: крестики у выбранного внизу окна
    root.querySelector('.genres-deskfoot').addEventListener('click', onBodyClick);

    // Правый клик по чипу жанра, плитке аудитории или рейтингу — сразу «нет» (повторный — сброс)
    root.querySelector('.genres-body').addEventListener('contextmenu', (e) => {
        const el = e.target.closest('[data-act="cycle"]');
        const name = el?.closest('[data-genre]')?.dataset.genre;
        if (!name) return;
        e.preventDefault();
        setPick(name, pick.get(name) === 'out' ? null : 'out');
    });

    // Плавающий быстрый переход: клик — к разделу, прокрутка — подсветка текущего
    slider = createSlider(root.querySelector('.win-jumps'), '.jump-items');
    root.querySelector('.win-jumps').addEventListener('click', onJumpClick);

    // В покое панель переходов уменьшена; касание разворачивает её, через 2 с без касаний — обратно
    const $jumps = root.querySelector('.win-jumps');
    let shrink = 0;
    $jumps.addEventListener('pointerdown', () => {
        $jumps.classList.add('-big');
        clearTimeout(shrink);
        shrink = setTimeout(() => $jumps.classList.remove('-big'), 2000);
    });
    w.on('hide', () => {
        clearTimeout(shrink);
        $jumps.classList.remove('-big');
    });

    search = createSearch(root);
    let spy = 0;
    const $scroll = root.querySelector('.content-wrapper');
    $scroll.addEventListener('scroll', () => {
        // Едем к разделу после клика — подсветка уже стоит на цели, промежуточные разделы не трогают её
        if (jumping) {
            holdJump();
            return;
        }
        if (spy) return;
        spy = requestAnimationFrame(() => {
            spy = 0;
            markJump();
        });
    }, { passive: true });

    // Пользователь сам взялся крутить во время перехода — подсветка снова следит за прокруткой
    const release = () => {
        if (jumping) releaseJump();
    };
    $scroll.addEventListener('wheel', release, { passive: true });
    $scroll.addEventListener('touchstart', release, { passive: true });

    // Пока окно не показано, у разделов нулевые координаты — подсветку перехода считаем после появления
    w.on('animshow', () => markJump(), 'jumps');

    w.on('hide', () => {
        clearTimeout(countTimer);
        countAbort?.abort();
    });

    return w;
}

function drawBody() {
    $body().innerHTML = `
        <div class="genres-summary"></div>
        <div class="genres-jump">
            <span class="genres-legend"><b class="in">+</b> есть <b class="out">−</b> нет</span>
        </div>
        <div class="genres-sections"></div>`;

    $root().querySelector('.genres-search-input').placeholder = `Найти среди ${num(genres.length + ages.length)}: «исэкай», «школа»…`;
    $root().querySelector('.genres-desk-input').placeholder = `Найти среди ${num(genres.length + ages.length)}`;

    drawSummary();
    drawSections();
}

/* ---------- группы ---------- */

/** Жанры студии, разложенные по группам (только непустые группы) */
function grouped() {
    const byName = new Map(genres.map((g) => [g.name, g]));
    const used = new Set();
    const out = [];

    for (const group of GROUPS) {
        const items = group.names.map((n) => byName.get(n)).filter(Boolean);
        items.forEach((g) => used.add(g.name));
        // Аудитория — в своём порядке, остальное — по числу тайтлов
        if (!group.tiles) items.sort((a, b) => b.count - a.count);
        if (items.length) out.push({ ...group, items });
    }

    const rest = genres.filter((g) => !used.has(g.name)).sort((a, b) => b.count - a.count);
    if (rest.length) out.push({ ...OTHER, items: rest });

    // Возрастной рейтинг — плитками сразу после аудитории
    if (ages.length) {
        const at = out[0]?.key === 'audience' ? 1 : 0;
        out.splice(at, 0, { key: 'age', title: 'Возрастной рейтинг', hint: '', tiles: true, items: ages });
    }
    return out;
}

const isAge = (name) => name.startsWith(AGE);
const label = (name) => (isAge(name) ? AGE_LABEL[name.slice(AGE.length)] : LABEL[name] || name);

function stateClass(name) {
    const st = pick.get(name);
    return st === 'in' ? ' -in' : st === 'out' ? ' -out' : '';
}

/**
 * Чип выбора в три колонки — рейтинг (жёлтый значок) и аудитория на телефоне (название):
 * число и что значит (или состояние); по кругу «+ есть» → «− нет» → сброс
 */
function pickChip(g) {
    const st = pick.get(g.name);
    const age = isAge(g.name);
    const meaning = age ? AGE_HINT[g.name.slice(AGE.length)] || '' : AUDIENCE_HINT[g.name] || '';
    const hint = st === 'in' ? '+ есть' : st === 'out' ? '− нет' : meaning;
    const title = age
        ? `<b class="age-badge">${esc(label(g.name))}</b>`
        : `<b class="nm">${esc(label(g.name))}</b>`;
    return `<button type="button" class="g-age${stateClass(g.name)}" data-genre="${esc(g.name)}" data-act="cycle" aria-pressed="${Boolean(st)}" title="${esc(meaning)}">
        ${title}
        <span class="hint"><span class="c">${num(g.count)}</span> · ${esc(hint)}</span>
        <span class="mark" aria-hidden="true">${st === 'in' ? '+' : st === 'out' ? '−' : ''}</span>
    </button>`;
}

/** Жанр на ПК: чип облака. Клик по кругу «есть» → «нет» → сброс, правый клик — сразу «нет» */
function cloudChip(g) {
    const st = pick.get(g.name);
    const mark = st === 'in' ? '+' : st === 'out' ? '−' : '';
    return `<button type="button" class="g-chip${stateClass(g.name)}" data-genre="${esc(g.name)}" data-act="cycle" aria-pressed="${Boolean(st)}">
        ${mark ? `<span class="mk" aria-hidden="true">${mark}</span>` : ''}<span class="nm">${esc(label(g.name))}</span><span class="c">${num(g.count)}</span>
    </button>`;
}

function tile(g) {
    const st = pick.get(g.name);
    const sub = st === 'in' ? '+ есть' : st === 'out' ? '− нет' : num(g.count);
    const hint = isAge(g.name) ? ` title="${esc(AGE_HINT[g.name.slice(AGE.length)] || '')}"` : '';
    return `<button type="button" class="g-tile${stateClass(g.name)}" data-genre="${esc(g.name)}" data-act="cycle" aria-pressed="${Boolean(st)}"${hint}>
        <b>${esc(label(g.name))}</b><span>${esc(sub)}</span>
    </button>`;
}

function row(g) {
    const st = pick.get(g.name);
    // Рейтинг строкой (ПК) — с расшифровкой при наведении, как у плитки
    const hint = isAge(g.name) ? ` title="${esc(AGE_HINT[g.name.slice(AGE.length)] || '')}"` : '';
    return `<div class="g-row${stateClass(g.name)}" data-genre="${esc(g.name)}"${hint}>
        <span class="g-name">${isAge(g.name) ? `<b class="age-badge">${esc(label(g.name))}</b>` : esc(label(g.name))} <span class="c">${num(g.count)}</span></span>
        <span class="g-btns">
            <button type="button" class="g-btn -in" data-act="in" aria-pressed="${st === 'in'}" aria-label="Есть: ${esc(label(g.name))}">+</button>
            <button type="button" class="g-btn -out" data-act="out" aria-pressed="${st === 'out'}" aria-label="Нет: ${esc(label(g.name))}">−</button>
        </span>
    </div>`;
}

/** Тема ли это (группы тем на ПК идут колонками под жанрами) */
const isTheme = (key) => THEMES.includes(key);

/**
 * Как показывать группу:
 * телефон — аудитория плитками, рейтинг чипами, остальное строками с «Ещё N»;
 * ПК — аудитория плитками и рейтинг чипами (две карточки рядом), жанры облаком,
 * темы компактными строками в колонках.
 */
function viewOf(group, desk) {
    if (group.key === 'age') return 'ages';
    // Аудитория: на ПК — плитки в карточке, на телефоне — чипы, как у рейтинга
    if (group.tiles) return desk ? 'tiles' : 'chips';
    if (desk && group.key === 'genres') return 'cloud';
    return 'rows';
}

/** Подпись справа от заголовка: на ПК — как нажимать (подсказок под группами там нет) */
function hintOf(group, view, desk) {
    if (!desk) return group.hint;
    if (view === 'tiles' || view === 'ages') return 'клик: + есть → − нет → сброс';
    if (view === 'cloud') return 'клик — есть, ещё раз — нет · правый клик — сразу «нет»';
    return group.hint;
}

function sectionHtml(group, desk) {
    let items = group.items;
    if (query) items = items.filter((g) => label(g.name).toLowerCase().includes(query));
    if (!items.length) return '';

    const view = viewOf(group, desk);

    // Свёрнуто (телефон): первые строки + выбранные из хвоста, остальное — за «Ещё N»
    let hidden = 0;
    if (!query && !desk && view === 'rows' && !expanded.has(group.key) && items.length > COLLAPSED_ROWS) {
        const head = items.slice(0, COLLAPSED_ROWS);
        const chosen = items.slice(COLLAPSED_ROWS).filter((g) => pick.has(g.name));
        hidden = items.length - head.length - chosen.length;
        items = [...head, ...chosen];
    }

    let body;
    switch (view) {
        case 'ages':
            body = `<div class="g-ages">${items.map(pickChip).join('')}</div>`;
            break;
        case 'chips':
            body = `<div class="g-ages">${items.map(pickChip).join('')}</div>
                <span class="sub g-tip">Нажатие: + есть → − нет → сброс</span>`;
            break;
        case 'tiles':
            body = `<div class="g-tiles">${items.map(tile).join('')}</div>
                <span class="sub g-tip">Нажатие: + есть → − нет → сброс</span>`;
            break;
        case 'cloud':
            body = `<div class="g-cloud">${items.map(cloudChip).join('')}</div>`;
            break;
        default:
            body = `<div class="g-rows">${items.map(row).join('')}
                ${hidden > 0 ? `<button type="button" class="g-more" data-more="${group.key}">Ещё ${hidden} ›</button>` : ''}</div>`;
    }

    return `<section class="g-section -${view}" data-group="${group.key}">
        <div class="g-head"><span class="g-title">${esc(group.title)}</span><span class="sub">${esc(hintOf(group, view, desk))}</span></div>
        ${body}
    </section>`;
}

function drawSections() {
    const groups = grouped();
    const $sections = $body().querySelector('.genres-sections');

    drawJumps(groups);

    const desk = DESK.matches;
    let html;

    if (desk) {
        // ПК: [аудитория | рейтинг] → жанры облаком → темы колонками
        const part = (fn) => groups.filter(fn).map((g) => sectionHtml(g, true)).join('');
        const top = part((g) => g.key === 'audience' || g.key === 'age');
        const middle = part((g) => g.key === 'genres');
        const themes = part((g) => isTheme(g.key));
        html = [
            top && `<div class="gd-top">${top}</div>`,
            middle,
            themes && `<div class="gd-themes">${themes}</div>`,
        ].filter(Boolean).join('');
    } else {
        html = groups.map((g) => sectionHtml(g, false)).join('');
    }

    $sections.innerHTML = html || `<div class="studios-empty"><b>Ничего не нашлось</b><p>Нет жанра или рейтинга «${esc(query)}» у этой студии.</p></div>`;
    // Подсветка перехода — когда разделы уже на месте
    markJump();
}

/* ---------- выбранное ---------- */

/** @returns {TPicked} */
function picked() {
    const out = { include: [], exclude: [], ageIn: [], ageOut: [] };
    for (const [name, st] of pick) {
        if (isAge(name)) (st === 'in' ? out.ageIn : out.ageOut).push(name.slice(AGE.length));
        else (st === 'in' ? out.include : out.exclude).push(name);
    }
    return out;
}

/** Порядок чипов выбранного — как разделы окна: аудитория, рейтинг, жанры и темы */
function pickedOrder() {
    const audience = GROUPS.find((g) => g.key === 'audience')?.names || [];
    const rank = (name) => (audience.includes(name) ? 0 : isAge(name) ? 1 : 2);
    return [...pick].sort((a, b) => rank(a[0]) - rank(b[0]));
}

/**
 * Выбранное — чипами «+ Сёнен ×» / «− Гарем ×»: нажатие снимает параметр.
 * На телефоне — блок над разделами (скрыт, пока ничего не выбрано), на ПК — внизу окна
 */
function drawSummary() {
    const chips = pickedOrder().map(([name, st]) => `<button type="button" class="g-picked -${st}" data-genre="${esc(name)}" data-act="remove" aria-label="Убрать ${esc(label(name))}">
        <span class="mark">${st === 'in' ? '+' : '−'}</span>${esc(label(name))}<span class="x">×</span>
    </button>`).join('');

    const $summary = $body().querySelector('.genres-summary');
    $summary.hidden = !chips;
    $summary.innerHTML = chips ? `<div class="g-picked-list">${chips}</div>` : '';

    $root().querySelector('.genres-picked-foot').innerHTML = chips || '<span class="sub">Ничего не выбрано</span>';
}

/** Поменять выбор жанра и перерисовать только то, что от него зависит */
function setPick(name, st) {
    if (st) pick.set(name, st);
    else pick.delete(name);

    // Строки и плитки этого жанра — на месте, без перерисовки всего списка (не сбиваем прокрутку)
    const g = genres.find((x) => x.name === name) || ages.find((x) => x.name === name);
    $body().querySelectorAll('[data-genre]').forEach((el) => {
        if (el.dataset.genre !== name || el.classList.contains('g-picked')) return;
        if (el.classList.contains('g-age')) el.outerHTML = pickChip(g);
        else if (el.classList.contains('g-chip')) el.outerHTML = cloudChip(g);
        else if (el.classList.contains('g-tile')) el.outerHTML = tile(g);
        else if (el.classList.contains('g-row')) el.outerHTML = row(g);
    });

    drawSummary();
    updateFoot();
}

/* ---------- плавающий быстрый переход (над нижней панелью) ---------- */

/** Группы тем: «Темы» ведёт к первой из них и подсвечивается на любой */
const THEMES = ['world', 'fight', 'mood', 'stage', 'other'];

/** К какому переходу относится группа */
const jumpOf = (key) => (THEMES.includes(key) ? 'themes' : key);

/** Переходы «Аудитория · Рейтинг · Жанры · Темы» — только к тем разделам, что есть у студии */
function drawJumps(groups) {
    const $jumps = $root().querySelector('.win-jumps');
    const keys = groups.map((g) => g.key);
    const themes = keys.find((k) => THEMES.includes(k));

    const list = [
        ['audience', 'Аудитория', 'audience'],
        ['age', 'Рейтинг', 'age'],
        ['genres', 'Жанры', 'genres'],
        ['themes', 'Темы', themes],
    ].filter(([, , target]) => target && keys.includes(target));

    // При поиске разделы перемешаны с пустыми — переходы прячем
    $jumps.hidden = Boolean(query) || list.length < 2;
    $jumps.querySelector('.jump-items').innerHTML = list
        .map(([key, title, target]) => `<button type="button" class="item" data-key="${key}" data-target="${target}">${title}</button>`)
        .join('');
    slider?.reposition();
}

/** Подсветить раздел, который сейчас наверху списка */
/** Идёт плавная прокрутка после клика по переходу */
let jumping = false;
let jumpTimer = 0;

/** Прокрутка ещё идёт — продлить ожидание её конца */
function holdJump() {
    clearTimeout(jumpTimer);
    jumpTimer = setTimeout(releaseJump, 160);
}

function releaseJump() {
    clearTimeout(jumpTimer);
    jumping = false;
    markJump();
}

function markJump() {
    if (jumping) return;
    const $scroll = $root().querySelector('.content-wrapper');
    const top = $scroll.getBoundingClientRect().top + 72; // под прилипшей шапкой окна
    let current = null;
    for (const sec of $body().querySelectorAll('[data-group]')) {
        if (sec.getBoundingClientRect().top <= top) current = jumpOf(sec.dataset.group);
    }
    // В самом начале списка — первый раздел
    current ??= jumpOf($body().querySelector('[data-group]')?.dataset.group || '');
    // Докрутили до дна — последний раздел, даже если его заголовок не дошёл до верха
    if ($scroll.scrollTop > 0 && $scroll.scrollTop + $scroll.clientHeight >= $scroll.scrollHeight - 2) {
        const last = [...$root().querySelectorAll('.win-jumps [data-key]')].pop();
        if (last) current = last.dataset.key;
    }

    slider?.select(current);
}

function onJumpClick(e) {
    const jump = e.target.closest('[data-key]');
    if (!jump) return;
    // Подсветка едет сразу к цели, а прокрутка не дёргает её по пути (снимается, когда прокрутка встала)
    slider?.select(jump.dataset.key);
    jumping = true;
    holdJump();
    $body().querySelector(`[data-group="${jump.dataset.target}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onBodyClick(e) {

    const more = e.target.closest('[data-more]');
    if (more) {
        expanded.add(more.dataset.more);
        drawSections();
        return;
    }

    const act = e.target.closest('[data-act]');
    if (!act) return;
    const name = act.closest('[data-genre]')?.dataset.genre;
    if (!name) return;
    const cur = pick.get(name);

    switch (act.dataset.act) {
        case 'in': setPick(name, cur === 'in' ? null : 'in'); break;
        case 'out': setPick(name, cur === 'out' ? null : 'out'); break;
        case 'cycle': setPick(name, cur === 'in' ? 'out' : cur === 'out' ? null : 'in'); break;
        case 'remove': setPick(name, null); break;
    }
}

/* ---------- поиск ---------- */

/** Новый запрос поиска — из нижней панели (телефон) или из шапки (ПК) */
function setQuery(value) {
    const q = value.trim().toLowerCase();
    if (q === query) return;
    query = q;
    drawSections();
}

/**
 * Лупа в нижней панели разъезжается в строку поиска на всю панель, крестик —
 * сворачивает и очищает. Как в окнах коллекций
 * (javascript/windows/collections/win.selector/mod.search.js).
 * @param {HTMLElement} root
 */
function createSearch(root) {
    const actions = root.querySelector('.win-actions');
    const open = root.querySelector('.filter-action');
    const close = root.querySelector('.filter-close');
    const input = root.querySelector('.genres-search-input');

    pressable([open, close]);

    let shown = false;
    let timer = 0;

    const apply = setQuery;

    open.addEventListener('click', () => {
        if (shown) return;
        shown = true;
        animateWidth(actions, '100%', {
            onBegin: () => actions.classList.add('-filter-mode'),
            onComplete: () => input.focus(),
        });
    });

    close.addEventListener('click', () => {
        if (!shown) return;
        shown = false;
        animateWidth(actions, 'auto', {
            onBegin: () => actions.classList.remove('-filter-mode'),
        });
        // Свернули строку — поиск снимается, иначе список остался бы отфильтрованным без видимой причины
        input.value = '';
        apply('');
    });

    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => apply(input.value), 120);
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
    });

    return {
        /** Свернуть без анимации и очистить — при каждом открытии окна */
        reset() {
            clearTimeout(timer);
            shown = false;
            input.value = '';
            root.querySelector('.genres-desk-input').value = '';
            actions.classList.remove('-filter-mode');
            actions.style.width = '';
        },
    };
}

/* ---------- нижняя панель: «Сбросить» и «Готово · N» ---------- */

function setFootEnabled(on) {
    $root().querySelectorAll('.genres-apply, .genres-reset').forEach((el) => { el.disabled = !on; });
}

function updateFoot() {
    const sel = picked();
    const pin = sel.include.length + sel.ageIn.length;
    const pout = sel.exclude.length + sel.ageOut.length;
    const root = $root();
    // «Сбросить» в нижней панели — только когда есть что сбрасывать (как в окнах коллекций);
    // в шапке на ПК стоит всегда (чтобы шапка не прыгала), но неактивна
    root.querySelectorAll('.genres-reset').forEach((el) => {
        if (el.classList.contains('-desk')) el.disabled = !pin && !pout;
        else el.hidden = !pin && !pout;
    });

    // Сколько тайтлов останется — с небольшой задержкой, чтобы не спрашивать на каждый клик
    const $apply = root.querySelectorAll('.genres-apply');
    $apply.forEach((el) => { el.textContent = 'Готово'; });
    clearTimeout(countTimer);
    countAbort?.abort();

    countTimer = setTimeout(async () => {
        const ctrl = new AbortController();
        countAbort = ctrl;
        try {
            const n = await ctx.count(sel, ctrl.signal);
            if (ctrl.signal.aborted || n == null) return;
            $apply.forEach((el) => {
                el.textContent = n ? `Готово · ${num(n)}` : 'Ничего не найдено';
                el.title = `${num(n)} ${plural(n, ['тайтл', 'тайтла', 'тайтлов'])}`;
            });
        } catch {
            // Сеть — оставляем просто «Готово»
        }
    }, 250);
}
