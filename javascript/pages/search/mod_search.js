import { GraphQl } from "../../modules/ShikiAPI.js";
import { Kodik } from "../../modules/Kodik.js";
import { Sleep } from "../../modules/functions.js";
import { ACardH } from "./mod_card.js";
import { Jikan } from "../../modules/api.jikan.js";
import { IsLogged } from "../search.js";
import { GetFilter } from "./mod_w_filter.js";

export class TInfo {
    static genre({ g, info } = {}) {
        const el = `<span class="sel">${g}:</span> ${info}`;
        return new TInfo({ type: 'genre', el });
    }

    static studio({ eng, jp, img, count, year } = {}) {
        const el = `<div class="img-wrapper"><img src="${img}"></div><div class="content-wrapper"><div class="title-wrapper"><div class="eng">${eng}</div><div class="jp">${jp}</div></div><div class="data"><div class="count">Аниме: <span>${count}</span></div><div class="date">Основана: <span>${year}</span></div></div></div>`;
        return new TInfo({ type: 'studio', el });

    }

    constructor({ type, el } = {}) {
        this.type = type;
        $(`.info > .${this.type}`).empty().append(el);
    }

    draw() {
        $(`.results-wrapper > .info`).addClass(this.type);
    }

    destroy() {
        $(`.results-wrapper > .info`).removeClass(this.type);
    }
}

class IOEngine {
    controller = new AbortController();

    constructor(observer, type) {
        this.type = type;
        this.observer = observer;
    }

    search(value) {
        this.observer.disconnect($('.results-wrapper > .sentinel')[0]);

        $('.results-wrapper').addClass('load')
        $(`.results`).empty();
    }

    next() {

    }

    destroy() {
        this.controller.abort({ name: "tabort" });
    }

    fetchAnimes(params, e = () => { }) {
        const { signal } = this.controller;
        GraphQl.animes(params, async (response) => {
            if (response.failed) {
                if (response.status == 429) {
                    await Sleep(1200);
                    return this.fetchAnimes(queryParams);
                }
                return;
            }

            const { animes } = response.data;

            const card = new ACardH({ isLogged: IsLogged });
            $('.results-wrapper').removeClass('load');
            $(`.results > .load-wrapper`).remove();

            animes.forEach(anime => {
                anime.personen = anime.statusesStats.reduce((sum, item) => sum + item.count, 0);
                $(`.results-wrapper > .results`).append(card.gen({ anime, redirects: { image: "poster.main2xUrl" } }, 'div'));
            });

            if (animes.length == 0) {
                TTSearch.instance.empty();
            }

            e(animes);
        }, signal).POST(["id", { "poster": ["main2xUrl"] }, "name", "russian", "kind", "season", "episodesAired", "episodes", "status", { "statusesStats": ["status", "count"] }, "score", { "userRate": ["status", "id"] }, { "airedOn": ["year"] }], IsLogged);
    }
}

class GenresSearch extends IOEngine {
    constructor({ id, obs } = {}) {
        super(obs, 'genres');

        this.params = {
            limit: 14,
            censored: $PARAMETERS.censored,
            genre: `"${id}"`
        }

        this.page = 1
    }

    search(value) {
        super.search(value);

        if (value == null)
            delete this.params.search;
        else
            this.params.search = `"${value}"`

        this.page = 1
        this.#search();
    }

    next() {
        const { params } = this;

        this.page++;

        $(`.results`).append(`<div class="load-wrapper"><span class="loader"></span></div>`);

        this.fetchAnimes({ ...params, page: this.page }, (animes) => {
            if (animes.length >= params.limit) {
                return this.observer.observe($('.results-wrapper > .sentinel')[0]);
            }
            TTSearch.instance.end();
        });
    }

    #search() {
        this.fetchAnimes(this.params, (animes) => {
            if (animes.length >= this.params.limit) {
                return this.observer.observe($('.results-wrapper > .sentinel')[0]);
            }
            TTSearch.instance.end();
        });
    }
}

class DefaultSearch extends IOEngine {
    constructor({ obs } = {}) {
        super(obs, 'default');

        this.params = {
            limit: 14,
            censored: $PARAMETERS.censored
        }

        this.page = 1;
    }

    search(value) {
        if (value == null) return TTSearch.instance.destroy();

        super.search(value);
        this.params.search = `"${value}"`;
        this.page = 1;
        this.#search();
    }

    next() {
        const { params } = this;
        this.page++;

        $(`.results`).append(`<div class="load-wrapper"><span class="loader"></span></div>`);

        this.fetchAnimes({ ...params, page: this.page }, (animes) => {
            if (animes.length >= params.limit) {
                return this.observer.observe($('.results-wrapper > .sentinel')[0]);
            }
            TTSearch.instance.end();
        });
    }

