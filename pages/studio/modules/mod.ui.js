import { num, STATES } from "/javascript/modules/dubs/dubs.format.js";

/** Экранирование для вставки в разметку */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** svg-иконка по path (обводка, 24×24) */
export const svgPath = (d, cls = 'icon stroke') =>
    `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"></path></svg>`;

/**
 * Ссылка на страницу аниме в Tunime. Без id Shikimori некуда вести:
 * у тайтлов не с Shikimori ключ не числовой — для них ссылки нет.
 */
export const animeUrl = (shiki) => (/^\d+$/.test(String(shiki ?? '')) ? `/watch.html?id=${shiki}` : null);

/**
 * Цензура из настроек сайта (Настройки → Основные → «Цензура»), по умолчанию включена.
 * $PARAMETERS задаёт /javascript/parametrs.js (подключён в studio.html до модулей).
 */
export const CENSORED = typeof $PARAMETERS === 'undefined' ? true : $PARAMETERS.censored !== false;

/**
 * Прятать ли тайтл: включена цензура, а тайтл 18+.
 * `adult` — рейтинг Rx или жанры «Хентай»/«Эротика».
 * Ветку студии «18+» признаком не считаем: это нецензурированные версии
 * обычных сериалов (у AniLibria — «Киберпанк: Бегущие по краю»).
 * @param {{adult?: boolean}} t
 */
export const isHidden18 = (t) => CENSORED && t.adult === true;

/** Что показывать вместо названия скрытого тайтла */
export const HIDDEN_NAME = 'Скрыто · 18+';

/** Ссылка на студию */
export const studioUrl = (id) => `/studio.html?id=${encodeURIComponent(id)}`;

/**
 * Значок состояния: иконка + короткая подпись цветом состояния.
 * @param {string} key - ключ из STATES
 * @param {boolean} [pill] - на подложке
 */
export function stateBadge(key, pill = false) {
    const st = STATES[key] || STATES.unknown;
    return `<span class="st${pill ? ' -pill' : ''}" style="--st:${st.color}">${svgPath(st.icon, 'icon')}${esc(st.short)}</span>`;
}

/**
 * Полоска прогресса: светлая часть — сколько вышло, цветная — сколько озвучено.
 * @param {import('/javascript/modules/dubs/api.dubs.js').TStudioTitle} t
 */
export function progressBar(t) {
    const ep = t.ep || 0;
    const aired = t.aired ?? ep;
    const total = t.total || Math.max(aired, ep) * 1.02 || 1;
    const air = Math.min(100, aired / total * 100);
    const dub = Math.min(100, ep / total * 100);
    const color = (STATES[t.state] || STATES.unknown).color;
    const label = `Озвучено ${ep} из ${aired} вышедших${t.total ? `, всего ${t.total}` : ''}`;

    return `<span class="pbar" role="img" aria-label="${esc(label)}"><span class="air" style="width:${air.toFixed(1)}%"></span><span class="dub" style="width:${dub.toFixed(1)}%;background:${color}"></span></span>`;
}

/**
 * Числа прогресса рядом со значком состояния (само состояние — в значке):
 * «5/12» — серия из всего, «4 из 5» — озвучено из вышедших.
 */
export function progressText(t) {
    if (t.state === 'unknown') return '—';
    if (t.state === 'caught') return `${num(t.ep)}/${t.total ? num(t.total) : '?'}`;
    if (t.state === 'complete') return `${num(t.ep)}/${num(t.total || t.ep)}`;
    return `${num(t.ep)} из ${num(t.aired ?? t.total ?? '?')}`;
}

/** Метка «≈ оценка» для приблизительных цифр */
export const estimate = (tip = 'Оценка: данных пока мало, значение уточнится') =>
    `<span class="est" title="${esc(tip)}" tabindex="0">≈ оценка</span>`;
