import { TEvents } from "./utils/util.event.js";

const ITEM_W = 50; // width of each item slot in px
const ITEM_G = 4; // gap in row items

export const UIScore = new class extends TEvents {
    #items = [null, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

    #labels = {
        10: 'Шедевр', 9: 'Отлично', 8: 'Очень хорошо', 7: 'Хорошо',
        6: 'Неплохо', 5: 'Средне', 4: 'Плохо', 3: 'Очень плохо',
        2: 'Ужасно', 1: 'Провал'
    }

    #colors = {
        10: '#3A8FFF', 9: '#3A8FFF', 8: '#2ECC8A', 7: '#2ECC8A',
        6: '#F5C842', 5: '#F5C842', 4: '#FF8C42', 3: '#FF8C42',
        2: '#FF4C4C', 1: '#FF4C4C'
    }

    #minX = -10 * (ITEM_W + ITEM_G);

    #state = {
        currentIdx: 0,
        offsetX: 0,
        dragStart: null,
        dragBaseOff: 0,
        didDrag: false,
    };

    // Stored so addEventListener/removeEventListener use the same reference
    #boundMove = this.#onPointerMove.bind(this);
    #boundUp = this.#onPointerUp.bind(this);

    #area;
    #row;
    #fc;
    #lbl;

    constructor() {
        super();

        this.#area = document.getElementById('scrollArea');
        this.#row = document.getElementById('itemsRow');
        this.#fc = document.getElementById('fc');
        this.#lbl = document.getElementById('lbl');

        // Recompute now that #items is set
        this.#minX = -(this.#items.length - 1) * (ITEM_W + ITEM_G);

        this.#buildItems();
        this.#attachListeners();
    }

    updateUI(idx, callback = false) {
        idx = this.#clamp(idx);
        this.#state.currentIdx = idx;
        const val = this.#items[idx];

        if (val === null) {
            this.#fc.textContent = '✕';
            this.#fc.style.background = '#3A8FFF';
            this.#lbl.textContent = 'Проведите для выбора оценки';
        } else {
            this.#fc.textContent = val;
            this.#fc.style.background = this.#colors[val];
            this.#lbl.textContent = this.#labels[val];
        }

        this.#row.querySelectorAll('.r-item').forEach((el, i) => {
            el.classList.toggle('active', i === idx);
        });

        if (callback) {
            this.trigger("score", val === null ? 0 : val);
        }
    }

    snapTo(idx, callback = false) {
        idx = this.#clamp(idx);
        this.#state.offsetX = -idx * (ITEM_W + ITEM_G);
        this.#row.style.transition = 'transform .2s ease';
        this.#row.style.transform = `translateX(${this.#state.offsetX}px)`;
        this.updateUI(idx, callback);
    }

    setScore(score) {
        if (score === 0 || score === null) {
            this.snapTo(0);
            return;
        }
        const idx = this.#items.indexOf(score);
        if (idx !== -1) this.snapTo(idx);
    }

    // ─── Private ─────────────────────────────────────────────
    #clamp(idx) {
        return Math.max(0, Math.min(this.#items.length - 1, idx));
    }

    #clientX(e) {
        return e.touches ? e.touches[0].clientX : e.clientX;
    }

    #buildItems() {
        this.#items.forEach((val, i) => {
            const div = document.createElement('div');
            div.className = 'r-item' + (i === 0 ? ' active' : '');
            div.innerHTML = `<div class="r-inner">${val === null ? '✕' : val}</div>`;
            this.#row.appendChild(div);
        });

        this.#row.style.transform = 'translateX(0px)';
    }

    #attachListeners() {
        this.#area.addEventListener('mousedown', this.#onPointerDown.bind(this));
        this.#area.addEventListener('touchstart', this.#onPointerDown.bind(this), { passive: true });
    }

    #onPointerDown(e) {
        this.#state.dragStart = this.#clientX(e);
        this.#state.dragBaseOff = this.#state.offsetX;
        this.#state.didDrag = false;

        this.#row.style.transition = 'none';

        window.addEventListener('mousemove', this.#boundMove);
        window.addEventListener('mouseup', this.#boundUp);
        window.addEventListener('touchmove', this.#boundMove, { passive: true });
        window.addEventListener('touchend', this.#boundUp);
    }

    #onPointerMove(e) {
        const s = this.#state;
        if (s.dragStart === null) return;

        const dx = this.#clientX(e) - s.dragStart;
        if (Math.abs(dx) > 5) s.didDrag = true;
        if (!s.didDrag) return;

        const newX = Math.max(this.#minX, Math.min(0, s.dragBaseOff + dx));
        this.#row.style.transform = `translateX(${newX}px)`;

        // Live-update label while dragging
        this.updateUI(Math.round(-newX / (ITEM_W + ITEM_G)));
    }

    #onPointerUp(e) {
        const s = this.#state;
        if (s.dragStart === null) return;

        if (!s.didDrag) {
            const tapX = this.#clientX(e) - this.#area.getBoundingClientRect().left;
            const tappedIdx = Math.round((-s.offsetX + tapX - ITEM_W / 2) / (ITEM_W + ITEM_G));
            this.snapTo(tappedIdx, true);
        } else {
            const cur = new DOMMatrix(getComputedStyle(this.#row).transform).m41;
            this.snapTo(Math.round(-cur / (ITEM_W + ITEM_G)), true);
        }

        s.dragStart = null;

        window.removeEventListener('mousemove', this.#boundMove);
        window.removeEventListener('mouseup', this.#boundUp);
        window.removeEventListener('touchmove', this.#boundMove);
        window.removeEventListener('touchend', this.#boundUp);
    }
}();