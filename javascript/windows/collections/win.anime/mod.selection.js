/**
 * Выбор аниме в окне списка.
 *
 * В отличие от выбора коллекций здесь наружу нужен весь набор: окно
 * отдаёт итоговый список, которым коллекция и будет наполнена. Разницу
 * (`added` / `removed`) считаем заодно — вызывающему коду она нужна,
 * чтобы отправить на сервер только изменения, а не весь список заново.
 *
 * @param {number[]} [initial] - что уже выбрано на момент открытия
 */
export function createSelection(initial = []) {
    const start = new Set(initial.map(Number).filter(Number.isFinite));
    const current = new Set(start);

    return {
        /** @param {number} aid */
        has(aid) {
            return current.has(Number(aid));
        },

        /**
         * Переключить выбор
         * @param {number} aid
         * @returns {boolean} новое состояние
         */
        toggle(aid) {
            const id = Number(aid);
            if (!Number.isFinite(id)) return false;

            if (current.has(id)) current.delete(id);
            else current.add(id);

            return current.has(id);
        },

        /**
         * Проставить состояние явно
         * @param {number} aid
         * @param {boolean} state
         */
        set(aid, state) {
            const id = Number(aid);
            if (!Number.isFinite(id)) return;

            if (state) current.add(id);
            else current.delete(id);
        },

        /** Снять весь выбор */
        clear() {
            current.clear();
        },

        /** Проставить отметки на отрисованные карточки */
        repaint(root) {
            root.querySelectorAll('.card-anime-h[data-id]').forEach((card) => {
                card.classList.toggle('is-selected', current.has(Number(card.dataset.id)));
            });
        },

        /** Итоговый список */
        get list() {
            return [...current];
        },

        /** Сколько выбрано — для счётчика в шапке и подписи кнопки */
        get size() {
            return current.size;
        },

        /** Что изменилось относительно исходного набора */
        get changes() {
            return {
                added: [...current].filter(id => !start.has(id)),
                removed: [...start].filter(id => !current.has(id))
            };
        },

        /** Отличается ли выбор от исходного */
        get dirty() {
            const { added, removed } = this.changes;
            return added.length > 0 || removed.length > 0;
        }
    };
}

export default createSelection;
