import tmpl from "../../../library/tmpl.lib.js";
import Collections from "../../../modules/tun.collections.js";

/**
 * Отрисовка списка коллекций в окне.
 *
 * @param {HTMLElement} dom - контейнер `.collections-list`
 * @param {ReturnType<import("./mod.selection.js").createSelection>} selection
 * @param {ReturnType<import("./mod.swipe.js").createSwipe>} swipe
 */
export function createList(dom, selection, swipe) {
    /** Текущие условия отбора */
    const filter = { type: 'all', query: '' };

    /**
     * Отбор по типу и названию.
     *
     * Особые коллекции (избранное, «Рекомендую») от фильтра по приватности
     * не прячем: у них нет осмысленной публичности, а спрятать их значило бы
     * лишить пользователя главного списка.
     */
    const match = (collection) => {
        const special = collection.kind !== 'custom';

        if (filter.type !== 'all' && !special && collection.visibility !== filter.type) return false;
        if (filter.query && !String(collection.title).toLowerCase().includes(filter.query)) return false;

        return true;
    };

    /** @param {Array<Object>} [list] */
    const render = (list = Collections.list.filter(match)) => {
        const template = tmpl('#collection-inline-item');

        // Снимаем свайпы со старых строк: иначе draggable останутся
        // висеть на узлах, которых уже нет в документе
        swipe.unbindAll(dom);

        selection.reset();
        dom.innerHTML = '';

        for (const collection of list) {
            const clone = template.clone().el;
            const icon = collection.kind === 'shikimori' ? 'i-shikimori' : 'i-box-archive';

            clone.setAttribute('data-cid', collection.cid);
            clone.setAttribute('data-kind', collection.kind);
            clone.setAttribute('data-visibility', collection.visibility);

            clone.querySelector('.cl-name svg use').setAttribute('href', `#${icon}`);
            clone.querySelector('.cl-name span').textContent = collection.title;
            clone.querySelector('.cl-info .count').textContent = collection.count ?? 0;

            selection.initial(collection.cid, Collections.has(selection.anime, collection.cid));

            dom.append(clone);
        }

        selection.repaint(dom);
        swipe.bindAll(dom);
    };

    /**
     * Точечное обновление счётчика — на событие `change` перерисовывать
     * весь список незачем
     * @param {Object} collection
     */
    const count = (collection) => {
        const el = dom.querySelector(`.item[data-cid="${collection.cid}"] .cl-info > .count`);
        if (el) el.textContent = collection.count ?? 0;
    };

    /**
     * Сменить условия отбора и перерисовать
     * @param {{type?: string, query?: string}} next
     */
    const setFilter = (next = {}) => {
        if (next.type !== undefined) filter.type = next.type;
        if (next.query !== undefined) filter.query = String(next.query).toLowerCase();

        render();
    };

    return { render, count, setFilter };
}

export default createList;
