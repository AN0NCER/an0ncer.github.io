/**
 * Выбранная сортировка.
 *
 * Живёт в `localStorage`, а не на сервере: это настройка устройства, а не
 * аккаунта — на телефоне человек может хотеть один порядок, на компьютере
 * другой.
 */

const KEY = 'tun-collections-sorting';

/** По умолчанию — свежие сверху: чаще всего заходят «куда я добавлял» */
export const DEFAULT = Object.freeze({ key: 'updated', dir: 'desc', groups: true });

const KEYS = ['title', 'count', 'updated'];
const DIRS = ['asc', 'desc'];

/** Отбрасываем мусор из хранилища: формат мог измениться между версиями */
const valid = (value) => Boolean(value)
    && KEYS.includes(value.key)
    && DIRS.includes(value.dir);

export const read = () => {
    try {
        const raw = JSON.parse(localStorage.getItem(KEY));

        if (!valid(raw)) return { ...DEFAULT };

        return { key: raw.key, dir: raw.dir, groups: raw.groups !== false };
    } catch {
        return { ...DEFAULT };
    }
};

/**
 * Отличается ли от умолчания. По этому шапка помечает кнопку: иначе
 * человек не поймёт, почему список в таком порядке
 *
 * @param {{key: string, dir: string, groups: boolean}} value
 */
export const custom = (value) => Boolean(value)
    && (value.key !== DEFAULT.key
        || value.dir !== DEFAULT.dir
        || value.groups !== DEFAULT.groups);

/** @param {{key: string, dir: string, groups: boolean}} value */
export const write = (value) => {
    try {
        localStorage.setItem(KEY, JSON.stringify(value));
    } catch {
        // Приватный режим или переполнение: порядок просто не запомнится
    }
};

export const reset = () => {
    try {
        localStorage.removeItem(KEY);
    } catch { }

    return { ...DEFAULT };
};

/**
 * Отсортировать коллекции.
 *
 * Особые коллекции всегда сверху: избранное и «Рекомендую» не
 * соревнуются с пользовательскими, и уехавшее в середину списка
 * избранное искали бы глазами каждый раз.
 *
 * @param {Array<Object>} list
 * @param {{key: string, dir: string}} sort
 */
export const apply = (list = [], { key = DEFAULT.key, dir = DEFAULT.dir } = {}) => {
    const sign = dir === 'asc' ? 1 : -1;

    const size = (x) => x.count
        ?? (Array.isArray(x.list) ? x.list.length : Object.keys(x.items ?? {}).length);

    const compare = {
        title: (a, b) => String(a.title ?? '').localeCompare(String(b.title ?? ''), 'ru'),
        count: (a, b) => size(a) - size(b),
        updated: (a, b) => String(a.updatedAt ?? '').localeCompare(String(b.updatedAt ?? ''))
    }[key] ?? (() => 0);

    // Вторым ключом всегда название: у коллекций легко совпадают и размер,
    // и дата, а произвольный порядок менялся бы между заходами
    const tie = (a, b) => String(a.title ?? '').localeCompare(String(b.title ?? ''), 'ru');

    const special = (x) => x.kind === 'custom' ? 1 : 0;

    return [...list].sort((a, b) =>
        special(a) - special(b)
        || compare(a, b) * sign
        || tie(a, b)
    );
};
