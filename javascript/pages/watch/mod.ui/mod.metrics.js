import { renderAiring } from "./mod.metrics/mod.airing.js";
import { renderMine } from "./mod.metrics/mod.mine.js";
import { renderRating } from "./mod.metrics/mod.rating.js";
import { renderSeason } from "./mod.metrics/mod.season.js";

/**
 * Блок под названием: оценка Shikimori, сезон с годом и статусом выхода,
 * ваша оценка. Каждую часть рисует свой подмодуль.
 */

const ROOT = '.year-score-wrapper';

const root = () => document.querySelector(ROOT);

/**
 * Данные аниме. Нужны поля запроса: score, scoresStats { count }, season,
 * status, nextEpisodeAt, kind, duration, airedOn { year month day }
 *
 * @param {Object} anime - аниме из GraphQL Shikimori
 */
export function SetMetrics(anime) {
    const el = root();
    if (!el || !anime) return;

    renderRating(el, anime);
    renderSeason(el, anime);
    renderAiring(el.querySelector('.status-sub'), anime);
}

/**
 * Ваша оценка — отдельно: она меняется без перезагрузки аниме
 * @param {{ score?: number } | null} rate - URate.uRate
 */
export function SetMyScore(rate) {
    renderMine(root(), rate);
}
