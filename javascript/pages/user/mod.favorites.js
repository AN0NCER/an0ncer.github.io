import { OAuth } from "../../core/main.core.js";
import { ACard } from "../../modules/AnimeCard.js";
import { GraphQl, Users } from "../../modules/api.shiki.js";
import { ScrollElementWithMouse, Sleep } from "../../modules/functions.js";
import { TCache } from "../../modules/tun.cache.js";
import { TPage } from "../user.js";
import { IOFriends } from "./io.friends.js";
import { TFriends } from "./mod.friends.js";
import { IOUser } from "./mod.loader.js";
import { TEvents } from "./util.event.js";



class FAV extends TEvents {
    constructor(/**@type {UIFavorites} */ core) {
        super();

        this.cache = core.cache;
        this.oninit = false;
        this.uid = core.id;
    }

    /**
     * Сортирует массив по заданному порядку ID
     * @param {Array} items - Массив объектов для сортировки
     * @param {Array} orderIds - Массив ID определяющий порядок
     * @param {boolean} reverse - Обратный порядок
     */
    sortByIdOrder(items, orderIds, reverse = false) {
        const orderMap = new Map(orderIds.map((id, idx) =>
            [String(id), reverse ? orderIds.length - idx - 1 : idx]
        ));

        return items.sort((a, b) => {
            const orderA = orderMap.get(String(a.id)) ?? Infinity;
            const orderB = orderMap.get(String(b.id)) ?? Infinity;
            return orderA - orderB;
        });
    }
}

class Animes extends FAV {
    constructor(/**@type {UIFavorites} */ core) {
        super(core);

        this.sentinel = {
            /** Обрабатывается ли запрос */
            fetch: false,
            /** Загружает аниме с кэша */
            cached: true,
            /** Загружено ли полностью */
            loaded: false,
            /** Страница загрузки */
            page: 0,
            /** Количество аниме за запрос */
            count: 10,
            /** Текущая загрузка аниме c shikimori*/
            promise: undefined
        }

        core.on('init', ([raw, cached]) => {
            if (this.oninit) return;
            this.#init(raw.animes, cached);
        }, { once: true });

        core.on('update', ([raw, cached]) => {
            if (this.oninit) {
                const newIds = raw.animes.map(x => x.id);
                const idsUnchanged = newIds.length === this.#ids.length &&
                    newIds.every((id, index) => id === this.#ids[index]);

                if (!idsUnchanged) {
                    this.#update(newIds);
                }
            } else {
                this.#init(raw.animes);
            }
        }, { once: true });
    }

    #list = new Map();

    #init(animes = []) {
        const $list = $('.user-favorites-list > .anime-list-favorites');

        this.on('load', () => {
            //Отображение блока с аниме (избранные)
            if (animes.length !== 0) {
                $('.user-favorites-anime-wrapper').removeClass('-hide');
            }
            ScrollElementWithMouse($('.user-favorites-content-wrapper > .user-favorites-list'));

            const observer = new IntersectionObserver(async ([entry], obs) => {
                if (entry.isIntersecting === true) {
                    if (this.sentinel.promise) {
                        await this.sentinel.promise;
                    }

                    this.#next();
                }
            }, { rootMargin: '0px' });

            observer.observe($(`.user-favorites-list > .sentinel-wrapper > .sentinel`)[0]);
        }, { once: true })

        this.on('load', ({ list, page, iscache }) => {
            //После загрузки следующей страницы с аниме пользователя
            if (iscache) { //Нужно для того чтобы обновлять старые данные на новые
                this.#list.set(page, list)
            }

            for (const anime of list) {
                //Добавляем елементы в DOM
                $list.append(ACard.GenV2({ type: "a", anime, data: { page } }))
            }
        });

        this.on('update', ({ list, page }) => {
            //При обновлении старых данных (Когда были получени новые данные а старые аниме нужно поменять)
            const oldList = this.#list.get(page) ?? [];

            const { toRemove, toAdd } = this.#diff(oldList, list);

            for (const { anime } of toRemove) {
                //Удаление ненужных аниме
                $list.find(`[data-id="${anime.id}"]`).remove();
            }

            for (const { anime, toIndex } of toAdd) {
                //Добавление аниме
                const $card = ACard.GenV2({
                    type: "a",
                    anime,
                    data: { page }
                });

                // ищем позицию ТОЛЬКО среди этой страницы
                const $pageItems = $list.children(`[data-page="${page}"]`);
                const $before = $pageItems.eq(toIndex);

                if ($before.length) {
                    $before.before($card);
                } else {
                    $pageItems.last().after($card);
                }
            }

            //Это не кэшированая страниа уже а новая
            this.#list.delete(page);
        });

        this.#ids = animes.map(x => x.id);
        this.sentinel.promise = this.#next();
        this.oninit = true;
    }

