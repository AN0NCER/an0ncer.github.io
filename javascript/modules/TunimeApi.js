import { Sleep } from "./funcitons.js";

const LIFETIME = 600000;
const VERSION = '2.0.0';

class Server {
    #base = 'https://tunime.onrender.com';
    #list = [
        'https://tunime-hujg.onrender.com',
    ];
    #url = undefined;
    #key = 'shadow-url';
    #id = -1;
    get url() {
        if (this.#url !== undefined)
            return this.#url;

        this.#url = this.#base;
        const data = sessionStorage.getItem(this.#key);

        if (data !== null) {
            /**@type {{id:number, url:string}} */
            const val = JSON.parse(data);
            this.#id = val.id;
            this.#url = val.url;
        }

        return this.#url;
    }

    Next(id = this.#id) {
        let url = this.#base;
        if ((id + 1) < this.#list.length) {
            id = id + 1;
            url = this.#list[id];
        } else {
            id = -1;
        }
        this.#id = id;
        this.#url = url;
        sessionStorage.setItem(this.#key, JSON.stringify({ id: this.#id, url: this.#url }));
    }
}

class Storage {
    #key = 'shadow-api';
    #val = undefined;
    #loaded = false;

    /**
     * @type {{date:number, id:string, key:string, token:string, access: boolean} | undefined}
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

    set access(value) {
        this.#val = value;
        if (value === undefined) {
            return sessionStorage.removeItem(this.#key);
        }
        sessionStorage.setItem(this.#key, JSON.stringify(this.#val));
    }

    /**
     * @param {{date:number, id:string, key:string, token:string, access: boolean} | undefined} access 
     * @returns {boolean}
     */
    Live(access = this.#val) {
        if (typeof access === 'undefined') {
            return false;
        }
        if ((new Date() - new Date(access.date)) > LIFETIME) {
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
        this.#id = value;
        localStorage.setItem(this.#key, this.#id);
    }
}

class Message {
    #Task = {
        'genId': async function () {
            const id = await Tunime.Device();
            Tunime.device.id = id;
        }
    }

    constructor(list = []) {
        if (list !== undefined) {
            for (let i = 0; i < list.length; i++) {
                const element = list[i];
                const task = this.#Task[element];
                if (task) {
                    task();
                }
            }
        }
    }
}

export const Tunime = {
    storage: new Storage(),
    device: new Device(),
    server: new Server(),
    Online: function (access = this.storage.access) {
        return new Promise((resolve) => {
            const cods = [666, 403]
            if (!this.storage.Live(access)) {
                access = undefined;
            }
            let body = { id: 'shadow', key: 'register', vid: VERSION };
            let headers = undefined;
            if (access !== undefined) {
                body = { id: access.id, key: access.key, vid: VERSION };
                headers = { 'Authorization': `Bearer ${access.token}` }
            }
            if (this.device.id !== undefined) {
                body['did'] = this.device.id;
            }
            let responseCode = 503;
            Fetch('/online', { method: 'POST', headers: headers, body: body }).then((response) => {
                responseCode = response.status;
                if (cods.includes(responseCode)) {
                    Tunime.storage.access = undefined;
                    return resolve(false);
                }
                response.json().then((value) => {
                    let storage = this.storage.access;
                    if (storage === undefined)
                        storage = {}
                    this.storage.access = Object.assign(storage, value.data);
                    if (value?.message) {
                        new Message(JSON.parse(value.message));
                    }
                    return resolve(true);
                })
            }).catch(async (reason) => {
                console.log(`[api] - Error: ${Tunime.server.url} Code: ${responseCode}\n${reason}`);
                if (responseCode == 503) {
                    Tunime.server.Next();
                    return resolve(this.Online(access));
                }
                this.storage.access = undefined;
                await Sleep(1000);
                return resolve(true);
            });
        })
    },

    Link: function ({ q720 = undefined, q480 = undefined, q360 = undefined } = {}) {
        const params = { q720, q480, q360 };
        const queryParams = Object.entries(params)
            .filter(([key, value]) => value !== undefined)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
        return `${Tunime.server.url}/video/stream.m3u8?${queryParams}`;
    },

    Source: function (kodik, access = this.storage.access) {
        return new Promise((resolve) => {
            if (access === undefined)
                return;
            const body = { key: access.key, id: access.id, link: kodik };
            const headers = { 'Authorization': `Bearer ${access.token}` };
            let responseCode = 503;
            Fetch('/video/source', { method: 'POST', body, headers }).then((response) => {
                responseCode = response.status;
                response.json().then((value) => {
                    return resolve(value.data);
                });
            }).catch(async (reason) => {
                console.log(`[api] - Error: ${Tunime.server.url} Code: ${responseCode}\n${reason}`);
                if (responseCode == 503) {
                    return;
                    // URL = `onrender.com`;
                    return resolve(this.Source(kodik, access));
                }
                await Sleep(1000);
                return resolve(this.Source(kodik, access));
            })
        });
    },

    Anime: function (aid, access = this.storage.access) {
        return new Promise((resolve) => {
            if (access === undefined)
                return;
            const body = { key: access.key, id: access.id };
            const headers = { 'Authorization': `Bearer ${access.token}` };
            let responseCode = 503;
            Fetch(`/anime/${aid}`, { method: 'POST', body, headers }).then((response) => {
                responseCode = response.status;
                response.json().then((value) => {
                    return resolve(value);
                });
            }).catch(async (reason) => {
                console.log(`[api] - Error: ${Tunime.server.url} Code: ${responseCode}\n${reason}`);
                if (responseCode == 503) {
                    return;
                    // URL = `onrender.com`;
                    // return resolve(this.Anime(aid, access));
                }
                await Sleep(1000);
                return resolve(this.Anime(aid, access));
            })
        });
    },

    Voices: function (aid, access = this.storage.access) {
        if (access === undefined)
            return { GET: () => { }, SET: () => { } };
        const headers = { 'Authorization': `Bearer ${access.token}` };
        return {
            GET: () => {
                let responseCode = 503;
                Fetch(`/voices/${aid}`, { method: 'GET', headers }).then((response) => {
                    responseCode = response.status;
                    response.json().then((value) => {
                        return resolve(value.data);
                    });
                }).catch(async (reason) => {
                    console.log(`[api] - Error: ${Tunime.server.url} Code: ${responseCode}\n${reason}`);
                    if (responseCode == 503) {
                        return;
                        // URL = `onrender.com`;
                        // return resolve(this.Voices(aid, access).GET());
                    }
                    await Sleep(1000);
                    return resolve(this.Voices(aid, access).GET());
                });
            },

            SET: (tid) => {
                return new Promise((resolve) => {
                    let responseCode = 503;
                    const body = { key: access.key, id: access.id, tid };
                    Fetch(`/voices/${aid}`, { method: 'POST', headers, body }).then((response) => {
                        responseCode = response.status;
                        response.json().then((value) => {
                            return resolve(value);
                        });
                    }).catch(async (reason) => {
                        console.log(`[api] - Error: ${Tunime.server.url} Code: ${responseCode}\n${reason}`);
                        if (responseCode == 503) {
                            return;
                            // URL = `onrender.com`;
                            // return resolve(this.Voices(aid, access).SET(tid));
                        }
                        await Sleep(1000);
                        return resolve(this.Voices(aid, access).SET(tid));
                    });
                });
            }
        }
    },

    Device: function (access = this.storage.access) {
        return new Promise((resolve) => {
            if (access === undefined)
                return;
            const body = { key: access.key, id: access.id };
            const headers = { 'Authorization': `Bearer ${access.token}` };
            let responseCode = 503;
            Fetch(`/device`, { method: 'POST', body, headers }).then((response) => {
                responseCode = response.status;
                response.json().then((value) => {
                    return resolve(value.id);
                });
            }).catch(async (reason) => {
                console.log(`[api] - Error: ${Tunime.server.url} Code: ${responseCode}\n${reason}`);
                if (responseCode == 503) {
                    return;
                    // URL = `onrender.com`;
                    // return resolve(this.Device(access));
                }
                await Sleep(1000);
                return resolve(this.Device(access));
            });
        })
    }
};

(async () => {
    return;
    const exception = ['/player.html'];
    let minute = 60000;
    if (exception.includes(window.location.pathname))
        return;
    if (Tunime.storage.access === undefined || !Tunime.storage.Live()) {
        const access = await Tunime.Online();
        if (access) {
            const interval = setInterval(async () => {
                const access = await Tunime.Online();
                if (!access)
                    clearInterval(interval);
            }, (LIFETIME - minute) - (Date.now() - Tunime.storage.access.date));
        }
    } else {
        const interval = setInterval(async () => {
            const access = await Tunime.Online();
            if (!access)
                clearInterval(interval);
        }, (LIFETIME - minute) - (Date.now() - Tunime.storage.access.date));
    }

    console.log(`[api] - Interval Started: Next ${((LIFETIME - minute) - (Date.now() - Tunime.storage.access?.date))} ms`);
})();

function Fetch(path, { method = 'GET', body = undefined, headers = undefined } = {}) {
    return;
    const request = {
        method
    };
    if (body != undefined) {
        request['body'] = new URLSearchParams(body);
    }
    if (headers != undefined) {
        request['headers'] = headers;
    }
    return fetch(`${Tunime.server.url}${path}`, request);
}