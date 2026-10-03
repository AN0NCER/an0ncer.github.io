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

class Endpoint {
    /**
     * @param {string} url
     * @param {{maxAttempts?: number, baseDelay?: number, maxDelay?: number, threshold?: number, cooldown?: number}} [opts]
     */
    constructor(url, opts = {}) {
        this.url = url;
        this.maxAttempts = opts.maxAttempts ?? 3;
        this.baseDelay = opts.baseDelay ?? 400;
        this.maxDelay = opts.maxDelay ?? 4000;

        // Здоровье сервера. downUntil обязателен числом: с undefined
        // сравнение даёт false, и сервер считался бы вечно мёртвым
        this.fails = 0;
        this.downUntil = 0;
        this.threshold = opts.threshold ?? 3;
        this.cooldown = opts.cooldown ?? 15000;
    }

    getUrl() {
        return this.url;
    }

    get alive() {
        return Date.now() >= this.downUntil;
    }

    /** Отказ самого сервера: сеть или 5xx. 4xx сюда не относятся */
    fail() {
        if (++this.fails < this.threshold) return;

        this.downUntil = Date.now() + this.cooldown;
        this.fails = 0;
    }

    ok() {
        this.fails = 0;
        this.downUntil = 0;
    }

    /** задержка перед попыткой n (0-based), экспонента + джиттер */
    delayFor(attempt) {
        const exp = Math.min(this.baseDelay * 2 ** attempt, this.maxDelay);
        return exp / 2 + Math.random() * (exp / 2);
    }
}

class Client {
    /**
     * @param {Endpoint} endpoint 
     * @param {Device} device 
     * @param {Session} session
     * @param {{retryStatuses?: number[], open?: string[], login?: () => Promise<any>}} [opts]
     */
    constructor(endpoint, device, session, opts = {}) {
        this.endpoint = endpoint;
        this.device = device;
        this.session = session;
        this.retryStatuses = new Set(opts.retryStatuses || [429, 502, 503, 504]);

        // Пути самой авторизации ждать нельзя — это и есть логин
        this.open = new Set(opts.open || ['/login', '/login/confirm', '/keep-alive']);
        this.login = opts.login ?? null;
    }


    /**
     * Сессия для этого пути. Дедупликация живёт в Api.login() — здесь
     * достаточно дождаться того логина, который уже идёт
     */
    async #auth(path) {
        if (this.open.has(path)) return null;
        if (this.session.access && this.session.live()) return null;
        if (!this.login || !this.endpoint.alive) return null;

