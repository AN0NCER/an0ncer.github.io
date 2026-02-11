import { TWindow } from "../../core/window.core.js";
import { ACard } from "../../modules/AnimeCard.js";
import { GraphQl } from "../../modules/api.shiki.js";
import { LazyLoad, PullToClose, WindowIntercator } from "../../modules/win.module.js";

class Sentinel {
    /**@type {boolean} Идет ли обработка запроса */
    #fetch = false;

    constructor() {
        /**@type {boolean} Загружено ли полностью */
        this.loaded = false;
        /**@type {number} Страница загрузки */
        this.page = 0;
        /**@type {number} Лимит на один запрос */
        this.limit = 12;
        /**@type {undefined | Promise} Текущий запрос */
        this.promise = undefined;
    }

    isFetch(value) {
        if (typeof value !== "boolean") {
            return this.#fetch;
        }

        this.#fetch = value;
    }

    reload() {
        this.isFetch(false);
        this.loaded = false;
        this.page = 0;
        this.promise = undefined;
        this.limit = 12;
    }
}

class UI {
    #hide = false;

    set hide(value) {
        if (typeof value !== "boolean") return;

        this.#hide = value;

        if (this.#hide) {
            $(`.card-anime[data-on="true"]`).addClass('-off');
        } else {
            $(`.card-anime[data-on="true"]`).removeClass('-off');
        }
    }

    get hide() {
        return this.#hide;
    }

    gen = {
        card: (anime) => {
            const complete = ["completed"].includes(anime.userRate?.status);
            return $(ACard.GenV2({ type: 'a', anime, data: { on: complete } })).addClass(this.#hide && complete ? '-off' : '');
        },
        empty: () => {
            return `<span class="empty-card"><div class="title">Ничего не найдено</div><div class="add">Очистите поиск, чтобы увидеть все аниме франшизы</div></span>`;
        }
    }

    empty() {
        $(`.anime-list-wrapper > .grid-anime-list-wrapper`).empty();
    }
}

class IO {
    constructor(type) {
        this.type = type;
        this.sentinel = new Sentinel();
        this.signal = new AbortController();
        this.ui = new UI();
        this.has = false;

        this.rule = '';
        this.exclude = [];
        this.filter = '';
    }

    Load(rule, excludeIds = []) {
        if (this.sentinel.isFetch() || this.rule == rule) return;

        this.rule = rule;
        this.exclude = excludeIds;

        this.Clear();
    }

    Next() {
        if (this.sentinel.isFetch() || this.sentinel.loaded || this.sentinel.page === 0) return;
        this.sentinel.isFetch(true);

        this.sentinel.promise = this.process_next();
    }

    async process_next() {
        this.signal = new AbortController();
        const characters = await this.graphql_fetch();

        const dom = $(`.anime-list-wrapper > .grid-anime-list-wrapper`);
        this.has = true;

        if (this.sentinel.page === 1) {
            this.ui.empty();

            if (characters.length === 0) {
                this.has = false;
                dom.append(this.ui.gen.empty());
            }
        }

        for (const character of characters) {
            dom.append(this.ui.gen.card(character));
        }

        this.sentinel.isFetch(false);
    }

    async graphql_fetch() {
        this.sentinel.page++;

        const fetch = async () => {
            const args = {
                limit: this.sentinel.limit,
                page: this.sentinel.page,
                franchise: `"${this.rule}"`,
                order: 'created_at',
                excludeIds: this.exclude
            }

            if (this.filter.length > 0) {
                args["search"] = `"${this.filter}"`;
            }

            const response = await GraphQl.query({
                animes: {
                    args, fields: ["id", { poster: ["mainUrl"] }, "russian", { airedOn: ["year"] }, "score", { userRate: ["status"] }]
                }
            }, () => { }, this.signal.signal).POST(true);

            if (response.failed) {
                if (response.status === 429) {
                    await Sleep(1000);
                    return fetch();
                }
                return [];
            }

            return response.data.animes;
        }

        const raw = await fetch();

        if (raw.length < this.sentinel.limit) {
            this.sentinel.loaded = true;
        }

        return raw;
    }

