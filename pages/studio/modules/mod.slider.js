import { animate, spring, utils } from "/javascript/library/anime.esm.min.js";

/**
 * Подсветка-«пилюля», которая едет к выбранному пункту — как у переключателя
 * «Все / Публичные / Приватные» на странице коллекций
 * (javascript/pages/collections/mod.filter.js → createFilter): два края едут
 * с разной пружиной — ведущий трогается сразу и жёстче, отстающий позже и мягче,
 * поэтому пилюля растягивается в движении, а не переносится целиком.
 *
 * Здесь пункты могут меняться (разделы студии), поэтому список берётся заново
 * при каждом выборе, а onChange нет — выбор приходит снаружи (прокрутка, клик).
 *
 * Разметка: root > .bg-selector > .selector и root > {list} > [data-key]
 *
 * @param {HTMLElement} root
 * @param {string} list - селектор контейнера пунктов внутри root
 */
export function createSlider(root, list) {
    const bg = root.querySelector('.bg-selector');
    const sel = root.querySelector('.bg-selector > .selector');
    const $list = root.querySelector(list);

    let pos = null;
    let current = null;

    const items = () => [...$list.querySelectorAll('[data-key]')];

    /**
     * Куда должна встать подсветка для этого пункта — в координатах раскладки
     * (offsetLeft / offsetWidth), а не экрана: панель может быть уменьшена
     * transform: scale(), и тогда экранные размеры не совпали бы с left / right
     */
    const targetFor = (item) => {
        let x = 0;
        for (let el = item; el && el !== root; el = el.offsetParent) x += el.offsetLeft;
        return { left: x, right: bg.offsetWidth - x - item.offsetWidth };
    };

    const edge = (prop, from, to, { duration, bounce, delay }) => {
        utils.remove(sel, prop);
        sel.style[prop] = `${from}px`;
        animate(sel, {
            [prop]: [`${from}px`, `${to}px`],
            ease: spring({ bounce, duration }),
            delay,
        });
    };

    const move = (to, animated) => {
        const from = pos;
        pos = to;

        if (!animated || !from) {
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

    /**
     * Выбрать пункт.
     * @param {string|null} key - data-key пункта
     * @param {{animated?: boolean}} [opts]
     */
    const select = (key, { animated = true } = {}) => {
        const item = items().find((i) => i.dataset.key === key) || items()[0];
        if (!item) return;

        items().forEach((i) => {
            const on = i === item;
            i.classList.toggle('-select', on);
            i.setAttribute('aria-current', on ? 'true' : 'false');
        });

        const to = targetFor(item);
        // Окно ещё скрыто — размеров нет, ставить подсветку некуда
        if (!bg.offsetWidth) return;
        if (item.dataset.key === current && pos && pos.left === to.left && pos.right === to.right) return;

        current = item.dataset.key;
        move(to, animated);
    };

    /** Пункты перерисовали или размеры поменялись — встать на место без анимации */
    const reposition = () => {
        pos = null;
        select(current, { animated: false });
    };

    new ResizeObserver(reposition).observe(root);

    return {
        select,
        reposition,
        get value() {
            return current;
        },
    };
}
