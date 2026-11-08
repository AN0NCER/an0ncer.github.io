/**
 * Форматирование и подписи для страниц озвучек (dubs.html, studio.html).
 */

const NUM = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

/** 3 735 · 96,7 */
export const num = (n) => (n == null ? '—' : NUM.format(n));

/** Тип студии полностью */
export const KIND_NAME = {
    fandub: 'Фандаб',
    official: 'Официальная',
    tv: 'ТВ',
    collab: 'Совместная',
    subs: 'Сабберы',
    generic: 'Без студии',
};

/**
 * Состояние озвучки тайтла: подпись, короткая форма, цвет полосы
 * и иконка (path svg 24×24, обводка).
 */
export const STATES = {
    complete: { label: 'Озвучено полностью', short: 'полностью', color: '#4FD18F', icon: 'M5 12.5l4.5 4.5L19 7.5' },
    caught: { label: 'Онгоинг: догнали Японию', short: 'догнали', color: '#2393F1', icon: 'M4 12h4l3-7 4 14 3-7h2' },
    behind: { label: 'Онгоинг: отстают', short: 'отстают', color: '#7BC0F7', icon: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    inprogress: { label: 'Не доозвучено', short: 'не доозвучено', color: '#FFD700', icon: 'M12 3a9 9 0 1 0 9 9M12 3v9h9' },
    abandoned: { label: 'Брошено', short: 'брошено', color: '#FF8A80', icon: 'M6 6l12 12M18 6L6 18' },
    unknown: { label: 'Нет данных', short: 'нет данных', color: '#5D636C', icon: 'M6 12h12' },
};

/** Порядок состояний в полосе и легенде */
export const STATE_ORDER = ['complete', 'caught', 'behind', 'inprogress', 'abandoned', 'unknown'];

/** Тип тайтла: tv → TV, movie → Фильм… */
export const TITLE_KIND = {
    tv: 'TV', movie: 'Фильм', ona: 'ONA', ova: 'OVA', special: 'Спешл',
    tv_special: 'TV-спешл', music: 'Клип', pv: 'Промо', cm: 'Реклама', unknown: '—',
};

/** Задержка в часах → «18 ч» или «2,1 дн» */
export function hours(h) {
    if (h == null) return '—';
    if (h < 24) return `${Math.max(1, Math.round(h))} ч`;
    return `${num(Math.round(h / 24 * 10) / 10)} дн`;
}

/**
 * plural(5, ['ветка', 'ветки', 'веток']) → 'веток'
 * @param {number} n
 * @param {[string, string, string]} forms
 */
export function plural(n, [one, few, many]) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b === 1) return one;
    if (b > 1 && b < 5) return few;
    return many;
}

/** «40 мин», «3 ч», «2 д», «3 нед», «5 мес», «2 г» — без «назад» */
export function ago(iso) {
    if (!iso) return null;

    const min = Math.max(0, (Date.now() - Date.parse(iso)) / 60000);
    if (!Number.isFinite(min)) return null;

    if (min < 60) return `${Math.max(1, Math.round(min))} мин`;
    const h = min / 60;
    if (h < 24) return `${Math.round(h)} ч`;
    const d = h / 24;
    if (d < 14) return `${Math.round(d)} д`;
    if (d < 60) return `${Math.round(d / 7)} нед`;
    if (d < 365) return `${Math.round(d / 30)} мес`;
    return `${Math.round(d / 365)} г`;
}

/** Логотипов у студий нет — аватар из двух букв названия */
export function initials(name) {
    const clean = name.replace(/\(.*?\)/g, '').trim() || name;
    const words = clean.split(/[\s&,.]+/).filter(Boolean);
    if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();

    const caps = clean.match(/[A-ZА-ЯЁ0-9]/g) || [];
    if (caps.length >= 2) return caps[0] + caps[1];
    return clean.slice(0, 2).toUpperCase();
}

/** Оттенок аватара: у одной студии всегда один и тот же цвет */
export function hue(name) {
    let h = 2166136261;
    for (let i = 0; i < name.length; i++) {
        h ^= name.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 360;
}