    #search() {
        const { params } = this;
        this.fetchAnimes({ ...params, ...GetFilter() }, (animes) => {
            if (animes.length >= this.params.limit) {
                return this.observer.observe($('.results-wrapper > .sentinel')[0]);
            }
            TTSearch.instance.end();
        });
    }
}

class VoiceSearch extends IOEngine {
    constructor({ id, obs } = {}) {
        super(obs, 'voice');

        this.params = {
            translation_id: id,
            has_field: 'shikimori_id',
            types: 'anime-serial,anime',
            limit: 25
        }

        this['next_page'] = null;
    }

    next() {
        const res = (response) => {
            this['next_page'] = response['next_page'] || null;

            const ids = response.results.map(x => parseInt(x['shikimori_id']));
            this.#anime({ ids });
        };

        if (!this['next_page']) return;

        const { signal } = this.controller;

        $(`.results`).append(`<div class="load-wrapper"><span class="loader"></span></div>`);
        return fetch(this['next_page'], { signal }).then((response) => {
            response.json().then(res);
        }).catch(err => {
            if (err?.name === "tabort") return;
            throw err;
        });
    }

    search(value) {
        super.search(value);
        this.#search({ search: value });
    }

    #search({ search } = {}) {
        const res = (response) => {
            this['next_page'] = response['next_page'] || null;

            if(response.results.length == 0){
                $('.results-wrapper').removeClass('load');
                return TTSearch.instance.empty();
            }

            const ids = response.results.map(x => parseInt(x['shikimori_id']));
            this.#anime({ ids });
        };

        const { signal } = this.controller;

        if (search) {
            return Kodik.Search({ ...this.params, title: search }, res, signal);
        }

        Kodik.List(this.params, res, signal);
    }

    #anime({ ids } = {}) {
        this.fetchAnimes({ ids: `"${ids.toString()}"`, limit: ids.length }, (animes) => {
            if (this['next_page']) {
                return this.observer.observe($('.results-wrapper > .sentinel')[0]);
            }
            TTSearch.instance.end();
        });
    }
}

class StudioSearch extends IOEngine {
    constructor({ id, obs } = {}) {
        super(obs, 'studio');

        this.params = {
            sfw: $PARAMETERS.censored,
            producers: id,
            order_by: "popularity",
            sort: "asc",
            limit: 14
        }

        this.page = 1;
    }

    search(value) {
        super.search(value);
        delete this.shiki;
        this.page = 1;
        this.#search(value);
    }

    next() {
        const { params, page } = this;
        const { signal } = this.controller;

        $(`.results`).append(`<div class="load-wrapper"><span class="loader"></span></div>`);

        if (!this.page) return

        if (!this.shiki) {
            return Jikan.anime.getAnimeSearch({ ...params, page }, (response) => {
                if (response.pagination['has_next_page']) {
                    this.page = response.pagination['current_page'] + 1;
                } else {
                    this.page = null;
                }

                const mal = response.data.map(x => ({ id: parseInt(x['mal_id']), personen: x.members, image: x.images.webp.image_url, mscore: x.score }));
                this.#anime({ ids: mal.map(x => x.id), mal });
            }).GET({ signal }, false);
        }

        this.fetchAnimes({ ...this.shiki, page }, (animes) => {
            if (animes.length >= this.shiki.limit) {
                return this.observer.observe($('.results-wrapper > .sentinel')[0]);
            }
            TTSearch.instance.end();
        });
    }

    #search(search) {
        const { params } = this;
        const { signal } = this.controller;

        if (!search) {
            return Jikan.anime.getAnimeSearch(params, (response) => {
                if (response.pagination['has_next_page']) {
                    this.page = response.pagination['current_page'] + 1;
                } else {
                    this.page = null;
                }

                if(response.data.length == 0){
                    $('.results-wrapper').removeClass('load');
                    return TTSearch.instance.empty();
                }

                const mal = response.data.map(x => ({ id: parseInt(x['mal_id']), personen: x.members, image: x.images.webp.image_url, mscore: x.score }));
                this.#anime({ ids: mal.map(x => x.id), mal });
            }).GET({ signal }, false);
        }

        this.shiki = {
            search: `"${search}"`,
            studio: `"${params.producers}"`,
            limit: params.limit,
            censored: params.sfw
        }

