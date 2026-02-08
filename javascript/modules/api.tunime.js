class Session {
    static key = 'shadow-api';

    #val = undefined;
    #loaded = false;

    constructor({ onUpdate } = {}) {
        // колбек, если надо дергать $SHADOW.update()\
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

class Failover {
    static key = 'shadow-url';

    #config;
    #state;

    constructor(servers = [], config = {}) {
        this.#config = {
            key: Failover.key,
            unlockTime: 5 * 60 * 1000,
            checkInterval: 10 * 1000,
            requestTimeout: 12 * 1000, // чтобы не висеть вечно
            ...config
        };

        this.#state = {
            servers: Array.isArray(servers) ? servers.filter(Boolean) : [],
            id: 0,
            blocked: false,
            cycleCount: 0,
            blockedTime: null
        };

        this.sync({ reason: 'init' });
        this.checkUnlock();
        this.startUnlockTimer();
    }

    // ---- state ----

    sync({ reason = 'sync' } = {}) {
        const raw = sessionStorage.getItem(this.#config.key);
        if (!raw) return;

        try {
            const stored = JSON.parse(raw);

            // Мягко восстанавливаем только ожидаемые поля
            if (stored && typeof stored === 'object') {
                if (Array.isArray(stored.servers)) this.#state.servers = stored.servers.filter(Boolean);
                if (Number.isInteger(stored.id)) this.#state.id = stored.id;
                if (typeof stored.blocked === 'boolean') this.#state.blocked = stored.blocked;
                if (Number.isInteger(stored.cycleCount)) this.#state.cycleCount = stored.cycleCount;
                if (typeof stored.blockedTime === 'number' || stored.blockedTime === null) this.#state.blockedTime = stored.blockedTime;
            }

            // Нормализация id
            if (this.#state.servers.length === 0) this.#state.id = 0;
            else this.#state.id = ((this.#state.id % this.#state.servers.length) + this.#state.servers.length) % this.#state.servers.length;

        } catch {
            // Если мусор — очищаем, чтобы не падать всегда
            sessionStorage.removeItem(this.#config.key);
        }
    }

    save() {
        sessionStorage.setItem(this.#config.key, JSON.stringify(this.#state));
    }

    get url() {
        return this.#state.servers[this.#state.id];
    }

    // ---- блокировка после полного круга ----

    next() {
        if (this.#state.blocked) return false;
        const n = this.#state.servers.length;
        if (n === 0) return false;

        this.#state.id = (this.#state.id + 1) % n;

        // если замкнули круг — считаем цикл
        if (this.#state.id === 0) {
            this.#state.cycleCount += 1;
        }

        // после 1 полного круга — блокируем
        if (this.#state.cycleCount >= 1) {
            this.#state.blocked = true;
            this.#state.blockedTime = Date.now();
            this.save();
            return false;
        }

        this.save();
        return true;
    }

    checkUnlock() {
        if (!this.#state.blocked || !this.#state.blockedTime) return;

        const elapsed = Date.now() - this.#state.blockedTime;
        if (elapsed >= this.#config.unlockTime) {
            this.reset();
        }
    }

    startUnlockTimer() {
        setInterval(() => this.checkUnlock(), this.#config.checkInterval);
    }

    reset() {
        this.#state.id = 0;
        this.#state.blocked = false;
        this.#state.cycleCount = 0;
        this.#state.blockedTime = null;
        this.save();
    }

    // ---- fetch с failover ----

    fetch(path, params = { method: 'GET', body: undefined }) {
        // не мутируем входной объект (но если тебе ок — можно убрать копию)
        const opts = { ...params };

        if (opts.body !== undefined) {
            opts.body = new URLSearchParams(opts.body);
        } else {
            delete opts.body;
        }

        const retryStatuses = new Set([502, 503, 504]);

        const lFetch = (url) => {
            return new Promise((resolve, reject) => {
                fetch(url, opts)
                    .then((response) => {
                        if (retryStatuses.has(response.status)) {
                            // пробуем следующий сервер
                            if (this.next()) {
                                return resolve(lFetch(`${this.url}${path}`));
                            }
                            return resolve(response);
                        }

                        // успешный или любой другой статус
                        return resolve(response);
                    })
                    .catch((reason) => {
                        // network/CORS/timeout(если был AbortController) и т.п.
                        if (this.next()) {
                            return resolve(lFetch(`${this.url}${path}`));
                        }
                        reject(reason);
                    });
            });
        };

        return lFetch(`${this.url}${path}`);
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

    update(user) {
        const currentTime = Date.now();

        this._state = {
            isConnected: user.access !== undefined,
            hasApiAccess: user.access?.scope?.includes("player") || false,
            permissions: user.access?.scope || [],
            sessionExpiry: user.access?.end ? new Date(user.access.end) : null,
            deviceId: device.id,
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

/**
 * @typedef {Object} TResponse
 * @property {boolean} complete
 * @property {boolean} parsed
 * @property {number} status
 * @property {Object | undefined} value
 * @property {string} [err]
 * @property {() => Promise<TResponse>} [retry]
 */

class Controls {
    static instance = null;

    constructor() {
        if (Controls.instance) return Controls.instance;
        Controls.instance = this;
    }

    /**
     * 
     * @param {string} url 
     * @param {RequestInit} [opts] 
     * @param {(val:TResponse) => {}} e 
     * @returns {Promise<TResponse>}
     */
    async fetch(url, opts = { method: 'GET' }, e = () => { }) {
        /**@type {TResponse} */
        let res = {
            complete: false,
            parsed: false,
            status: 0,
            value: undefined
        };

        if (opts.body) {
            const body = new FormData();
            this.#appendFormData(body, opts.body);
            opts.body = body;
        }

        try {
            const response = await balancer.fetch(url, {
                ...opts,
                headers: {
                    ...opts.headers,
                    "x-tun-did": device.id,
                    "x-tun-key": user.access?.key,
                    "x-tun-id": user.access?.id
                }
            });

            res.status = response.status;
            res.complete = response.ok;

            const [parsed, raw] = await this.#parse(response);
            res.parsed = parsed;
            res.value = raw;
        } catch (err) {
            res.err = String(err);
            res.retry = () => this.fetch(url, opts);
        }

        e(res);
        return res;
    }

    #appendFormData(fd = new FormData(), data, parentKey = '') {
        for (const key in data) {
            const value = data[key];
            const fullKey = parentKey ? `${parentKey}[${key}]` : key;

            if (value instanceof File || value instanceof Blob) {
                fd.append(fullKey, value);
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

class Task {
    static key = 'tsk-tunime';

    #val = [];
    #loaded = false;

    #sessionSig = null;      // текущая сигнатура активной сессии
    #bound = false;          // мы уже знаем user.access?

    constructor({ onUpdate } = {}) {
        this.onUpdate = typeof onUpdate === 'function' ? onUpdate : null;

        window.addEventListener('pageshow', (e) => {
            if (e.persisted) this.sync({ reason: 'bfcache' });
            else this.sync({ reason: 'pageshow' });
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.sync({ reason: 'visible' });
            }
        });

        // грузим raw из localStorage, но НЕ принимаем решение чистить/оставлять,
        // пока не будет bindSession()
        this.sync({ silent: true, reason: 'init' });
    }

    /**
     * , когда user.access появился/обновился/стал undefined.
     * Здесь и происходит решение: оставить задачи или очистить.
     */
    bindSession(access, { silent = false, reason = 'bindSession' } = {}) {
        const nextSig = this.#makeSessionSig(access);

        if (nextSig === null) {
            this.#bound = true;
            this.#sessionSig = null;
            this.clear({ silent, reason: 'session-null' });
            return;
        }

        this.#bound = true;
        this.#sessionSig = nextSig;

        // проверяем что лежит в storage
        const payload = this.#readPayload();
        if (!payload) {
            // ничего нет — просто закрепили сессию
            return;
        }

        // если payload от другой сессии — очищаем
        if (payload.sessionSig && payload.sessionSig !== nextSig) {
            this.clear({ silent, reason: 'session-changed' });
            return;
        }

        // если payload без sessionSig (старый формат) — лучше очистить
        if (!payload.sessionSig) {
            this.clear({ silent, reason: 'missing-sessionSig' });
            return;
        }

        // иначе всё ок — оставляем как есть
        if (!silent && this.onUpdate) {
            this.onUpdate({ reason, value: this.#val });
        }
    }

    // --- API ---
    update(list = [], { merge = true, silent = false, reason = 'update' } = {}) {
        // если ещё не знаем сессию — обновлять нельзя, иначе перепутаешь сессии
        if (!this.#bound) return;

        const incoming = Array.isArray(list) ? list : [];
        const normalizedIncoming = incoming
            .filter(t => t && typeof t === 'object' && typeof t.key === 'string' && t.key.trim() !== '')
            .map(t => ({ key: t.key.trim(), ...t }));

        const next = merge ? this.#mergeByKey(this.#val, normalizedIncoming) : normalizedIncoming;
        this.#set(next, { silent, reason });
    }

    has(key) {
        return this.get(key) !== undefined;
    }

    get(key) {
        // пока не bindSession — лучше не отдавать задачи (они “не привязаны”)
        if (!this.#bound) return undefined;

        if (!this.#loaded) this.sync({ silent: true, reason: 'lazy' });
        const k = this.#normKey(key);
        if (!k) return undefined;
        return this.#val.find(t => t.key === k);
    }

    list() {
        if (!this.#bound) return [];
        if (!this.#loaded) this.sync({ silent: true, reason: 'lazy' });
        return this.#val;
    }

    remove(key, { silent = false, reason = 'remove' } = {}) {
        if (!this.#bound) return false;

        if (!this.#loaded) this.sync({ silent: true, reason: 'lazy' });
        const k = this.#normKey(key);
        if (!k) return false;

        const next = this.#val.filter(t => t?.key !== k);
        const changed = !this.#deepEqual(this.#val, next);
        if (changed) this.#set(next, { silent, reason });
        return changed;
    }

    clear({ silent = false, reason = 'clear' } = {}) {
        this.#set([], { silent, reason });
    }

    // --- storage ---
    sync({ silent = false, reason = 'sync' } = {}) {
        const payload = this.#readPayload();

        // если нет payload — пусто
        if (!payload) {
            this.#set([], { silent, reason, skipWrite: true });
            return;
        }

        // Поднимаем список в память (без чистки!)
        const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
        this.#set(tasks, { silent, reason, skipWrite: true });

        // ВАЖНО: тут НЕ очищаем по sessionSig — это делается только в bindSession()
    }

    // --- internals ---
    #readPayload() {
        const raw = localStorage.getItem(Task.key);
        if (!raw) return null;
        try {
            const v = JSON.parse(raw);
            if (!v || typeof v !== 'object') return null;
            return v;
        } catch {
            localStorage.removeItem(Task.key);
            return null;
        }
    }

    #writePayload() {
        const payload = {
            sessionSig: this.#sessionSig, // привязка к текущей сессии
            tasks: this.#val,
            updatedAt: Date.now()
        };
        localStorage.setItem(Task.key, JSON.stringify(payload));
    }

    #set(next, { silent = false, reason = 'set', skipWrite = false } = {}) {
        if (!Array.isArray(next)) next = [];
        const changed = !this.#deepEqual(this.#val, next);

        this.#val = next;
        this.#loaded = true;

        if (!skipWrite) this.#writePayload();

        if (!silent && changed && this.onUpdate) {
            this.onUpdate({ reason, value: this.#val });
        }
    }

    #mergeByKey(current, incoming) {
        const map = new Map();
        for (const t of current) if (t?.key) map.set(t.key, t);
        for (const t of incoming) map.set(t.key, { ...(map.get(t.key) || {}), ...t });
        return Array.from(map.values());
    }

    #normKey(key) {
        return typeof key === 'string' ? key.trim() : '';
    }

    #deepEqual(a, b) {
        if (a === b) return true;
        try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
    }

    #makeSessionSig(access) {
        // null = нет сессии
        if (!access) return null;
        // fallback
        return `id:${access.id ?? ''}`;
    }
}


const balancer = new Failover([
    'https://192.168.31.45:3001',
    // 'https://tunime.onrender.com',
    // 'https://tunime-hujg.onrender.com',
]);

export const Snapshot = new Shadow();

const tsk = new Task();

const device = new Device();

const user = new Session({
    onUpdate: ({ value, session }) => {
        Snapshot.update(session);
        tsk.bindSession(value);
    }
});


const Api = new class {
    constructor() {
        this.control = new Controls();
    }

    async logout() {
        const response = await this.control.fetch('/logout', { method: 'GET' });

        if (response.complete && response.parsed) {
            user.access = response.value.data;
        }

        return response.value?.data;
    }

    async checkScope(scope) {
        const response = await this.control.fetch('/scope', { method: 'GET' });

        if (response.complete && response.parsed) {
            user.setScope(response.value.data.scope);
        }

        return user.access.scope.includes(scope);
    }

    async login() {
        const body = await this.#body();

        const response = await this.control.fetch('/login', { method: 'POST', body });

        if (response.status !== 200 || !response.parsed) {
            return null;
        }

        const { data, task } = response.value;

        device.id = data.did;
        user.access = data;
        tsk.update(task, { merge: false });

        return data;
    }

    async keepAlive() {
        const response = await this.control.fetch('/keep-alive', { method: 'GET' });

        if (response.status !== 200 || !response.parsed) {
            if (response.status === 401) {
                return response.value;
            }
            return null;
        }

        const { data } = response.value;

        user.access = data;

        return data;
    }

    async #body() {
        if (!$PARAMETERS.tunsync) return {}

        const OAuth = (await import("../core/main.core.js")).OAuth;
        if (OAuth.access) {
            return {
                'token': OAuth.access.access_token,
                'uid': OAuth.user?.id
            }
        }

        return {};
    }
}

export const Tunime = new class {
    constructor() {
        this.control = new Controls();
    }

    api = {
        users: (event = (/**@type {TResponse} */ r) => { }) => {
            const basePath = '/api/users/info';
            return {
                GET: async (ids = []) => {
                    const query = `ids=${ids.map(id => encodeURIComponent(id)).join(',')}`;
                    const fullPath = query ? `${basePath}?${query}` : basePath;
                    return this.control.fetch(fullPath, { method: 'GET' }, event);
                }
            }
        },
        user: (id, event = () => { }) => {
            const url = `/api/user/${id}`;

            const fetch = (method, body) => {
                return this.control.fetch(url, { method, body }, event);
            }

            return {
                GET: async () => {
                    return fetch('GET');
                },

                PATCH: async (body = {}) => {
                    const hasScope = user.access.scope.includes('acc');

                    if (hasScope) {
                        return fetch('PATCH', body);
                    }

                    if (tsk.has('shiki')) {
                        if (await Api.checkScope('acc')) {
                            tsk.remove('shiki');
                            return fetch('PATCH', body);
                        }
                        throw { msg: 'Проверка аккаунта!', code: '001' }
                    }

                    throw { msg: 'Нет доступа!', code: '002' }
                },

                DELETE: async (body = {}) => {
                    const hasScope = user.access.scope.includes('acc');

                    if (hasScope) {
                        return fetch('DELETE', body);
                    }

                    if (tsk.has('shiki')) {
                        if (await Api.checkScope('acc')) {
                            tsk.remove('shiki');
                            return fetch('DELETE', body);
                        }
                        throw { msg: 'Проверка аккаунта!', code: '001' }
                    }

                    throw { msg: 'Нет доступа!', code: '002' }
                }
            }
        },
        anime: {
            get_popular: async (event = () => { }) => {
                const response = await this.control.fetch('/anime/popular', event);

                if (!response.complete || !response.parsed) {
                    return false;
                }

                return response.value.data;
            }
        }
    }

    rooms = {
        create: (aid, { access, kodikId, episode, friendIds = [], canPause = false } = {}) => {
            const body = {
                access,
                friendIds,
                kodikId,
                episode,
                canPause
            }
            return this.control.fetch(`/api/anime/${aid}/rooms`, { method: 'POST', body });
        },

        list: (aid) => {
            return this.control.fetch(`/api/anime/${aid}/rooms`, { method: 'GET' });
        },

        join: (rid) => {
            return this.control.fetch(`/api/rooms/${rid}/join`, { method: 'POST' })
        }
    }

    mark = {
        anime: (aid) => {
            return this.control.fetch(`/anime/${aid}`, { method: 'PUT' });
        },
        voice: (aid, vid) => {
            return this.control.fetch(`/voice/${aid}/${vid}`, { method: 'PUT' });
        }
    }

    video = {
        genLink: (query = {}) => {
            const url = new URL(`${balancer.url}/video/hls.m3u8`);
            for (const [key, value] of Object.entries(query)) {
                url.searchParams.append(key, encodeURIComponent(value));
            }
            return url.toString();
        },
        source: async (kodik) => {
            const body = { src: kodik };
            if (user.access === undefined || !user.access.scope.includes("player")) {
                return false;
            }
            const response = await this.control.fetch('/video/source', { method: 'POST', body });

            if (!response.complete || !response.parsed) {
                return false;
            }

            return response.value.data;
        }
    }

    share = {
        anime: (id) => `${balancer.url}/l/${id}`,
        user: (id) => `${balancer.url}/u/${id}`
    }

    help = {
        hasAccount: async ({ scope = 'acc', task = 'shiki' } = {}) => {
            const hasScope = user.access.scope?.includes(scope);

            if (hasScope) return true;

            if (tsk.has(task)) {

                if (await Api.checkScope(scope)) {
                    tsk.remove(task);
                    return true;
                }

                throw { msg: 'Аккаунт проверяется!', code: '001' }
            }

            return false;
        },
        logout: async () => {
            return Api.logout();
        },
        login: async () => {
            if (!$PARAMETERS.tunsync) return;

            const { OAuth } = (await import("../core/main.core.js"));
            await OAuth.requests.getWhoami();
            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (OAuth.access) {
                await Api.login();
            }
        }
    }
}();

(async ({ exception = [] } = {}) => {
    if (exception.includes(window.location.pathname)) return;

    if (user.access === undefined) {
        let acc = await Api.login();

        if (acc && !acc.scope.includes("player")) {
            acc = await Api.keepAlive();
        }
    }

    (async () => {
        let timeout = undefined;

        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState !== 'visible') {
                clearTimeout(timeout);
            } else {
                clearTimeout(timeout);
                update();
            }
        });

        const update = async () => {
            const time = 60000;

            if (user.access === undefined) {
                const acc = await Api.login();
                if (!acc) {
                    return;
                }
            }

            const date = Date.parse(user.access.end) - Date.now() - time;

            timeout = setTimeout(async () => {
                if (document.visibilityState !== 'visible') return;

                if (!user.live()) {
                    user.access = undefined;
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
    })();
})({ exception: ['/player.html'] })

window.$SHADOW = Snapshot;
window.Tunime = Tunime;