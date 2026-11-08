import { OAuth } from "/javascript/core/main.core.js";
import { UserRates } from "/javascript/modules/api.shiki.js";
import { svgPath } from "./mod.ui.js";

/**
 * Список пользователя на странице студии (только если вошёл в аккаунт):
 *  - значок статуса в левом нижнем углу постеров («Свежие серии» и «Все тайтлы»);
 *  - id тайтлов «смотрю и в планах» — для фильтра в «Все тайтлы» (mod.titles.js).
 *
 * Весь список аниме — один запрос к Shikimori (как на главной), кэш в sessionStorage
 * на 5 минут.
 */

/** Статусы Shikimori: подпись, класс цвета и иконка (пересматриваю = смотрю) */
const STATUS = {
    watching: { label: 'Смотрю', cls: '-watching', d: 'M8 5.5v13l10.5-6.5z' },
    completed: { label: 'Просмотрено', cls: '-completed', d: 'M5 12.5l4.5 4.5L19 7.5' },
    planned: { label: 'В планах', cls: '-planned', d: 'M7 4h10v16l-5-3.6L7 20z' },
    on_hold: { label: 'Отложено', cls: '-on_hold', d: 'M9 6v12M15 6v12' },
    dropped: { label: 'Брошено', cls: '-dropped', d: 'M6.5 6.5l11 11M17.5 6.5l-11 11' },
};

const statusOf = (s) => (s === 'rewatching' ? 'watching' : s);

/** Статусы фильтра «Мои»: смотрю (и пересматриваю) и в планах */
const MINE = new Set(['watching', 'planned']);

/** shiki id → { status, score } — весь список пользователя (для значков) */
const rates = new Map();

const CACHE_TTL = 5 * 60 * 1000;
const cacheKey = (uid) => `tun-mylist:${uid}`;

/* ---------- значок на постере ---------- */

/**
 * Значок статуса для постера (пусто — тайтла нет в списке или список не загружен).
 * У просмотренного — ещё и оценка.
 * @param {number|string} shiki
 */
export function userMark(shiki) {
    const r = rates.get(Number(shiki));
    if (!r) return '';
    const st = STATUS[statusOf(r.status)];
    if (!st) return '';
    const score = r.status === 'completed' && r.score ? `<span>${r.score}</span>` : '';
    return `<span class="badge -bl u-mark ${st.cls}${score ? '' : ' -round'}" title="В вашем списке: ${st.label.toLowerCase()}">${svgPath(st.d, 'icon stroke')}${score}</span>`;
}

/** Расставить значки на уже нарисованных постерах (список пришёл позже карточек) */
export function applyMarks(root = document) {
    if (!rates.size) return;
    root.querySelectorAll('[data-shiki]').forEach((el) => {
        const box = el.querySelector('.poster, .shot');
        if (!box || box.querySelector('.u-mark')) return;
        const mark = userMark(el.dataset.shiki);
        if (mark) box.insertAdjacentHTML('beforeend', mark);
    });
}

/* ---------- загрузка ---------- */

/** Весь список аниме пользователя: [[shiki, status, score], …] */
async function loadRates(uid) {
    try {
        const c = JSON.parse(sessionStorage.getItem(cacheKey(uid)) || 'null');
        if (c && Date.now() - c.t < CACHE_TTL) return c.rates;
    } catch {
        // нет sessionStorage — просто спросим заново
    }

    for (let attempt = 0; attempt < 3; attempt++) {
        const res = await UserRates.list({ user_id: uid, target_type: 'Anime' }).GET(OAuth.auth);
        if (Array.isArray(res)) {
            const list = res.map((r) => [r.target_id, r.status, r.score || 0]);
            try {
                sessionStorage.setItem(cacheKey(uid), JSON.stringify({ t: Date.now(), rates: list }));
            } catch {
                // переполнен — без кэша
            }
            return list;
        }
        // Shikimori ограничивает частоту — подождать и повторить
        if (res?.status === 429) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        else break;
    }
    return null;
}

/**
 * Загрузить список пользователя. Не вошёл, список закрыт или сеть — null.
 * @returns {Promise<number[]|null>} id тайтлов «смотрю и в планах»
 */
export async function loadMyList() {
    const uid = OAuth.user?.id;
    if (!uid) return null;
    try {
        const list = await loadRates(uid);
        if (!list) return null;
        rates.clear();
        for (const [id, status, score] of list) rates.set(Number(id), { status, score });
        return list.filter(([, status]) => MINE.has(statusOf(status))).map(([id]) => Number(id));
    } catch (err) {
        console.warn('[studio] список пользователя не загрузился', err);
        return null;
    }
}
