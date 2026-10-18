/**
 * Ваша оценка. Данные — из URate (score, 0 = не поставлена)
 */

/**
 * @param {HTMLElement} root - .year-score-wrapper
 * @param {{ score?: number } | null} rate - URate.uRate
 */
export function renderMine(root, rate) {
    const metric = root?.querySelector('.my-score-metric');
    if (!metric) return;

    const score = Number(rate?.score) || 0;

    // data-state="empty" — «☆ Оценить», без атрибута — число и звезда
    if (score > 0) delete metric.dataset.state;
    else metric.dataset.state = 'empty';

    metric.querySelector('.value').textContent = score > 0 ? score : '';
}