    async #update(newIds) {
        if (this.sentinel.fetch) {
            await this.sentinel.promise;
        }

        //Очищаем старые значения кэша

        const metakey = `user-${this.uid}-animes-favourites`;
        const meta = await this.cache.get("metadata", metakey);

        if (meta && meta?.keys) {
            for (const key of meta.keys) {
                await this.cache.delete("requests", key)
            }
            await this.cache.delete("metadata", metakey)
        }

        // Сохраняем новые ID
        this.#ids = newIds;

        this.sentinel.page = 0;
        this.sentinel.cached = false;
        this.sentinel.loaded = false;

        this.sentinel.promise = this.#next();
    }

    /** Список id аниме из избраного пользователя @type {number[]} */
    #ids = [];

    get hash() { //Хэширование
        const str = this.#ids.join(',');
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Загрузка следующей страницы с аниме
     */
    async #next() {
        if (this.sentinel.loaded || this.sentinel.fetch) return;

        this.sentinel.fetch = true;
        this.sentinel.page += 1;

        let raw = await this.#load_from_cache();

        if (!this.sentinel.cached || !raw) {
            raw = await this.#load_anime_favorites();
            this.sentinel.cached = false;

            if (raw.length > 0) {
                const page = this.sentinel.page;
                this.update_cache(page, raw);
            }
        }

        this.#event_trigger(raw, this.sentinel.page, this.sentinel.cached);

        this.sentinel.fetch = false;
    }

    /**
     * Загружает список аниме с определеной страници из кэша
     */
    async #load_from_cache() {
        const key = `animes-${this.uid}-${this.sentinel.page}-${this.hash}`;

        const raw = await this.cache.get("requests", key);

        if (raw) {
            this.sentinel.loaded = this.#ids.length === raw.length || raw.length < this.sentinel.count;
        } else {
            this.sentinel.cached = false;
        }

        return raw;
    }

    //Список переданных страниц аниме
    #set = new Set();

    /**
     * Распределяет куда сделать обратный сызов загруженого списка аниме
     * @param {Object | null} list 
     * @param {number} page 
     * @param {boolean} [iscache] 
     */
    #event_trigger(list, page, iscache = false) {
        if (!list) return;

        /**Передана ли данная страница уже */
        const isset = this.#set.has(page);

        if (isset) {
            return this.trigger('update', { list, page, iscache });
        }

        // Добавить новую страницу
        this.#set.add(page);
        return this.trigger('load', { list, page, iscache })
    }

    /**
     * Загрузка аниме с Shikimori
     */
    async #load_anime_favorites() {
        const total = this.#ids.length;

        const to = total - this.sentinel.count * (this.sentinel.page - 1);
        const from = Math.max(0, to - this.sentinel.count);

        const ids = this.#ids.slice(from, to);

        if (ids.length === 0) {
            this.sentinel.loaded = true;
            return [];
        }

        // если дошли до начала массива (старые элементы кончились)
        if (from === 0 || ids.length < this.sentinel.count) {
            this.sentinel.loaded = true;
        }

        const fetch = async (ids) => {
            const response = await GraphQl.animes({ ids: `"${ids.join(',')}"`, limit: ids.length }).POST(["id", { poster: ["mainUrl"] }, "russian", { airedOn: ["year"] }, "score"]);

            if (response.failed) {
                if (response.status === 429) {
                    await Sleep(1000);
                    return fetch(ids);
                }
                return [];
            }

            return this.sortByIdOrder(response.data.animes, ids, true);
        }

        const raw = await fetch(ids);

        if (raw.length < this.sentinel.count) {
            this.sentinel.loaded = true;
        }

        const indexMap = new Map(ids.map((id, i) => [String(id), i]));
        raw.sort((a, b) => indexMap.get(b.id) - indexMap.get(a.id));

        return raw;
    }

    /**
     * Обновляет кэш если это пользователь или друг
     * @param {number} page 
     * @param {Array} value 
     */
    async update_cache(page, value) {
        const event = async (page, value) => {
            const key = `user-${this.uid}-animes-favourites`;
            const metakey = `animes-${this.uid}-${page}-${this.hash}`;
            if (value && value.length > 0) {
                const meta = (await this.cache.get("metadata", key)) || { keys: [] };
                meta.keys.push(metakey);
                await this.cache.put("metadata", key, meta);
                this.cache.put("requests", metakey, value);
            }
        }

        TFriends.on("init", async () => {
            if (await IOFriends.canCachePage(TPage.id)) {
                this.update_cache = event;
                this.update_cache(page, value);
            } else {
                this.update_cache = () => { };
            }
        }, { once: true, replay: true });
    }

    /**
     * Высчитывает старрые данные и новые 
     * @param {*} oldList 
     * @param {*} newList 
     * @param {*} getId 
     * @returns Возвращает что нужно удалить, а какие аниме добавить с позиционированием
     */
    #diff(oldList, newList, getId = x => x.id) {
        const oldMap = new Map(oldList.map((x, i) => [getId(x), i]));
        const newMap = new Map(newList.map((x, i) => [getId(x), i]));

        const toRemove = [];
        const toAdd = [];

        for (const [id, index] of oldMap) {
            if (!newMap.has(id)) {
                toRemove.push({ anime: oldList[index], fromIndex: index });
            }
        }

        for (const [id, index] of newMap) {
            if (!oldMap.has(id)) {
                toAdd.push({ anime: newList[index], toIndex: index });
            }
        }

        return { toRemove, toAdd };
    }
}

