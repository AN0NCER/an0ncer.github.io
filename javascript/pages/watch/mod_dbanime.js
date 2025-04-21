import { $ID } from "../watch.js";
import { Private } from "./mod_private.js";
import { UserRate } from "./mod_urate.js";

class SLocal {
    #key = "anime-db";

    constructor() {
        /**@type {{synch:boolean, voice:[number], ldata:{kodik_episode:number, kodik_dub:number, date_update:string}}} */
        this.localData = this.#Load();
    }

    #Load() {
        if (localStorage.getItem($ID) !== null) {
            this.#LoadOLD($ID);
        }
        const ld = JSON.parse(localStorage.getItem(this.#key)) || {};
        return ld[$ID] || {
            synch: $PARAMETERS.anime.syncdata,
            ldata: undefined
        };
    }

    set synch(val) {
        if (typeof val !== "boolean")
            return;

        this.localData.synch = val;
        this.#Save();
    }

    get synch() {
        return this.localData.synch;
    }

    set data(val) {
        this.localData.ldata = val;
        this.#Save();
    }
    get data() {
        return this.localData.ldata;
    }

    get voice() {
        return this.localData.voice || [];
    }

    set voice(val) {
        this.localData.voice = val;
        this.#Save();
    }

    #Save() {
        const ld = JSON.parse(localStorage.getItem(this.#key)) || {};
        ld[$ID] = this.localData;
        localStorage.setItem(this.#key, JSON.stringify(ld));
    }

    #LoadOLD(id) {
        const ld = JSON.parse(localStorage.getItem(this.#key)) || {};

        if (!ld[id]) {
            ld[id] = { synch: $PARAMETERS.anime.syncdata, ldata: JSON.parse(localStorage.getItem(id)) }
        }

        localStorage.removeItem(id);
        localStorage.setItem(this.#key, JSON.stringify(ld));
    }
}

export class ASynch {
    /**@type {ASynch} */
    static #class = undefined;
    #callbacks = {
        "inited": [],
        "updated": []
    }

    constructor() {
        this.local = new SLocal();
        this.difference;
    }

    Synch(userRate) {
        if (this.local.data) {
            this.difference = this.local.data;
        }

        if (!this.local.synch || !userRate) {
            return this.#Dispatch("inited", this.local.data);
        }

        const regex = /\[tunime-sync:(\d+):(\d+):"(.+?)"]/;
        let match = undefined;

        if (userRate.text) {
            match = userRate.text.match(regex);
        }

        if (!match) {
            return this.#Dispatch("inited", this.local.data);
        }


        let serverData = { ep: parseInt(match[1], 10), id: parseInt(match[2], 10), time: match[3] };

        const syncData = {
            kodik_episode: serverData.ep,
            kodik_dub: serverData.id,
            date_update: serverData.time
        }

        let localUpdateTime = undefined;

        const localData = this.local.data;
        if (localData) {
            if (localData.date_update) {
                localUpdateTime = new Date(localData.date_update);
            } else {
                this.local.data = syncData;
                return this.#Dispatch("inited", this.local.data);
            }

            if (new Date(syncData.date_update) > localUpdateTime) {
                this.local.data = syncData;
                return this.#Dispatch("inited", this.local.data);
            } else {
                return this.#Dispatch("inited", this.local.data);
            }
        } else {
            this.local.data = syncData;
            return this.#Dispatch("inited", this.local.data);
        }
    }

    /**
     * Сохраняет данные аниме и обновляет комментарий
     * @param {number} e - Эпизод аниме
     * @param {number} d - ID озвучки
     */
    Save(e, d) {
        if (Private.INCOGNITO)
            return;

        const data = {
            kodik_episode: e,
            kodik_dub: d,
            date_update: new Date()
        };

        this.difference = this.local.data;
        this.local.data = data;

        let user_rate = UserRate().Get();

        if (!this.local.synch || !user_rate) {
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

        UserRate().Controls.Note(user_rate.text);
        this.#Dispatch("updated", this.local.data);
    }

    get Diff() {
        return [this.local.data, this.difference];
    }

    /**
     * Добавляет обработчик события.
     * @param { "inited" | "updated" } event - Название события.
     * @param {Function} callback - Функция обработчик события.
     */
    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
    }

    #Dispatch(event, data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(data));
    }

    static Init() {
        if (this.#class === undefined) {
            this.#class = new ASynch();
        }
        return this.#class;
    }
}