        this.fetchAnimes(this.shiki, (animes) => {
            if (animes.length >= this.shiki.limit) {
                return this.observer.observe($('.results-wrapper > .sentinel')[0]);
            }
            TTSearch.instance.end();
        });
    }

    #anime({ ids, mal } = {}) {
        const { signal } = this.controller;
        GraphQl.animes({ ids: `"${ids.toString()}"`, limit: ids.length }, async (response) => {
            if (response.failed) {
                if (response.status == 429) {
                    await Sleep(1200);
                    return this.#anime({ ids, mal });
                }
                return resolve();
            }

            const { animes } = response.data;
            const card = new ACardH({ isLogged: IsLogged });

            $('.results-wrapper').removeClass('load');
            $(`.results > .load-wrapper`).remove();

            for (let i = 0; i < mal.length; i++) {
                const el = mal[i];
                const index = animes.findIndex(x => x.id == el.id);
                mal[i] = { ...el, ...animes[index] };
            }

            mal.forEach(anime => {
                if ($(`.results > .card-anime-h[data-id="${anime.id}"]`).length !== 0) return;
                $(`.results`).append(card.gen({ anime, mal: { score: anime.mscore } }, 'div'));
            });

            if (this.page) {
                return this.observer.observe($('.results-wrapper > .sentinel')[0]);
            }
            TTSearch.instance.end();
        }, signal).POST(["id", "name", "russian", "kind", "season", "episodesAired", "episodes", "status", "score", { "userRate": ["status", "id"] }, { "airedOn": ["year"] }], IsLogged);
    }
}

class SeasonSearch extends IOEngine {
    constructor({ id, obs } = {}) {
        super(obs, 'season');

        this.year = id.year;
        this.season = id.season;

        this.params = {
            sfw: $PARAMETERS.censored,
            limit: 14
        }

        this.page = 1;
    }

    search(value) {
        super.search(value);
        delete this.shiki;
        this.page = 1;
        this.observer.disconnect($('.results-wrapper > .sentinel')[0]);
        this.#search(value);
    }

    next() {
        const { year, season, params, page } = this;
        const { signal } = this.controller;

        $(`.results`).append(`<div class="load-wrapper"><span class="loader"></span></div>`);

        if (this.page) {
            if (!this.shiki) {
                return Jikan.seasons.getSeason(year, season, { ...params, page }, (response) => {
                    if (response.pagination['has_next_page']) {
                        this.page = response.pagination['current_page'] + 1;
                    } else {
                        this.page = null;
                    }

                    const mal = response.data.map(x => ({ id: parseInt(x['mal_id']), personen: x.members, image: x.images.webp.image_url, mscore: x.score }));
                    this.#anime({ ids: mal.map(x => x.id), mal });
                }).GET({ signal }, false);
            }

            this.fetchAnimes({ ...this.shiki, page }, (animes) => {
                if (animes.length >= this.shiki.limit) {
                    return this.observer.observe($('.results-wrapper > .sentinel')[0]);
                }
                TTSearch.instance.end();
            });
        }
    }

    #search(search) {
        const { year, season, params } = this;
        const { signal } = this.controller;

        if (!search) {
            return Jikan.seasons.getSeason(year, season, params, (response) => {
                if (response.pagination['has_next_page']) {
                    this.page = response.pagination['current_page'] + 1;
                } else {
                    this.page = null;
                }

                const mal = response.data.map(x => ({ id: parseInt(x['mal_id']), personen: x.members, image: x.images.webp.image_url, mscore: x.score }));
                this.#anime({ ids: mal.map(x => x.id), mal });
            }).GET({ signal }, false);
        }

        this.shiki = {
            search: `"${search}"`,
            season: `"${season}_${year}"`,
            limit: params.limit,
            censored: params.sfw
        }

        this.fetchAnimes(this.shiki, (animes) => {
            if (animes.length >= this.shiki.limit) {
                return this.observer.observe($('.results-wrapper > .sentinel')[0]);
            }
            TTSearch.instance.end();
        });
    }

    #anime({ ids, mal } = {}) {
        const { signal } = this.controller;
        GraphQl.animes({ ids: `"${ids.toString()}"`, limit: ids.length }, async (response) => {
            if (response.failed) {
                if (response.status == 429) {
                    await Sleep(1200);
                    return this.#anime({ ids, mal });
                }
                return resolve();
            }

            const { animes } = response.data;
            const card = new ACardH({ isLogged: IsLogged });

            $(`.results > .load-wrapper`).remove();
            $('.results-wrapper').removeClass('load');

            for (let i = 0; i < mal.length; i++) {
                const el = mal[i];
                const index = animes.findIndex(x => x.id == el.id);
                mal[i] = { ...el, ...animes[index] };
            }

            mal.forEach(anime => {
                if ($(`.results > .card-anime-h[data-id="${anime.id}"]`).length !== 0) return;
                $(`.results`).append(card.gen({ anime, mal: { score: anime.mscore } }, 'div'));
            });

            if (this.page) {
                return this.observer.observe($('.results-wrapper > .sentinel')[0]);
            }
            TTSearch.instance.end();
        }, signal).POST(["id", "name", "russian", "kind", "season", "episodesAired", "episodes", "status", "score", { "userRate": ["status", "id"] }, { "airedOn": ["year"] }], IsLogged);
    }
}

