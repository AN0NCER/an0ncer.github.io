import { isFav } from "/javascript/modules/dubs/dubs.favorites.js";
import { ago, hours, hue, KIND_NAME, num, plural, STATE_ORDER, STATES, TITLE_KIND } from "/javascript/modules/dubs/dubs.format.js";
import { animeUrl, esc, estimate, HIDDEN_NAME, isHidden18, stateBadge, studioUrl, svgPath } from "./mod.ui.js";

/**
 * Профиль студии: всё, что строится из одного ответа профиля.
 * Каждый блок рисуется в свою секцию из studio.html; пустые блоки остаются скрытыми.
 */

const $ = (sel) => document.querySelector(sel);

/** Роли веток по-русски */
const ROLE = {
    main: 'основная', subs: 'субтитры', old: 'старая ветка', '18+': '18+',
    rebrand: 'ребрендинг', typo: 'опечатка в названии', alt: 'альтернативная', collab: 'совместная',
    multi: 'многоголосая', branch: 'ветка',
};

const TITLES = ['тайтл', 'тайтла', 'тайтлов'];

/** Аватар студии: сокращение, цвет — от названия */
const avatar = (s, cls = 'avatar') =>
    `<span class="${cls}" style="--h:${hue(s.name)}" aria-hidden="true">${esc(s.short)}</span>`;

/* ---------- шапка студии ---------- */

/** @param {any} s - профиль студии */
export function renderHero(s) {
    const when = ago(s.lastUpdate);
    const since = s.firstSeen ? new Date(s.firstSeen).getFullYear() : null;
    const branches = s.members?.length || 0;

    const facts = [
        KIND_NAME[s.kind] || s.kind,
        `${num(s.titles)} ${plural(s.titles, TITLES)}`,
        when ? `обновление ${when} назад` : null,
    ].filter(Boolean).join(' · ');

    const tags = [
        branches > 1 ? `<span class="tag">${num(branches)} ${plural(branches, ['ветка', 'ветки', 'веток'])}</span>` : '',
        since ? `<span class="tag">с ${since} года</span>` : '',
    ].join('');

    $('.hero').innerHTML = `
        <div class="hero-head">
            ${avatar(s)}
            <span class="hero-info">
                <h1 class="hero-name">${esc(s.name)}</h1>
                <span class="sub">${esc(facts)}</span>
            </span>
        </div>
        ${s.note ? `<p class="hero-note">✦ ${esc(s.note)}</p>` : ''}
        ${tags ? `<div class="hero-tags">${tags}</div>` : ''}
        <div class="hero-actions">
            <button type="button" class="fav-btn -pill" data-id="${s.id}" aria-pressed="false">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-star"></use></svg>
                <span class="label">В избранное</span>
            </button>
            <button type="button" class="chip search-in" data-act="search">
                <svg class="icon" viewBox="0 0 10 10" aria-hidden="true"><use href="#i-ios-search"></use></svg>
                Искать в озвучке
            </button>
        </div>`;

    markFav($('.hero .fav-btn'), isFav(s.id));
}

/**
 * Звёздочка с подписью: залита — студия в избранном.
 * @param {HTMLElement} btn
 * @param {boolean} on
 */
