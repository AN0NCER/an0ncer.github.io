class Access {
    #val = undefined;

    constructor() {
        this.Key = 'shadow-api';
        this.Loaded = false;
        window.addEventListener("storage", ({ key }) => {
            if (document.visibilityState !== "hidden" || this.Key !== key) return;

            this.#val = JSON.parse(localStorage.getItem(this.Key));
            window.$SHADOW.update()
        });
    }

    get access() {
        if (this.#val !== undefined || this.Loaded === true) {
            return this.#val;
        }

        const data = localStorage.getItem(this.Key);
        this.#val = JSON.parse(data) || undefined;

        if (this.#val !== undefined) {
            if (!this.Live(this.#val)) {
                this.#val = undefined;
            }
        }

        return this.#val;
    }

    set access(val) {
        this.#val = val;
        if (val === undefined) {
            return localStorage.removeItem(this.Key);
        }

        localStorage.setItem(this.Key, JSON.stringify(this.#val));
    }

    Live(access = this.#val) {
        if (access === undefined)
            return false;

        if (0 >= (Date.parse(access.end) - Date.now()))
            return false;
        return true;
    }
}

class Device {
    #id = undefined;

    constructor() {
        this.Key = 'tunime-id';
        this.Loaded = false;
    }

    get Id() {
        if (this.#id === undefined && this.Loaded === false) {
            this.#id = localStorage.getItem(this.Key) || undefined;
        }
        return this.#id;
    }

    set Id(val) {
        if (this.#id === val)
            return;

        this.#id = val;
        localStorage.setItem(this.Key, this.#id);
    }
}

class Balancer {
    #url = undefined;

    constructor(servers) {
        this.config = {
            key: 'shadow-url',
            unlockTime: 5 * 60 * 1000, // 5 минут в миллисекундах
            checkInterval: 10 * 1000 // Проверка каждые 10 секунд
        };

        this.state = {
            servers: servers,
            id: 0,
            blocked: false,
            cycleCount: 0,
            blockedTime: null
        };

        // Восстанавливаем состояние из sessionStorage
        const storedData = sessionStorage.getItem(this.config.key);
        if (storedData !== null) {
            Object.assign(this.state, JSON.parse(storedData));
        }

        // Проверяем, можно ли разблокировать
        this.checkUnlock();
    }


    /**
     * Переключает сервер и сохраняет его в sessionStorage
     * @returns {boolean} - true, если сервер успешно переключён, false, если все сервера были уже пройдены
     */
    Next() {
        if (this.state.blocked) return false;

        this.state.id = (this.state.id + 1) % this.state.servers.length;

        if (this.state.id === 0) {
            this.state.cycleCount++;
        }

        if (this.state.cycleCount >= 1) {
            this.state.blocked = true;
            this.state.blockedTime = Date.now(); // Фиксируем время блокировки
            this.saveState();
            return false;
        }

        this.saveState();
        return true;
    }

    /**
     * Проверяет, прошло ли достаточно времени для разблокировки
     */
    checkUnlock() {
        if (this.state.blocked && this.state.blockedTime) {
            const elapsedTime = Date.now() - this.state.blockedTime;
            if (elapsedTime >= this.config.unlockTime) {
                this.resetBalancer();
            }
        }
    }

    /**
     * Запускает таймер для проверки разблокировки
     */
    startUnlockTimer() {
        setInterval(() => this.checkUnlock(), this.config.checkInterval);
    }

    /**
     * Сбрасывает состояние балансера после таймаута
     */
    resetBalancer() {
        this.state.id = 0;
        this.state.blocked = false;
        this.state.cycleCount = 0;
        this.state.blockedTime = null;
        this.saveState();
    }


    /**
     * Сохраняет текущее состояние в sessionStorage
     */
    saveState() {
        sessionStorage.setItem(this.config.key, JSON.stringify(this.state));
    }

    /**
     * Получает текущий URL сервера
     * @returns {string}
     */
    get url() {
        return this.state.servers[this.state.id];
    }


    fetch(path, params = { method: 'GET', body: undefined }) {
        if (params.body !== undefined) {
            params.body = new URLSearchParams(params.body);
        } else {
            delete params.body;
        }

        const lFetch = (url, params) => {
            return new Promise((resolve, reject) => {
                let rCode = 503;
                fetch(url, params).then((response) => {
                    rCode = response.status;
                    return resolve(response);
                }).catch((reason) => {
                    if (rCode == 503) {
                        if (this.Next()) {
                            return resolve(lFetch(`${this.url}${path}`, params));
                        }
                    }
                    reject(reason);
                });
            });
        }

        return lFetch(`${this.url}${path}`, params);
    }
}

class Shadow {
    constructor() {
        this._state = {
            isConnected: false,
            hasApiAccess: false,
            permissions: [],
            sessionExpiry: null,
            deviceId: null,
            lastUpdate: null
        }
    }

    get state() {
        return { ...this._state };
    }

    update() {
        const currentTime = Date.now();

        this._state = {
            isConnected: user.access !== undefined,
            hasApiAccess: user.access?.scope?.includes("player") || false,
            permissions: user.access?.scope || [],
            sessionExpiry: user.access?.end ? new Date(user.access.end) : null,
            deviceId: device.Id,
            lastUpdate: new Date(currentTime)
        }

        // Добавляем вычисляемые поля
        this._state.isSessionValid = user.Live();
        this._state.timeToExpiry = this._state.sessionExpiry
            ? this._state.sessionExpiry - currentTime
            : null;
    }

    debug() {
        console.group('Shadow State Debug Info');
        console.log('Current State:', this.state);
        console.log('Is Connected:', this.state.isConnected);
        console.log('API Access:', this.state.hasApiAccess);
        console.log('Permissions:', this.state.permissions);
        console.log('Session Valid:', this.state.isSessionValid);
        if (this.state.sessionExpiry) {
            console.log('Session Expires:', this.state.sessionExpiry.toLocaleString());
            console.log('Time to Expiry:', Math.floor(this.state.timeToExpiry / 1000), 'seconds');
        }
        console.log('Device ID:', this.state.deviceId);
        console.log('Last Update:', this.state?.lastUpdate?.toLocaleString());
        console.groupEnd();
    }
}

const balancer = new Balancer([
    'https://tunime.onrender.com',
    'https://tunime-hujg.onrender.com'
]);

const user = new Access();
const device = new Device();
window.$SHADOW = new Shadow();

export const Tunime = new class {
    async '/auth'() {
        const [method, path] = ["POST", "/login"];

        const body = await (async () => {
            if ($PARAMETERS.tunsync) {
                const oauth = (await import("../core/main.core.js")).OAuth;
                if (oauth.access) {
                    return {
                        'token': oauth.access.access_token,
                        'uid': oauth.user?.id
                    }
                }
            }

            return {};
        })();

        return new Promise((resolve) => {
            this.#fetch(path, { method, body }).then((response) => {
                if (response.status === 200) {
                    return response.json().then((value) => {
                        device.Id = value.data.did;
                        user.access = value.data;
                        return resolve(value.data);
                    });
                }

                return resolve(false);
            }).catch(r => resolve(false));
        })
    }

    async '/keep-alive'() {
        const [method, path] = ["GET", "/keep-alive"];

        return new Promise((resolve) => {
            this.#fetch(path, { method }).then(async (response) => {
                if (response.status === 200) {
                    return response.json().then((value) => {
                        user.access = value.data;
                        return resolve(value.data);
                    });
                }

                if (response.status === 401) {
                    return response.json().then((value) => {
                        return resolve(value);
                    });
                }

                return resolve(false);
            }).catch(r => resolve(false));
        })
    }

    '/voice' = {
        '/:aid/:vid': (aid, vid) => {
            const [method, path] = ["PUT", `/voice/${aid}/${vid}`];

            if (user.access === undefined || !user.access.scope.includes("anime")) {
                return false;
            }

            return new Promise((resolve) => {
                this.#fetch(path, { method }).then((response) => {
                    if (response.status === 200) {
                        return response.json().then((value) => {
                            return resolve(value.data);
                        });
                    }

                    return resolve(false);
                }).catch(r => resolve(false));
            })
        }
    }

    '/video' = {
        '/hls.m3u8': (query = {}) => {
            const url = new URL(`${balancer.url}/video/hls.m3u8`);
            for (const [key, value] of Object.entries(query)) {
                url.searchParams.append(key, encodeURIComponent(value));
            }
            return url.toString();
        },
        '/source': (kodik, access = user.access) => {
            const [method, path, body] = ["POST", "/video/source", { src: kodik }];

            if (access === undefined || !access.scope.includes("player")) {
                return false;
            }

            return new Promise((resolve) => {
                this.#fetch(path, { method, body }).then((response) => {
                    if (response.status === 200) {
                        return response.json().then((value) => {
                            return resolve(value.data);
                        });
                    }

                    return resolve(false);
                }).catch(r => resolve(false));
            })
        }
    }

    '/anime' = {
        '/popular': () => {
            const [method, path] = ["GET", "/anime/popular"];

            return new Promise((resolve) => {
                this.#fetch(path, { method }).then((response) => {
                    if (response.status === 200) {
                        return response.json().then((value) => {
                            return resolve(value.data);
                        });
                    }

                    return resolve(false);
                }).catch(r => resolve(false));
            })
        },
        '/:aid': (aid) => {
            const [method, path] = ["PUT", `/anime/${aid}`];

            if (user.access === undefined || !user.access.scope.includes("anime")) {
                return false;
            }

            return new Promise((resolve) => {
                this.#fetch(path, { method }).then((response) => {
                    if (response.status === 200) {
                        return response.json().then((value) => {
                            return resolve(value.data);
                        });
                    }

                    return resolve(false);
                }).catch(r => resolve(false));
            })
        }
    }

    Share = {
        Anime: (id) => {
            return `${balancer.url}/l/${id}`;
        },
        User: (id) => {
            return `${balancer.url}/u/${id}`;
        }
    }

    async #fetch(path, options = {}) {
        const headers = {
            "x-tun-did": device.Id,
            "x-tun-key": user.access?.key,
            "x-tun-id": user.access?.id
        }

        return balancer.fetch(path, { ...options, headers }).catch((reason) => {
            console.log(`[api] Error: ${reason}`);
        });
    }
}();

