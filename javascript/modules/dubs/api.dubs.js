/** API озвучек — для каталога студий (dubs.html) и страницы студии (studio.html) */
const DEFAULT_BASE = 'https://dub.tunime.app/api/v1';

/** Адрес API можно подменить через localStorage['tun-dub-api'] */
const BASE = (() => {
    try {
        return localStorage.getItem('tun-dub-api') || DEFAULT_BASE;
    } catch {
        return DEFAULT_BASE;
    }
})();

/** Сколько ждать ответа */
const TIMEOUT_MS = 15000;

/**
 * Сигнал, который срабатывает по таймауту или по внешней отмене.
 * AbortSignal.any/timeout есть не везде (Safari < 17.4) — собираем вручную.
 * @param {AbortSignal} [signal]
 */
function withTimeout(signal) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(new DOMException('timeout', 'TimeoutError')), TIMEOUT_MS);
    ctrl.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });

    if (signal) {
        if (signal.aborted) ctrl.abort(signal.reason);
        else signal.addEventListener('abort', () => ctrl.abort(signal.reason), { once: true });
    }
    return ctrl.signal;
}

/**
 * Запрос к API. Ошибка несёт `status`: 404 — студии нет, 0 — сеть или таймаут.
 * @param {string} path
 * @param {AbortSignal} [signal] - отмена, когда запрос уже не нужен
 */
async function get(path, signal) {
    const res = await fetch(`${BASE}${path}`, {
        signal: withTimeout(signal),
    }).catch((err) => {
        if (signal?.aborted) throw err;
        throw Object.assign(new Error(`dub api: ${err.message}`), { status: 0 });
    });

    if (!res.ok) throw Object.assign(new Error(`dub api: HTTP ${res.status}`), { status: res.status });
    return res.json();
}

/**
 * Студия из списка `/studios`.
 *
 * @typedef {Object} TStudio
 * @property {number} id
 * @property {string} name
 * @property {'fandub'|'official'|'tv'|'collab'|'subs'|'generic'} kind
 * @property {{id:number, name:string, role:string}[]} [members] - ветки студии, если их больше одной
 * @property {number} titles
 * @property {number} episodes
 * @property {number} ongoing
 * @property {number} exclusives
 * @property {number|null} completionRate - сколько начатого доозвучено до конца, %
 * @property {number} active30 - тайтлов с новыми сериями за 30 дней
 * @property {number} eps30
 * @property {string|null} lastUpdate - ISO
 */

/**
 * Все студии одним запросом; поиск, фильтр и сортировка дальше — без сети.
 * Обобщённые подписи (`kind: 'generic'`) показываются под чипом «Без студии».
 *
 * @returns {Promise<TStudio[]>}
 */
export async function getStudios() {
    const { items } = await get('/studios?limit=1000');
    return items;
}

/**
 * Профиль студии: ветки, цифры, состояния, жанры, годы…
 *
 * @param {number|string} id - id студии или translation.id любой её ветки
 * @param {AbortSignal} [signal]
 */
export function getStudio(id, signal) {
    return get(`/studios/${encodeURIComponent(id)}`, signal);
}

/**
 * Тайтл студии.
 *
 * @typedef {Object} TStudioTitle
 * @property {string} id
 * @property {number|null} shiki - id на Shikimori (= id страницы аниме в Tunime)
 * @property {string} name
 * @property {string|null} nameEn
 * @property {string|null} poster
 * @property {string|null} kind - tv, movie, ona, ova…
 * @property {number|null} year
 * @property {number|null} rating
 * @property {number|null} season
 * @property {number|null} ep - на какой серии студия
 * @property {number|null} aired - сколько вышло в Японии (null — фильм)
 * @property {number|null} total - всего серий (0 — неизвестно)
 * @property {'complete'|'caught'|'behind'|'inprogress'|'abandoned'|'unknown'} state
 * @property {boolean} exclusive
 * @property {boolean} [adult] - 18+ (рейтинг Rx или жанр «Хентай»/«Эротика»)
 * @property {number[]} [branches] - translation.id веток студии, где есть тайтл
 * @property {string[]} [genres] - жанры тайтла
 * @property {'G'|'PG'|'PG-13'|'R'|'R+'|'Rx'|null} [mpaa] - возрастной рейтинг
 * @property {number} voices - сколько всего озвучек у тайтла
 * @property {string|null} updated - ISO
 * @property {string|null} progress - ISO, когда студия последний раз продвинулась
 */

/**
 * Тайтлы студии постранично.
 *
 * @param {number|string} id
 * @param {{state?: string, branch?: number, genres?: string[], exclude?: string[], sort?: string, q?: string, limit?: number, offset?: number}} params
 *  state: ongoing | caught | behind | complete | inprogress | abandoned | exclusive | movies;
 *  branch: translation.id одной ветки студии;
 *  genres: есть все эти жанры; exclude: нет ни одного из них;
 *  sort: progress | updated | rating | age | year | voices | name
 * @param {AbortSignal} [signal]
 * @returns {Promise<{total: number, offset: number, limit: number, items: TStudioTitle[],
 *  branch?: {id: number, name: string, role: string}|null,
 *  genres?: {include: string[], exclude: string[]}}>} branch / genres — какие фильтры применены
 *  (нет поля — фильтр не применён)
 */
export function getStudioTitles(id, params = {}, signal) {
    const q = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value)) {
            if (value.length) q.set(key, value.join(','));
            continue;
        }
        q.set(key, String(value));
    }
    return get(`/studios/${encodeURIComponent(id)}/titles?${q}`, signal);
}

/**
 * Все жанры тайтлов студии с числами — для окна «Жанры и темы».
 * 404 — фильтр по жанрам недоступен.
 * @param {number|string} id
 * @param {AbortSignal} [signal]
 * @returns {Promise<{total: number, items: {name: string, count: number}[]}>}
 */
export function getStudioGenres(id, signal) {
    return get(`/studios/${encodeURIComponent(id)}/genres`, signal);
}