export function markFav(btn, on) {
    btn.classList.toggle('-on', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Убрать из избранного' : 'Добавить в избранное');
    btn.querySelector('.label').textContent = on ? 'В избранном' : 'В избранное';
}

/* ---------- цифры ---------- */

export function renderKpis(s) {
    const st = s.states || {};
    const tile = (value, label, sub = '', extra = '') =>
        `<div class="kpi"><span class="v">${value}</span><span class="l">${label}</span>${sub ? `<span class="s">${sub}</span>` : ''}${extra}</div>`;

    const lag = s.medianLagHours != null
        ? tile(`≈ ${hours(s.medianLagHours)}`, 'от выхода в Японии', '', s.lagMethod === 'estimate'
            ? estimate('Медиана времени от выхода серии в Японии до озвучки. Данных пока мало, значение уточнится со временем')
            : '')
        : '';

    $('.kpis').innerHTML = [
        tile(num(s.titles), plural(s.titles, TITLES), `${num(s.serials)} ${plural(s.serials, ['сериал', 'сериала', 'сериалов'])} · ${num(s.movies)} ${plural(s.movies, ['фильм', 'фильма', 'фильмов'])}`),
        tile(num(s.episodes), plural(s.episodes, ['серия', 'серии', 'серий'])),
        tile(num(s.ongoing), plural(s.ongoing, ['онгоинг', 'онгоинга', 'онгоингов']), s.ongoing ? `без задержки ${num(st.caught || 0)} · с задержкой ${num(st.behind || 0)}` : ''),
        tile(num(s.exclusives), plural(s.exclusives, ['эксклюзивное аниме', 'эксклюзивных аниме', 'эксклюзивных аниме']), 'только у этой студии'),
        s.completionRate != null ? tile(`${num(s.completionRate)}%`, 'аниме озвучено до конца', 'из тех, что уже вышли целиком') : '',
        lag,
        s.avgRating != null ? tile(num(s.avgRating), 'средний рейтинг', 'по Shikimori') : '',
        // Когда студия последний раз выпустила серию; за месяц — сколько тайтлов двигала
        ago(s.lastUpdate)
            ? tile(`${ago(s.lastUpdate)} назад`, 'последняя активность',
                s.active30 ? `${num(s.active30)} ${plural(s.active30, ['тайтл', 'тайтла', 'тайтлов'])} с новыми сериями за месяц` : 'за месяц новых серий не было')
            : '',
    ].join('');
}

/* ---------- состояния ---------- */

/** Какой фильтр тайтлов открывает клик по состоянию в легенде */
const STATE_FILTER = { complete: 'complete', inprogress: 'inprogress', abandoned: 'abandoned' };

export function renderStates(s) {
    const raw = s.states || {};
    // Онгоинги без задержки и с задержкой входят в «в процессе»
    const st = { ...raw, inprogress: (raw.caught || 0) + (raw.behind || 0) + (raw.inprogress || 0) };
    const total = STATE_ORDER.reduce((sum, k) => sum + (st[k] || 0), 0);

    // Маленькие сегменты всё равно видны тонкой полоской
    const bar = STATE_ORDER
        .filter((k) => st[k])
        .map((k) => `<span style="flex:${Math.max(st[k], total * 0.012)};background:${STATES[k].color}" title="${esc(STATES[k].label)}: ${num(st[k])}"></span>`)
        .join('');

    const legend = STATE_ORDER.map((k) => {
        const filter = STATE_FILTER[k];
        const inner = `${stateBadge(k)}<span class="n">${num(st[k] || 0)}</span>`;
        return filter && st[k]
            ? `<button type="button" class="legend-item" data-state="${filter}" title="Показать: ${esc(STATES[k].label)}">${inner}</button>`
            : `<span class="legend-item -static">${inner}</span>`;
    }).join('');

    $('.states').innerHTML = `
        <div class="s-head">
            <span class="s-title">Состояние озвучек</span>
            <span class="sub">${num(total)} ${plural(total, TITLES)}</span>
        </div>
        <div class="sbar6" role="img" aria-label="Распределение тайтлов по состояниям">${bar}</div>
        <div class="legend">${legend}</div>
        <span class="sub">«Брошено» — давно не выходили эпизоды.</span>`;
}

/* ---------- ветки и совместные ---------- */

export function renderBranches(s) {
    const members = s.members || [];
    const collabs = s.collabs || [];
    const partners = s.partners || [];
    const $box = $('.branches');

    if (members.length < 2 && !collabs.length && !partners.length) return;

    const main = members.find((m) => m.role === 'main');
    const others = members.filter((m) => m !== main);
    const summary = [
        main ? `основная ${main.name}` : null,
        others.length ? `ещё ${others.length}` : null,
    ].filter(Boolean).join(' · ');

    // Ветка — кнопка: показывает в «Все тайтлы» только её аниме (обработчик — в studio.js)
    const rows = members.map((m) => {
        const when = ago(m.lastUpdate);
        return `<button type="button" class="branch" data-branch="${m.id}" data-name="${esc(m.name)}" title="Показать аниме ветки ${esc(m.name)}">
            <span class="branch-info">
                <span class="branch-name">${esc(m.name)}</span>
                <span class="sub">${esc(ROLE[m.role] || m.role || '')}${m.type === 'subtitles' && m.role !== 'subs' ? ' · субтитры' : ''}</span>
            </span>
            <span class="branch-num">
                <b>${num(m.entries)}</b>
                <span class="sub">${when ? `${when} назад` : '—'}</span>
            </span>
            <svg class="icon stroke branch-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>
        </button>`;
    }).join('');

    const links = (title, list) => list.length
        ? `<div class="links"><span class="sub">${title}</span>${list.map((c) =>
            `<a class="chip sm" href="${studioUrl(c.id)}">${avatar(c, 'avatar -xs')}${esc(c.name)}${c.titles != null ? ` <span class="c">${num(c.titles)}</span>` : ''}</a>`).join('')}</div>`
        : '';

    $box.innerHTML = `
        ${members.length > 1 ? `
        <button type="button" class="branches-toggle" aria-expanded="false" aria-controls="branch-collapse">
            ${svgPath('M12 3l9 5-9 5-9-5zM3 13l9 5 9-5')}
            <span class="branches-title">
                <span class="s-title">Ветки · ${num(members.length)}</span>
                <span class="sub">${esc(summary)}</span>
            </span>
            <svg class="icon stroke chevron" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-chevron-down"></use></svg>
        </button>
        <div class="branch-collapse" id="branch-collapse" aria-hidden="true" inert>
            <div class="branch-list">${rows}</div>
        </div>` : ''}
        ${links('Совместные:', collabs)}
        ${links('Участники:', partners)}`;

    $box.hidden = false;

    // Раскрытие анимирует CSS (_profile.scss → .branch-collapse): здесь только состояние
    const toggle = $box.querySelector('.branches-toggle');
    const collapse = $box.querySelector('.branch-collapse');
    toggle?.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(open));
        collapse.classList.toggle('-open', open);
        collapse.setAttribute('aria-hidden', String(!open));
        collapse.inert = !open;
    });
}

