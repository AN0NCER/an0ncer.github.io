import { Sleep } from "./functions.js";

/**
 * @typedef {Object} Access - данные доступа
 * @property {string} id - индентификатор пользователя
 * @property {string} did - индентификатор устройства
 * @property {string} key - ключ доступа
 * @property {[string]} scope - разрешения пользователя
 * @property {string} end - время в ISO 8601 когда закончиться доступ
 */

/**
 * @typedef {Object} Source
 * @property {[{src:string, type:string}]} 
 * @property {[string]} scips
 * @property {[string]} thumbinals
 */

/**
 * @typedef {Object} Tunime - управление api
 * @property {Storage} storage
 * @property {Device} device
 * @property {Server} server
 * @property {function(): Promise<Access|false>} Auth
 * @property {function(Access): Promise<Access|false>} Online
 * @property {function({q720:string|undefined,q480:string|undefined,q360:string|undefined}): string} Link
 * @property {{Anime:function(number|string): string, User:function(number|string): string}} Share
 * @property {function(string, Access): Promise<{data:Source}|false>} Source
 * @property {{Anime:function(number, Access): Promise<Object|false>, Voice:function(number, number, Access): Promise<Object|false>}} OnActiv
 */

class Server {
    #base = 'https://tunime.onrender.com'; // Основной URL сервера
    #list = [
        'https://tunime-hujg.onrender.com', // Список дополнительных URL
    ];
    #url; // Текущий URL
    #key = 'shadow-url'; // Ключ для хранения данных в sessionStorage
    #id = -1; // Идентификатор текущего URL в списке

    // Геттер для получения текущего URL
    get url() {
        // Если URL уже определен, возвращаем его
        if (this.#url !== undefined) {
            return this.#url;
        }

        // Изначально используем базовый URL
        this.#url = this.#base;

        // Получаем данные из sessionStorage
        const data = sessionStorage.getItem(this.#key);
        if (data !== null) {
            /** @type {{id: number, url: string}} */
            const val = JSON.parse(data);
            this.#id = val.id;
            this.#url = val.url;
        }

        return this.#url;
    }

    // Метод для переключения на следующий URL в списке
    next(id = this.#id) {
        let url = this.#base;

        // Если есть следующий URL в списке, переключаемся на него
        if ((id + 1) < this.#list.length) {
            id = id + 1;
            url = this.#list[id];
        } else {
            return false;
        }

        this.#id = id;
        this.#url = url;

        // Сохраняем текущий URL и идентификатор в sessionStorage
        sessionStorage.setItem(this.#key, JSON.stringify({ id: this.#id, url: this.#url }));
    }
}

class Storage {
    #key = 'shadow-api';
    #val = undefined;
    #loaded = false;

    /**
    * @type {Access | undefined}
    */
    get access() {
        if (this.#val === undefined && this.#loaded === true || this.#val !== undefined) {
            return this.#val;
        }

        const data = sessionStorage.getItem(this.#key);
        this.#val = JSON.parse(data) || undefined;

        if (this.#val !== undefined) {
            if (!this.Live(this.#val)) {
                this.#val = undefined;
            }
        }

        return this.#val;
    }

    /**
     * @type {Access | undefined}
     */
    set access(value) {
        this.#val = value;
        if (value === undefined) {
            return sessionStorage.removeItem(this.#key);
        }
        sessionStorage.setItem(this.#key, JSON.stringify(this.#val));
    }

    /**
     * Существует ли все еще ключ доступа
     * @param {Access | undefined} access 
     * @returns {boolean}
     */
    Live(access = this.#val) {
        if (typeof access === 'undefined') {
            return false;
        }

        if (0 >= (Date.parse(access.end) - Date.now())) {
            return false;
        }
        return true;
    }
}

class Device {
    #key = 'tunime-id';
    #id = undefined;
    #loaded = false;
    get id() {
        if (this.#id === undefined && this.#loaded === false) {
            this.#id = localStorage.getItem(this.#key) || undefined;
        }
        return this.#id;
    }

    set id(value) {
        if (this.#id === value)
            return;

        this.#id = value;
        localStorage.setItem(this.#key, this.#id);
    }
}

function ApiFetch(path, { method = 'GET', body = undefined } = {}) {
    const request = {
        method
    };

    if (body != undefined) {
        request['body'] = new URLSearchParams(body);
    }

    return fetch(`${Tunime.server.url}${path}`, request);
}

/**
 * @type {Tunime}
 */
export const Tunime = {
    storage: new Storage(),
    device: new Device(),
    server: new Server(),
    Auth: function () {
        return new Promise((resolve) => {
            let path = '/auth';
            let body = {};
            if (this.device.id !== undefined) {
                body['did'] = this.device.id;
            }
            let responseCode = 503;
            ApiFetch(path, { method: 'POST', body }).then((response) => {
                responseCode = response.status;

                if (responseCode === 200) {
                    return response.json().then((value) => {
                        Tunime.device.id = value.data.did;
                        this.storage.access = value.data;
                        return resolve(value.data);
                    });
                }

                return resolve(false);
            }).catch(async (reason) => {
                console.log(`[api] - Error: ${Tunime.server.url} Code: ${responseCode}\n${reason}`);

                if (responseCode == 503) {
                    if (Tunime.server.next() !== false) {
                        await Sleep(1000);
                        return resolve(this.Auth());
                    }
                }

                return resolve(false);
            });
        });
    },
    Online: function (access = this.storage.access) {
        return new Promise((resolve) => {
            if (access === undefined || !access.scope.includes("web")) {
                return resolve(false);
            }
            const path = '/online';
            const body = { id: access.id, key: access.key };
            let responseCode = 503;
            ApiFetch(path, { method: 'POST', body: body }).then(async (response) => {
                responseCode = response.status;

                if (responseCode === 200) {
                    return response.json().then((value) => {
                        this.storage.access = value.data;
                        return resolve(value.data);
                    });
                }

                return resolve(false);
            }).catch(async (reason) => {
                console.log(`[api] - Error: ${Tunime.server.url} Code: ${responseCode}\n${reason}`);

                if (responseCode == 503) {
                    if (Tunime.server.next() !== false) {
                        return resolve(this.Online(access));
                    }
                }

                return resolve(false);
            })
        });
    },
    Link: function ({ q720 = undefined, q480 = undefined, q360 = undefined } = {}) {
        const params = { q720, q480, q360 };
        const queryParams = Object.entries(params)
            .filter(([key, value]) => value !== undefined)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
        return `${Tunime.server.url}/video/stream.m3u8?${queryParams}`;
    },
    Share: {
        Anime: function (id) {
            return `${Tunime.server.url}/l/${id}`;
        },
        User: function (id) {
            return `${Tunime.server.url}/u/${id}`;
        }
    },
    Source: function (kodik, access = this.storage.access) {
        return new Promise((resolve) => {
            if (access === undefined || !access.scope.includes("player")) {
                return resolve(false);
            }
            const path = '/video/source';
            const body = { id: access.id, key: access.key, link: kodik };
            let responseCode = 503;
            const cods = [401, 429];
            ApiFetch(path, { method: 'POST', body: body }).then(async (response) => {
                responseCode = response.status;

                if (cods.includes(responseCode)) {
                    Tunime.storage.access = undefined;
                    const access = await Tunime.Auth();
                    return resolve(this.Source(kodik, access));
                }

                if (responseCode === 200) {
                    return response.json().then((value) => {
                        return resolve(value.data);
                    });
                }

                return resolve(false);
            }).catch((reason) => {
                console.log(`[api] - Error: ${Tunime.server.url} Code: ${responseCode}\n${reason}`);

                if (responseCode == 503) {
                    if (Tunime.server.next() !== false) {
                        return resolve(this.Source(kodik, access));
                    }
                }

                return resolve(false);
            });
        });
    },
    OnActiv: {
        Anime: function (aid, access = Tunime.storage.access) {
            return new Promise((resolve) => {
                if (access === undefined || !access.scope.includes("anime")) {
                    return resolve(false);
                }
                const path = `/anime/${aid}`;
                const body = { id: access.id, key: access.key };
                let responseCode = 503;
                const cods = [401, 429];
                ApiFetch(path, { method: 'POST', body: body }).then(async (response) => {
                    responseCode = response.status;

                    if (cods.includes(responseCode)) {
                        Tunime.storage.access = undefined;
                        const access = await Tunime.Auth();
                        return resolve(this.Anime(aid, access));
                    }

                    if (responseCode === 200) {
                        return response.json().then((value) => {
                            return resolve(value.data);
                        });
                    }

                    return resolve(false);
                }).catch((reason) => {
                    console.log(`[api] - Error: ${Tunime.server.url} Code: ${responseCode}\n${reason}`);

                    if (responseCode == 503) {
                        if (Tunime.server.next() !== false) {
                            return resolve(this.Anime(aid, access));
                        }
                    }

                    return resolve(false);
                });
            });
        },
        Voice: function (aid, tid, access = Tunime.storage.access) {
            return new Promise((resolve) => {
                if (access === undefined || !access.scope.includes("anime")) {
                    return resolve(false);
                }
                const path = `/voices/${aid}`;
                const body = { id: access.id, key: access.key, tid: tid };
                let responseCode = 503;
                const cods = [401, 429];
                ApiFetch(path, { method: 'POST', body: body }).then(async (response) => {
                    responseCode = response.status;

                    if (cods.includes(responseCode)) {
                        Tunime.storage.access = undefined;
                        const access = await Tunime.Auth();
                        return resolve(this.Voice(aid, tid, access));
                    }

                    if (responseCode === 200) {
                        return response.json().then((value) => {
                            return resolve(value.data);
                        });
                    }

                    return resolve(false);
                }).catch((reason) => {
                    console.log(`[api] - Error: ${Tunime.server.url} Code: ${responseCode}\n${reason}`);

                    if (responseCode == 503) {
                        if (Tunime.server.next() !== false) {
                            return resolve(this.Voice(aid, tid, access));
                        }
                    }

                    return resolve(false);
                });
            });
        }
    }
};

(() => {
    if (typeof $SERVER !== 'undefined' && $SERVER) {
        $SERVER.On.Updatet((event) => {
            if (event === false) {
                AutoUpdateToken();
            }
        });
    } else {
        AutoUpdateToken();
    }
})();

async function AutoUpdateToken() {
    const exception = ['/player.html'];
    if (exception.includes(window.location.pathname))
        return;

    let access = Tunime.storage.access;

    if (access === undefined) {
        access = await Tunime.Auth();
        if (access && !access.scope.includes("player")) {
            access = await Tunime.Online();
        }
    }

    if (access === false) {
        return;
    }

    console.log(`[api] - Token: ${access.end}`);
    UpdateToken();
}

async function UpdateToken() {
    let timeout = undefined;

    document.addEventListener('visibilitychange', async function () {
        if (document.visibilityState === 'visible') {
            if (!Tunime.storage.Live()) {
                clearTimeout(timeout);
                _update();
            }
        }
    })

    async function _update() {
        const minute = 60000;
        if (Tunime.storage.access === undefined) {
            const access = await Tunime.Auth();
            if (access === false) {
                return;
            }
        }

        const time = Date.parse(Tunime.storage.access.end) - Date.now() - minute;
        timeout = setTimeout(async () => {
            if (!Tunime.storage.Live()) {
                Tunime.storage.access = undefined;
                const access = await Tunime.Auth();
                if (access === false) {
                    return;
                }
            } else {
                const access = await Tunime.Online();
                if (access === false) {
                    return;
                }
                _update();
            }
        }, time);
        console.log(`[api] - Weiter durch ${time} ms`);
    }

    _update();
}