import { ACard } from "../../modules/AnimeCard.js";
import { Sleep } from "../../modules/functions.js";
import { GraphQl } from "../../modules/ShikiAPI.js";
import { WindowManagement } from "../../modules/Windows.js"

const fetchAnime = function () {
    const { id, limit, order, page, loaded, process, exclude } = this.state;
    if (loaded === true || process === true) return;

    return new Promise((resolve, reject) => {
        startProcess.bind(this)();
        GraphQl.animes({ franchise: `"${id}"`, limit, order, page, excludeIds: `"${exclude.toString()}"` }, async (response) => {
            const { data, errors, failed, status } = response;
            endProcess.bind(this)();

            if (failed && status == 429) {
                await Sleep(1000);
                return fetchAnime.bind(this)();
            }

            if (errors) return reject(errors);

            if (data.animes.length < limit) {
                this.state.loaded = true;
            } else {
                this.state.page += 1;
            }

            data.animes.forEach(element => {
                let cmp = ["completed"].includes(element.userRate?.status);
                const el = $(ACard.GenV2({ type: "a", anime: element, data: { on: cmp } }));
                if (cmp && this.filter) el.addClass('disable');
                $('.anime-list').append(el);
            });
            resolve();
        }).POST(["id", { poster: ["mainUrl"] }, "russian", { airedOn: ["year"] }, "score", { userRate: ["status"] }], true);
    });
}

const startProcess = function () {
    this.state.process = true;
    $(`.anime-list`).append(`<div class="card-loader"><span class="loader"></span></div>`);
    $(`.achivement[data-id="${this.state.id}"]`).addClass('loading');
}

const endProcess = function () {
    this.state.process = false;
    $(`.anime-list > .card-loader`).remove();
    $(`.achivement[data-id="${this.state.id}"]`).removeClass('loading');
}

const Anime = {
    filter: false,
    state: {
        process: false,
        loaded: false,
        id: undefined,
        page: 1,
        order: 'created_at',
        limit: 12,
        exclude: []
    },

    newSetup: function (id, exclude = []) {
        this.state = {
            process: false,
            loaded: false,
            id: id,
            page: 1,
            order: 'created_at',
            limit: 12,
            exclude: exclude
        }
    },

    init: function () {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting === true) {
                fetchAnime.bind(this)();
            }
        }, { rootMargin: '0px' });

        observer.observe($('.list-wrapper > .sentinel')[0]);

        $(`.bar-anime > .window-close`).on('click', () => {
            this.hide();
        });

        $(`.bar-anime > .hide-elements`).on('click', () => {
            this.filter = !this.filter;
            if (this.filter) {
                $(`.hide-elements`).removeClass('state-0').addClass('state-1');
                $(`.card-anime[data-on="true"]`).addClass('disable');
            } else {
                $(`.hide-elements`).removeClass('state-1').addClass('state-0');
                $(`.card-anime.disable`).removeClass('disable');
            }
        });
    },
    show: function () {
        $('body').addClass('loading');
    },
    hide: function () {
        $('body').removeClass('loading');
        _window.hide();
    },
    anim: {
        showed: () => {
            $('.content-anime')[0].scroll(0, 0);
        }
    },
    verif: () => { return true }
}

const _window = new WindowManagement(Anime, '.window-anime');

export function ShowAnimeList(id, exclude = []) {
    if (Anime.state.process === true) return;

    if (Anime.state.id === id) {
        return _window.show();
    }

    Anime.newSetup(id, exclude);
    $('.anime-list').empty();

    fetchAnime.bind(Anime)().then(() => {
        _window.click();
    }).catch((error) => {
        Anime.state.id = undefined;
        Anime.hide();
    });
}