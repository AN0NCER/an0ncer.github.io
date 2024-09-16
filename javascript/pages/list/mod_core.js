import { ACard } from "../../modules/AnimeCard.js";
import { Sleep } from "../../modules/functions.js";
import { GraphQl } from "../../modules/ShikiAPI.js"
import { AList } from "./mod_alist.js";
import { Carousel } from "./mod_carousel.js";
import { AFilter } from "./mod_filter.js";

class CustomList extends AList {
    constructor({ core, status, dom } = {}) {
        super({ core, status, dom });

        this.L = `"planned,watching,rewatching,completed,on_hold,dropped"`;
        this.D = ["id", "russian", "name", "score", { airedOn: ["year"] }, { poster: ["mainUrl"] }, "kind", { userRate: ["id", "status", "score", "updatedAt"] }];
    }

    Load({ ins, sort } = { ins: "append", sort: undefined }) {
        if (typeof sort === "undefined") {
            if (typeof this.sort !== "undefined") {
                this.sort = undefined;
                this.page = 1
                this.loaded = false;
            }
        } else {
            if (typeof this.sort === "undefined") {
                this.sort = { order: "none" };
            }

            if (this.sort.order !== sort.order) {
                if (this.loaded) {
                    this.sort = sort;
                    this.page = 1;
                    this.loaded = false;
                }
            }
        }

        if (this.loaded) return this.Blank();
        return this.GetByAnime(sort, ins);
    }

    GetByAnime(sort, ins) {
        const kind = this.status == "anime" ? `"!movie"` : `"movie"`;
        const param = {
            page: this.page,
            limit: this.limit,
            kind,
            mylist: this.L,
            order: "ranked"
        };

        this.history.sort = sort;
        this.history.order = this.core.ORDER;

        if (sort != undefined) {
            if (sort.order == "year") {
                param.order = "aired_on";
            }
            // param.order = sort.order;
        }

        const load = () => {
            return new Promise((resolve, reject) => {
                GraphQl.animes(param, async (response) => {
                    if (response.failed) {
                        if (response.status == 429) {
                            await Sleep(1000);
                            return load();
                        }
                        resolve();
                        return console.log('Не удалось загрузить список аниме');
                    }

                    if (response.errors) {
                        resolve();
                        return console.log('Не удалось загрузить список аниме');
                    }

                    if (this.page === 1) {
                        this.Empty();
                    }

                    this.page++;

                    if (response.data.animes.length < this.limit) {
                        this.loaded = true;
                    }

                    for (let i = 0; i < response.data.animes.length; i++) {
                        const userRate = response.data.animes[i].userRate;
                        delete response.data.animes[i].userRate;
                        const anime = response.data.animes[i];
                        userRate.anime = anime;

                        this.list.push(userRate);
                        this.$element.append(ACard.GenV2({ anime, data: { score: userRate.score, kind: anime.kind }, exclude: ["score"] }));
                    }

                    resolve();
                }).POST(this.D, true);
            });
        }

        return load();
    }

    GetByUserRate() {
        return this.Blank();
    }
}

class Core {
    #callbacks = {
        "filter": [],
        "filtered": []
    }

    constructor() {
        /**@type {Array<{id: string, list: AnimeList}>>} */
        this.animeList = [];
        this.watching = new AList({ core: this, status: "watching", ins: ["rewatching"], dom: ".anime-list" });
        this.planned = new AList({ core: this, status: "planned", ins: ["on_hold"], dom: ".anime-list" });
        this.completed = new AList({ core: this, status: "completed", dom: ".anime-list" });
        this.dropped = new AList({ core: this, status: "dropped", dom: ".anime-list" });
        this.anime = new CustomList({ core: this, status: "anime", dom: ".anime-list" });
        this.movie = new CustomList({ core: this, status: "movie", dom: ".anime-list" });
        this.list = [this.watching, this.planned, this.completed, this.dropped, this.anime, this.movie];

        this.filter = new AFilter({ core: this });

        this.SELECTED_LIST = 1;
        this.SORT = this.filter.default.sort;
        this.ORDER = this.filter.default.order;
    }

    NewSort(data) {
        if (this.SORT === data.sort && this.ORDER === data.order) return;

        this.#Dispatch("filter", this);

        this.SORT = this.filter.data.sort;
        this.ORDER = this.filter.data.order;
        let top = 0;
        if ((top = $('.app').scrollTop()) >= 308) {
            $('.app').scrollTop(top + $(`.anime-content`).position().top - 60);
        } else {
            $(`.app`)[0].scrollTo({ top: top + $(`.anime-content`).position().top - 60, behavior: 'smooth' });
        }

        this.Update().then(() => {
            this.#Dispatch("filtered", this);
        });
    }

    Load(ins = "prepend") {
        return this.list[this.SELECTED_LIST].Load({ ins, sort: this.SORT, order: this.ORDER });
    }

    Hide() {
        this.list[this.SELECTED_LIST].Hide();
    }

    Show(ins = "prepend") {
        return this.list[this.SELECTED_LIST].Show(ins);
    }

    Update() {
        return this.list[this.SELECTED_LIST].Update({ sort: this.SORT, order: this.ORDER });
    }

    get page() {
        return this.list[this.SELECTED_LIST].page;
    }

    get loaded() {
        return this.list[this.SELECTED_LIST].loaded;
    }

    get alist() {
        return this.list[this.SELECTED_LIST];
    }

    /**
     * Добавляет обработчик события.
     * @param { "filter" | "filtered" } event - Название события.
     * @param {Function} callback - Функция обработчик события.
     */
    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
    }

    #Dispatch(event, data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(data));
    }
}

