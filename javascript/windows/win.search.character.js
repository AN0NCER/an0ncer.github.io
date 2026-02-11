import { TWindow } from "../core/window.core.js"
import { GraphQl } from "../modules/api.shiki.js";
import { Sleep } from "../modules/functions.js";
import { Template } from "../modules/tun.template.js";
import { LazyLoad, PullToClose, WindowIntercator } from "../modules/win.module.js";

const config = {
    key: "user-favorites",
    tpl: 'win.search.character.tpl',
    css: 'win.search.character.css',
    ell: '.window-character-list'
}


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
    constructor() {
        this.default = '../../../images/noanime.png';

        this.#load();
        this.#watcher();
    }

    #watcher() {
        const originalSetItem = localStorage.setItem;

        localStorage.setItem = (key, value) => {
            originalSetItem.call(localStorage, key, value);

            if (key === config.key) {
                this.#load(value);
            }
        }
    }

    #load(value) {
        const local = JSON.parse((value || localStorage.getItem(config.key)) || '{}');
        this.list = local?.Character || {};
    }

    gen = {
        card: ({ id, russian, name, poster }) => {
            const title = russian || name;
            const img = poster?.mainUrl || this.default;
            const is_favorite = this.list[id] ? true : false;
            return `<span class="character-card" data-id="${id}"><div class="img-wrapper" style="--img: url('${img}')">${is_favorite ? `<div class="favorite"><div class="ticon i-heart-solid"></div></div>` : ``}</div><div class="text-wrapper"><div class="name">${title}</div><div class="character-source"><span class="val">0 Аниме</span><div class="point"></div><span class="val">0 Манги</span></div></div></span>`
        },
        empty: () => {
            return `<span class="empty-card"><div class="title">Список пуст</div><div class="add">Воспользуйтесь поиском персонажей, чтобы найти персонажа из аниме или манги.</div></span>`;
        }
    }

    empty() {
        $(`.grid-wrapper-list > .characters-grid-list`).empty();
    }
}

class IO {
    constructor(type) {
        this.type = type;
        this.sentinel = new Sentinel();
        this.signal = new AbortController();
        this.ui = new UI();
        this.has = false;

        this.value = [];
        this.filter = '';
    }

    Load(value) { }

    Next() {
        if (this.sentinel.isFetch() || this.sentinel.loaded || this.sentinel.page === 0) return;
        this.sentinel.isFetch(true);

        this.sentinel.promise = this.process_next();
    }

    async process_next() {
        this.signal = new AbortController();
        const characters = await this.graphql_fetch(this.value);

        const dom = $(`.grid-wrapper-list > .characters-grid-list`);
        this.has = true;

        if (this.sentinel.page === 1) {
            this.ui.empty();

            if (characters.length === 0) {
                this.has = false;
                dom.append(this.ui.gen.empty());
            }
        }

        const html = [];

        for (const character of characters) {
            html.push(this.ui.gen.card(character));
        }

        dom.append(html.join(''));

        this.sentinel.isFetch(false);
    }

    async graphql_fetch() {
        this.sentinel.page++;

        const fetch = async () => {
            const args = {
                limit: this.sentinel.limit,
                page: this.sentinel.page,
            }

            if (this.value.length > 0) {
                args["ids"] = this.value;
            }

            if (this.filter.length > 0) {
                args["search"] = `"${this.filter}"`;
            }

            const response = await GraphQl.query({
                characters: {
                    args, fields: ["id", "name", "russian", { "poster": ["mainUrl"] }]
                }
            }, () => { }, this.signal.signal).POST();

            if (response.failed) {
                if (response.status === 429) {
                    await Sleep(1000);
                    return fetch();
                }
                return [];
            }

            return response.data.characters;
        }

        const raw = await fetch();

        if (raw.length < this.sentinel.limit) {
            this.sentinel.loaded = true;
        }

        return raw
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

    Clear() { }
    Destoy() {
        this.signal.abort("[tun] close window");
        this.sentinel = null;
        this.ui = null;
        this.has = false;

        this.value = [];
        this.filter = '';
    }
}

class List extends IO {
    constructor() {
        super("list");
    }

