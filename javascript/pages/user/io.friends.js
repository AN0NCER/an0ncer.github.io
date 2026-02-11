import { OAuth } from "../../core/main.core.js";
import { Users } from "../../modules/api.shiki.js";
import { Sleep } from "../../modules/functions.js";
import { TEvents } from "./util.event.js";

class Sentinel {
    constructor() {
        /**@type {boolean} Загружено ли полностью */
        this.loaded = false;
        /**@type {number} Страница загрузки */
        this.page = 0;
        /**@type {number} Лимит на один запрос */
        this.limit = 100;
        /**@type {undefined | Promise} Текущий запрос */
        this.promise = undefined;
        /**@type {boolean} Идет ли обработка запроса */
        this.isFetch = false
    }
}

export const IOFriends = new class extends TEvents {
    static state = {
        friend: 1,
        not: 0,
        my: -1,
    };

    #indexAuthId = null;
    #indexLoaded = false;
    #indexComplete = false;
    #friendSet = new Set();
    #saveTimer = null;
    #lastUpdatedAt = 0;

    constructor() {
        super();
        this.sentinel = new Sentinel();

        // синхронизация между вкладками
        window.addEventListener('storage', (e) => {
            if (!this.#indexAuthId) return;
            if (e.key !== this.#lsKey(this.#indexAuthId)) return;

            const data = this.#parse(e.newValue);
            this.#applyIndex(data);
        });

        window.addEventListener('pageshow', (e) => {
            // bfcache restore
            if (e.persisted) {
                // перечитать localStorage и обновить внутреннее состояние
                this.syncIndex({ force: true });
            } else {
                this.syncIndex();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.syncIndex();
            }
        });
    }

    init(viewedUserId) {
        this.id = Number(viewedUserId);
        this.authId = OAuth.user?.id ?? null;
        this.isWhoami = this.authId && this.id === this.authId;

        // если сменился auth — индекс нужно перечитать
        if (this.#indexAuthId !== this.authId) {
            this.#indexAuthId = this.authId;
            this.#indexLoaded = false;
            this.#indexComplete = false;
            this.#friendSet = new Set();
        }
    }

    #lsKey(authId) {
        return `friends-index:${authId}`
    }

    #parse(raw) {
        try { return raw ? JSON.parse(raw) : null; } catch { return null; }
    }

    syncIndex({ force = false } = {}) {
        if (!this.authId) return false;

        const raw = localStorage.getItem(this.#lsKey(this.authId));
        const data = this.#parse(raw);

        if (!data || !Array.isArray(data.ids)) return false;

        const ts = Number(data.updatedAt || 0);

        if (!force && ts && ts === this.#lastUpdatedAt) return false;

        this.#lastUpdatedAt = ts;
        this.#applyIndex(data);
        return true;
    }

    async #loadIndex() {
        if (this.#indexLoaded) return;
        this.#indexLoaded = true;

        if (!this.authId) return;

        const raw = localStorage.getItem(this.#lsKey(this.authId));
        const data = this.#parse(raw);
        this.#applyIndex(data);
    }

    #applyIndex(data) {
        if (!data || !Array.isArray(data.ids)) return;

        this.#friendSet = new Set(data.ids);
        this.#indexComplete = !!data.complete;
        this.#lastUpdatedAt = Number(data.updatedAt || this.#lastUpdatedAt || 0);

        this.trigger('index', { ids: data.ids, complete: this.#indexComplete });
    }

    #persistIndex({ immediate = false } = {}) {
        if (!this.authId) return;

        const save = () => {
            const payload = {
                v: 1,
                ids: [...this.#friendSet],
                complete: this.#indexComplete,
                updatedAt: Date.now()
            };
            localStorage.setItem(this.#lsKey(this.authId), JSON.stringify(payload));
            this.trigger('index', payload);
        }

        if (immediate) return save();

        clearTimeout(this.#saveTimer);
        this.#saveTimer = setTimeout(save, 200);
    }

    async canCachePage(userId = this.id) {
        if (!this.authId) return false;
        const uid = Number(userId);

        if (uid === this.authId) return true;

        await this.#loadIndex();
        return this.#friendSet.has(uid);
    }

    async Next() {
        if (this.sentinel.loaded) return [];
        if (this.sentinel.isFetch) return this.sentinel.promise;

        this.sentinel.isFetch = true;
        this.sentinel.promise = this.#nextImpl();

        try {
            return await this.sentinel.promise;
        } finally {
            this.sentinel.isFetch = false;
            this.sentinel.promise = undefined;
        }
    }

    async #nextImpl() {
        this.sentinel.page++;

        const { limit, page } = this.sentinel;
        const raw = await this.#fetch(limit, page);

        if (raw === null) {
            this.trigger('next', [], page, false, { failed: true });
            return [];
        }

        if (raw.length < limit) this.sentinel.loaded = true;

        if (this.isWhoami) {
            await this.#loadIndex();

            raw.forEach(x => this.#friendSet.add(x.id));

            if (this.sentinel.loaded) this.#indexComplete = true;

            this.#persistIndex();
        }

        this.trigger('next', raw, page, this.sentinel.loaded);
        return raw;
    }

    async #fetch(limit, page) {
        const response = await Users.friends(this.id, { limit, page }).GET();

        if (response.failed) {
            if (response.status === 429) {
                await Sleep(1000);
                return this.#fetch(limit, page);
            }
            return null;
        }

        return response;
    }

    isFriend(id) {
        const S = this.constructor.state;
        const uid = Number(id);

        if (!this.authId) return S.not;   // или можно отдельный статус, но ты просил эти 3
        if (uid === this.authId) return S.my;

        return this.#friendSet.has(uid) ? S.friend : S.not;
    }

    async isFriendAsync(id) {
        await this.#loadIndex();
        return this.isFriend(id);
    }

    async addFriend(id) {
        if (!this.authId) return;
        await this.#loadIndex();
        this.#friendSet.add(Number(id));
        this.#persistIndex({ immediate: true });
        this.trigger('friend:add', Number(id));
    }

    async removeFriend(id) {
        if (!this.authId) return;
        await this.#loadIndex();
        this.#friendSet.delete(Number(id));
        this.#persistIndex({ immediate: true });
        this.trigger('friend:remove', Number(id));
    }
}