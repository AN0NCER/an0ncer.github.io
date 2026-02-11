import { Achievements } from "../../modules/api.shiki.js";
import { Sleep } from "../../modules/functions.js";
import { TCache } from "../../modules/tun.cache.js";
import { TEvents } from "./util.event.js";

export class TAchivements extends TEvents {
    #data = undefined;

    constructor(id) {
        super();

        //ID Текущего пользователя
        this.uid = id;
        this.cache = new TCache();
        this.loaded = false;
        this.#load();
    }

    #update(value) {
        if (!value) return;

        const is_changed = value !== this.#data;
        this.#data = value;

        if (!this.loaded) {
            this.loaded = true;
            this.trigger('init', this.#data, { replay: true });
        } else if (is_changed) {
            this.trigger('update', this.#data);
        }
    }

    async #load() {
        const key = `user-${this.uid}-achivements`;

        const cache = await this.cache.get("requests", key);
        this.#update(cache);

        const fetch = async () => {
            const response = await Achievements.achievements({ user_id: this.uid }).GET();

            if (response.failed) {
                if (response.status === 429) {
                    await Sleep(1000);
                    return fetch();
                }
                return [];
            }

            return response;
        }

        const raw = await fetch();
        this.#update(raw);
    }
}