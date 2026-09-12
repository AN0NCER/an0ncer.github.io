/**
 * Выбор коллекций в окне.
 *
 * Хранит три множества, потому что важно не «что отмечено», а «что нужно
 * изменить»: аниме уже лежит в части коллекций, и по кнопке «Применить»
 * надо отправить только разницу.
 *
 *   initial — где аниме было на момент отрисовки
 *   added   — куда пользователь его добавил
 *   removed — откуда убрал
 *
 * @param {number} anime
 */
export function createSelection(anime) {
    /** @type {Set<string>} */
    const initial = new Set();
    /** @type {Set<string>} */
    const added = new Set();
    /** @type {Set<string>} */
    const removed = new Set();

    /** Отмечена ли коллекция сейчас */
    const has = (cid) => initial.has(cid) ? !removed.has(cid) : added.has(cid);

    return {
        has,

        /**
         * Исходное состояние — вызывается при отрисовке для каждой строки.
         * Список мог измениться (синхронизация, правка с другого
         * устройства), поэтому исходное состояние каждый раз пересобирается
         * заново, а не накапливается.
         * @param {string} cid
         * @param {boolean} inside
         */
        initial(cid, inside) {
            if (inside) initial.add(cid);
            else initial.delete(cid);
        },

        /** Сбросить исходное состояние перед новой отрисовкой */
        reset() {
            initial.clear();
        },

        /**
         * Переключить отметку
         * @param {string} cid
         * @returns {boolean} новое состояние
         */
        toggle(cid) {
            const next = !has(cid);

            if (initial.has(cid)) {
                if (next) removed.delete(cid);
                else removed.add(cid);
            } else {
                if (next) added.add(cid);
                else added.delete(cid);
            }

            return next;
        },

        /**
         * Отметить коллекцию, не переключая. Нужно созданию: коллекцию
         * завели ради текущего аниме, отмечать её вручную незачем
         * @param {string} cid
         */
        add(cid) {
            removed.delete(cid);
            if (!initial.has(cid)) added.add(cid);
        },

        /** Проставить отметки на существующие строки списка */
        repaint(root) {
            root.querySelectorAll('.item[data-cid]').forEach((item) => {
                item.classList.toggle('is-selected', has(item.dataset.cid));
            });
        },

        /** Что реально нужно отправить на сервер */
        changes() {
            return {
                added: [...added].filter(cid => !initial.has(cid)),
                removed: [...removed].filter(cid => initial.has(cid))
            };
        },

        /** Есть ли что применять */
        get dirty() {
            const { added: a, removed: r } = this.changes();
            return a.length > 0 || r.length > 0;
        },

        get anime() {
            return anime;
        }
    };
}

export default createSelection;
