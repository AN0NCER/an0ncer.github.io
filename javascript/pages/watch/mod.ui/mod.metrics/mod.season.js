/**
 * Сезон и год. Цвет и значок задаёт CSS по data-season на корне блока.
 */

const SEASONS = {
    winter: 'Зима',
    spring: 'Весна',
    summer: 'Лето',
    fall: 'Осень'
};

/**
 * Сезон Shikimori: «fall_2026». У анонсов бывает «?» или null
 * @param {string | null} season
 * @returns {{ key: string, name: string, year: number | null } | null}
 */
export function parseSeason(season) {
    const [key, year] = String(season ?? '').split('_');
    if (!SEASONS[key]) return null;

    return { key, name: SEASONS[key], year: Number(year) || null };
}

/**
 * Год для метрики: из сезона, иначе из даты выхода. Нет ни того,
 * ни другого — анонс без даты, показываем «Скоро»
 */
export const seasonYear = (anime) => parseSeason(anime?.season)?.year ?? anime?.airedOn?.year ?? null;

/**
 * @param {HTMLElement} root - .year-score-wrapper
 * @param {Object} anime
 */
export function renderSeason(root, anime) {
    if (!root) return;

    const season = parseSeason(anime?.season);
    const year = seasonYear(anime);

    // Без атрибута CSS прячет значок и слово — остаётся только год
    if (season) root.dataset.season = season.key;
    else delete root.dataset.season;

    console.log(root, anime);

    root.querySelector('.year-metric .season').textContent = season?.name ?? '';
    root.querySelector('.year-metric .value').textContent = year ?? 'Скоро';
}