        return this.login();
    }

    /**
     * @param {string} path 
     * @param {RequestInit} opts 
     * @param {(v:tResponse) => {}} e
     * @returns {Promise<tResponse>}
     */
    async fetch(path, opts = { method: 'GET' }, e = () => { }) {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        const base = { ...opts, headers: { ...(opts.headers || {}) } };
        const body = this.#prepareBody(base);       // один раз, до цикла
        const url = this.endpoint.getUrl();

        const route = path.split('?')[0];

        let error = null;
        let relogin = false;    // перелогин по 401 — не больше одного на вызов

        await this.#auth(route);

        if (!this.endpoint.alive) {
            const res = {
                value: undefined, complete: false, parsed: false,
                status: 0, offline: true,
                retry: () => this.fetch(path, opts, e),
            };
            e(res);
            return res;
        }

        for (let attempt = 0; attempt < this.endpoint.maxAttempts; attempt++) {
            if (attempt > 0) await sleep(this.endpoint.delayFor(attempt - 1));

            const init = { ...base, cache: 'no-store', headers: this.#headers(base.headers) };
            if (base.method === 'GET' || body === undefined) delete init.body;
            else init.body = body;

            try {
                const response = await window.fetch(`${url}${path}`, init);

                if (this.retryStatuses.has(response.status)) {
                    // 429 — живой сервер, который просит подождать
                    if (response.status !== 429) this.endpoint.fail();

                    error = new Error(`Retryable ${response.status}`);
                    continue;
                }

                // Ключ отправлен, но сервер его не знает: сессия умерла на
                // его стороне раньше, чем истекла у нас, и по локальной дате
                // гейт считает её живой. Перелогин и один повтор
                if (response.status === 401 && !relogin && this.login && !this.open.has(route)) {
                    relogin = true;
                    this.session.access = undefined;

                    await this.#auth(route);

                    attempt--;  // восстановление не должно съедать попытку
                    continue;
                }

                const [parsed, raw] = await this.#parse(response);
                const tResp = {
                    complete: response.ok,
                    parsed,
                    status: response.status,
                    value: raw,
                    retry: () => this.fetch(path, opts, e),
                };

                // Ответ получен — сервер жив, каким бы ни был статус
                this.endpoint.ok();

                e(tResp);
                return tResp;
            } catch (err) {
                this.endpoint.fail();
                error = err;  // network / CORS / timeout
            }
        }

        const res = {
            value: undefined, complete: false, parsed: false,
            status: 600, err: String(error),
            retry: () => this.fetch(path, opts, e),
        };
        e(res);
        return res;
    }

    #headers(extra = {}) {
        const h = { ...extra, 'x-tun-did': this.device.id };
        const acc = this.session.access;
        if (acc?.key) h['x-tun-key'] = acc.key;
        if (acc?.id) h['x-tun-id'] = acc.id;
        return h;
    }

    #prepareBody(base) {
        const raw = base.body;
        if (!raw || typeof raw !== 'object' || raw instanceof URLSearchParams) return raw;

        const fd = new FormData();
        this.#appendFormData(fd, raw);

        if (this.#hasBinary(raw)) return fd;

        base.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
        return new URLSearchParams(fd);
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

class Certificate {
    static dbName = 'hub-cert';
    static storeName = 'keys';
    static recordKey = 'device';
    static algorithm = { name: 'ECDSA', namedCurve: 'P-256' }

    #pair = undefined;
    #loaded = false;
    #dbPromise = null;

    get loaded() {
        return this.#loaded;
    }

    get hasKey() {
        return this.#pair !== undefined;
    }

    #openDb() {
        if (this.#dbPromise) return this.#dbPromise;

        this.#dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(Certificate.dbName, 1);
            req.onupgradeneeded = () => req.result.createObjectStore(Certificate.storeName);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        }).catch(err => {
            this.#dbPromise = null;
            throw err;
        });

        return this.#dbPromise;
    }

    async #get() {
        const db = await this.#openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(Certificate.storeName, 'readonly');
            const req = tx.objectStore(Certificate.storeName).get(Certificate.recordKey);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async #set(value) {
        const db = await this.#openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(Certificate.storeName, 'readwrite');
            tx.objectStore(Certificate.storeName).put(value, Certificate.recordKey);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async ensure() {
        if (this.#loaded) return this.#pair;

        try {
            let pair = await this.#get();

            if (!pair) {
                pair = await crypto.subtle.generateKey(Certificate.algorithm, false, ['sign', 'verify']);
                await this.#set(pair);
            }

            this.#pair = pair;
            this.#loaded = true;
        } catch (err) {
            console.warn('[Certificate] хранилище ключей недоступно', err);
            this.#pair = undefined;
        }

        return this.#pair;
    }

    async publicKeyJwk() {
        const pair = await this.ensure();
        if (!pair) return undefined;
        return crypto.subtle.exportKey('jwk', pair.publicKey);
    }

    async sign(message) {
        const pair = await this.ensure();
        if (!pair) return undefined;

        const sigBuf = await crypto.subtle.sign(
            { name: 'ECDSA', hash: 'SHA-256' },
            pair.privateKey,
            new TextEncoder().encode(message)
        );

        return btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
    }

    async reset() {
        const db = await this.#openDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(Certificate.storeName, 'readwrite');
            tx.objectStore(Certificate.storeName).delete(Certificate.recordKey);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        this.#pair = undefined;
        this.#loaded = false;
    }
}

const endpoint = new Endpoint('https://hub.tunime.app');

// Сеть вернулась — не дожидаемся остатка cooldown
window.addEventListener('online', () => endpoint.ok());

const device = new Device();

const snapshot = new Shadow(device);

const session = new Session({
    onUpdate: ({ value, session }) => {
        snapshot.update(session);
    }
})

/**
 * Плеер живёт в iframe и намеренно исключён из бутстрапа — авторизацией
 * занимается только верхнее окно. У фрейма свой экземпляр модуля, и общая
 */
