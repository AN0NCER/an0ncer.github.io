import { DBAnime } from "./mod.db.js";
import { URate } from "./mod.urate.js";
import { Private } from "./mod_private.js";
import { TEvents } from "./utils/util.event.js";

/**
 * @typedef {'loaded' | 'update'} ASynchEvent
 */

export const ASynch = new class extends TEvents {
    difference = undefined;

    /**
     * Синхронизация между версией Shikimori и localStorage
     * @param {undefined | {text:string}} userRate 
     * @returns Вызов событий **"loaded"** c сохранением replay = true
     */
    synch(userRate = undefined) {
        let ldata = undefined;

        if ((ldata = DBAnime.get('anime', 'ldata'))) {
            this.difference = ldata;
        }

        const synch = DBAnime.get('anime', 'synch') ?? $PARAMETERS.anime.syncdata;

        if (!synch || !userRate) {
            return this.trigger("loaded", ldata, { replay: true });
        }

        const regex = /\[tunime-sync:(\d+):(\d+):"(.+?)"]/;
        let match = undefined;

        if (userRate.text) {
            match = userRate.text.match(regex);
        }

        if (!match) {
            return this.trigger("loaded", ldata, { replay: true });
        }

        let serverData = { ep: parseInt(match[1], 10), id: parseInt(match[2], 10), time: match[3] };

        const syncData = {
            kodik_episode: serverData.ep,
            kodik_dub: serverData.id,
            date_update: serverData.time
        }

        let localUpdateTime = undefined;

        if (ldata) {
            if (ldata.date_update) {
                localUpdateTime = new Date(ldata.date_update);
            } else {
                DBAnime.set('anime', 'ldata', syncData);
                return this.trigger("loaded", syncData, { replay: true });
            }

            if (new Date(syncData.date_update) > localUpdateTime) {
                DBAnime.set('anime', 'ldata', syncData);
                return this.trigger("loaded", syncData, { replay: true });
            } else {
                return this.trigger("loaded", ldata, { replay: true });
            }
        } else {
            DBAnime.set('anime', 'ldata', syncData);
            return this.trigger("loaded", syncData, { replay: true });
        }
    }

    /**
     * Сохраняет данные в localStorage и в userRate
     * @param {number} episode - Номер эпизода
     * @param {number} dubId - ID озвучки
     */
    save(episode, dubId) {
        if (Private.INCOGNITO)
            return;

        const data = {
            kodik_episode: episode,
            kodik_dub: dubId,
            date_update: new Date()
        }

        this.difference = DBAnime.get('anime', 'ldata');
        DBAnime.set('anime', 'ldata', data);

        let user_rate = URate.uRate;

        if (!DBAnime.get('anime', 'synch') || !user_rate) {
            return;
        }

        const regex = /\[tunime-sync:(\d+):(\d+):"(.+?)"]/;
        let match = "";

        if (user_rate.text) {
            match = user_rate.text.match(regex);
        }

        if (match) {
            user_rate.text = user_rate.text.replace(match[0], '');
        }

        if (user_rate.text) {
            user_rate.text = user_rate.text.trim();
        } else {
            user_rate.text = "";
        }

        user_rate.text += `\r\n[tunime-sync:${data.kodik_episode}:${data.kodik_dub}:${JSON.stringify(data.date_update)}]`;
        URate.setNote(user_rate.text);
        this.trigger('update', data);
    }

    getDiff() {
        return [DBAnime.get('anime', 'ldata'), this.difference];
    }

    /**
     * @override
     * @param {ASynchEvent} event - Название события
     * @param {Function} callback - Обработчик
     * @param {object} [options]
     * @returns {this}
     */
    on(event, callback, options) {
        return super.on(event, callback, options);
    }
}();