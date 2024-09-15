import { arraysAreEqual, Sleep } from "./functions.js";
import { Favorites, Users } from "./ShikiAPI.js";
import { User } from "./ShikiUSR.js";

let __collection = undefined;

class Collection {
    #pass = ["favourites"];
    #callbacks = {
        "new_collection": [],
        "remove_collection": [],
        "remove_anime": [],
        "change_collection": [],
        "loaded": [],
        "rename_collection": [],
        "storage": []
    };

    constructor({ INIT = false } = {}) {
        if (__collection !== undefined) {
            return __collection;
        }

        __collection = this;
        this.key = 'anime-collection';
        /**@type {Array<{name: string, id: string, modified: string, list: Array<number>>} */
        this.list = JSON.parse(localStorage.getItem(this.key)) || [
            { name: 'Избранное', id: 'favourites', modified: new Date().toISOString(), list: [] }
        ];

        this.Collection = {
            /**
             * Создаёт новую коллекцию.
             * @param {string} name - Название коллекции.
             * @returns {{name: string, id: string, modified: string, list: Array<number>}} - Объект с данными коллекции.
             */
            New: (name) => {
                const id = this.Id;
                if (this.list.find(x => x.id === id)) return this.Collection.New(name);
                const data = { name, id, modified: new Date().toISOString(), list: [] };
                this.list.push(data);
                localStorage.setItem(this.key, JSON.stringify(this.list));
                this.#Dispatch("new_collection", data);
                return data;
            },

            Rename: (id, name) => {
                const index = this.list.findIndex(x => x.id === id);
                if (index === -1) return;
                this.list[index].name = name;
                this.list[index].modified = new Date().toISOString();
                localStorage.setItem(this.key, JSON.stringify(this.list));
                this.#Dispatch("rename_collection", this.list[index]);
                return this.list[index];
            },

            /**
             * Удаляет коллекцию.
             * @param {string} id - Идентификатор коллекции.
             */
            Remove: (id) => {
                if (this.#pass.includes(id)) return;
                const index = this.list.findIndex(x => x.id === id);
                if (index === -1) return;
                this.list.splice(index, 1);
                localStorage.setItem(this.key, JSON.stringify(this.list));
                this.#Dispatch("remove_collection", { id });
            },

            Anime: {
                /**
                 * Добавляет аниме в коллекцию.
                 * @param {number} aid - Идентификатор аниме.
                 * @param {string} cid - Идентификатор коллекции.
                 */
                Add: async (aid, cid) => {
                    aid = parseInt(aid);
                    if (this.list.find(x => x.id === cid).list.includes(aid)) return;

                    const index = this.list.findIndex(x => x.id === cid);

                    if (cid === "favourites") {
                        const data = await this.AddToFavourites(aid);
                        if (!data.success) {
                            return reject(data);
                        }
                    }

                    this.list[index].list.unshift(aid);
                    this.list[index].modified = new Date().toISOString();
                    localStorage.setItem(this.key, JSON.stringify(this.list));
                    this.#Dispatch("change_collection", this.list[index]);
                    return this.list[index];
                },

                /**
                 * Удаляет аниме из коллекции.
                 * @param {number} aid - Идентификатор аниме.
                 * @param {string} cid - Идентификатор коллекции.
                 */
                Remove: async (aid, cid) => {
                    aid = parseInt(aid);
                    if (!this.list.find(x => x.id === cid).list.includes(aid)) return;

                    const index = this.list.findIndex(x => x.id === cid);

                    if (cid === "favourites") {
                        const data = await this.RemoveFromFavourites(aid);
                        if (!data.success) {
                            return reject(data);
                        }
                    }

                    this.list[index].list.splice(this.list[index].list.indexOf(aid), 1);
                    this.list[index].modified = new Date().toISOString();
                    localStorage.setItem(this.key, JSON.stringify(this.list));
                    this.#Dispatch("remove_anime", this.list[index]);
                    return this.list[index];
                },

                Is: (aid, cid) => {
                    aid = parseInt(aid);
                    return this.list.find(x => x.id === cid).list.includes(aid);
                }
            },

            /**
             * Находит коллекции по аниме.
             * @param {{id: number, type: "anime" | "collection"}} data - Данные для поиска.
             * @returns {Array<string>} - Массив с идентификаторами коллекций.
             */
            Find: ({ id, type = "anime" } = {}) => {
                if (type === "anime") {
                    id = parseInt(id);
                    return this.list.filter(x => x.list.includes(id)).map(x => x.id);
                }

                const index = this.list.findIndex(x => x.id === id);
                if (index === -1) return undefined;
                return this.list[index];
            },

            FindAll: ({ value } = {}) => {
                if (typeof value !== "string") return [];
                return this.list.filter(x => x.name.toLowerCase().includes(value.toLowerCase()));
            },

            Get: ({ id } = {}) => {
                return this.list[this.list.findIndex(x => x.id === id)];
            }
        };

        if (INIT) {
            this.Init();
        }

        this.#storage_event();
    }

    async Init() {
        await this.LoadFavourites();
        this.#Dispatch("loaded", this.list);
    }

    get Id() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    AddToFavourites(aid) {
        return new Promise((resolve, reject) => {
            Favorites.favorites("Anime", aid, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(this.AddToFavourites(aid));
                }

                if (response.failed) {
                    return reject(response);
                }

                resolve(response);
            }).POST();
        });
    }

    RemoveFromFavourites(aid) {
        return new Promise((resolve, reject) => {
            Favorites.favorites("Anime", aid, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(this.RemoveFromFavourites(aid));
                }

                if (response.failed) {
                    return reject(response);
                }

                resolve(response);
            }).DELETE();
        });
    }

    LoadFavourites() {
        return new Promise((resolve, reject) => {
            Users.favourites(User.Storage.Get(User.Storage.keys.whoami).id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(this.LoadFavourites());
                }

                if (response.failed) {
                    return resolve();
                }

                const i = this.list.findIndex(x => x.id === "favourites");
                const animes = response.animes.map(anime => anime.id);
                if (arraysAreEqual(this.list[i].list, animes)) return resolve();
                this.list[i].list = animes;
                this.list[i].modified = new Date().toISOString();
                localStorage.setItem(this.key, JSON.stringify(this.list));
                resolve();
            }).GET();
        });
    }

    /**
     * Добавляет обработчик события.
     * @param { "new_collection" | "remove_collection" | "remove_anime" | "change_collection" | "loaded" | "rename_collection" | "storage" } event - Название события.
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

    #storage_event() {
        window.addEventListener('storage', (event) => {
            if (event.key === this.key && this.#callbacks["storage"].length > 0) {
                let oldValue = JSON.parse(event.oldValue);
                let newValue = JSON.parse(event.newValue);

                this.list = newValue;

                const changes = [];

                const oldMap = new Map(oldValue.map(item => [item.id, item]));
                const newMap = new Map(newValue.map(item => [item.id, item]));

                // Проверка удаленных и измененных элементов
                for (const [id, oldItem] of oldMap.entries()) {
                    const newItem = newMap.get(id);

                    if (!newItem) {
                        changes.push({ action: 'deleted', id, name: oldItem.name });
                    } else {
                        if (oldItem.name !== newItem.name) {
                            changes.push({ action: 'renamed', id, oldName: oldItem.name, newName: newItem.name });
                        }

                        const oldListSet = new Set(oldItem.list);
                        const newListSet = new Set(newItem.list);

                        const addedItems = [...newListSet].filter(x => !oldListSet.has(x));
                        const removedItems = [...oldListSet].filter(x => !newListSet.has(x));

                        if (addedItems.length || removedItems.length) {
                            changes.push({
                                action: 'list_changed',
                                id,
                                name: oldItem.name,
                                added: addedItems,
                                removed: removedItems,
                            });
                        }
                    }
                }

                // Проверка добавленных элементов
                for (const [id, newItem] of newMap.entries()) {
                    if (!oldMap.has(id)) {
                        changes.push({ action: 'added', id, name: newItem.name });
                    }
                }

                this.#Dispatch("storage", changes);
            }
        });
    }

}

export default Collection;