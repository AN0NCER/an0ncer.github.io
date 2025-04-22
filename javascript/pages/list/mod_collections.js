import Collection from "../../modules/Collection.js";
import { Sleep } from "../../modules/functions.js";
import { ShowInfo } from "../../modules/Popup.js";
import { GraphQl } from "../../modules/ShikiAPI.js";
import { WindowManagement } from "../../modules/Windows.js";
import { HCollection } from "./mod_html.js";
import { AnimeWindow } from "./mod_w_anime.js";

class Core {

    #callbacks = {
        click: []
    };

    constructor({ control } = {}) {
        this.control = control;
        this.collections = [];
        this.loaded = false;

        this.previewLimit = 5;
        this.callLimit = 20;
        this.loadPage = 1;
        this.previewLoaded = false;

        this.#Sort();

        this.events = {
            off: () => {
                $('.item-collection').off('click.collection');
            },
            on: () => {
                $('.item-collection').on('click.collection', (e) => {
                    const id = $(e.currentTarget).data('id');
                    this.#Dispatch('click', id);
                });
            },
            reload: () => {
                this.events.off();
                this.events.on();
            }
        }
    }

    Preview() {
        if (this.previewLoaded) return;
        this.previewLoaded = true;
        const previewLimit = this.previewLimit - 1;
        let mergeredArray = [];
        for (let i = 0; i < this.control.list.length && i <= previewLimit; i++) {
            const element = this.control.list[i];
            let h = HCollection.Load({
                title: element.name,
                id: element.id,
                count: element.list.length
            })

            if (element.list.length <= 0) {
                h = HCollection.Iteam({
                    title: element.name,
                    id: element.id,
                    count: element.list.length,
                });
            }

            $(`.span-row`).append(h);
            $(`.list-collection`).append(h);

            mergeredArray = [...new Set([...mergeredArray, ...element.list.slice(0, 4)])];
        }

        this.events.reload();

        this.#LoadImages(mergeredArray).then((list) => {
            for (let i = 0; i < this.control.list.length && i <= previewLimit; i++) {
                this.collections.push(this.control.list[i].id);
                const ids = this.control.list[i].list.slice(0, 4);

                const bgs = ids.map((id) => {
                    return list.find((item) => item.id == id).poster.previewUrl;
                });

                for (let j = 0; j < bgs.length; j++) {
                    if (j == 0) {
                        $(`.item-collection[data-id="${this.control.list[i].id}"] > .bg-collection > .block-1`).attr("style", `--bg-image: url(${bgs[j]})`).removeClass("loading");
                    } else {
                        $(`.item-collection[data-id="${this.control.list[i].id}"] > .bg-collection > .block-2 > .preview:nth-child(${j})`).attr("style", `--bg-image: url(${bgs[j]})`).removeClass("loading");
                    }
                }
            }
        });
    }

    Load() {
        const collections = this.control.list.filter((item) => !this.collections.includes(item.id));
        let mergeredArray = [];
        for (let i = 0; i < collections.length; i++) {
            const element = collections[i];
            const h = HCollection.Load({
                title: element.name,
                id: element.id,
                count: element.list.length
            });
            $(`.list-collection`).append(h);
            mergeredArray = [...new Set([...mergeredArray, ...element.list.slice(0, 4)])];
        }

        this.loaded = true;
        this.events.reload();

        this.#LoadImages(mergeredArray).then((list) => {
            for (let i = 0; i < collections.length; i++) {
                const ids = collections[i].list.slice(0, 4);
                const bgs = ids.map((id) => {
                    return list.find((item) => item.id == id).poster.previewUrl;
                });

                for (let j = 0; j < bgs.length; j++) {
                    if (j == 0) {
                        $(`.item-collection[data-id="${collections[i].id}"] > .bg-collection > .block-1`).attr("style", `--bg-image: url(${bgs[j]})`).removeClass("loading");
                    } else {
                        $(`.item-collection[data-id="${collections[i].id}"] > .bg-collection > .block-2 > .preview:nth-child(${j})`).attr("style", `--bg-image: url(${bgs[j]})`).removeClass("loading");
                    }
                }
            }
        });
    }

    #Sort() {
        this.control.list.sort((a, b) => {
            return new Date(b.modified) - new Date(a.modified);
        });
    }

    #LoadImages(ids = []) {
        return new Promise((resolve) => {
            GraphQl.animes({ ids: `"${ids.toString()}"`, limit: ids.length }, async (response) => {
                if (response.failed) {
                    if (response.status == 429) {
                        await Sleep(1000);
                        return resolve(this.#LoadImages(ids));
                    }
                    return console.log('Не удалось загрузить изображения коллекций данные');
                }
                if (response.errors) {
                    return resolve([]);
                }
                const list = response.data.animes;
                return resolve(list);
            }).POST(["id", { "poster": ["id", "previewUrl"] }]);
        });
    }

    LoadImages(ids = []) {
        return this.#LoadImages(ids);
    }

    /**
     * Добавляет обработчик события.
     * @param { "process" } event - Название события.
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

class Search {
    #callbacks = {
        found: [],
        next: [],
        init: []
    };

    constructor() {
        /**@type {Collection} */
        this.control = undefined;
        this.core = undefined;

        this.preload = [];

        this.list = [];
        this.listByName = [];
        this.limit = 5;
    }

    Init({ control, core }) {
        /**@type {Collection} */
        this.control = control;
        this.core = core;
    }

    /**
     * Поиск аниме в коллекциях
     * @param {{title: string, animes: [{id: string}]}} animes - Список аниме
     */
    Search({ title, animes = [] } = {}) {
        clearTimeout(this.#timer);
        let ids = this.listByName.map(x => x.id);

        if (ids.length === 0) {
            ids = this.control.Collection.FindAll({ value: title }).slice(0, this.limit).map(x => x.id);
        }

        if (ids.length == 5)
            return this.#Dispatch('found', ids);

        if (animes.length <= 0)
            return this.#Dispatch('found', ids);

        for (let i = 0; i < animes.length && ids.length < this.limit; i++) {
            const element = animes[i];
            const collection = this.control.Collection.Find({ id: element.id, type: 'anime' });
            if (collection.length > 0 && !ids.includes(collection.id)) {
                ids = [...new Set([...ids, ...collection])];
            }
        }

        return this.#Dispatch('found', ids);
    }

    Clear() {
        clearTimeout(this.#timer);
        this.#elements = [];
        const elements = $(`.span-row > .item-collection`);
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const attr = $(element).attr('data-id');
            if (attr === undefined || !this.core.collections.includes(attr)) {
                $(element).remove();
            }
        }
        $(`.span-row > .item-collection`).show();
        this.list = [];
        this.listByName = [];
    }

    Next(animes = []) {
        if (this.list.length >= this.limit) return;

        let ids = [];

        for (let i = 0; i < animes.length && (this.list.length + ids.length) < this.limit; i++) {
            const element = animes[i];
            const collection = this.control.Collection.Find({ id: element.id, type: 'anime' });
            if (collection.length > 0 && !ids.includes(collection.id)) {
                ids = [...new Set([...ids, ...collection])];
            }
        }

        const load = [];

        for (let i = 0; i < ids.length; i++) {
            const element = ids[i];

            if (this.core.collections.includes(element)) {
                $(`.span-row > .item-collection[data-id="${element}"]`).show();
            } else if (this.preload.findIndex(x => x.id === element) !== -1) {
                const preload = this.preload.find(x => x.id === element);
                const h = HCollection.Iteam({
                    title: preload.title,
                    id: preload.id,
                    count: preload.list.length,
                    bgs: preload.bgs
                });
                $(`.span-row`).append(h);
            } else if ($(`.list-collection >.item-collection[data-id="${element}"]`).length !== 0) {
                $(`.list-collection >.item-collection[data-id="${element}"]`).clone().appendTo(`.span-row`);
            } else {
                load.push(this.control.Collection.Get({ id: element }));
            }

            this.list.push(element);
        }

        if (load.length <= 0) return;

        this.#LoadImages(ids, load);
    }

    #LoadImages(animes = [], load = []) {
        this.core.LoadImages(animes).then((list) => {
            for (let i = 0; i < load.length; i++) {
                const ids = load[i].list.slice(0, 4);
                const bgs = ids.map((id) => {
                    return list.find((item) => item.id == id).poster.previewUrl;
                });

                this.preload.push({ id: load[i].id, title: load[i].name, list: load[i].list.slice(0, 4), bgs });

                for (let j = 0; j < bgs.length; j++) {
                    if (j == 0) {
                        $(`.span-row > .item-collection[data-id="${load[i].id}"] > .bg-collection > .block-1`).attr("style", `--bg-image: url(${bgs[j]})`).removeClass("loading");
                    } else {
                        $(`.span-row > .item-collection[data-id="${load[i].id}"] > .bg-collection > .block-2 > .preview:nth-child(${j})`).attr("style", `--bg-image: url(${bgs[j]})`).removeClass("loading");
                    }
                }
            }
        });
    }

    #timer = undefined;
    #elements = [];

    Entry(title) {
        this.listByName = this.control.Collection.FindAll({ value: title }).slice(0, this.limit);

        const _clearElements = (clear = false) => {
            if (clear) {
                for (let i = 0; i < this.#elements.length; i++) {
                    const element = this.#elements[i];
                    if (this.listByName.findIndex(x => x.id === element) === -1) {
                        $(`.span-row > .item-collection[data-id="${element}"]`).remove();
                    }
                }
                this.#elements = [];
            } else {
                for (let i = 0; i < this.#elements.length; i++) {
                    const element = this.#elements[i];
                    if (this.listByName.findIndex(x => x.id === element) === -1) {
                        $(`.span-row > .item-collection[data-id="${element}"]`).remove();
                        this.#elements.splice(i, 1);
                        i--;
                    }
                }
            }
        }


        if (this.listByName.length === 0) {
            clearTimeout(this.#timer);
            _clearElements(true);
            $(`.span-row > .item-collection`).hide();
            return HCollection.NotFound.Show('.span-row');
        }

        HCollection.NotFound.Hide('.span-row');
        _clearElements(false);

        let animes = [];
        let load = [];
        $(`.span-row > .item-collection`).hide();

        for (let i = 0; i < this.listByName.length; i++) {
            const element = this.listByName[i];
            if (this.core.collections.includes(element.id)) {
                $(`.span-row > .item-collection[data-id="${element.id}"]`).show();
            } else if (this.preload.findIndex(x => x.id === element.id) !== -1) {
                const preload = this.preload.find(x => x.id === element.id);
                if (!this.#elements.includes(preload.id)) {
                    this.#elements.push(preload.id);
                    const h = HCollection.Iteam({
                        title: preload.title,
                        id: preload.id,
                        count: preload.list.length,
                        bgs: preload.bgs
                    });
                    $(`.span-row`).append(h);
                } else {
                    $(`.span-row > .item-collection[data-id="${element.id}"]`).show();
                }

            } else {
                load.push(element);
                animes = [...animes, ...element.list.slice(0, 4)];
                if (!this.#elements.includes(element.id)) {
                    this.#elements.push(element.id);
                    const h = HCollection.Load({
                        title: element.name,
                        id: element.id,
                        count: element.list.length
                    });
                    $(`.span-row`).append(h);
                } else {
                    $(`.span-row > .item-collection[data-id="${element.id}"]`).show();
                }
            }
        }

        clearTimeout(this.#timer);
        this.#timer = setTimeout(() => {
            this.#LoadImages(animes, load);
        }, 5000);
    }

    Load(collections = []) {
        clearTimeout(this.#timer);
        if (collections.length === 0) return;

        const load = [];

        $(`.span-row > .item-collection`).hide();

        for (let i = 0; i < collections.length; i++) {
            const element = collections[i];

            if (this.core.collections.includes(element)) {
                $(`.span-row > .item-collection[data-id="${element}"]`).show();
            } else if (this.preload.findIndex(x => x.id === element) !== -1) {
                const preload = this.preload.find(x => x.id === element);
                const h = HCollection.Iteam({
                    title: preload.title,
                    id: preload.id,
                    count: preload.list.length,
                    bgs: preload.bgs
                });
                $(`.span-row`).append(h);
            } else if ($(`.list-collection >.item-collection[data-id="${element}"]`).length !== 0) {
                $(`.list-collection >.item-collection[data-id="${element}"]`).clone().appendTo(`.span-row`);
            } else {
                load.push(this.control.Collection.Get({ id: element }));
            }

            this.list.push(element);
        }

        if (load.length <= 0) return;

        for (let i = 0; i < load.length; i++) {
            const element = load[i];
            const h = HCollection.Load({
                title: element.name,
                id: element.id,
                count: element.list.length
            });
            $(`.span-row`).append(h);
        }

        let animes = [];

        for (let i = 0; i < load.length; i++) {
            const element = load[i];
            animes = [...animes, ...element.list.slice(0, 4)];
        }

        this.#LoadImages(animes, load);
    }

    /**
     * Добавляет обработчик события.
     * @param { "select" } event - Название события.
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

/**
 * @type {Core}
 */
let CORE = undefined;
let SEARCH = new Search();;

export const InitCollections = () => {
    const c = new Collection();
    c.on("loaded", () => {
        CORE = new Core({ control: c });
        SEARCH.Init({ control: c, core: CORE });
        CORE.on("click", (data) => {
            anime({
                targets: `.item-collection[data-id="${data}"]`,
                scale: [1, 0.9, 1],
                duration: 100,
                easing: "easeInOutQuad"
            });
            const collection = c.Collection.Find({ id: data, type: "collection" });
            if (collection.list.length <= 0) return ShowInfo(`Коллекция пуста`, 'collection-empty');
            const list = [...new Set(collection.list)];
            CORE.events.off();
            $(`.item-collection[data-id="${data}"]`).addClass("loading");
            AnimeWindow({
                list: list,
                title: collection.name
            }).then(() => {
                $(`.item-collection[data-id="${data}"]`).removeClass("loading");
                CORE.events.on();
            });
        });
        CORE.Preview();
    });
    c.Init();

    $(`.title-block.collections`).click(ShowAllCollections);
};

function ShowAllCollections() {
    _windowCollection.target.show();
}

const _windowCollection = new WindowManagement({
    init: function () {
        $(`.bar-collection > .close-btn`).on("click", () => {
            this.hide();
        });
        let last = "";
        $(`.collection-search > .wrapper > input`).on("keyup", (e) => {
            const value = e.target.value.trim();
            if (value && value !== last) {
                last = value;

                const collections = CORE.control.Collection.FindAll({ value });
                const items = $(`.list-collection > .item-collection`)

                for (let i = 0; i < items.length; i++) {
                    const item = $(items[i]);
                    if (collections.findIndex(x => x.id === item.attr('data-id')) === -1) {
                        item.hide();
                    } else {
                        item.show();
                    }
                }
            } else if (!value) {
                $(`.list-collection > .item-collection`).show();
            }
        });
    },
    show: function () {
        _windowCollection.show();
    },
    hide: function () {
        _windowCollection.hide();
    },
    verif: function () {
        return true;
    },
    anim: {
        showed: function () {
            if (CORE.loaded) return;
            CORE.Load();
        },
        hided: function () { },
    },
}, '.window-collection');

export const CSearch = () => {
    return SEARCH;
}