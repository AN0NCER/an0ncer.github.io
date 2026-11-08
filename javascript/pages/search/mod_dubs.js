import { getFeed, getOverview, getStudios } from "../../modules/dubs/api.dubs.js";
import { favIds, isFav } from "../../modules/dubs/dubs.favorites.js";
import { ago, hue, num, plural } from "../../modules/dubs/dubs.format.js";
import { ScrollElementWithMouse } from "../../modules/functions.js";

/**
 * Блок «Озвучки» на странице поиска (до ввода запроса):
 * студии — сначала избранные, потом популярные; свежие серии — в избранных студиях,
 * а без избранного — во всех.
 */

/** Сколько студий в ленте (после них — карточка «Каталог студий») */
const STUDIOS_SHOWN = 8;
/** Типы студий для «популярных» (без сабберов и обобщённых подписей) */
const RANKED = new Set(['fandub', 'official', 'tv', 'collab']);

const $block = () => document.querySelector('.dubs-block');

/** Цензура: тайтлы 18+ размыты, название скрыто */
const CENSORED = typeof $PARAMETERS === 'undefined' ? true : $PARAMETERS.censored !== false;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Аватар студии: сокращение, цвет — от названия */
const avatar = (s, cls = 'db-avatar') =>
    `<span class="${cls}" style="--h:${hue(s.name)}" aria-hidden="true">${esc(s.short)}</span>`;

/* ---------- студии ---------- */

/** Сколько серий студия выпустила за сутки — по ленте */
function dayEpisodes(feed) {
    const out = new Map();
    for (const e of feed) {
        if (e.type !== 'ep') continue;
        const n = e.from != null ? Math.max(1, e.ep - e.from) : 1;
        out.set(e.studio.id, (out.get(e.studio.id) || 0) + n);
    }
    return out;
}

function studioCard(s, eps) {
    const when = ago(s.lastUpdate);
    const tag = eps
        ? `<span class="db-plus">+${num(eps)} ${plural(eps, ['серия', 'серии', 'серий'])}</span>`
        : '<span class="db-plus -quiet">тихо</span>';
    return `<a class="db-studio${isFav(s) ? ' -mine' : ''}" href="/studio.html?id=${encodeURIComponent(s.id)}" draggable="false">
        <span class="top">${avatar(s)}${tag}</span>
        <span class="name" title="${esc(s.name)}">${esc(s.name)}</span>
        <span class="sub">${num(s.ongoing)} ${plural(s.ongoing, ['онгоинг', 'онгоинга', 'онгоингов'])}</span>
        <span class="sub">${when ? `${when} назад` : '&nbsp;'}</span>
    </a>`;
}

/** Последняя карточка ленты — в каталог; аватары следующих студий стопкой */
function catalogCard(next, total) {
    const stack = next.slice(0, 3).map((s) => avatar(s, 'db-avatar -xs')).join('');
    return `<a class="db-studio -catalog" href="/dubs.html" draggable="false">
        <span class="top"><span class="stack">${stack}</span></span>
        <span class="name">Каталог студий</span>
        <span class="sub">${num(total)} ${plural(total, ['студия', 'студии', 'студий'])}
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>
        </span>
    </a>`;
}

/** Сначала избранные (у кого были серии — выше), потом популярные */
function pickStudios(all, eps) {
    const byDay = (a, b) => (eps.get(b.id) || 0) - (eps.get(a.id) || 0);
    const mine = all.filter((s) => isFav(s)).sort(byDay);
    const popular = all
        .filter((s) => !isFav(s) && RANKED.has(s.kind))
        .sort((a, b) => byDay(a, b) || (b.active30 || 0) - (a.active30 || 0) || b.titles - a.titles);
    const shown = [...mine, ...popular].slice(0, STUDIOS_SHOWN);
    const rest = popular.filter((s) => !shown.includes(s));
    return { shown, rest };
}

/* ---------- свежие серии ---------- */

/** Как «Свежие серии» на странице студии: серия — слева сверху, когда — справа сверху */
function freshCard(e) {
    const hidden = CENSORED && e.adult === true;
    const when = ago(e.at);
    const img = e.shot || e.poster;
    return `<a class="db-ep" href="/watch.html?id=${encodeURIComponent(e.id)}" draggable="false">
        <span class="shot${hidden ? ' -adult' : ''}">
            ${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" draggable="false" onerror="this.remove()">` : ''}
            ${hidden ? '<span class="adult">18+</span>' : ''}
            <span class="pill -ep">${e.type === 'new' ? 'новая озвучка' : `${num(e.ep)} серия`}</span>
            ${when ? `<span class="pill -when">${esc(when)} назад</span>` : ''}
            ${avatar(e.studio, 'db-avatar -sm')}
        </span>
        <span class="name${hidden ? ' -hidden' : ''}">${esc(hidden ? 'Скрыто · 18+' : e.name)}</span>
        <span class="sub">${esc(e.studio.name)}</span>
    </a>`;
}

/* ---------- загрузка ---------- */

/** Перетаскивание мышью не должно открывать карточку под курсором */
function rail(el) {
    ScrollElementWithMouse(el);
    let x = 0;
    el.addEventListener('mousedown', (e) => { x = e.clientX; });
    el.addEventListener('click', (e) => {
        if (Math.abs(e.clientX - x) > 6) e.preventDefault();
    }, true);
}

export async function LoadDubs() {
    const block = $block();
    if (!block) return;

    const fav = favIds();
    const [all, feed, overview, favFeed] = await Promise.allSettled([
        getStudios(),
        getFeed({ days: 1, types: 'ep,new', limit: 300 }),
        getOverview(),
        fav.length ? getFeed({ days: 7, types: 'ep,new', limit: 24, studios: fav }) : Promise.resolve(null),
    ]).then((r) => r.map((x) => (x.status === 'fulfilled' ? x.value : null)));

    if (!all?.length) {
        block.hidden = true;
        return;
    }

    const eps = dayEpisodes(feed?.items || []);
    const { shown, rest } = pickStudios(all, eps);

    const total = overview?.studios || all.length;
    block.querySelector('.db-all .n').textContent = num(total);
    block.querySelector('.db-studios').innerHTML = shown.map((s) => studioCard(s, eps.get(s.id) || 0)).join('') + catalogCard(rest, total);

    // Свежие серии в избранных студиях; избранного нет — просто свежие
    const mine = (favFeed?.items || []).filter((e) => e.shot || e.poster);
    const fresh = mine.length ? mine : (feed?.items || []).filter((e) => e.shot || e.poster);
    const $wrap = block.querySelector('.db-fresh-wrap');
    $wrap.querySelector('.db-all').hidden = !mine.length;
    $wrap.querySelector('.db-fresh').innerHTML = fresh.slice(0, 12).map(freshCard).join('');
    $wrap.hidden = !fresh.length;

    block.querySelectorAll('.db-rail').forEach(rail);
}
