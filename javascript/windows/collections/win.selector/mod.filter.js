import { animate, spring, utils } from "../../../library/anime.esm.min.js";

/**
 * Фильтр коллекций по типу: «Все / Публичные / Приватные».
 *
 * На десктопе подсветка ездит под выбранным пунктом, на мобильном список
 * скроллится, а подсветка стоит по центру и меняет ширину под ближайший
 * пункт — отсюда возня с геометрией и слежением за скроллом.
 */

const MOBILE = '(max-width: 600px)';

export class TypeFilter {
    #wrap; #list; #bg; #sel; #items; #mq; #ro; #timer;
    #pos = { left: 0, right: 0 };
    #raf = 0;
    #following = false;
    #committed = null;

    constructor(root, opts = {}) {
        this.#wrap = root;
        this.#list = root.querySelector('.type-filter-items');
        this.#bg = root.querySelector('.bg-selector');
        this.#sel = root.querySelector('.bg-selector > .selector');
        this.#items = [...this.#list.querySelectorAll('.item')];
        this.#mq = matchMedia(MOBILE);
        this.onChange = opts.onChange ?? (() => { });

        this.#bind();
        this.#layout();
        this.select(this.#items.findIndex(i => i.classList.contains('-select')) || 0, { animated: false });
    }

    get value() { return this.#active?.dataset.value ?? null; }
    get #active() { return this.#list.querySelector('.item.-select'); }
    get #isMobile() { return this.#mq.matches; }

    // --- геометрия --------------------------------------------------------

    /** распорки для мобильного центрирования крайних пунктов */
    #layout() {
        if (!this.#isMobile) {
            this.#list.style.removeProperty('--tf-pad-start');
            this.#list.style.removeProperty('--tf-pad-end');
            return;
        }
        const w = this.#list.clientWidth;
        const first = this.#items[0].offsetWidth;
        const last = this.#items.at(-1).offsetWidth;
        this.#list.style.setProperty('--tf-pad-start', `${Math.max(0, (w - first) / 2)}px`);
        this.#list.style.setProperty('--tf-pad-end', `${Math.max(0, (w - last) / 2)}px`);
    }

    /** куда должна встать пилюля для данного пункта */
    #targetFor(item) {
        const bg = this.#bg.getBoundingClientRect();
        if (this.#isMobile) {
            // мобилка: пилюля всегда по центру, меняется только её ширина
            const half = (bg.width - item.offsetWidth) / 2;
            return { left: half, right: half };
        }
        const r = item.getBoundingClientRect();
        return { left: r.left - bg.left, right: bg.right - r.right };
    }

    // --- анимация ---------------------------------------------------------

    #move(to, animated = true) {
        const from = this.#pos;
        this.#pos = to;

        if (!animated) {
            utils.remove(this.#sel, 'left');
            utils.remove(this.#sel, 'right');
            this.#sel.style.left = `${to.left}px`;
            this.#sel.style.right = `${to.right}px`;
            return;
        }

        // едем вправо → ведущий край правый, отстающий левый
        const goingRight = to.left > from.left;
        const lead = goingRight ? 'right' : 'left';
        const trail = goingRight ? 'left' : 'right';

        this.#edge(lead, from[lead], to[lead], { duration: 380, bounce: .30, delay: 0 });
        this.#edge(trail, from[trail], to[trail], { duration: 520, bounce: .38, delay: 60 });
    }

    #edge(prop, from, to, { duration, bounce, delay }) {
        utils.remove(this.#sel, prop);
        this.#sel.style[prop] = `${from}px`;
        animate(this.#sel, {
            [prop]: [`${from}px`, `${to}px`],
            ease: spring({ bounce, duration }),
            delay,
        });
    }

    #highlight(item) {
        if (item === this.#active) return;
        this.#items.forEach(i => i.classList.toggle('-select', i === item));
    }

