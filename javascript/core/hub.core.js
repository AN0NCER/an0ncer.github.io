import { OAuth } from "./main.core.js";

const promiseOnInitHub = [];

class Session {
    static key = 'shadow-api';

    #val = undefined;
    #loaded = false;

    constructor({ onUpdate } = {}) {
        this.onUpdate = typeof onUpdate === 'function' ? onUpdate : null;

        // 1) Изменения из других вкладок
        window.addEventListener('storage', (e) => {
            if (e.key !== Session.key) return;
            this.sync({ reason: 'storage' });
        });

        // 2) Возврат из bfcache (Safari/Chrome/Firefox)
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                this.sync({ reason: 'bfcache' });
            } else {
                // обычная загрузка страницы
                this.sync({ reason: 'pageshow' });
            }
        });

        // 3) Возврат на вкладку (мог истечь токен пока вкладка была скрыта)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.sync({ reason: 'visible' });
            }
        });

        // начальная синхронизация
        this.sync({ reason: 'init' });
    }

    get loaded() {
        return this.#loaded;
    }

    get access() {
        // после первой sync() всегда возвращаем то, что в памяти
        if (this.#loaded) return this.#val;

        // на случай, если кто-то вызвал getter до init-sync
        this.sync({ reason: 'lazy', silent: true });
        return this.#val;
    }

    set access(value) {
        // сохраняем и сразу синхронизируем локальное состояние этой вкладки
        if (value === undefined) {
            localStorage.removeItem(Session.key);
        } else {
            localStorage.setItem(Session.key, JSON.stringify(value));
        }

        // storage event тут не придёт -> обновляем вручную
        this.sync({ reason: 'setter' });
    }

    // "живой ли токен" (true = живой)
    live(access = this.#val) {
        if (!access || !access.end) return false;
        const end = Date.parse(access.end);
        if (!Number.isFinite(end)) return false;
        return end > Date.now();
    }

    setScope(scopes = []) {
        // если нет сессии — нечего обновлять
        if (this.#val === undefined) return false;

        // нормализуем вход в массив строк
        const nextScope = Array.isArray(scopes)
            ? scopes.filter(Boolean).map(String)
            : [String(scopes)].filter(Boolean);

        // если уже такое же — ничего не делаем
        const curr = Array.isArray(this.#val.scope) ? this.#val.scope : (this.#val.scope ? [this.#val.scope] : []);
        if (this.#deepEqual(curr, nextScope)) return false;

        // обновляем в памяти
        this.#val = { ...this.#val, scope: nextScope };

        // сохраняем (важно: если #val вдруг стал невалидным — sync сам подчистит)
        localStorage.setItem(Session.key, JSON.stringify(this.#val));

        // обновляем состояние/триггеры (onUpdate)
        this.sync({ reason: 'scope', silent: false });

        return true;
    }


    // перечитать localStorage -> провалидировать -> обновить #val -> вызвать onUpdate при изменении
    sync({ reason = 'sync', silent = false } = {}) {
        const raw = localStorage.getItem(Session.key);
        const next = this.#safeParse(raw);

        // если next есть, но протух — чистим storage и считаем как undefined
        let normalized = next;
        if (normalized !== undefined && !this.live(normalized)) {
            normalized = undefined;
            localStorage.removeItem(Session.key);
        }

        const changed = !this.#deepEqual(this.#val, normalized);

        this.#val = normalized;
        this.#loaded = true;

        if (!silent && changed && this.onUpdate) {
            this.onUpdate({ reason, value: this.#val, session: this });
        }
    }

    #safeParse(raw) {
        if (!raw) return undefined;
        try {
            const v = JSON.parse(raw);
            // если там null — тоже считаем "нет сессии"
            return v ?? undefined;
        } catch {
            // мусор -> чистим, чтобы не падать всегда
            localStorage.removeItem(Session.key);
            return undefined;
        }
    }

    // чтобы не дергать update без реального изменения
    #deepEqual(a, b) {
        if (a === b) return true;
        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch {
            return false;
        }
    }
}

class Device {
    static key = 'tunime-id';

    #id = undefined;
    #loaded = false;

    constructor({ onUpdate } = {}) {
        this.onUpdate = typeof onUpdate === 'function' ? onUpdate : null;

        // изменения из других вкладок
        window.addEventListener('storage', (e) => {
            if (e.key !== Device.key) return;
            this.sync({ reason: 'storage' });
        });

        // bfcache restore / обычный pageshow
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) this.sync({ reason: 'bfcache' });
        });

        // первичная загрузка
        this.sync({ reason: 'init', silent: true });
    }

    get loaded() {
        return this.#loaded;
    }

    get id() {
        if (!this.#loaded) this.sync({ reason: 'lazy', silent: true });
        return this.#id;
    }

    set id(value) {
        // пустое -> удалить ключ
        const normalized = this.#normalize(value);

        if (this.#id === normalized && this.#loaded) return;

        if (normalized === undefined) {
            localStorage.removeItem(Device.key);
        } else {
            localStorage.setItem(Device.key, normalized);
        }

        // в этой вкладке storage event не придёт
        this.sync({ reason: 'setter' });
    }

    sync({ reason = 'sync', silent = false } = {}) {
        const raw = localStorage.getItem(Device.key);
        const next = this.#normalize(raw);

        const changed = this.#id !== next || !this.#loaded;

        this.#id = next;
        this.#loaded = true;

        if (!silent && changed && this.onUpdate) {
            this.onUpdate({ reason, value: this.#id });
        }
    }

    #normalize(value) {
        // принимаем string | undefined | null
        if (value === null || value === undefined) return undefined;

        const s = String(value).trim();

        // убираем типичные "мусорные" записи
        if (!s || s === 'undefined' || s === 'null') return undefined;

        return s;
    }
}

/**
 * @typedef {Object} tResponse
 * @property {boolean} complete
 * @property {boolean} parsed
 * @property {number} status
 * @property {Object | undefined} value
 * @property {string} [err]
 * @property {() => Promise<TextDecoderStreamResponse>} [retry]
 */

class Pool {
    /**
     * @param {string[]} servers 
     * @param {{storage: Storage, storageKey: string}} [opts] 
     */
    constructor(servers = [], opts = {}) {
        this.servers = servers;
        this.storage = opts.storage || sessionStorage;
        this.key = opts.storageKey || 'shadow-url';

        this.meta = {
            id: 0,
            blocked: false,
            cycleCount: 0,
            blockedTime: null
        };

        this.sync();
        this.#checkUnlock();
        this.#startUnlockTimer();
    }

    sync() {
        const raw = this.storage.getItem(this.key);
        if (!raw) return;

        try {
            const stored = JSON.parse(raw);

            // Востоновление состояния
            if (stored && typeof stored === "object") {
                this.meta = stored;
            }

            // Нормализация id
            if (this.servers.length === 0) this.meta.id = 0;
            else this.meta.id = ((this.meta.id % this.servers.length) + this.servers.length) % this.servers.length;

        } catch {
            this.storage.removeItem(this.key);
        }
    }

    getUrl() {
        return this.servers[this.meta.id];
    }

    fail(url) {
        if (this.meta.blocked) return false;
        const n = this.servers.length;
        if (n === 0) return false;

        this.meta.id = (this.meta.id + 1) % n;

        // если замкнули круг — считаем цикл
        if (this.meta.id === 0) {
            this.meta.cycleCount += 1;
        }

        if (this.meta.cycleCount >= 1) {
            this.meta.blocked = true;
            this.meta.blockedTime = Date.now();
            this.#save();
            return false;
        }

        this.#save();
        return true;
    }

    //Helps

    #checkUnlock() {
        if (!this.meta.blocked || !this.meta.blockedTime) return;

        const elapsed = Date.now() - this.meta.blockedTime;
        if (elapsed >= this.meta.unlockTime) {
            this.#reset();
        }
    }

    #reset() {
        this.meta.blocked = this.fail;
        this.meta.blockedTime = null;
        this.meta.cycleCount = 0;
        this.meta.id = 0;
        this.#save();
    }

    #save() {
        this.storage.setItem(this.key, JSON.stringify(this.meta));
    }

    #startUnlockTimer() {
        setInterval(() => this.#checkUnlock(), this.meta.checkInterval);
    }
}

class Client {
    /**
     * @param {Pool} pool 
     * @param {Device} device 
     * @param {Session} session
     * @param {{retryStatuses: number[], maxAttempts: number}} [opts] 
     */
    constructor(pool, device, session, opts = {}) {
        this.pool = pool;
        this.device = device;
        this.session = session;

        this.retryStatuses = new Set(opts.retryStatuses || [502, 503, 504]);
        this.maxAttempts = opts.maxAttempts || 3;
    }

    /**
     * @param {string} path 
     * @param {RequestInit} opts 
     * @param {(v:tResponse) => {}} e
     * @returns {Promise<tResponse>}
     */
    async fetch(path, opts = { method: 'GET' }, e = () => { }) {
        const setupHeaders = (orig = {}) => ({
            ...orig,
            'x-tun-did': this.device.id,
            'x-tun-key': session.access?.key,
            'x-tun-id': session.access?.id
        });
        
        const setupBody = (body) => {
            if (!body || typeof body !== "object" || body instanceof URLSearchParams) return;
            
            const fd = new FormData();
            this.#appendFormData(fd, body);
            
            if (!this.#hasBinary(body)) {
                opts.headers = {
                    ...(opts.headers || {}),
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                }
                return new URLSearchParams(fd);
            }
            
            return fd;
        }
        
        let error = null;
        let attempt = 0;
        
        while (attempt < this.maxAttempts) {
            attempt++;
            
            const url = this.pool.getUrl();
            
            if (!url) {
                error = new Error('No availble servers');
                break;
            }
            
            opts.body = setupBody(opts.body);
            
            if (opts.method === 'GET' || opts.body === undefined) delete opts.body;
            
            try {
                const response = await window.fetch(`${url}${path}`, {
                    ...opts,
                    headers: setupHeaders(opts.headers)
                });
                /**@type {tResponse} */
                const tResp = {
                    complete: response.ok,
                    parsed: false,
                    status: response.status,
                    value: undefined
                }
                
                if (this.retryStatuses.has(response.status)) {
                    this.pool.fail(url);
                    error = new Error(`Retryable status ${response.status}`);
                    continue;
                }
                
                const [parsed, raw] = await this.#parse(response);
                
                tResp.parsed = parsed;
                tResp.value = raw;
                tResp.retry = () => this.fetch(path, opts, e);
                e(tResp);
                return tResp;
            } catch (err) {
                // network / CORS / timeout
                this.pool.fail(url);
                error = err;
                // loop -> try next available server
                continue;
            }
        }
        
        /**@type {tResponse} */
        const res = {
            value: undefined,
            complete: false,
            parsed: false,
            status: 600,
            err: String(error),
            retry: () => this.fetch(path, opts, e)
        }
        
        e(res);
        return res;
    }

    //Helps
    #hasBinary(data) {
        if (!data || typeof data !== "object") return false;

        for (const k in data) {
            const v = data[k];
            if (v instanceof File || v instanceof Blob) return true;
            if (v && typeof v === "object" && this.#hasBinary(v)) return true;
        }
        return false;
    }

    #appendFormData(fd = new FormData(), data, parentKey = '') {
        for (const key in data) {
            const value = data[key];
            const fullKey = parentKey ? `${parentKey}[${key}]` : key;

            if (value instanceof File || value instanceof Blob) {
                fd.append(fullKey, value, value?.name);
            } else if (typeof value === 'object' && value !== null) {
                this.#appendFormData(fd, value, fullKey);
            } else {
                fd.append(fullKey, value);
            }
        }
    }

    /**
     * 
     * @param {Response} response
     * @returns {Promise<[boolean, Object|undefined]>}
     */
    async #parse(response) {
        if (response.status === 404) {
            return [false, undefined]
        }
        try {
            const raw = await response.json();
            return [true, raw]
        } catch {
            return [false, undefined]
        }
    }
}

