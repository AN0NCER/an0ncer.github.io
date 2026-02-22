import { Hub } from "../../core/hub.core.js";
import { OAuth } from "../../core/main.core.js";
import { Users } from "../../modules/api.shiki.js";
import { Tunime } from "../../modules/api.tunime.js";
import { Sleep } from "../../modules/functions.js";
import { TCache } from "../../modules/tun.cache.js";
import { TPage } from "../user.js";
import { IOFriends } from "./io.friends.js";
import { TEvents } from "./util.event.js";

export const IOUser = new class extends TEvents {

    #value = null;
    #scope = 'web';

    constructor() {
        super();
        this.cache = new TCache();
    }

    get value() {
        return this.#value;
    }

    async load(id) {
        // 1) попробуем отдать кэш (если можно)
        try {
            if (await IOFriends.canCachePage(id)) {
                const requestKey = `tun-api-${id}-user`;
                const raw = await this.cache.get("requests", requestKey);
                this.update(raw, { source: "cache" });
            }
        } catch (_) {
            // кэш не должен ломать загрузку
        }

        // 2) если нет доступа/соединения — отдаем null и выходим
        const hasPerm = !!Hub.snapshot.state.permissions.includes(this.#scope);
        if (!Hub.snapshot?.state?.isConnected || !hasPerm) {
            this.update(null, { source: 'permission' });
            return;
        }


        // 3) сеть: в любом случае гарантируем "разблокировку" через update(null)
        Tunime.api.user(id, (response) => {
            if (!response.complete || !response.parsed) {
                this.update(null, { source: 'network' });
                return;
            }

            this.update(response.value?.data ?? null, { source: 'network' });
        }).GET();
    }

    /**
     * @param {any|null} data  - данные пользователя или null
     * @param {{source?: 'cache'|'network'|'permission'}} meta 
     */
    update(data, meta = {}) {
        const prev = this.#value;
        const next = (data && typeof data === 'object') ? data : null;

        const type = prev === null ? 'load' : 'update';
        this.#value = next;

        // кэшируем только если есть данные
        IOFriends.canCachePage(TPage.id).then((can) => {
            if (!can) return;
            if (next === null) return;

            const requestKey = `tun-api-${TPage.id}-user`;
            // храним одинаковый формат (чтобы cache read был предсказуем)
            this.cache.put("requests", requestKey, next).catch(() => { });
        });

        
        // ВАЖНО: trigger всегда вызывается, даже если next === null
        this.trigger(type, ...[next, meta], { replay: true });
    }
}

export class ULoader {
    #data = undefined;

    constructor() {
        this.cache = new TCache();
        //Больше не нужно нигде очищать TCache для страницы user.html
        this.cache.cleanup();

        this.screen = new class {
            query = $(".page-loading")

            async hide() {
                this.query.css("opacity", 0);
                await Sleep(600);
                $("body").removeClass("loading");
                this.query.css("display", "none");
                return true;
            }
        }
    }

    async getID(id) {
        if (id === null && OAuth.auth) {

            const start = Date.now();

            const [raw, type] = await (async () => {
                const cache = await this.cache.get("requests", "whoami");

                if (cache) {
                    this.#data = cache;
                    return [this.#data, 'TCache'];
                }

                const value = await OAuth.requests.getWhoami();
                if (value !== undefined) {
                    this.#data = value;
                    this.cache.put("requests", "whoami", this.#data, 60 * 1000);
                    return [this.#data, 'OAuth'];
                }
            })();

            console.log(`[page]: ID loaded from [${type}] "${raw?.nickname}" (${Date.now() - start}ms)`)

            return raw?.id;
        } else if (id !== null) {
            return id;
        }

        window.location.href = "/404a.html";
    }

    async getRaw(id, isLogged, opts = { t: Date.now() }) {
        const [raw, type] = await (async () => {
            const cache = await this.cache.get("requests", `tun-${id}-user`);

            if (cache) {
                this.#data = cache;
                return [this.#data, 'TCache'];
            }

            const usr = async () => {
                const response = await Users.show(id, {}).GET(isLogged);

                if (response.failed) {
                    if (response.status == 429) {
                        await Sleep(1000);
                        return usr();
                    }
                    return undefined;
                }

                return response;
            }

            const value = await usr();

            if (value !== undefined) {
                this.#data = value;
                this.cache.put("requests", `tun-${id}-user`, this.#data, 5 * 60 * 1000);
                return [this.#data, 'Users.show'];
            }

            return [value, 'Users.show'];
        })();

        console.log(`[page]: RAW loaded from [${type}] (${Date.now() - opts.t}ms)`);

        return raw;
    }
}