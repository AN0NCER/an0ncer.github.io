import { isFav } from "/javascript/modules/dubs/dubs.favorites.js";
import { KIND_NAME } from "/javascript/modules/dubs/dubs.format.js";

/**
 * Чипы над списком. Ключи совпадают с `kind` из API, кроме двух своих:
 * `all` — всё подряд, `fav` — избранное на этом устройстве
 */
export const KINDS = [
    ['all', 'Все'],
    ['fav', 'Избранное'],
    ['fandub', 'Фандаб'],
    ['official', 'Официальные'],
    ['tv', 'ТВ'],
    ['collab', 'Совместные'],
    ['subs', 'Сабберы'],
    ['generic', 'Без студии'],
];

/** Подпись типа в строке студии (фандаб — по умолчанию, не подписываем) */
export const KIND_LABEL = Object.fromEntries(Object.entries(KIND_NAME).filter(([key]) => key !== 'fandub'));

/** Тип полностью — подпись под названием в карточке на ПК (общий, из dubs.format.js) */
export { KIND_NAME };

/** Сортировки каталога (ключи — как у API) */
/**
 * label — на кнопке и в списке, hint — пояснение под ним,
 * icon — path для svg 24×24 (обводка), рисуется в win.sort.js
 */
export const SORTS = {
    titles: {
        label: 'Тайтлы', hint: 'Больше всего озвученных тайтлов',
        icon: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
        cmp: (a, b) => b.titles - a.titles,
    },
    episodes: {
        label: 'Серии', hint: 'Больше всего озвученных серий',
        icon: 'M8 5l11 7-11 7z',
        cmp: (a, b) => b.episodes - a.episodes,
    },
    ongoing: {
        label: 'Онгоинги', hint: 'Больше всего онгоингов сейчас',
        icon: 'M3 12h4l3-7 4 14 3-7h4',
        cmp: (a, b) => b.ongoing - a.ongoing || b.titles - a.titles,
    },
    exclusives: {
        label: 'Эксклюзивы', hint: 'Аниме, которые озвучила только эта студия',
        icon: 'M7 4h10l4 5-9 11L3 9zM3 9h18',
        cmp: (a, b) => b.exclusives - a.exclusives || b.titles - a.titles,
    },
    active30: {
        label: 'Активность', hint: 'Тайтлы с новыми сериями за 30 дней',
        icon: 'M4 20V11M10 20V5M16 20v-6M21 20H3',
        cmp: (a, b) => b.active30 - a.active30 || b.titles - a.titles,
    },
    lastUpdate: {
        label: 'Обновление', hint: 'Недавно выпускали серии',
        icon: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
        cmp: (a, b) => (b.lastUpdate || '').localeCompare(a.lastUpdate || ''),
    },
    name: {
        label: 'Название', hint: 'По алфавиту, А–Я',
        icon: 'M4 18l4-12 4 12M5.5 14h5M14 6h6l-6 12h6',
        cmp: (a, b) => a.name.localeCompare(b.name, 'ru'),
    },
};

/**
 * Что сейчас выбрано. Тип и сортировка живут в адресе (?kind=&sort=),
 * чтобы ссылкой можно было поделиться и «назад» возвращал туда же.
 */
export const state = (() => {
    const p = new URLSearchParams(location.search);
    const kind = p.get('kind');
    const sort = p.get('sort');

    return {
        kind: KINDS.some(([k]) => k === kind) ? kind : 'all',
        sort: sort in SORTS ? sort : 'titles',
        q: '',
    };
})();

/** Переписать ?kind=&sort= без новой записи в истории */
export function syncUrl() {
    const url = new URL(location.href);
    const set = (key, value, def) => (value === def ? url.searchParams.delete(key) : url.searchParams.set(key, value));

    set('kind', state.kind, 'all');
    set('sort', state.sort, 'titles');

    history.replaceState(history.state, '', url);
}

/**
 * Отфильтровать и отсортировать.
 * @param {import('/javascript/modules/dubs/api.dubs.js').TStudio[]} all
 */
export function apply(all) {
    const q = state.q.trim().toLowerCase();

    return all
        .filter(s => state.kind === 'all' || (state.kind === 'fav' ? isFav(s.id) : s.kind === state.kind))
        .filter(s => !q || s.name.toLowerCase().includes(q) || s.members?.some(m => m.name.toLowerCase().includes(q)))
        .sort(SORTS[state.sort].cmp);
}

/** Сколько студий каждого типа — числа на чипах */
export function countKinds(all) {
    const out = { all: all.length, fav: 0 };
    for (const s of all) {
        out[s.kind] = (out[s.kind] || 0) + 1;
        if (isFav(s.id)) out.fav++;
    }
    return out;
}
