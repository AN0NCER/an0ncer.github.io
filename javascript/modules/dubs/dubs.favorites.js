/**
 * Избранные студии — это избранные озвучки плеера (`save-translations`, translation.id).
 *
 * Студия в избранном, если там есть любая её ветка. id студии из API — translation.id
 * её основной ветки: его и добавляем, убираем — все ветки студии.
 */

const KEY = 'save-translations';
/** Прежний отдельный список избранных студий — переносится в KEY один раз */
const OLD_KEY = 'tun-dubs-favorites';

/** @param {string} key */
const readList = (key) => {
    try {
        const raw = JSON.parse(localStorage.getItem(key));
        return Array.isArray(raw) ? raw.filter(Number.isInteger) : [];
    } catch {
        return [];
    }
};

const ids = new Set(readList(KEY));

const save = () => {
    try {
        localStorage.setItem(KEY, JSON.stringify([...ids]));
    } catch (err) {
        console.warn('[dubs] избранное не сохранилось', err);
    }
};

(() => {
    const old = readList(OLD_KEY);
    if (!old.length) return;
    old.forEach((id) => ids.add(id));
    save();
    try { localStorage.removeItem(OLD_KEY); } catch { }
})();

// Избранное могли поменять в плеере в другой вкладке
window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    ids.clear();
    readList(KEY).forEach((id) => ids.add(id));
});

/**
 * @typedef {number | {id: number, members?: {id: number}[]}} TFavStudio
 *  студия из API (с ветками) или просто её id
 */

/** @param {TFavStudio} s */
const studioIds = (s) => (typeof s === 'object' && s
    ? [s.id, ...(s.members || []).map((m) => m.id)]
    : [s]);

/** @param {TFavStudio} s */
export const isFav = (s) => studioIds(s).some((id) => ids.has(id));

/** Все избранные translation.id — API озвучек сам находит по ним студии */
export const favIds = () => [...ids];

/**
 * Добавить или убрать.
 * @param {TFavStudio} s
 * @returns {boolean} в избранном ли теперь
 */
export function toggleFav(s) {
    const all = studioIds(s);
    if (all.some((id) => ids.has(id))) all.forEach((id) => ids.delete(id));
    else ids.add(all[0]);

    save();
    return isFav(s);
}
