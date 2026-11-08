import { getStudioTitles } from "/javascript/modules/dubs/api.dubs.js";
import { ago, num, plural, stateKey, TITLE_KIND } from "/javascript/modules/dubs/dubs.format.js";
import { AGE_LABEL, AGES, CENSORED_AGES, CENSORED_GENRES, GROUPS } from "./mod.genres.js";
import { animeUrl, CENSORED, esc, HIDDEN_NAME, isHidden18, progressBar, progressText, stateBadge } from "./mod.ui.js";
import { WGenres } from "../windows/win.genres.js";
import { applyMarks, loadMyList, userMark } from "./mod.mylist.js";

/**
 * Тайтлы студии: лента «Новые серии» и сетка «Все тайтлы»
 * с фильтром по состоянию, сортировкой, поиском и догрузкой при прокрутке.
 */

/** Аудитории: «+» у нескольких — любая из них (сёнен или сёдзё), у остальных жанров «+» — все сразу */
const AUDIENCE = new Set(GROUPS.find((g) => g.key === 'audience')?.names || []);

/**
 * Жанры «+» для запроса: аудитории — в any (хотя бы одна), остальное — в genres (все)
 * @param {string[]} include
 */
const genreQuery = (include) => ({
    genres: include.filter((g) => !AUDIENCE.has(g)),
    any: include.filter((g) => AUDIENCE.has(g)),
});

/** Сколько тайтлов догружать за раз */
const PAGE = 60;

/** Фильтры: ключ `state` для API, подпись, число из профиля студии */
const FILTERS = [
    ['', 'Все', (s) => s.titles],
    ['ongoing', 'Онгоинги', (s) => s.ongoing],
    ['complete', 'Озвучено', (s) => s.states?.complete],
    // «В процессе» — онгоинги и вышедшие, которые ещё озвучиваются; «брошено» — отдельно
    ['inprogress', 'В процессе', (s) => ['caught', 'behind', 'inprogress'].reduce((n, k) => n + (s.states?.[k] || 0), 0)],
    ['abandoned', 'Брошено', (s) => s.states?.abandoned],
    ['exclusive', 'Эксклюзивы', (s) => s.exclusives],
    ['movies', 'Фильмы', (s) => s.movies],
];

/**
 * «Мои» — тайтлы студии из списка пользователя (если вошёл).
 * Не состояние озвучки: в запрос уходят id из списка. В адрес не пишется.
 */
const MINE = 'mine';
const userMarkIcon = '<svg class="icon stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v16l-5-3.6L7 20z"></path></svg>';
/** @type {number[]|null} id тайтлов «смотрю и в планах» */
let mineIds = null;
/** Сколько таких тайтлов у студии (0 — чип не показываем) */
let mineCount = 0;

/** Состояние для запроса: у «Мои» вместо состояния — список id */
const stateQuery = () => (view.state === MINE ? { state: '', ids: mineIds || [] } : { state: view.state });

/** Сортировки (ключи — как у API) */
const SORTS = [
    ['progress', 'Свежие серии'],
    ['rating', 'Оценка'],
    ['year', 'Год'],
    ['voices', 'Мало озвучек'],
    ['name', 'Название'],
];

const $grid = document.querySelector('.title-grid');
const $sentinel = document.querySelector('.title-grid-sentinel');
const $count = document.querySelector('.titles-count');
const $filters = document.querySelector('.title-filters');
const $sorts = document.querySelector('.title-sorts');
const $search = document.querySelector('#title-search');