(async (exception) => {
    const originalAccessSetter = Object.getOwnPropertyDescriptor(Access.prototype, 'access').set;
    Object.defineProperty(Access.prototype, 'access', {
        set: function (value) {
            originalAccessSetter.call(this, value);
            window.$SHADOW.update();
        }
    });

    window.$SHADOW.update();

    if (exception.includes(window.location.pathname)) return;

    if (user.access === undefined) {
        let acc = await Tunime['/auth']();
        if (acc && !acc.scope.includes("player")) {
            acc = await Tunime["/keep-alive"]();
        }
    }

    (async () => {
        let timeout = undefined;

        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState !== 'visible') return clearInterval(timeout);
            [clearTimeout(timeout), update()];
        });

        const update = async () => {
            const time = 60000;
            if (user.access === undefined) {
                const acc = await Tunime["/auth"]();
                if (acc === false) {
                    return;
                }
            }

            const date = Date.parse(user.access.end) - Date.now() - time;
            timeout = setTimeout(async () => {
                if (document.visibilityState !== 'visible') return;
                if (!user.Live()) {
                    user.access = undefined;
                    const acc = await Tunime["/auth"]();
                    if (acc === false) {
                        return;
                    }
                } else {
                    const acc = await Tunime["/keep-alive"]();

                    if (typeof acc === "boolean") {
                        return;
                    } else if (acc.code === 401) {
                        await Tunime["/auth"]();
                    }
                    update();
                }
            }, date);
            console.log(`[api] - Weiter durch ${date} ms`);
        }

        update();
    })();
})(['/player.html']);