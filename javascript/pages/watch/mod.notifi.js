import { TNotifi } from "../../modules/tun.notification.js";
import { $ID, Player } from "../watch.js";
import { DBAnime } from "./mod.db.js";
import { TEvents } from "./utils/util.event.js";

export const ANotifi = new class extends TEvents {
    #hasProcess = false;

    hasNotify(id = undefined) {
        if (id === undefined) {
            id = Player.selected?.id;
        }

        const save = DBAnime.get("notifications");

        return save.includes(id);
    }

    async subscribe(id = undefined) {
        if (this.#hasProcess) return false;
        this.#hasProcess = true;
        let ALLOW = false;

        if (id === undefined) {
            id = Player.selected?.id;
        }

        const permission = await TNotifi.request();

        if (permission === 1) {
            const kodik = Player.results.get(id);
            const title = kodik.title ?? kodik.other_title ?? kodik.title_orig;
            const dub = kodik.translation.title;
            const type = kodik.translation.type === "voice" ? "в озвучке" : "с субтитрами";

            const anime_allowed = await TNotifi.requestWin(`Хотите получать уведомления, когда выйдет новый эпизод «${title}» ${type} ${dub}?`);

            if (anime_allowed === 1) {
                const { Tunime } = await import('../../modules/api.tunime.js');

                const last_episode = Player.selected?.last_episode;

                /**@type {string[]} */
                const notifi_list = DBAnime.get("notifications", null);

                const response = await Tunime.api.device.notify.subscription("dubEpisode")
                    .POST({ kodik_id: id, anime_id: $ID, last_episode });

                if (response.status !== 200) {
                    console.warn('Не удалось подписаться на аниме.', response);
                    this.#hasProcess = false;
                    return ALLOW;
                }

                ALLOW = true;

                if (!notifi_list.includes(response.value.kodikId)) {
                    notifi_list.push(response.value.kodikId);
                    DBAnime.set("notifications", null, notifi_list);
                }

                this.trigger('subscribe', [response.value.kodikId])
            }
        }

        this.#hasProcess = false;
        return ALLOW;
    }

    async unsubscribe(id = undefined) {
        if (this.#hasProcess) return false;
        this.#hasProcess = true;

        if (id === undefined) {
            id = Player.selected?.id;
        }

        const { Tunime } = await import('../../modules/api.tunime.js');

        const response = await Tunime.api.device.notify.subscription("dubEpisode").DELETE({ kodik_id: id });

        if (response.status !== 200) {
            console.warn('Не удалось отписаться от уведомления', response);
            this.#hasProcess = false;
            return false;
        }

        const notifi_list = new Set(DBAnime.get("notifications", null));

        if (notifi_list.has(id)) {
            notifi_list.delete(id);
            DBAnime.set("notifications", null, [...notifi_list])
        }

        this.trigger('unsubscribe', [id]);
        this.#hasProcess = false;
        return true;
    }

    async unsubscribeAll() {
        if (this.#hasProcess) return false;
        this.#hasProcess = true;

        const { Tunime } = await import('../../modules/api.tunime.js');

        const response = await Tunime.api.device.notify.subscription("dubEpisode").DELETE({ anime_id: $ID });

        if (response.status !== 200) {
            console.warn('Не удалось отписаться от всех уведомлений', response);
            this.#hasProcess = false;
            return false;
        }

        const removed = DBAnime.get('notifications');
        DBAnime.set("notifications", null, []);

        this.trigger('unsubscribe', removed);
        this.#hasProcess = false;
        return true;
    }
}();