    #commit(item) {
        if (!item || item.dataset.value === this.#committed) return;
        this.#committed = item.dataset.value;
        this.onChange(this.#committed, item);
    }

    // --- выбор ------------------------------------------------------------

    select(index, { animated = true, scroll = true, silent = false } = {}) {
        const item = typeof index === 'number' ? this.#items[index]
            : this.#items.find(i => i.dataset.value === index);
        if (!item) return;

        this.#highlight(item);

        if (this.#isMobile) {
            if (scroll) item.scrollIntoView({ behavior: animated ? 'smooth' : 'auto', inline: 'center', block: 'nearest' });
            if (!animated) this.#move(this.#targetFor(item), false);
            // при smooth — позицию догонит #follow, коммит придёт из #settle
        } else {
            this.#move(this.#targetFor(item), animated);
        }

        if (!silent) this.#commit(item);
    }

    reposition() {
        this.#layout();
        const a = this.#active;
        if (!a) return;
        if (this.#isMobile) a.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
        this.#move(this.#targetFor(a), false);
    }

    // --- события ----------------------------------------------------------

    #centered() {
        const c = this.#list.getBoundingClientRect().left + this.#list.clientWidth / 2;
        const d = el => { const r = el.getBoundingClientRect(); return Math.abs(r.left + r.width / 2 - c); };
        return this.#items.reduce((a, b) => d(b) < d(a) ? b : a);
    }

    #follow = () => {
        this.#raf = 0;
        if (!this.#isMobile) return;

        const bgW = this.#bg.getBoundingClientRect().width;
        const c = this.#list.getBoundingClientRect().left + this.#list.clientWidth / 2;
        const centers = this.#items.map(i => {
            const r = i.getBoundingClientRect();
            return r.left + r.width / 2;
        });

        // ближайший пункт
        let a = 0;
        centers.forEach((x, i) => { if (Math.abs(x - c) < Math.abs(centers[a] - c)) a = i; });

        // сосед со стороны, куда ушёл центр
        const dir = centers[a] > c ? -1 : 1;
        const b = Math.min(this.#items.length - 1, Math.max(0, a + dir));

        const span = Math.abs(centers[b] - centers[a]) || 1;
        const t = Math.min(1, Math.abs(centers[a] - c) / span);   // clamp для iOS-оверскролла

        const wa = this.#items[a].offsetWidth;
        const wb = this.#items[b].offsetWidth;
        const half = (bgW - (wa + (wb - wa) * t)) / 2;

        this.#sel.style.left = `${half}px`;
        this.#sel.style.right = `${half}px`;
        this.#pos = { left: half, right: half };

        this.#highlight(this.#items[a]);
    };

    #onScroll = () => {
        if (this.#isMobile) {
            if (!this.#following) {
                this.#following = true;
                utils.remove(this.#sel, 'left');
                utils.remove(this.#sel, 'right');
            }
            if (!this.#raf) this.#raf = requestAnimationFrame(this.#follow);
        }
        if ('onscrollend' in window) return;
        clearTimeout(this.#timer);
        this.#timer = setTimeout(this.#settle, 120);
    };

    #settle = () => {
        this.#following = false;
        if (this.#raf) { cancelAnimationFrame(this.#raf); this.#raf = 0; }

        const near = this.#centered();
        this.#highlight(near);
        this.#move(this.#targetFor(near), false);   // без анимации: доводим до точных координат
        this.#commit(near);
    };

    #bind() {
        this.#items.forEach((el, i) => el.addEventListener('click', () => this.select(i)));

        this.#list.addEventListener('scroll', this.#onScroll, { passive: true });
        this.#list.addEventListener('scrollend', this.#settle);

        this.#mq.addEventListener('change', () => this.reposition());
        this.#ro = new ResizeObserver(() => this.reposition());
        this.#ro.observe(this.#list);
    }

    destroy() {
        this.#ro?.disconnect();
        clearTimeout(this.#timer);
        utils.remove(this.#sel, 'left');
        utils.remove(this.#sel, 'right');
    }
}

export default TypeFilter;