/**
 * Подсветить выбранную ветку в списке (или снять подсветку).
 * @param {number|null} id
 */
export function markBranch(id) {
    document.querySelectorAll('.branches .branch').forEach((el) => {
        const on = Number(el.dataset.branch) === id;
        el.classList.toggle('-on', on);
        el.setAttribute('aria-pressed', String(on));
    });
}

/* ---------- жанры, годы, типы ---------- */

export function renderGenres(s) {
    const genres = s.genres || [];
    if (!genres.length) return;

    const max = Math.max(...genres.map((g) => g.share));
    $('.genres').innerHTML = `
        <span class="s-title">Жанры · топ-${genres.length}</span>
        <div class="hbars">${genres.map((g) => `
            <div class="hbar" title="${esc(g.name)}: ${num(g.count)} ${plural(g.count, TITLES)}">
                <span class="hbar-name">${esc(g.name)}</span>
                <span class="pbar"><span class="dub -grad" style="width:${(g.share / max * 100).toFixed(1)}%"></span></span>
                <span class="hbar-val">${num(Math.round(g.share))}%</span>
            </div>`).join('')}
        </div>`;
    $('.genres').hidden = false;
}

/** Аниме студии по году выхода в Японии */
export function renderYears(s) {
    const years = Object.entries(s.years || {}).map(([y, n]) => [Number(y), n]).filter(([y]) => y > 1900);
    if (years.length < 2) return;

    // Длинную историю собираем по 2 года, чтобы столбики не превращались в нитки
    const first = years[0][0], last = years.at(-1)[0];
    const step = last - first > 24 ? 2 : 1;
    const buckets = new Map();
    for (const [y, n] of years) {
        const from = first + Math.floor((y - first) / step) * step;
        buckets.set(from, (buckets.get(from) || 0) + n);
    }
    const list = [...buckets];
    const max = Math.max(...list.map(([, n]) => n));
    const mid = list[Math.floor(list.length / 2)][0];
    const bar = (n, title) =>
        `<span style="height:${Math.max(3, n / max * 100).toFixed(0)}%" title="${title}: ${num(n)} ${plural(n, TITLES)}"></span>`;

    $('.years').innerHTML = `
        <div class="s-head">
            <span class="s-title">Аниме по годам выхода</span>
            <span class="sub">${step > 1 ? 'по 2 года' : 'по годам'}</span>
        </div>
        <div class="vbars">${list.map(([y, n]) =>
            bar(n, `${y}${step > 1 ? `–${y + 1}` : ''}`)).join('')}
        </div>
        <div class="vbars-axis sub"><span>${first}</span><span>${mid}</span><span>${last}</span></div>`;
    $('.years').hidden = false;
}

/** Сколько у студии сериалов, фильмов, ONA, OVA… (качество видео не показываем) */
export function renderKinds(s) {
    const kinds = Object.entries(s.kinds || {}).filter(([k, n]) => n > 0 && k !== 'unknown');
    if (!kinds.length) return;

    $('.kinds').innerHTML = `
        <span class="s-title">Типы аниме</span>
        <div class="chip-wrap">${kinds.slice(0, 8)
            .map(([k, n]) => `<span class="chip sm">${esc(TITLE_KIND[k] || k)} <span class="c">${num(n)}</span></span>`).join('')}
        </div>`;
    $('.kinds').hidden = false;
}

/* ---------- лучшие по рейтингу ---------- */

export function renderTop(s) {
    const top = s.topRated || [];
    if (!top.length) return;

    $('.top').innerHTML = `
        <span class="s-title">Лучшие по рейтингу</span>
        <div class="top-list">${top.map((t, i) => {
            const url = animeUrl(t.id);
            const hidden = isHidden18(t);
            const inner = `<span class="rk">${i + 1}</span>
                <span class="top-name${hidden ? ' -hidden' : ''}">${esc(hidden ? HIDDEN_NAME : t.name)}</span>
                <span class="sub">${t.year || ''}</span>
                <span class="top-rating">★ ${num(t.rating)}</span>`;
            return url ? `<a class="top-row" href="${url}">${inner}</a>` : `<span class="top-row">${inner}</span>`;
        }).join('')}</div>`;
    $('.top').hidden = false;
}

/** Заглушки, пока профиль грузится */
export function profileSkeleton() {
    $('.hero').innerHTML = `
        <div class="hero-head">
            <span class="avatar sk"></span>
            <span class="hero-info"><span class="sk line w60"></span><span class="sk line w80"></span></span>
        </div>
        <span class="sk line w40"></span>`;
    $('.kpis').innerHTML = '<div class="kpi sk"></div>'.repeat(6);
    $('.states').innerHTML = '<span class="sk line w40"></span><span class="sk bar"></span><span class="sk line w80"></span>';
}
