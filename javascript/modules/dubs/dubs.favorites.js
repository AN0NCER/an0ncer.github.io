/**
 * Избранные студии.
 *
 * Живут в `localStorage`: это закладки устройства, аккаунт для них не нужен.
 * Храним id студии из API — это translation.id её основной ветки, он не меняется.
 */

const KEY = 'tun-dubs-favorites';

const read = () => {
    try {
        const raw = JSON.parse(localStorage.getItem(KEY));
        return Array.isArray(raw) ? raw.filter(Number.isInteger) : [];
    } catch {
        return [];
    }
};

const ids = new Set(read());

const save = () => {
    try {
        localStorage.setItem(KEY, JSON.stringify([...ids]));
    } catch (err) {
        console.warn('[dubs] избранное не сохранилось', err);
    }
};

/** @param {number} id */
export const isFav = (id) => ids.has(id);

export const favCount = () => ids.size;

/**
 * Добавить или убрать.
 * @param {number} id
 * @returns {boolean} в избранном ли теперь
 */
export function toggleFav(id) {
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);

    save();
    return ids.has(id);
}
