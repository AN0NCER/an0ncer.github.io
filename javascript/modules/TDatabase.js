/**
 * Открытие базы данных
 * @param {Setup} Setup - настройки базы данных
 * @param {[Storage]} storages - формирование хранилищей в БД
 * @returns {Promise<IDBDatabase>} - база данных
 */
export const OpenDB = ({ name, version = 1 } = {}, storages = []) => {
    return new Promise((resolve, reject) => {
        const openRequest = window.indexedDB.open(name, version);

        openRequest.onupgradeneeded = function (event) {
            let db = openRequest.result;
            switch (event.oldVersion) {
                case 0:
                    New(db);
            }

        }

        openRequest.onerror = function () {
            console.error("Error", openRequest.error);
            reject(openRequest.error);
        };

        openRequest.onsuccess = function () {
            let db = openRequest.result;
            resolve(db);
        };

        function New(db) {
            for (let i = 0; i < storages.length; i++) {
                const { name, keyPath, autoIncrement, indexing } = storages[i];
                let store = db.createObjectStore(name, { keyPath, autoIncrement });
                if (!indexing)
                    continue;
                for (let i = 0; i < indexing.length; i++) {
                    const { name, keyPath, options } = indexing[i];
                    store.createIndex(name, keyPath, options);
                }
            }
        }
    });
}

export class DBControls {
    /**
     * Инициализация управление БД
     * @param {TDatabase} tdb - БД
     */
    constructor(tdb) {
        this.db = tdb.db;
    }

    issetByKey(name, { key, id } = {}) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(name, "readonly");
            const objectStore = transaction.objectStore(name);
            const index = objectStore.index(key);
            const openRequest = index.getKey(id);

            openRequest.onsuccess = () => {
                if (openRequest.result) {
                    return resolve(true);
                }
                return resolve(false);
            }

            openRequest.onerror = () => {
                console.error("Error", openRequest.error);
                reject(openRequest.error);
            };
        });
    }

    add(name, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(name, "readwrite");
            const objectStore = transaction.objectStore(name);
            const openRequest = objectStore.add(value);

            openRequest.onsuccess = () => {
                resolve(openRequest.result);
            }

            openRequest.onerror = () => {
                console.error("Error", openRequest.error);
                reject(openRequest.error);
            }
        })
    }

    set(name, { id } = {}, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(name, "readwrite");
            const objectStore = transaction.objectStore(name);

            let item = value;
            if (id)
                item = { id, ...value };

            const openRequest = objectStore.put(item);

            openRequest.onsuccess = () => {
                resolve(openRequest.result);
            }

            openRequest.onerror = () => {
                console.log(openRequest.error.message, openRequest.error.name, openRequest);
                console.error("Error", openRequest.error);
                reject(openRequest.error);
            }
        });
    }

    get(name, { id } = {}) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(name, "readonly");
            const objectStore = transaction.objectStore(name);
            const openRequest = objectStore.get(id);

            openRequest.onsuccess = () => {
                if (openRequest.result) {
                    resolve(openRequest.result);
                } else {
                    resolve(null);
                }
            };

            openRequest.onerror = () => {
                console.error("Error", openRequest.error);
                reject(openRequest.error);
            };
        });
    }

    getAll(name) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(name, "readonly");
            const objectStore = transaction.objectStore(name);
            const openRequest = objectStore.getAll();

            openRequest.onsuccess = () => {
                if (openRequest.result) {
                    resolve(openRequest.result);
                } else {
                    resolve(null);
                }
            };
            openRequest.onerror = () => {
                console.error("Error", openRequest.error);
                reject(openRequest.error);
            };
        })
    }

    getByKey(name, { key, id } = {}) {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(name, "readonly");
            const objectStore = transaction.objectStore(name);
            const index = objectStore.index(key)
            const openRequest = index.get(id);

            openRequest.onsuccess = () => {
                if (openRequest.result) {
                    resolve(openRequest.result);
                } else {
                    resolve(null);
                }
            };

            openRequest.onerror = () => {
                console.error("Error", openRequest.error);
                reject(openRequest.error);
            };
        })
    }

    delete(name, { id, ids = [] } = {}) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(name, "readwrite");
            const objectStore = transaction.objectStore(name);

            const handleError = (error) => {
                console.error("Error", error);
                reject(error);
            };

            const handleSuccess = () => {
                resolve(true);
            };

            if (ids.length > 0) {
                ids.forEach((cid) => {
                    const openRequest = objectStore.delete(cid);
                    openRequest.onerror = handleError;
                });

                transaction.oncomplete = handleSuccess;
                transaction.onerror = handleError;
            } else if (id) {
                const openRequest = objectStore.delete(id);
                openRequest.onsuccess = handleSuccess;
                openRequest.onerror = handleError;
            } else {
                resolve(false);
            }
        });
    }

    Close(){
        this.db.close()
    }
}

export class DBIndexing {
    constructor(name, keyPath, options = { unique: false }) {
        this.name = name;
        this.keyPath = keyPath;
        this.options = options;
    }

    get() {
        return { name: this.name, keyPath: this.keyPath, options: this.options };
    }
}

/**
 * Инициализация самой БД которую можно будет
 * редактировать и управлять через дополнительный
 * класс {TDBControls}
 */
export class TDatabase {
    #callbacks = {
        "opened": [],
        "error": []
    }

    constructor({ name, version = 1, initStorages = [], createIndex = [] }) {
        this.name = name;
        this.version = version;
        this.initStorages = initStorages;
        this.createIndex = createIndex;
        this.db = undefined;
    }

    async Open() {
        try {
            const db = await OpenDB({ name: this.name, version: this.version }, this.initStorages, this.createIndex);
            this.db = db;
            this.#Dispatch("opened", this);
            return db;
        } catch (err) {
            console.log(err);
            this.#Dispatch("error", { msg: 'Не удалось открыть БД' });
        }
        return this.db;
    }

    /**
     * Добавляет обработчик события.
     * @param {"opened" | "error"} event - Название события.
     * @param {Function} callback - Функция обработчик события.
     */
    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
    }

    /**
     * Вызывает функция событий с данными.
     * @param {"opened" | "error"} event - Название события.
     * @param {Object} data - данные которые приходят в функцию.
     */
    #Dispatch(event, data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(data));
    }

    static Delete(name) {
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.deleteDatabase(name);

            request.onerror = function (ev) {
                console.log(request.error);
                reject("Ошибка удаление.")
            }

            request.onsuccess = function (ev) {
                resolve(true);
            }

            request.onblocked = function (ev) {
                reject("Закройте все вкладки чтобы удалить");
            }
        });
    }
}