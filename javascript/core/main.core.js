export const sUrl = 'https://shiki.one';

const $IPS = ["127.0", "192.168"] // <- тестовые версии
let $MODE = 'production'; // <- тип запуска core
const $HOST = location.hostname;

if ($IPS.findIndex(x => $HOST.startsWith(x)) != -1) {
    $MODE = 'test';
    updateAppIcons({
        manifest: '/images/icons/manifest-b.json',
        icons: {
            '120x120': './images/icons/logo-x192-b.png',
            '152x152': './images/icons/logo-x192-b.png'
        }
    })
}

export class Fetch {
    /**
    * Создает новый экземпляр Fetch
    * @param {string} [method="GET"] - HTTP метод запроса
    * @param {string} [url=""] - URL для запроса
    * @param {Object} [headers={}] - Заголовки запроса
    * @param {string|Object|FormData} [body=null] - Тело запроса
    */
    constructor(method = "GET", url = "", headers = {}, body = null) {
        this.method = method;
        this.url = url;
        this.headers = headers;
        this.body = body;

        // Константы для статусов ответов
        this.RESPONSE_STATUSES = {
            NO_CONTENT: 204
        };

        // Шаблон ответа при ошибке
        this.ERROR_RESPONSE = {
            failed: true,
            status: 404,
            message: "Request failed"
        };
    }

    /**
     * Устанавливает HTTP-метод запроса
     * @param {string} method - HTTP метод (GET, POST, PUT, DELETE и др.)
     * @returns {Fetch} - Текущий экземпляр для цепочки вызовов
     */
    setMethod(method) {
        this.method = method;
        return this;
    }
    /**
    * Устанавливает URL для запроса
    * @param {string} url - URL для запроса
    * @returns {Fetch} - Текущий экземпляр для цепочки вызовов
    */
    setUrl(url) {
        this.url = url;
        return this;
    }
    /**
     * Добавляет отдельный заголовок к запросу
     * @param {string} name - Имя заголовка
     * @param {string} value - Значение заголовка
     * @returns {Fetch} - Текущий экземпляр для цепочки вызовов
     */
    addHeader(name, value) {
        this.headers[name] = value;
        return this;
    }
    /**
     * Устанавливает тело запроса
     * @param {string|Object|FormData} body - Тело запроса
     * @returns {Fetch} - Текущий экземпляр для цепочки вызовов
     */
    setBody(body) {
        this.body = body;
        return this;
    }

    /**
     * Подготавливает конфигурацию запроса
     * @param {AbortSignal} [signal] - Сигнал для отмены запроса
     * @returns {Object} - Объект с конфигурацией для fetch API
     * @private
     */
    _prepareRequestConfig(signal) {
        const config = {
            method: this.method,
            headers: { ...this.headers }
        };

        if (signal) {
            config.signal = signal;
        }

        if (this.body) {
            // Автоматическая сериализация объектов в JSON
            if (typeof this.body === "object" && !(this.body instanceof FormData)) {
                config.body = JSON.stringify(this.body);
                // Установка Content-Type только если явно не указан
                if (!config.headers["Content-Type"]) {
                    config.headers["Content-Type"] = "application/json";
                }
            } else {
                config.body = this.body;
            }
        }

        return config;
    }

    /**
     * Обрабатывает полученный ответ
     * @param {Response} response - Объект ответа от fetch API
     * @returns {Promise} - Промис с обработанным ответом
     * @private
     */
    async _handleResponse(response) {
        // Проверка успешности запроса
        if (!response.ok) {
            const errorResponse = { ...this.ERROR_RESPONSE, status: response.status };

            try {
                // Попытка получить сообщение об ошибке из JSON ответа
                const errorData = await response.json();
                errorResponse.details = errorData;
            } catch (e) {
                // Игнорируем ошибку, если не удалось прочитать JSON
            }

            return errorResponse;
        }

        // Обработка успешного ответа без содержимого
        if (response.status === this.RESPONSE_STATUSES.NO_CONTENT) {
            return { ok: true, status: response.status };
        }

        try {
            // Попытка получить JSON из ответа
            return await response.json();
        } catch (e) {
            // Возвращаем базовую информацию об успешном ответе, если JSON не получен
            return { ok: true, status: response.status };
        }
    }

    /**
     * Выполняет HTTP-запрос
     * @param {AbortSignal} [signal] - Сигнал для отмены запроса
     * @returns {Promise} - Промис с результатом запроса
     */
    async fetch(signal) {
        // Проверка наличия URL
        if (!this.url) {
            return Promise.resolve({ ...this.ERROR_RESPONSE, message: "URL is not defined" });
        }

        try {
            const requestConfig = this._prepareRequestConfig(signal);
            const response = await fetch(this.url, requestConfig);
            return await this._handleResponse(response);
        } catch (error) {
            // Обработка отмены запроса
            if (error?.name === "tabort") {
                return Promise.resolve({ cancelled: true, status: 0 });
            }

            // Общая обработка ошибок
            return Promise.resolve({
                ...this.ERROR_RESPONSE,
                message: error?.message || "Network error",
                error: error
            });
        }
    }

    /**
     * Вспомогательный метод для создания GET-запроса
     * @param {string} url - URL запроса
     * @param {Object} [headers={}] - Заголовки запроса
     * @returns {Fetch} - Новый экземпляр Fetch
     */
    static get(url, headers = {}) {
        return new Fetch("GET", url, headers);
    }