/** Выбор живёт в адресе (?state=&sort=&branch=&g=&xg=) — ссылкой можно поделиться */
const view = (() => {
    const p = new URLSearchParams(location.search);
    // Ссылки с ?state=caught / behind ведут в «В процессе»
    const st = stateKey(p.get('state') || '');
    const sort = p.get('sort');
    const branch = Number(p.get('branch')) || null;
    // Жанры, скрытые цензурой, из ссылки не берём
    const genres = (key) => (p.get(key) || '').split(',').map((g) => g.trim())
        .filter((g) => g && !(CENSORED && CENSORED_GENRES.has(g)));
    // Возрастные рейтинги — только известные; Rx при цензуре не берём
    const ages = (key) => (p.get(key) || '').split(',').map((a) => a.trim())
        .filter((a) => AGES.includes(a) && !(CENSORED && CENSORED_AGES.has(a)));
    return {
        state: FILTERS.some(([k]) => k === st) ? st : '',
        sort: SORTS.some(([k]) => k === sort) ? sort : 'progress',
        q: '',
        /** @type {number|null} translation.id выбранной ветки */
        branch,
        /** @type {string[]} жанры «есть» */
        include: genres('g'),
        /** @type {string[]} жанры «нет» */
        exclude: genres('xg'),
        /** @type {string[]} возрастной рейтинг «любой из» (G, PG, PG-13, R, R+, Rx) */
        ageIn: ages('a'),
        /** @type {string[]} возрастной рейтинг «не эти» */
        ageOut: ages('xa'),
    };
})();

let studio = null;
let offset = 0;
let total = Infinity;
let loading = false;
/** Отменяет запрос, ставший ненужным после смены фильтра */
let abort = null;

/** Что сделать, когда ветку выбрали или сбросили (подсветка в профиле — задаёт studio.js) */
let onBranch = (_id) => { };

function syncUrl() {
    const url = new URL(location.href);
    view.state && view.state !== MINE ? url.searchParams.set('state', view.state) : url.searchParams.delete('state');
    view.sort !== 'progress' ? url.searchParams.set('sort', view.sort) : url.searchParams.delete('sort');
    view.branch ? url.searchParams.set('branch', view.branch) : url.searchParams.delete('branch');
    view.include.length ? url.searchParams.set('g', view.include.join(',')) : url.searchParams.delete('g');
    view.exclude.length ? url.searchParams.set('xg', view.exclude.join(',')) : url.searchParams.delete('xg');
    view.ageIn.length ? url.searchParams.set('a', view.ageIn.join(',')) : url.searchParams.delete('a');
    view.ageOut.length ? url.searchParams.set('xa', view.ageOut.join(',')) : url.searchParams.delete('xa');
    history.replaceState(history.state, '', url);
}

/* ---------- выбранная ветка ---------- */

/** Чип «Ветка: AniLiberty ✕» над фильтрами — создаётся один раз */
const $branch = (() => {
    const el = document.createElement('div');
    el.className = 'branch-active';
    el.hidden = true;
    el.innerHTML = `<span class="sub">Только ветка</span>
        <button type="button" class="chip -on branch-chip" aria-label="Сбросить фильтр по ветке">
            <span class="label"></span>
            <svg class="icon stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>
        </button>`;
    document.querySelector('.titles-controls').prepend(el);
    return el;
})();

function drawBranch() {
    const member = view.branch ? studio?.members?.find((m) => m.id === view.branch) : null;
    $branch.hidden = !member;
    $branch.querySelector('.label').textContent = member?.name || '';
    syncCounts();
    onBranch(member ? member.id : null);
}

/** Сколько выбрано в окне «Жанры и темы»: «есть» и «нет» (жанры + возрастной рейтинг) */
const pickedIn = () => view.include.length + view.ageIn.length;
const pickedOut = () => view.exclude.length + view.ageOut.length;

/** Числа на фильтрах — по всей студии; при выбранной ветке, жанрах или рейтинге они бы врали */
function syncCounts() {
    const narrowed = Boolean(view.branch) || pickedIn() + pickedOut() > 0;
    $filters.classList.toggle('-no-counts', narrowed);
}

/* ---------- жанры ---------- */

const $genresBtn = document.querySelector('.genres-btn');

/** Кнопка фильтра: подсвечена и с «+2 −1», когда выбраны жанры или возрастной рейтинг */
function drawGenresBtn() {
    const on = pickedIn() + pickedOut() > 0;
    const $count = $genresBtn.querySelector('.genres-count');
    $genresBtn.classList.toggle('-on', on);
    $genresBtn.setAttribute('aria-pressed', String(on));
    $count.hidden = !on;
    $count.textContent = [pickedIn() ? `+${pickedIn()}` : '', pickedOut() ? `−${pickedOut()}` : '']
        .filter(Boolean).join(' ');
    syncCounts();
}