class Characters extends FAV {
    constructor(/**@type {UIFavorites} */ core) {
        super(core);

        this.config = {
            cached: true,
            count: 7
        }

        core.on('init', ([raw, cached]) => {
            if (raw.characters.length > 0 || IOFriends.isWhoami) {
                $('.user-characters-favorites-wrapper').removeClass('-hide');
            }
            this.config.cached = cached;
            this.#init(raw.characters.map(x => x.id));
        }, { once: true });

        core.on('update', ([raw, cached]) => {
            if (this.oninit) {
                const newIds = raw.characters.map(x => x.id).slice(0, this.config.count);
                const idsUnchanged = newIds.length === this.#ids.length &&
                    newIds.every((id, index) => id === this.#ids[index]);

                if (!idsUnchanged) {
                    IOUser.on('update', (data) => {
                        const character = data?.public?.character || {};
                        this.#update(newIds, character);
                    }, { once: true, replay: true });
                }
            } else {
                this.#init(raw.characters);
            }
        }, { once: true });

        ((process = false) => {
            const loader = () => {
                return `<span class="load"><div class="ticon i-circle-notch"></div></span>`
            }

            const setProcess = (on = false, $element) => {
                process = on;

                if (!process) {
                    return $('.character-hexagon').removeClass('-load').find('.load').remove();
                }

                if (process && $element) {
                    $element.addClass('-load').append(loader());
                }
            }

            const handleCharacterClick = (() => {
                let added = new Map();
                let removed = new Map();
                let is_changed = false;

                const tun = {};

                const onadd = (id, { x, y, img }) => {
                    is_changed = true;

                    tun[id] = { x, y, link: img };
                    added.set(id, id);
                    this.#ids.push(id);
                };

                const onremove = (id) => {
                    delete tun[id];

                    if (added.has(id)) {
                        added.delete(id);
                    } else {
                        removed.set(id, id);
                    }

                    is_changed = true;

                    if (added.size === 0 && removed.size === 0) {
                        is_changed = false;
                    }

                    const index = this.#ids.findIndex(x => String(x) === String(id));
                    this.#ids.splice(index, 1);
                };

                const onhide = () => {
                    if (is_changed) {
                        this.#update(this.#ids, tun);
                        added = null;
                        removed = null;
                    }
                }

                let isProcessing = false;

                return async (id) => {
                    if (isProcessing) return;

                    isProcessing = true
                    added = new Map();
                    removed = new Map();

                    try {
                        const { WCharacter } = await import("../../windows/win.character.js");
                        await WCharacter(id, { onadd, onremove, onhide });
                    } finally {
                        setProcess(false);
                        isProcessing = false;
                    }
                }
            })();

            $(`.user-characters-content-wrapper`).on('click', '.character-hexagon', (element) => {
                if (process) return;
                const $element = $(element.currentTarget);
                const id = $element.attr('data-id');

                if (id === "null") return;
                if (id === "search") {
                    setProcess(true, $element);
                    import("../../windows/win.search.character.js").then(({ WCharacterList }) => {
                        WCharacterList("search", { click: handleCharacterClick }).then(() => {
                            setProcess(false);
                        });
                    })
                } else {
                    setProcess(true, $element);
                    try {
                        handleCharacterClick(id);
                    } catch (err) {
                        console.log(err);
                    }
                }
            });
        })()
    }

    #list = new Map();
    #ids = [];

    async #init(characters = []) {
        if (characters.length === 0 && this.uid !== OAuth.user?.id) return;

        this.#ids = characters;

        const data = await Promise.all([
            new Promise((resolve) => IOUser.on("load", resolve, { once: true, replay: true })),
            this.#load_characters_favorites()
        ]);

        this.#process(data);
    }