const client = new Client(endpoint, device, session, {
    login: window.self === window.top ? () => Api.login() : null
});

/**
 * Метаданные сессии, которые сервер прикладывает к ответам /login,
 * /login/confirm, /keep-alive и /shiki/auth: `uid` текущего владельца и
 * `collectionsRev` — маркер изменений коллекций.
 *
 * `uid` идёт в паре с маркером не для красоты: счётчики у разных
 * пользователей растут независимо
 */
const meta = new class {
    #value = { uid: null, collectionsRev: null };
    #listeners = [];

    /**
     * Приходил ли хоть один ответ с метаданными.
     *
     * Отличает «сервер сказал: владельца нет» (логаут) от «мы ещё ничего
     * не спрашивали». Без этого различия стартовое пустое значение выглядело
     * бы как логаут — и подписчики сбрасывали бы кэш на ровном месте.
     * Это реально случается: если сессия ещё жива, /login не вызывается,
     * и до первого keep-alive метаданных нет вообще.
     */
    #seen = false;

    get value() {
        return { ...this.#value };
    }

    /** Получены ли метаданные хотя бы раз за эту загрузку страницы */
    get seen() {
        return this.#seen;
    }

    /**
     * Принять поля из ответа сервера. Отсутствующие в ответе — не трогаем,
     * поэтому роуты, которые про метаданные не знают, ничего не сбрасывают.
     * @param {Object} payload
     */
    accept(payload) {
        if (!payload || typeof payload !== 'object') return;
        if (!('uid' in payload) && !('collectionsRev' in payload)) return;

        const next = {
            uid: 'uid' in payload
                ? (payload.uid === null || payload.uid === undefined ? null : String(payload.uid))
                : this.#value.uid,
            collectionsRev: 'collectionsRev' in payload
                ? payload.collectionsRev
                : this.#value.collectionsRev
        };

        const changed = !this.#seen
            || next.uid !== this.#value.uid
            || next.collectionsRev !== this.#value.collectionsRev;

        this.#value = next;
        this.#seen = true;

        if (changed) {
            for (const listener of this.#listeners) {
                try {
                    listener(this.value);
                } catch (err) {
                    console.warn('[hub] обработчик meta упал', err);
                }
            }
        }
    }

    /**
     * Подписка. Обработчик вызывается сразу с текущим значением —
     * подписчик может появиться позже логина и всё равно его получит.
     * @param {(meta: {uid: string|null, collectionsRev: number|null}) => void} fn
     */
    on(fn) {
        if (typeof fn !== 'function') return;

        this.#listeners.push(fn);

        // Сразу отдаём только то, что реально пришло с сервера. Пустое
        // стартовое значение подписчику не показываем — он принял бы его
        // за логаут
        if (!this.#seen) return;

        try {
            fn(this.value);
        } catch (err) {
            console.warn('[hub] обработчик meta упал', err);
        }
    }
}();

const Api = new class {
    /** Логин в полёте. Один на всех: гейт, бутстрап и keep-alive */
    #logging = null;

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

    /**
     * Параллельные логины недопустимы: каждый /login/confirm выдаёт новый
     * ключ сессии, и тот, кто пришёл первым, остаётся со старым — сервер
     * отвечает ему 401
     */
    login() {
        if (this.#logging) return this.#logging;

        this.#logging = this.#login().finally(() => { this.#logging = null; });
        return this.#logging;
    }

    async #login() {
        const pubKey = await certificate.publicKeyJwk();

        const response = await this.client.fetch('/login', {
            method: 'POST',
            body: pubKey ? { pubKey } : undefined
        });

        if (response.status !== 200 || !response.parsed) {
            return null;
        }

        const { data, shiki, certRequired, loginId } = response.value ?? {};

        if (!data?.did) return null;

        this.device.id = data.did;

        // Устройство без сертификата получает uid и маркер уже здесь;
        // у устройств с сертификатом это ещё pending-сессия без uid,
        // и метаданные приедут после подтверждения
        if (!certRequired) meta.accept(response.value);

        if (certRequired) {
            const confirmed = await this.#confirmLogin(data.did, loginId);

            if (confirmed.data) {
                this.session.access = confirmed.data.data;
                if (confirmed.data.shiki) OAuth.access = confirmed.data.shiki;
                meta.accept(confirmed.data);
                return this.session.access;
            }

            if (confirmed.reset) {
                console.warn(`[hub] сброс устройства: ${confirmed.code}`);
                this.device.id = undefined;
            } else if (confirmed.code) {
                console.warn(`[hub] вход не подтверждён (${confirmed.code}), did сохранён`);
            }

            this.session.access = undefined;
            return null;
        }

        this.session.access = data;
        if (shiki) OAuth.access = shiki;

        return this.session.access;
    }

    /**
     * @returns {Promise<{data: Object|null, reset: boolean, code: string|null}>}
     */
    async #confirmLogin(did, loginId) {
        const sig = await certificate.sign(`${did}:${loginId}`);

        // Подписать нечем: хранилище ключей недоступно (приватный режим,
        // вытеснение IndexedDB).
        if (!sig) return { data: null, reset: false, code: 'CERT_UNAVAILABLE' };

        const response = await this.client.fetch('/login/confirm', {
            method: 'POST',
            headers: { 'x-tun-login-id': loginId, 'x-tun-sig': sig }
        });

        if (response.status === 200 && response.parsed) {
            return { data: response.value, reset: false, code: null };
        }

        // Сеть/таймаут/5xx
        if (!response.parsed) {
            return { data: null, reset: false, code: 'NETWORK' };
        }

        return {
            data: null,
            reset: response.value?.reset === true,
            code: response.value?.code ?? 'UNKNOWN'
        };
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

        // Маркер коллекций едет попуткой
        meta.accept(response.value);

        return data;
    }
}(client, session, device);

export const certificate = new Certificate();
window.certificate = certificate;

//Public API
export const Hub = new class {
    snapshot = snapshot;

    /**
     * Метаданные сессии от сервера: { uid, collectionsRev }.
     * Приезжают из /login, /login/confirm, /keep-alive и /shiki/auth.
     */
    get meta() {
        return meta.value;
    }

    /**
     * Подписка на метаданные. Обработчик вызывается сразу с текущим
     * значением, так что подписаться можно в любой момент.
     * @param {(meta: {uid: string|null, collectionsRev: number|null}) => void} fn
     */
    onMeta(fn) {
        meta.on(fn);
    }

    get url() {
        return endpoint.getUrl();
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

            // Привязка аккаунта: сообщаем нового владельца и его маркер —
            // модуль коллекций по этому сигналу сбросит чужой кэш
            meta.accept(response.value);

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

                // Владельца больше нет — тот же сигнал, что и при входе,
                // только с uid: null
                meta.accept(response.value);
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
    if (window.self !== window.top) return;

    const pwa = (await import("./pwa.core.js")).$PWA;

    const IniT = async () => {
        let timeout = undefined;
        let planning = false;   // update() уже в полёте

        promiseOnInitHub.forEach((resolve) => resolve());

        const schedule = (ms) => {
            clearTimeout(timeout);
            // Меньше секунды — защита от мгновенного цикла на просроченной сессии
            timeout = setTimeout(tick, Math.max(ms, 1000));
            console.log(`[api] - Weiter durch ${ms} ms`);
        };

        const tick = async () => {
            if (document.visibilityState !== 'visible') return;

            try {
                // Сессию не обнуляем: login и keepAlive присвоят свежую сами
                const acc = session.live() ? await Api.keepAlive() : await Api.login();

                if (!acc) return;
                if (acc.code === 401 && !await Api.login()) return;

                update();
            } catch (err) {
                console.log('[api] - цикл сессии упал', err);
            }
        };

        const update = async () => {
            if (planning) return;
            planning = true;

            try {
                if (session.access === undefined && !await Api.login()) return;

                const acc = session.access;
                if (!acc?.end) return;

                schedule(Date.parse(acc.end) - Date.now() - 60000);
            } finally {
                planning = false;
            }
        };

        document.addEventListener('visibilitychange', () => {
            clearTimeout(timeout);
            if (document.visibilityState === 'visible') update();
        });

        window.addEventListener('pageshow', (e) => {
            if (e.persisted) update();
        });

        update();
    };

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
})({ exception: ['/player.html', '/tplayer.html'] });