/** Окно «Жанры и темы» */
function openGenres() {
    if (!studio) return;
    WGenres({
        studioId: studio.id,
        picked: { include: view.include, exclude: view.exclude, ageIn: view.ageIn, ageOut: view.ageOut },
        // Сколько тайтлов останется при таком выборе (с текущими состоянием, веткой и поиском)
        count: async ({ include, exclude, ageIn, ageOut }, signal) => {
            const { genres, any } = genreQuery(include);
            const res = await getStudioTitles(studio.id, {
                ...stateQuery(), branch: view.branch, q: view.q.trim(),
                genres, any, exclude, age: ageIn, xage: ageOut, limit: 1,
            }, signal);
            return res.total;
        },
        apply: ({ include, exclude, ageIn, ageOut }) => {
            view.include = include;
            view.exclude = exclude;
            view.ageIn = ageIn;
            view.ageOut = ageOut;
            syncUrl();
            drawGenresBtn();
            reload();
        },
    });
}

/* ---------- карточки ---------- */

// Возрастной рейтинг у тайтла подписывается как на Shikimori — AGE_LABEL из mod.genres.js

/** Картинка без ломаной иконки: не загрузилась — остаётся цветная подложка */
const img = (src, alt = '') => (src
    ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`
    : '');

/** Метка поверх размытой картинки скрытого тайтла */
const ADULT_MARK = '<span class="adult-mark" aria-hidden="true">18+</span>';

/** @param {import('/javascript/modules/dubs/api.dubs.js').TStudioTitle} t */
function tile(t) {
    const url = animeUrl(t.shiki);
    const hidden = isHidden18(t);
    const name = hidden ? HIDDEN_NAME : t.name;
    const meta = [TITLE_KIND[t.kind] || null, t.year, AGE_LABEL[t.mpaa] || null].filter(Boolean).join(' · ');
    const badges = [
        t.rating ? `<span class="badge -tl">★ ${num(t.rating)}</span>` : '',
        t.exclusive ? '<span class="badge -tr -gold">только здесь</span>' : '',
    ].join('');

    const inner = `
        <span class="poster${hidden ? ' -adult' : ''}">${img(t.poster, hidden ? '' : t.name)}${badges}${hidden ? ADULT_MARK : ''}${userMark(t.shiki)}</span>
        <span class="tile-name${hidden ? ' -hidden' : ''}"${hidden ? '' : ` title="${esc(t.name)}"`}>${esc(name)}</span>
        <span class="sub tile-meta">${esc(meta)}${t.voices > 1 ? ` · ${num(t.voices)} ${plural(t.voices, ['озвучка', 'озвучки', 'озвучек'])}` : ''}</span>
        ${progressBar(t)}
        <span class="tile-foot">${stateBadge(t.state)}<span class="sub">${esc(progressText(t))}</span></span>`;

    // data-shiki — чтобы значок статуса из списка встал и на уже нарисованные плитки
    return url
        ? `<a class="title-tile" href="${url}" data-shiki="${esc(t.shiki)}">${inner}</a>`
        : `<div class="title-tile -nolink">${inner}</div>`;
}

/** @param {import('/javascript/modules/dubs/api.dubs.js').TStudioTitle} t */
function freshCard(t) {
    const url = animeUrl(t.shiki);
    const when = ago(t.progress);
    const hidden = isHidden18(t);
    const inner = `
        <span class="shot${hidden ? ' -adult' : ''}">${img(t.shot || t.poster, hidden ? '' : t.name)}
            <span class="badge -tl -ep">${num(t.ep)} серия</span>
            ${when ? `<span class="badge -tr -when">${when} назад</span>` : ''}
            ${hidden ? ADULT_MARK : ''}${userMark(t.shiki)}
        </span>
        <span class="tile-name -one${hidden ? ' -hidden' : ''}"${hidden ? '' : ` title="${esc(t.name)}"`}>${esc(hidden ? HIDDEN_NAME : t.name)}</span>
        ${progressBar(t)}
        <span class="tile-foot">${stateBadge(t.state)}<span class="sub">${esc(progressText(t))}</span></span>`;

    return url ? `<a class="fresh-card" href="${url}" data-shiki="${esc(t.shiki)}">${inner}</a>` : `<div class="fresh-card">${inner}</div>`;
}

/* ---------- новые серии ---------- */

/** Лента последних продвижений студии; пустая — блок остаётся скрытым */
export async function renderFresh(id) {
    try {
        const { items } = await getStudioTitles(id, { sort: 'progress', limit: 12 });
        const list = items.filter((t) => t.progress && t.ep);
        if (!list.length) return;

        document.querySelector('.fresh-rail').innerHTML = list.map(freshCard).join('');
        document.querySelector('.fresh').hidden = false;
    } catch (err) {
        console.warn('[studio] новые серии не загрузились', err);
    }
}

/* ---------- все тайтлы ---------- */

function drawControls(s) {
    const chips = FILTERS.map(([key, label, count]) => {
        const n = count(s) || 0;
        // Пустые фильтры не показываем, кроме выбранного (мог прийти из ссылки)
        if (key && !n && key !== view.state) return '';
        return `<button type="button" class="chip" data-state="${key}">${label} <span class="c">${num(n)}</span></button>`;
    });
    // «Мои» — сразу после «Все», если у студии есть такие тайтлы
    if (mineCount) {
        chips.splice(1, 0, `<button type="button" class="chip -mine" data-state="${MINE}">${userMarkIcon}Мои <span class="c">${num(mineCount)}</span></button>`);
    }
    $filters.innerHTML = chips.join('');

    $sorts.innerHTML = '<span class="sub sorts-label">Сортировка:</span>' + SORTS
        .map(([key, label]) => `<button type="button" class="chip sm" data-sort="${key}">${label}</button>`).join('');

    mark();
}

function mark() {
    $filters.querySelectorAll('.chip').forEach((el) => {
        const on = el.dataset.state === view.state;
        el.classList.toggle('-on', on);
        el.setAttribute('aria-pressed', String(on));
    });
    $sorts.querySelectorAll('.chip').forEach((el) => {
        const on = el.dataset.sort === view.sort;
        el.classList.toggle('-on', on);
        el.setAttribute('aria-pressed', String(on));
    });
}

function skeleton(n = 12) {
    $grid.classList.remove('-state');
    $grid.innerHTML = '<div class="title-tile -skeleton"><span class="poster sk"></span><span class="sk line w80"></span><span class="sk line w40"></span></div>'.repeat(n);
}

function message(title, text) {
    $grid.classList.add('-state');
    $grid.innerHTML = `<div class="studios-empty"><b>${esc(title)}</b><p>${esc(text)}</p></div>`;
}

/** Следующая страница тайтлов */
async function more() {
    if (loading || offset >= total || !studio) return;
    loading = true;

    const ctrl = new AbortController();
    abort = ctrl;
    const first = offset === 0;

    try {
        const { genres, any } = genreQuery(view.include);
        const res = await getStudioTitles(studio.id, {
            ...stateQuery(), branch: view.branch, genres, any, exclude: view.exclude,
            age: view.ageIn, xage: view.ageOut,
            sort: view.sort, q: view.q.trim(), limit: PAGE, offset,
        }, ctrl.signal);

        if (ctrl.signal.aborted) return;

        total = res.total;
        offset += res.items.length;
        if (!res.items.length) total = offset; // защита от бесконечной догрузки

        $count.textContent = `${num(res.total)} ${plural(res.total, ['тайтл', 'тайтла', 'тайтлов'])}`;

        if (first) {
            $grid.classList.remove('-state');
            $grid.innerHTML = '';
            if (!res.total) {
                const genred = pickedIn() + pickedOut() > 0;
                const where = view.branch ? ' в этой ветке' : view.state || genred ? ' в этом фильтре' : '';
                message('Ничего не нашлось', view.q
                    ? `Нет тайтлов по запросу «${view.q.trim()}»${where}.`
                    : `${view.branch ? 'В этой ветке' : 'В этом фильтре'} у студии нет тайтлов.${genred ? ' Попробуйте убрать часть жанров.' : ''}`);
                return;
            }
        }

        $grid.insertAdjacentHTML('beforeend', res.items.map(tile).join(''));
    } catch (err) {
        if (ctrl.signal.aborted) return;
        // Ветку из ссылки у студии не нашли — показываем всю студию
        if (err.status === 404 && view.branch) {
            view.branch = null;
            syncUrl();
            drawBranch();
            loading = false;
            abort = null;
            reload();
            return;
        }
        console.error('[studio] тайтлы не загрузились', err);
        if (first) message('Не удалось загрузить тайтлы', 'Сервер озвучек не ответил. Попробуйте обновить страницу.');
        total = offset; // не повторяем запрос при прокрутке
    } finally {
        if (abort === ctrl) {
            loading = false;
            abort = null;
        }
    }

    // Экран большой, а тайтлов пришло мало — догружаем сразу, не дожидаясь прокрутки
    if (offset < total && $sentinel.getBoundingClientRect().top < innerHeight + 800) more();
}

/** Начать список заново под текущие фильтр, сортировку и поиск */
function reload() {
    abort?.abort();
    abort = null;
    loading = false;
    offset = 0;
    total = Infinity;
    skeleton();
    more();
}

/**
 * Подключить блок тайтлов к студии.
 * @param {any} s - профиль студии (для чисел на фильтрах)
 */
export function initTitles(s, { branchChange = () => { } } = {}) {
    studio = s;
    onBranch = branchChange;
    // Ветка из ссылки, которой у студии нет, — не применяем
    if (view.branch && !s.members?.some((m) => m.id === view.branch)) view.branch = null;
    drawControls(s);
    drawBranch();
    drawGenresBtn();
    syncUrl();
    reload();
    initMine();
}

/**
 * Список пользователя: значки на постерах и чип «Мои» (если у студии есть такие тайтлы).
 */
async function initMine() {
    const ids = await loadMyList();
    if (!ids) return;
    applyMarks();
    if (!ids.length || !studio) return;
    try {
        const res = await getStudioTitles(studio.id, { ids, limit: 1 });
        if (!res.total) return;
        mineIds = ids;
        mineCount = res.total;
        drawControls(studio);
    } catch (err) {
        console.warn('[studio] «смотрю и в планах» не посчиталось', err);
    }
}

/**
 * Показать в «Все тайтлы» только аниме одной ветки (клик по ветке в профиле).
 * Повторный клик по той же ветке — сброс.
 * @param {number} id - translation.id ветки
 */
export function showBranch(id) {
    view.branch = view.branch === id ? null : id;
    syncUrl();
    drawBranch();
    reload();
    if (view.branch) document.querySelector('#titles').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Открыть фильтр (клик по состоянию в полосе) и прокрутить к тайтлам */
export function showState(state) {
    view.state = state;
    if (!$filters.querySelector(`[data-state="${state}"]`)) return;
    syncUrl();
    mark();
    reload();
    document.querySelector('#titles').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** «Искать в озвучке» — к поиску по тайтлам */
export function focusSearch() {
    document.querySelector('#titles').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => $search.focus({ preventScroll: true }), 350);
}

/* ---------- обработчики ---------- */

$genresBtn.addEventListener('click', openGenres);

// ✕ на чипе ветки — снова вся студия
$branch.querySelector('.branch-chip').addEventListener('click', () => {
    if (!view.branch) return;
    view.branch = null;
    syncUrl();
    drawBranch();
    reload();
});

$filters.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-state]');
    if (!chip || chip.dataset.state === view.state) return;
    view.state = chip.dataset.state;
    syncUrl();
    mark();
    reload();
});

$sorts.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-sort]');
    if (!chip || chip.dataset.sort === view.sort) return;
    view.sort = chip.dataset.sort;
    syncUrl();
    mark();
    reload();
});

let typing = 0;
$search.addEventListener('input', () => {
    clearTimeout(typing);
    typing = setTimeout(() => {
        if ($search.value.trim() === view.q.trim()) return;
        view.q = $search.value;
        reload();
    }, 250);
});

$search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $search.blur();
});

new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) more();
}, { rootMargin: '800px 0px' }).observe($sentinel);

skeleton();