    async #load_characters_favorites() {
        const ids = this.#ids.slice(0, this.config.count);

        if (this.config.cached) {
            const cache = await this.#load_from_cache();
            if (cache) return cache;
        }

        const raw = await this.#fetch(ids);
        this.update_cache(raw);

        return raw;
    }

    async #fetch(ids = []) {
        if (ids.length === 0) {
            return [];
        }

        const response = await GraphQl.query({
            characters: {
                args: { ids: [ids.join(',')], limit: ids.length },
                fields: ["id", "russian", { poster: ["mainUrl"] }]
            }
        }).POST();

        if (response.failed) {
            if (response.status == 429) {
                await Sleep(1000);
                return this.#fetch(ids);
            }

            return [];
        }

        // сортировка в порядке ids
        return this.sortByIdOrder(response.data.characters, ids, false);
    }

    async #load_from_cache() {
        const key = `user-${this.uid}-characters-favourites`;

        const cache = await this.cache.get("requests", key);

        return cache;
    }

    async update_cache(value) {
        const event = async (value) => {
            const key = `user-${this.uid}-characters-favourites`;
            if (value && value.length > 0) {
                this.cache.put("requests", key, value);
            }
        }

        TFriends.on("init", async () => {
            if (await IOFriends.canCachePage(TPage.id)) {
                this.update_cache = event;
                this.update_cache(value);
            } else {
                this.update_cache = () => { };
            }
        }, { once: true, replay: true });
    }

    #create = (id, link, x, y) => {
        return $(`<div class="character-hexagon" data-id="${id}"><svg viewBox="0 0 174 200"><defs><clipPath id="hexClip"><path d="M82.0172 1.32985C85.1024 -0.443295 88.8976 -0.443291 91.9828 1.32986L168.983 45.5827C172.087 47.3665 174 50.6731 174 54.2529V142.679C174 146.259 172.087 149.566 168.983 151.35L91.9828 195.602C88.8976 197.376 85.1024 197.376 82.0172 195.602L5.01715 151.35C1.91348 149.566 0 146.259 0 142.679V54.2529C0 50.6731 1.91348 47.3665 5.01716 45.5827L82.0172 1.32985Z" /></clipPath></defs><g clip-path="url(#hexClip)"><image href="${link}" x="${x}" y="${y}" width="174" preserveAspectRatio="xMidYMid slice" /></g><path d="M82.1172 1.50327C85.1406 -0.234211 88.8594 -0.234211 91.8828 1.50327L168.883 45.7562C171.924 47.5042 173.8 50.7451 173.8 54.2533V142.679C173.8 146.187 171.924 149.428 168.883 151.176L91.8828 195.429C88.8594 197.167 85.1406 197.167 82.1172 195.429L5.11719 151.176C2.07558 149.428 0.200195 146.187 0.200195 142.679V54.2533C0.200195 50.7451 2.07558 47.5042 5.11719 45.7562L82.1172 1.50327Z" stroke="white" stroke-opacity="0.8" stroke-width="0.4" fill="none" /></svg></div>`);
    }

    #empty = (add = false) => {
        return $(`<div class="character-hexagon" data-id="${add ? "search" : "null"}"><svg viewBox="0 0 174 200"><path d="M82.1172 1.50327C85.1406 -0.234211 88.8594 -0.234211 91.8828 1.50327L168.883 45.7562C171.924 47.5042 173.8 50.7451 173.8 54.2533V142.679C173.8 146.187 171.924 149.428 168.883 151.176L91.8828 195.429C88.8594 197.167 85.1406 197.167 82.1172 195.429L5.11719 151.176C2.07558 149.428 0.200195 146.187 0.200195 142.679V54.2533C0.200195 50.7451 2.07558 47.5042 5.11719 45.7562L82.1172 1.50327Z" stroke="white" stroke-opacity="0.8" stroke-width="0.4" fill="#191C21" />${add ? `<path d="M87 125C93.6304 125 99.9893 122.366 104.678 117.678C109.366 112.989 112 106.63 112 100C112 93.3696 109.366 87.0107 104.678 82.3223C99.9893 77.6339 93.6304 75 87 75C80.3696 75 74.0107 77.6339 69.3223 82.3223C64.6339 87.0107 62 93.3696 62 100C62 106.63 64.6339 112.989 69.3223 117.678C74.0107 122.366 80.3696 125 87 125ZM84.6562 108.594V102.344H78.4062C77.1074 102.344 76.0625 101.299 76.0625 100C76.0625 98.7012 77.1074 97.6562 78.4062 97.6562H84.6562V91.4062C84.6562 90.1074 85.7012 89.0625 87 89.0625C88.2988 89.0625 89.3438 90.1074 89.3438 91.4062V97.6562H95.5938C96.8926 97.6562 97.9375 98.7012 97.9375 100C97.9375 101.299 96.8926 102.344 95.5938 102.344H89.3438V108.594C89.3438 109.893 88.2988 110.938 87 110.938C85.7012 110.938 84.6562 109.893 84.6562 108.594Z" fill="white" fill-opacity="0.4" /></svg></div>` : ""}`);
    }

    async #process([tun, characters]) {
        tun = tun?.public?.character ?? {};

        const ROW1_SIZE = 4;
        const ROW2_SIZE = 3;

        // Добавляем элементы в DOM
        const row1 = $('.character-row-1');
        const row2 = $('.character-row-2');

        // Массивы для хранения элементов каждого ряда
        const row1Items = [];
        const row2Items = [];

        let charIndex = 0;
        let nextEmptyPosition = -1; // позиция для empty(true)

        // Распределяем персонажей чередуя ряды
        for (let i = 0; i < ROW1_SIZE + ROW2_SIZE; i++) {
            const isRow1 = i % 2 === 0;

            if (isRow1 && row1Items.length < ROW1_SIZE) {
                if (charIndex < characters.length) {
                    this.#list.set(characters[charIndex].id, [i, 1]);
                    row1Items.push({ char: characters[charIndex], position: i });
                    charIndex++;
                } else {
                    if (nextEmptyPosition === -1) nextEmptyPosition = i;
                    row1Items.push({ char: null, position: i });
                }
            } else if (!isRow1 && row2Items.length < ROW2_SIZE) {
                if (charIndex < characters.length) {
                    this.#list.set(characters[charIndex].id, [i, 2]);
                    row2Items.push({ char: characters[charIndex], position: i });
                    charIndex++;
                } else {
                    if (nextEmptyPosition === -1) nextEmptyPosition = i;
                    row2Items.push({ char: null, position: i });
                }
            }
        }

        //Авторизированный пользователь
        const auth = OAuth.user.id === this.uid;

        // Заполняем первый ряд
        row1Items.forEach(item => {
            if (item.char) {
                const config = { x: 0, y: 0, ...tun[String(item.char.id)] || {} };
                if (!config?.link) {
                    config.link = item.char.poster?.mainUrl || '/images/noanime.png';
                }
                row1.append(this.#create(item.char.id, config.link, config.x, config.y));
            } else {
                // Это первая пустая позиция?
                const isAddButton = item.position === nextEmptyPosition && auth;
                row1.append(this.#empty(isAddButton));
            }
        });

        // Заполняем второй ряд
        row2Items.forEach(item => {
            if (item.char) {
                const config = { x: 0, y: 0, ...tun[String(item.char.id)] || {} };
                if (!config?.link) {
                    config.link = item.char.poster.mainUrl || '/images/noanime.png';
                }
                row2.append(this.#create(item.char.id, config.link, config.x, config.y));
            } else {
                // Это первая пустая позиция?
                const isAddButton = item.position === nextEmptyPosition && auth;
                row2.append(this.#empty(isAddButton));
            }
        });

        this.oninit = true;
        this.trigger("load", { replay: true });
    }

    // async #update(characters = []) {
    //     const key = `user-${this.uid}-characters-favourites`;
    //     this.cache.delete("requests", key);

    //     this.config.cached = false;

    //     $('.character-row-1').empty();
    //     $('.character-row-2').empty();

    //     this.#init(characters);
    // }

    async #update(characters = [], tunime = {}) {
        const key = `user-${this.uid}-characters-favourites`;
        this.cache.delete("requests", key);

        this.config.cached = false;

        const hex = [
            $('.character-row-1 > .character-hexagon'),
            $('.character-row-2 > .character-hexagon'),
        ]

        this.#ids = characters;

        const data = await Promise.all([
            new Promise(resolve => IOUser.on('load', (data) => { resolve({ public: { character: { ...data.public.character, ...tunime } } }) }, { once: true, replay: true })),
            this.#load_characters_favorites()
        ]);

        await this.#process(data);

        hex.every(x => x.remove());
    }
}

export class UIFavorites extends TEvents {
    constructor(id) {
        super();

        //Управление кэшом
        this.cache = new TCache();
        // ID Пользовательской страницы
        this.id = id;

        //Классы управлением избранным пользователя
        this.animes = new Animes(this);//Animes
        this.characters = new Characters(this);//Characters

        this.#init();
    }

    #initialized = false;

    #callback(value, cached) {
        this.trigger("init", [value, cached], { replay: true });

        if (this.#initialized) {
            this.trigger("update", [value, cached]);
        }

        this.#initialized = true;
    }

    #ready() {
        return Promise.all([
            new Promise(resolve => this.animes.on('load', resolve, { once: true, replay: true })),
            new Promise(resolve => this.characters.on('load', resolve, { once: true, replay: true }))
        ]);
    }

    async #init({ } = {}) {
        const cache = await this.cache.get("requests", `user-${this.id}-favourites`);

        if (cache) {
            this.#callback(cache, true);
            await this.#ready();
        }

        const fetch = async (id = this.id) => {
            const response = await Users.favourites(id).GET();

            if (response.failed) {
                if (response.status == 429) {
                    await Sleep(1000);
                    return fetch(id);
                }
                return { animes: [], characters: [] };
            }

            return response;
        }

        const value = await fetch(this.id);
        this.#callback(value, false);

        TFriends.on("init", async () => {
            if (await IOFriends.canCachePage(TPage.id)) {
                this.cache.put("requests", `user-${this.id}-favourites`, value);
            }
        }, { once: true, replay: true });

        return this;
    }
}