    /**
     * Вспомогательный метод для создания POST-запроса
     * @param {string} url - URL запроса
     * @param {Object|string|FormData} [body=null] - Тело запроса
     * @param {Object} [headers={}] - Заголовки запроса
     * @returns {Fetch} - Новый экземпляр Fetch
     */
    static post(url, body = null, headers = {}) {
        return new Fetch("POST", url, headers, body);
    }

    /**
     * Вспомогательный метод для создания PUT-запроса
     * @param {string} url - URL запроса
     * @param {Object|string|FormData} [body=null] - Тело запроса
     * @param {Object} [headers={}] - Заголовки запроса
     * @returns {Fetch} - Новый экземпляр Fetch
     */
    static put(url, body = null, headers = {}) {
        return new Fetch("PUT", url, headers, body);
    }

    /**
     * Вспомогательный метод для создания DELETE-запроса
     * @param {string} url - URL запроса
     * @param {Object} [headers={}] - Заголовки запроса
     * @returns {Fetch} - Новый экземпляр Fetch
     */
    static delete(url, headers = {}) {
        return new Fetch("DELETE", url, headers);
    }
}

/**
 * Обновляет иконки приложения для разных платформ
 * @param {Object} config - конфигурация иконок
 */
function updateAppIcons(config) {
    // Обновляем manifest
    const manifestLink = document.querySelector('head > link[rel="manifest"]');
    if (manifestLink) manifestLink.href = config.manifest;

    // Обновляем иконки для Apple устройств
    for (const size in config.icons) {
        const icon = document.querySelector(`head > link[sizes="${size}"]`);
        if (icon) icon.href = config.icons[size];
    }
}

export const OAuth = new class {
    constructor() {
        this.refreshing = null;

        this.access = JSON.parse(localStorage.getItem('hub-access')) || null;
        this.user = JSON.parse(localStorage.getItem('hub-whoami')) || null;
        this.auth = this.access ? !this.isExpired() : false;
        this.events.setMode($MODE);
    }

    events = {
        setMode: (mode) => {
            this.mode = mode;
            this.scope = this.access ? this.access.scope : []
        },

        genLink: async (tun) => {
            const response = await tun.io.genLink();
            if (!response.complete && !response.parsed) return;
            return response.value.link;
        },

        sleep: (ms) => {
            return new Promise((resolve) => setTimeout(resolve, ms));
        },

        clear: () => {
            const indexs = ['hub-access', 'hub-whoami'];
            for (let i = 0; i < indexs.length; i++) {
                const key = indexs[i];
                localStorage.removeItem(key);
            }
        }
    }

    requests = {
        authorizate: (tun, code) => {
            const r = async () => {
                const response = await tun.io.auth(code);
                if (!response.complete || !response.parsed) throw response;

                const { shiki, whoami } = response.value;

                this.access = {
                    ...shiki,
                    scope: shiki.scope.split(' ')
                };

                this.user = whoami;
                this.auth = true;

                localStorage.setItem('hub-access', JSON.stringify(this.access));
                localStorage.setItem('hub-whoami', JSON.stringify(this.user));
                return this.access;
            }

            return r();
        },

        refreshToken: (tun) => {
            if (this.refreshing) return this.refreshing;

            this.refreshing = (async () => {
                const response = await tun.io.refresh();
                if (!response.complete || !response.parsed) {
                    this.auth = false;
                    return null;
                }

                const { shiki, whoami } = response.value;

                this.access = { ...shiki, scope: String(shiki.scope || "").split(" ") };
                this.user = whoami;
                this.auth = true;

                localStorage.setItem("hub-access", JSON.stringify(this.access));
                localStorage.setItem("hub-whoami", JSON.stringify(this.user));
                return this.access;
            })().finally(() => {
                this.refreshing = null;
            });

            return this.refreshing;
        },

        getWhoami: () => {
            /**
             * Выполняет запрос с попытками
             * @param {Fetch} [request] 
             */
            const r = (request) => {
                return new Promise(async (resolve) => {
                    const response = await request.fetch();

                    if (response.failed) {
                        if (response.status === 429) {
                            await this.events.sleep(1000);
                            return resolve(r(request));
                        }
                        return resolve(this.user);
                    }

                    this.user = response;
                    localStorage.setItem('hub-whoami', JSON.stringify(this.user));
                    resolve(this.user);
                });
            }

            const request = Fetch.get(`${sUrl}/api/users/whoami`, Headers.bearer);
            return r(request);
        }
    }

    isExpired(skewSec = 60) {
        const { access } = this;
        const expRaw = access?.expires_at;

        if (!expRaw) return true;

        const now = Math.floor(Date.now() / 1000);
        const exp = Number(expRaw);

        return now >= (exp - skewSec);
    }
}

export const Headers = new class {
    get base() {
        return { "Accept": "application/json" };
    }
    get bearer() {
        const { access } = OAuth;
        return {
            "Authorization": `${access.token_type} ${access.access_token}`,
            "Accept": "application/json",
        };
    }
}

export const Main = async (callback) => {
    const { Tunime } = await import("../modules/api.tunime.js");

    if (!OAuth.access) {
        return callback(false);
    }

    if (OAuth.isExpired()) {
        await OAuth.requests.refreshToken(Tunime);
        if (!OAuth.auth) {
            return callback(false);
        }
    }

    callback(OAuth.auth);
}