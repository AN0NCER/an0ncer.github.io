/** Состояния заглушки: ровно одно из них видно за раз */
const STATES = ['idle', 'loading', 'nofound', 'error'];

/** Списку есть что показать — заглушки нет вовсе */
const NONE = 'none';

/**
 * Заглушка списка аниме.
 *
 * Все варианты текста лежат в разметке, а состояние переключается одним
 * атрибутом. Так их не надо прятать поодиночке: показать два сразу или
 * ни одного просто нечем.
 *
 * @param {HTMLElement} root - корень окна
 */
export function createEmpty(root) {
    const wrapper = root.querySelector('.anime-list-empty-wrapper');
    const query = wrapper?.querySelector('[data-for="nofound"] .query');

    let current = wrapper?.dataset.state ?? 'idle';

    return {
        get state() {
            return current;
        },

        /**
         * @param {'idle'|'loading'|'nofound'|'error'|null} state - `null`
         *  скрывает заглушку целиком: списку есть что показать
         * @param {string} [value] - запрос, для состояния `nofound`
         */
        set(state, value = '') {
            if (!wrapper) return;

            // Скрытие тоже состояние: класс-утилита не годится — правило
            // враппера длиннее и перебило бы её по весу
            const next = STATES.includes(state) ? state : NONE;

            current = next;
            wrapper.dataset.state = next;

            if (query) query.textContent = next === 'nofound' && value ? `«${value}»` : '';
        }
    };
}

export default createEmpty;
