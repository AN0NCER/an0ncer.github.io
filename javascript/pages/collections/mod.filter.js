import { animate, spring, utils } from "../../library/anime.esm.min.js";

/**
 * Фильтр коллекций по приватности: «Все / Публичные / Приватные».
 *
 * Анимация та же, что у переключателей в окнах: подсветка едет двумя
 * краями с разной пружиной — ведущий край трогается сразу и жёстче,
 * отстающий выходит позже и мягче. За счёт этого пилюля растягивается в
 * движении, а не переносится целиком.
 *
 * Мобильной логики окна выбора здесь нет намеренно: ни прокрутки, ни
 * слежения за пальцем — только нажатия. Пунктов три, они всегда влезают.
 *
 * @param {HTMLElement} root - `.collection-filter`
 * @param {{value?: string, onChange?: (value: string, item: HTMLElement) => void}} [opts]
 */
export function createFilter(root, { value = null, onChange = () => { } } = {}) {
    const bg = root.querySelector('.bg-selector');
    const sel = root.querySelector('.bg-selector > .selector');
    const list = root.querySelector('.type-filter-items');
    const items = [...list.querySelectorAll('.item')];

    let pos = { left: 0, right: 0 };
    let committed = null;

    const active = () => list.querySelector('.item.-select');

    /** Куда должна встать подсветка для этого пункта */
    const targetFor = (item) => {
        const box = bg.getBoundingClientRect();
        const rect = item.getBoundingClientRect();

        return { left: rect.left - box.left, right: box.right - rect.right };
    };

    const edge = (prop, from, to, { duration, bounce, delay }) => {
        utils.remove(sel, prop);
        sel.style[prop] = `${from}px`;

        animate(sel, {
            [prop]: [`${from}px`, `${to}px`],
            ease: spring({ bounce, duration }),
            delay
        });
    };

    const move = (to, animated = true) => {
        const from = pos;
        pos = to;

        if (!animated) {
            utils.remove(sel, 'left');
            utils.remove(sel, 'right');
            sel.style.left = `${to.left}px`;
            sel.style.right = `${to.right}px`;
            return;
        }

        // Едем вправо — ведущий край правый, отстающий левый
        const right = to.left > from.left;
        const lead = right ? 'right' : 'left';
        const trail = right ? 'left' : 'right';

        edge(lead, from[lead], to[lead], { duration: 380, bounce: .30, delay: 0 });
        edge(trail, from[trail], to[trail], { duration: 520, bounce: .38, delay: 60 });
    };

    const highlight = (item) => {
        if (item === active()) return;
        items.forEach(i => i.classList.toggle('-select', i === item));
    };

    /**
     * @param {string | number} target - значение или индекс
     * @param {{animated?: boolean, silent?: boolean}} [opts] silent — не звать onChange
     */
    const select = (target, { animated = true, silent = false } = {}) => {
        const item = typeof target === 'number'
            ? items[target]
            : items.find(i => i.dataset.value === target);

        if (!item) return;

        highlight(item);
        move(targetFor(item), animated);

        if (silent || item.dataset.value === committed) return;

        committed = item.dataset.value;
        onChange(committed, item);
    };

    /** Пересчитать позицию: ширина пунктов меняется с окном */
    const reposition = () => {
        const item = active();
        if (item) move(targetFor(item), false);
    };

    const onClick = (e) => {
        const item = e.target.closest('.item[data-value]');
        if (item) select(item.dataset.value);
    };

    list.addEventListener('click', onClick);

    const observer = new ResizeObserver(reposition);
    observer.observe(root);

    // Стартовое положение — без анимации и без onChange: это не выбор
    // пользователя, а начальное состояние
    select(value ?? active()?.dataset.value ?? 0, { animated: false, silent: true });
    committed = active()?.dataset.value ?? null;

    return {
        select,
        reposition,

        get value() {
            return active()?.dataset.value ?? null;
        },

        destroy() {
            observer.disconnect();
            list.removeEventListener('click', onClick);
            utils.remove(sel, 'left');
            utils.remove(sel, 'right');
        }
    };
}

/**
 * Отбор по приватности.
 *
 * Особые коллекции идут по тем же правилам, что обычные: избранное на
 * Shikimori публично, и в «Приватных» ему не место. Здесь фильтр
 * отвечает на «покажи только такие», а не помогает выбрать — поэтому
 * исключений нет
 *
 * @param {Array<Object>} list
 * @param {'all' | 'public' | 'private'} [type]
 */
export const applyFilter = (list = [], type = 'all') => {
    if (type === 'all') return list;

    return list.filter(x => x.visibility === type);
};

export default createFilter;
