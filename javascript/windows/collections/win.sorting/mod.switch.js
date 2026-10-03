import { animate, spring, utils } from "../../../library/anime.esm.min.js";

/**
 * Переключатель внутри группы сортировки.
 *
 * Анимация та же, что у переключателей в других окнах: подсветка едет
 * двумя краями с разной пружиной, за счёт чего пилюля растягивается в
 * движении.
 *
 * Отличие от остальных: выбора может не быть вовсе. Сортировка одна на
 * всё окно, поэтому при выборе в одной группе две другие гасятся —
 * подсветка там прячется.
 *
 * @param {HTMLElement} root - `.group-sorting-wrapper`
 * @param {{value?: string|null, onChange?: (value: string, item: HTMLElement) => void}} [opts]
 */
export function createSwitch(root, { value = null, onChange = () => { } } = {}) {
    const bg = root.querySelector('.bg-selector');
    const sel = root.querySelector('.bg-selector > .selector');
    const list = root.querySelector('.sorting-items');
    const items = [...list.querySelectorAll('.item')];

    /** Ключ группы: title, count, updated, groups */
    const key = root.dataset.sort ?? null;

    let pos = { left: 0, right: 0 };
    let committed = null;

    /** Идёт ли поездка подсветки — на это время пересчёт запрещён */
    let moving = 0;

    const active = () => list.querySelector('.item.-select');

    /** Куда должна встать подсветка для этого пункта */
    const targetFor = (item) => {
        const box = bg.getBoundingClientRect();
        const rect = item.getBoundingClientRect();

        return { left: rect.left - box.left, right: box.right - rect.right };
    };

    /**
     * Ширина, от которой считается растяжение.
     *
     * Держим её равной ширине подсветки в покое: тогда `scaleX` ровно 1,
     * и скругление с границей не искажены. Поехали — растягиваем от
     * этого значения, приехали — снова подгоняем под пункт.
     */
    let base = 0;

    /** Текущее положение краёв, из них собирается transform */
    const edges = { left: 0, right: 0 };

    const width = () => bg.getBoundingClientRect().width;

    /**
     * Собрать transform из положения краёв.
     *
     * Анимируем именно его, а не `left` / `right`: те пересчитываются
     * раскладкой на каждом кадре, и поверх `backdrop-filter` это
     * заметно подлагивает на телефоне
     */
    const paint = () => {
        const size = Math.max(width() - edges.left - edges.right, 0);
        const scale = base > 0 ? size / base : 1;

        sel.style.transform = `translateX(${edges.left}px) scaleX(${scale})`;
    };

    /** Поставить подсветку на место без поездки: scaleX ровно 1 */
    const place = (to) => {
        utils.remove(edges, 'left');
        utils.remove(edges, 'right');

        edges.left = to.left;
        edges.right = to.right;

        base = Math.max(width() - to.left - to.right, 0);

        sel.style.width = `${base}px`;
        sel.style.transform = `translateX(${to.left}px)`;
    };

    const edge = (prop, from, to, { duration, bounce, delay }) => {
        utils.remove(edges, prop);
        edges[prop] = from;

        moving++;

        animate(edges, {
            [prop]: to,
            ease: spring({ bounce, duration }),
            delay,
            onUpdate: paint,
            onComplete: () => {
                moving = Math.max(moving - 1, 0);

                // Обе пружины доиграли — возвращаем ширину пункту, чтобы
                // в покое ничего не было растянуто
                if (moving === 0) place(pos);
            }
        });
    };

    const move = (to, animated = true) => {
        const from = { ...edges };
        pos = to;

        if (!animated) return place(to);

        // Едем вправо — ведущий край правый, отстающий левый
        const right = to.left > from.left;
        const lead = right ? 'right' : 'left';
        const trail = right ? 'left' : 'right';

        edge(lead, from[lead], to[lead], { duration: 380, bounce: .30, delay: 0 });
        edge(trail, from[trail], to[trail], { duration: 520, bounce: .38, delay: 60 });
    };

    /**
     * Подсветку прячем, а не двигаем: в этой группе выбора сейчас нет.
     *
     * Видимостью управляет CSS по классу на группе — инлайновый стиль
     * перебил бы правила, в которых у автогрупп селектор виден всегда
     */
    const hide = () => {
        // Обрываем поездку: подсветка гаснет, и доигрывать её незачем
        utils.remove(edges, 'left');
        utils.remove(edges, 'right');
        moving = 0;

        root.classList.remove('-active');
        items.forEach(i => i.classList.remove('-select'));

        committed = null;
    };

    const show = () => {
        root.classList.add('-active');
    };

    /**
     * @param {string | null} target - значение пункта. `null` — снять выбор
     * @param {{animated?: boolean, silent?: boolean}} [opts] silent — не звать onChange
     */
    const select = (target, { animated = true, silent = false } = {}) => {
        if (target === null) return hide();

        const item = items.find(i => i.dataset.value === target);
        if (!item) return;

        // Была ли подсветка видна: если группу только что включили, ехать
        // ей неоткуда — она проявляется сразу на нужном месте. Смотрим на
        // класс группы, а не на выбранный пункт: `-select` мог остаться
        // с прошлого раза, пока подсветка была скрыта
        const visible = root.classList.contains('-active');

        // Тот же пункт уже подсвечен — выходим, не трогая анимацию. Иначе
        // повторный вызов (окно перерисовывает состояние сразу после
        // onChange) обрывал бы пружину и подсветка прыгала бы рывком
        if (visible && item.classList.contains('-select')) return;

        items.forEach(i => i.classList.toggle('-select', i === item));
        show();

        move(targetFor(item), animated && visible);

        if (silent || item.dataset.value === committed) return;

        committed = item.dataset.value;
        onChange(committed, item);
    };

    /**
     * Пересчитать позицию: ширина пунктов меняется с окном.
     *
     * Во время поездки не трогаем — иначе наблюдатель за размером
     * обрывал бы пружину и подсветка дёргалась бы на полпути
     */
    const reposition = () => {
        if (moving > 0) return;

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
    if (value === null) hide();
    else select(value, { animated: false, silent: true });

    return {
        key,
        select,
        reposition,

        get value() {
            return active()?.dataset.value ?? null;
        },

        destroy() {
            observer.disconnect();
            list.removeEventListener('click', onClick);
            utils.remove(edges, 'left');
            utils.remove(edges, 'right');
        }
    };
}

export default createSwitch;