/**
 * @typedef {Object} TSearchTypeParams
 * @property {number} id - индентификатор
 * @property {string} val - значение
 * @property {string} icon - значение
 * @property {IOEngine} engine - движок поиска
 */

export class TSearchType {
    static voice({ id, val } = {}) {
        return new TSearchType({ id, val, engine: VoiceSearch, icon: 'i-microphone' });
    }

    static genre({ id, val } = {}) {
        return new TSearchType({ id, val, engine: GenresSearch, icon: 'i-book' });
    }

    static studio({ id, val } = {}) {
        return new TSearchType({ id, val, engine: StudioSearch, icon: 'i-paintbrush' });
    }

    static season({ id, val } = {}) {
        return new TSearchType({ id, val, engine: SeasonSearch, icon: 'i-calendar' });
    }

    static default({ } = {}) {
        return new TSearchType({ engine: DefaultSearch });
    }

    /**
     * Тип определяющий поиск
     * @param {TSearchTypeParams} param 
     */
    constructor({ id, val, engine, icon } = {}) {
        /**@type {class IOEngine} */
        this.engine = engine;
        /**@type {number} */
        this.id = id;
        /**@type {string} */
        this.val = val;
        /**@type {string} */
        this.icon = icon;

        this.create();
    }

    create() {
        if (!this.icon || $(`.input-wrapper > .tag`).length !== 0) return;
        const el = $(`.input-wrapper`);

        el.prepend(`<div class="tag"><div class="${['ticon', this.icon].join(' ')}"></div><span class="text">${this.val}</span></div>`);
        $('.search-controls').addClass('state-1');
    }

    delete() {
        $(`.input-wrapper > .tag`).remove();
        $('.search-controls').removeClass('state-1');
    }
}

/**
 * @typedef {Object} TTSearchParams
 * @property {TInfo} info - информация
 * @property {TSearchType} type - тип поиска
 */

export class TTSearch {
    /**@type {TTSearch} */
    static instance = null;

    #callbacks = {
        "destroy": []
    }

    /**
     * Контроллер поиска
     * @param {TSearchType} type 
     * @param {TTSearchParams} param1 
     */
    constructor(type, { info, on } = {}) {
        if (TTSearch.instance !== null) {
            TTSearch.instance.destroy();
        }

        TTSearch.instance = this;

        this.type = type;
        this.info = info;
        this.observer = new IntersectionObserver(([entry], obs) => {
            if (entry.isIntersecting === true) {
                obs.disconnect();
                this.engine.next();
            }
        }, { rootMargin: '0px' });

        this.type.create();
        this.info?.draw();

        /**@type {IOEngine} */
        this.engine = new this.type.engine({ id: type.id, obs: this.observer });

        for (const key in on) {
            this.#callbacks[key].push(on[key]);
        }
    }

    search(q) {
        $(`.body-wrapper`).removeClass('state-1').addClass('state-2');
        $(`.results-wrapper > .end`).addClass('hide');
        $(`.results-wrapper`).removeClass(['state-0', 'empty']);
        this.engine.controller.abort();
        this.engine.controller = new AbortController();
        this.engine.search(q);
    }

    end() {
        if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
            $(`.results-wrapper > .end`).removeClass('hide');
        }
    }

    empty() {
        $(`.results-wrapper`).addClass('empty');
    }

    destroy() {
        this.type.delete();
        this.engine.destroy();
        this.info?.destroy();
        this.observer.disconnect($('.results-wrapper > .sentinel')[0]);
        $(`.results`).empty();
        $(`.results-wrapper`).addClass('state-0');
        $(`.body-wrapper`).removeClass('state-2');
        TTSearch.instance = null;
        this.#Dispatch("destroy");
    }

    /**
     * Вызывает функция событий с данными.
     * @param {"destroy"} event - Название события.
     * @param {Object} data - данные которые приходят в функцию.
     */
    #Dispatch(event, data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(data));
    }
}