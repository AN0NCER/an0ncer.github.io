import { AutoScrollEpisodes } from "../utils/util.scroll.js";
import { DUB } from "../mod.dubs.js";
import { WEpisodes } from "../mod.episode.win.js";
import { toLegacy } from "./player.legacy.js";

/** С какого количества эпизодов показывать кнопку меню */
const MENU_FROM = 40;

const MENU_HTML = `<div class="btn-win-episode" data-index="-1"><svg viewBox="0 0 640 640" aria-hidden="true"><use href="#i-grip"></use></svg><span class="ep-name">EPS</span></div>`;

/** @param {number} i */
const episodeHtml = (i) => `<span class="episode" data-index="${i}">${i}<span class="ep-name">EP</span></span>`;

/**
 * Разметка плеера страницы просмотра: список эпизодов, кнопка озвучки, тип плеера.
 */
export class PlayerView {
    hasMenu = false;

    /** @param {import('./player.core.js').WatchPlayer} player */
    constructor(player) {
        this.player = player;
        this.wrappers = $('.episode-scroll-wrapper');

        this.#applyKind(player.kind);

        player.on('kind', ({ kind }) => this.#applyKind(kind));

        player.on('voice', ({ voice }) => {
            DUB.select(toLegacy(voice), player.favorites.has(voice.id));
            this.render();
        });

        player.on('episode', ({ episode, user }) => this.highlight(episode, { scroll: !user }));
        player.on('mark', ({ episode }) => this.highlight(episode));

        this.#bindClicks();
        this.#bindScroll();
    }

    /** Перестраивает список эпизодов под выбранную озвучку */
    render() {
        const count = this.player.count;
        const parts = [];

        this.hasMenu = count > MENU_FROM;

        if (this.hasMenu && $PARAMETERS.watch.epismenu) {
            this.wrappers.css('--items', 1);
            parts.push(MENU_HTML);
        } else {
            this.wrappers.css('--items', '');
        }

        for (let i = 1; i <= count; i++) parts.push(episodeHtml(i));

        $('.episode-list').html(parts.join(''));
        $('.episode-visible-area').toggleClass('-hide', count <= 0);
    }

    /**
     * Подсвечивает эпизод
     * @param {number} [episode]
     * @param {{scroll?:boolean}} [opts]
     */
    highlight(episode = this.player.episode, { scroll = false } = {}) {
        $('.episode.-select').removeClass('-select');
        $('.episodes > .value, .episodes > .episodes-wrapper, .episode-scroll-wrapper').css('--episod', episode);
        $(`.episode[data-index="${episode}"]`).addClass('-select');

        if (scroll) AutoScrollEpisodes();
    }

    /** Повторная подсветка с прокруткой (смена ориентации) */
    revise() {
        this.highlight(this.player.episode, { scroll: true });
    }

    /** @param {string} kind */
    #applyKind(kind) {
        const el = document.querySelector('.player');
        if (!el) return;

        el.setAttribute('data-type', kind);
        el.setAttribute('default-controls', $PARAMETERS.player.standart_controls);
    }

    #bindClicks() {
        this.wrappers.on('click', '.btn-win-episode, .episode[data-index]', (e) => {
            const player = this.player;
            if (!player.owner) return;

            const episode = Number($(e.currentTarget).data('index'));

            if (episode === -1) {
                WEpisodes(player.count, player.episode, {
                    onselect: (selected, win) => {
                        const changed = player.selectEpisode(selected, { user: true });

                        if (win && changed) {
                            win.hide();
                            AutoScrollEpisodes();
                        }
                    }
                });
                return;
            }

            player.selectEpisode(episode, { user: true });
        });
    }

    /** Кнопка меню эпизодов показывается при прокрутке назад */
    #bindScroll() {
        let lastLeft = 0;
        let lastTop = 0;
        let pending = false;

        this.wrappers.on('scroll', (e) => {
            if (!this.hasMenu || pending) return;
            pending = true;

            const el = e.currentTarget;

            requestAnimationFrame(() => {
                pending = false;

                const { scrollLeft, scrollTop } = el;

                if (scrollLeft !== lastLeft) {
                    $('[data-scroll="horizontal"] .btn-win-episode').toggleClass('-show', lastLeft > scrollLeft);
                    lastLeft = scrollLeft;
                }

                if (scrollTop !== lastTop) {
                    $('[data-scroll="vertical"] .btn-win-episode').toggleClass('-show', lastTop > scrollTop);
                    lastTop = scrollTop;
                }
            });
        });
    }
}