class Shadow {
    /**
     * @param {Device} device 
     */
    constructor(device) {
        this.device = device
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

    update(user) {
        const currentTime = Date.now();

        this._state = {
            isConnected: user.access !== undefined,
            hasApiAccess: user.access?.scope?.includes("player") || false,
            permissions: user.access?.scope || [],
            sessionExpiry: user.access?.end ? new Date(user.access.end) : null,
            deviceId: this.device.id,
            lastUpdate: new Date(currentTime)
        }

        // Добавляем вычисляемые поля
        this._state.isSessionValid = user.live();
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

const pool = new Pool([
    'https://tunime.onrender.com',
    'https://tunime-hujg.onrender.com'
], { storageKey: 'hub-state' });

const device = new Device();

const snapshot = new Shadow(device);

const session = new Session({
    onUpdate: ({ value, session }) => {
        snapshot.update(session);
    }
})

const client = new Client(pool, device, session);

const Api = new class {
    /**
     * @param {Client} client 
     * @param {Session} session 
     * @param {Device} device 
     */
    constructor(client, session, device) {
        this.client = client;
        this.session = session;
        this.device = device;
    }

    async login() {
        const response = await this.client.fetch('/login', { method: 'POST' });

        if (response.status !== 200 || !response.parsed) {
            return null;
        }

        const { data, shiki } = response.value;
        this.device.id = data.did;
        this.session.access = data;

        if (shiki) {
            OAuth.access = shiki;
        }

        return data;
    }

    async keepAlive() {
        const response = await this.client.fetch('/keep-alive');

        if (response.status !== 200 || !response.parsed) {
            if (response.status === 401) {
                return response.value;
            }
            return null;
        }

        const { data } = response.value;
        this.session.access = data;

        return data;
    }
}(client, session, device);

//Public API
export const Hub = new class {
    snapshot = snapshot;

    get url() {
        return pool.getUrl();
    }

    /**
     * @param {string} path 
     * @param {RequestInit} opts 
     * @param {(v:tResponse) => {}} e 
     * @returns {Promise<tResponse>}
     */
    fetch(path, opts = { method: 'GET' }, e = () => { }) {
        return client.fetch(path, opts, e);
    }

    onInit(event = () => { }) {
        return new Promise((resolve) => {
            event();
            promiseOnInitHub.push(resolve);
        })
    }

    api = {
        auth: async (code) => {
            const app = _getAppInfo('application_installed');

            const response = await client.fetch(`/shiki/auth?app=${app.installed}&date=${app.date}`, { method: 'POST', body: { code } });

            if (!response.parsed || !response.complete) {
                return response;
            }

            const { data } = response.value;
            session.access = data;

            return response;
        },

        refresh: async () => {
            return client.fetch('/shiki/auth', { method: 'PATCH' });
        },

        link: () => {
            return client.fetch('/shiki/auth', { method: 'GET' });
        },

        logout: async () => {
            const response = await client.fetch(`/shiki/auth`, { method: 'DELETE' });

            if (response.parsed && response.complete) {
                session.access = response.value.data;
            }

            return response.value?.data;
        }
    }
}();

function _getAppInfo(key) {
    let raw;
    try {
        raw = JSON.parse(localStorage.getItem(key) ?? 'null');
    } catch {
        raw = null;
    }

    const installed = typeof raw?.installed === 'boolean' ? raw.installed : false;
    const date = typeof raw?.date === 'string' ? raw.date : '';

    return { installed, date };
}

(async ({ exception = [] } = {}) => {
    if (exception.includes(window.location.pathname)) return;

    const pwa = (await import("./pwa.core.js")).$PWA;

    const IniT = async () => {
        let timeout = undefined;

        promiseOnInitHub.forEach((resolve) => {
            resolve();
        })

        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState !== 'visible') {
                clearTimeout(timeout);
            } else {
                clearTimeout(timeout);
                update();
            }
        });

        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                clearTimeout(timeout);
                update();
            }
        });

        const update = async () => {
            const time = 60000;

            if (session.access === undefined) {
                const acc = await Api.login();
                if (!acc) {
                    return;
                }
            }

            const date = Date.parse(session.access.end) - Date.now() - time;

            timeout = setTimeout(async () => {
                if (document.visibilityState !== 'visible') return;

                if (!session.live()) {
                    session.access = undefined;
                    await Api.login();
                } else {
                    const acc = await Api.keepAlive();

                    if (!acc) {
                        return;
                    } else if (acc.code === 401) {
                        await Api.login();
                    }

                    update();
                }
            }, date);

            console.log(`[api] - Weiter durch ${date} ms`);
        }

        update();
    }

    pwa.events.on('load', async () => {
        try {
            if (session.access === undefined) {
                let acc = await Api.login();

                if (acc && !acc.scope.includes("player")) {
                    acc = await Api.keepAlive();
                }
            }

            IniT();
        } catch (err) {
            console.log(err);
        }

    }, { once: true, replay: true });
})({ exception: ['/player.html'] });