    Load(ids = []) {
        if (this.has || this.sentinel.loaded || this.sentinel.isFetch() || this.value == ids) return;
        this.value = ids;
        this.sentinel.promise = this.process_next();
    }

    Clear() {
        if (this.sentinel.isFetch())
            this.signal.abort()

        this.filter = '';
        this.has = false;

        const cards = $(`.grid-wrapper-list > .characters-grid-list > .character-card`);

        this.sentinel.reload();
        this.sentinel.isFetch(false);

        this.sentinel.promise = this.process_next();
        this.sentinel.promise?.then(() => {
            cards.remove();
        })
    }
}

class Search extends IO {
    constructor() {
        super("search");
    }

    Clear() {
        if (this.sentinel.isFetch())
            this.signal.abort();

        this.filter = '';
        this.value = [];
        this.has = false;

        const dom = $(`.grid-wrapper-list > .characters-grid-list`);
        this.ui.empty();
        dom.append(this.ui.gen.empty());

        this.sentinel.reload();
        this.sentinel.isFetch(false);
    }
}

class UIBtn {
    constructor(/**@type {IO}*/io) {
        this.io = io;
        this.val = false;
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
        const $btn = $('.character-search-wrapper > .btn');

        if (this.val) {
            $btn.removeClass('-rem').addClass('-load');
        } else {

            $btn.removeClass('-load').removeClass('-rem');
            if ((this.io.type === "list" && this.io.sentinel.loaded) || (this.io.type === "search" && this.io.has)) {
                $btn.addClass('-rem');
            }
        }
    }
}

const handleCharacterClick = (() => {
    let isProcessing = false;

    return async (id) => {
        if (isProcessing) return;

        isProcessing = true;

        try {
            const { WCharacter } = await import("./win.character.js");
            await WCharacter(id);
        } finally {
            isProcessing = false;
        }
    };
})();

/**
 * 
 * @param {"search" | "list"} type 
 * @param {{[dom]: "string", [click]: Function, [ids]: [number]}} param1 
 */
export async function WCharacterList(type = 'search', { dom = 'body', click = handleCharacterClick, ids = [] } = {}) {
    /**@type {IO} */
    const io = type === "search" ? new Search() : new List();
    new UIBtn(io);

    const load = async () => {
        if (type === "search")
            return;

        io.Load(ids);
        await io.sentinel.promise;
    }

    const next = () => {
        io.Next();
    }

    $(dom).append((await Template(config.tpl)).css(config.css, '/style/win/css').text());

    const window = new TWindow({
        oninit: () => {
            let timer = undefined;

            const $input = $('.character-search-wrapper > input');

            $input.on('keyup', (e) => {
                let value = e.currentTarget.value;

                if (e.which == 13) {
                    clearTimeout(timer);
                    return io.Filter(value);
                }

                clearTimeout(timer);
                timer = setTimeout(() => {
                    io.Filter(value);
                }, 700);
            });

            $('.character-search-wrapper').on('click', '.btn', (e) => {
                let $btn = $(e.currentTarget);
                clearTimeout(timer);

                if ($btn.hasClass('-rem')) {
                    $input.val('');
                    return io.Clear();
                }

                io.Filter($input.val());
            });

            let isProcessing = false;

            $('.characters-grid-list').on('click', '.character-card', async function () {
                if (isProcessing) return;

                const $ell = $(this);
                const $loader = $(`<span class="load"><div class="ticon i-circle-notch"></div></span>`)
                const id = $ell.attr('data-id');
                $ell.append($loader).addClass('-load');
                isProcessing = true;

                try {
                    await click(id);
                } finally {
                    $loader.remove();
                    $ell.removeClass('-load')
                    isProcessing = false;
                }
            });

            $('.banner-character-list > .window-close').on('click', function () {
                window.hide();
            })
        },
        animate: {
            animhide: () => {
                io.Destoy();
                window.destroy();
            }
        }
    }, config.ell);

    window.module.add(WindowIntercator);
    window.module.add(PullToClose, { scroll: '.content-character-list > .content-wrapper' })
    window.module.add(LazyLoad, { sentinel: '.wrapper > .character-sentinel', callback: next });

    await load();

    window.show();
}