/**@type {Core} */
let CORE = undefined;
let LOADED = false;
let LAST_SCROLL_TOP = 0;
let SEARCH_ENABLE = false;

const ICarousel = () => {
    Carousel.Init().on("select", async (c) => {
        if (c.id == CORE.SELECTED_LIST || SEARCH_ENABLE) return;

        LOADED = false;

        let top = 0;

        if ((top = $('.app').scrollTop()) >= 308) {
            $('.app').scrollTop(top + $(`.anime-content`).position().top - 60);
        } else {
            $(`.app`)[0].scrollTo({ top: top + $(`.anime-content`).position().top - 60, behavior: 'smooth' });
        }

        CORE.Hide();
        CORE.SELECTED_LIST = c.id;
        LAST_SCROLL_TOP = 0;

        if (CORE.loaded) {
            await CORE.Update();
        } else if (CORE.page !== 1) {
            await CORE.Show("append");
        }

        if (CORE.page == 1 && !CORE.loaded && !LOADED) {
            LOADED = true;
            c.enabled = false;
            CORE.Load("prepend").then(() => {
                LOADED = false;
                c.enabled = true;
            });
        }
    });
}

const IScroll = () => {
    const $element = $('.app');
    $element.on('scroll', function () {
        if (SEARCH_ENABLE) return;
        const scrollTop = $(this).scrollTop();
        if (scrollTop < LAST_SCROLL_TOP) {
            return;
        }
        LAST_SCROLL_TOP = scrollTop <= 0 ? 0 : scrollTop;
        if (scrollTop + 200 + $(this).innerHeight() >= $(this)[0].scrollHeight && !LOADED) {
            LOADED = true;
            if (!CORE.loaded) {
                $(`.anime-list`).append(`<div class="card-loader"><span class="loader"></span></div>`);
                CORE.Load("append").then(() => {
                    LOADED = false;
                    $(`.anime-list > .card-loader`).remove()
                });
            }
        }
    });
}

export const InitCore = () => {
    CORE = new Core();

    ICarousel();
    IScroll();

    CORE.Load("prepend");

    CORE.on("filter", () => {
        LOADED = false;
    })

    CORE.on("filtered", () => {
        LOADED = false;
    });
}

class Search {
    constructor() {
        this.list = [];
        this.page = 1;
        this.limit = 16;
        this.loaded = false;
        this.search = "";
    }

    Search({ value } = {}) {
        SEARCH_ENABLE = true;
        if (this.loaded) return;
        this.search = value;
        return this.#load();
    }

    Reset() {
        this.search = "";
        this.page = 1;
        this.loaded = false;
        this.list = [];
    }

    Load() {
        if (this.loaded) return;
        return this.#load();
    }

    #load() {
        return new Promise((resolve) => {
            GraphQl.animes({
                mylist: `"planned,watching,rewatching,completed,on_hold,dropped"`,
                limit: this.limit,
                page: this.page,
                search: `"${this.search}"`
            }, async (response) => {
                if (response.failed) {
                    if (response.status == 429) {
                        await Sleep(1000);
                        return this.#load();
                    }
                    resolve([]);
                    return console.log('Не удалось выполнить поиск');
                }

                if (response.errors) {
                    resolve([]);
                    return console.log('Не удалось выполнить поиск');
                }

                this.page++;
                if (response.data.animes.length < this.limit) {
                    this.loaded = true;
                }

                this.list = response.data.animes;
                resolve(this.list);
            }).POST(["id", "russian", "name", "score", { airedOn: ["year"] }, { poster: ["mainUrl"] }, "kind", { userRate: ["id", "status", "score", "updatedAt"] }], true);
        })
    }

    Complete() {
        SEARCH_ENABLE = false;
    }
}

export const ASearch = () => {
    return new Search();
}