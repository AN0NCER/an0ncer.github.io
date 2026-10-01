import { ACard } from "../../../modules/AnimeCard.js";
import { createGlide } from "../utils/util.glide.js";

/** Сколько карточек догружаем, когда лента доехала до незаполненных */
const BATCH = 10;

/** Число эпизодов: у вышедшего полное, у онгоинга — сколько уже вышло */
const episodes = (anime) => {
    const count = anime.status === 'released' ? anime.episodes : anime.episodesAired;
    return count > 0 ? `${count} EP` : '';
};

/**
 * Лента карточек коллекции.
 *
 * Карточки рисуются сразу все — по числу аниме в коллекции, — но пустые:
 * так лента с первого кадра имеет правильную ширину, прокрутка не
 * прыгает, а данные проставляются по мере загрузки.
 *
 * @param {HTMLElement} dom - контейнер `.cid-collection-viewer`
 * @param {ReturnType<import("./mod.source.js").createSource>} source
 * @param {Object} opts
 * @param {number[]} opts.ids - состав коллекции по порядку
 * @param {number} opts.current - открытое сейчас аниме
 * @param {string} opts.cid
 * @param {(ids: number[]) => void} [opts.onNeed] - каких карточек не хватает
 */
export function createStrip(dom, source, { ids = [], current, cid, onNeed = () => { } } = {}) {
    /** @type {Map<number, HTMLElement>} */
    const cards = new Map();

    /** Пустые карточки, до которых доехала прокрутка */
    const observer = new IntersectionObserver((entries) => {
        const need = entries
            .filter(entry => entry.isIntersecting)
            .map(entry => Number(entry.target.dataset.id))
            .filter(id => !source.get(id));

        if (need.length === 0) return;

        // Просим с запасом вокруг увиденного: пользователь листает
        // дальше, и лучше опередить его, чем догонять
        const from = ids.indexOf(need[0]);
        onNeed(ids.slice(Math.max(from - 2, 0), from + BATCH));
    }, { root: dom, rootMargin: '200px' });

    // Прокрутка и инерция колеса — общий утилитарный модуль
    const glide = createGlide(dom, { axis: 'x', busy: '-wheel' });

    /** @param {number} id */
    const create = (id) => {
        const el = document.createElement('a');

        el.className = 'cid-card -load';
        el.dataset.id = String(id);
        el.href = ACard.Url(id, { cid });

        el.innerHTML = `
            <div class="poster">
                <img alt="" loading="lazy">
            </div>
            <div class="name"></div>
            <div class="meta"></div>`;

        if (id === current) {
            el.classList.add('-current');
            el.querySelector('.poster').insertAdjacentHTML(
                'afterbegin', '<div class="badge">сейчас</div>'
            );
        }

        return el;
    };

    /** @param {HTMLElement} el */
    const fillOne = (el) => {
        const id = Number(el.dataset.id);
        const anime = source.get(id);

        if (!anime) return;

        const title = anime.russian || anime.name || '';

        const img = el.querySelector('img');
        img.src = anime.poster?.mainUrl || '/images/noanime.png';
        img.alt = title;

        el.querySelector('.name').textContent = title;

        // Год и эпизоды через точку — но только то, что известно:
        // у анонсов не бывает ни года, ни серий
        const meta = [anime.airedOn?.year, episodes(anime)].filter(Boolean);

        el.querySelector('.meta').innerHTML = meta
            .map(x => `<span>${x}</span>`)
            .join('<span class="dot"></span>');

        el.classList.remove('-load');
        observer.unobserve(el);
    };

    return {
        /** Нарисовать ленту целиком */
        draw() {
            const fragment = document.createDocumentFragment();

            cards.clear();
            dom.innerHTML = '';

            for (const id of ids) {
                const el = create(id);

                cards.set(id, el);
                fragment.append(el);
            }

            dom.append(fragment);

            this.fill();
        },

        /** Проставить данные во все карточки, для которых они есть */
        fill() {
            for (const el of cards.values()) {
                if (el.classList.contains('-load')) fillOne(el);
                if (el.classList.contains('-load')) observer.observe(el);
            }
        },

        /**
         * Показать текущее аниме.
         *
         * Без анимации при первом показе: страница только открылась, и
         * плавная прокрутка выглядела бы как самопроизвольный сдвиг
         *
         * @param {{smooth?: boolean}} [opts]
         */
        toCurrent({ smooth: animated = false } = {}) {
            glide.center(cards.get(current), { animated });
        },

        /**
         * Прокрутить к краю
         * @param {'start' | 'end'} edge
         */
        toEdge(edge) {
            glide.toEdge(edge);
        },

        /** Виден ли сейчас текущий — от этого зависит кнопка возврата */
        get visible() {
            return glide.visible(cards.get(current));
        },

        destroy() {
            observer.disconnect();
            glide.destroy();
        }
    };
}

export default createStrip;
