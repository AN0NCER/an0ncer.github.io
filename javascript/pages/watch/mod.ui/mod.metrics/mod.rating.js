/**
 * Оценка Shikimori и число голосов.
 *
 * «Rating», а не «score»: watch/mod.score.js — это окно оценки (UIScore)
 */

const plural = (n, one, few, many) => {
    const a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
};

/** Голоса — сумма scoresStats по всем оценкам */
export const ratingVotes = (anime) => (anime?.scoresStats ?? []).reduce((sum, x) => sum + (x.count ?? 0), 0);

/** «159 оценок», «1,5 тыс. оценок», «147 тыс. оценок» */
export function votesText(n) {
    if (n >= 1000) {
        const value = (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace('.', ',').replace(/,0$/, '');
        return `${value} тыс. оценок`;
    }

    return `${n} ${plural(n, 'оценка', 'оценки', 'оценок')}`;
}

/**
 * @param {HTMLElement} root - .year-score-wrapper
 * @param {Object} anime
 */
export function renderRating(root, anime) {
    const metric = root?.querySelector('.score-metric');
    if (!metric) return;

    const score = Number(anime?.score) || 0;

    // У анонсов Shikimori отдаёт 0 — это «оценок ещё нет», а не ноль
    metric.toggleAttribute('data-empty', score === 0);
    metric.querySelector('.value').textContent = score > 0 ? score.toFixed(2) : '—';
    metric.querySelector('.metric-sub').textContent = score > 0 ? votesText(ratingVotes(anime)) : 'нет оценок';
}