    Filter(value) {
        if (this.sentinel.isFetch()) return;
        value = clearValue(value);
        if (!filter.call(this, value)) return;
        this.sentinel.reload();
        this.sentinel.isFetch(true);

        this.filter = value;

        this.sentinel.promise = this.process_next();

        function clearValue(value) {
            return value
                .trim()                 // убираем пробелы в начале и конце
                .replace(/\s+/g, ' ');  // заменяем все подряд идущие пробелы на один
        }

        function filter(value) {
            if (value.toLowerCase() === this.filter.toLowerCase()) return false;
            if (value.length === 0) return false;
            if (!value.trim()) return false;
            if (/\s{2,}/.test(value)) return false;

            return true;
        }
    }

    Clear() {
        if (this.sentinel.isFetch())
            this.signal.abort();

        this.filter = '';
        this.has = false;

        const cards = $(`.anime-list-wrapper > .grid-anime-list-wrapper > .card-anime`);

        this.sentinel.reload();
        this.sentinel.isFetch(false);

        this.sentinel.promise = this.process_next();
        this.sentinel.promise?.then(() => {
            cards.remove();
        });
    }

    Destoy() {
        this.signal.abort("[tun] close window");
        this.sentinel = null;
        this.ui = null;
        this.has = false;

        this.rule = [];
        this.filter = '';
    }
}

class UIBtn {
    constructor(/**@type {IO}*/io, dom) {
        this.io = io;
        this.val = false;
        this.$btn = $(dom);

        const originalHandler = this.io.sentinel.isFetch.bind(this.io.sentinel);

        this.io.sentinel.isFetch = (val) => {
            if (typeof val === "boolean") {
                this.val = val;
                this.update();
            }

            return originalHandler(val);
        };
    }

    update() {
        if (this.val) {
            this.$btn.removeClass('-rem').addClass('-load');
        } else {
            this.$btn.removeClass('-load').removeClass('-rem');
            if (this.io.filter.length !== 0) {
                this.$btn.addClass('-rem');
            }
        }
    }
}

let ______io = undefined;
let __window = undefined;

export async function WAnime(rule, { exclude = [] } = {}) {
    if (__window !== undefined) {
        ______io.Load(rule, exclude)
        await ______io.sentinel.promise;
        return __window.show();
    }

    const io = new IO("search");
    new UIBtn(io, `.anime-search-wrapper > .btn-filter`);

    const next = () => {
        io.Next();
    }

    const window = new TWindow({
        oninit: () => {
            let timer = undefined;

            const $input = $('.anime-search-wrapper > input');

            $input.on('keyup', (e) => {
                let value = e.currentTarget.value;

                if (e.which == 13) {
                    clearTimeout(timer);
                    $input.blur();
                    return io.Filter(value);
                }

                clearTimeout(timer);
                timer = setTimeout(() => {
                    io.Filter(value);
                }, 700);
            });

            $('.bar-anime').on('click', '.window-close', (e) => {
                window.hide();
            })

            $('.anime-search-wrapper').on('click', '.btn-filter', (e) => {
                let $btn = $(e.currentTarget);
                clearTimeout(timer);
                $input.blur();

                if ($btn.hasClass('-rem')) {
                    $input.val('');
                    return io.Clear();
                }

                io.Filter($input.val());
            });

            $('.anime-search-wrapper').on('click', '.btn-visible', (e) => {
                let $btn = $(e.currentTarget);

                io.ui.hide = !io.ui.hide;
                $btn.removeClass('-off');
                if (io.ui.hide) {
                    $btn.addClass('-off');
                }
            })
        }
    }, '.window-anime');

    io.Load(rule, exclude);
    await io.sentinel.promise;

    window.module.add(WindowIntercator);
    window.module.add(PullToClose, { scroll: '.window-content.content-anime > .content-wrapper' });
    window.module.add(LazyLoad, { sentinel: '.wrapper > .anime-sentinel', callback: next })

    window.show();
    __window = window;
    ______io = io;
}