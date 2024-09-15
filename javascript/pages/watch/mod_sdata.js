import { $ID } from "../watch.js";
import { Private } from "./mod_private.js";
import { UserRate } from "./mod_urate.js";

export let SYNC_ENABLE = $PARAMETERS.anime.syncdata;

/**@type {undefined | {kodik_episode:number, kodik_dub:number, date_update:string}} */
let LData = undefined;

/**@type {LData} */
let DataDifference = undefined;

/**
 * Синхронизация данных пользователя с локальными данными
 * @param {Object} userRate - Данные пользователя
 */
export async function SynchLData(userRate) {
    const strLocalData = localStorage.getItem($ID);
    let localData = undefined;

    if (strLocalData) {
        localData = JSON.parse(strLocalData);
        DataDifference = localData;
    }

    if (!SYNC_ENABLE || !userRate) {
        LData = localData;
        return Synch.Init().Call(localData);
    }

    const regex = /\[tunime-sync:(\d+):(\d+):"(.+?)"]/;
    let match = undefined;

    if (userRate.text) {
        match = userRate.text.match(regex);
    }

    if (!match) {
        LData = localData;
        return Synch.Init().Call(localData);
    }

    let serverData = { ep: parseInt(match[1], 10), id: parseInt(match[2], 10), time: match[3] };

    const syncData = {
        kodik_episode: serverData.ep,
        kodik_dub: serverData.id,
        date_update: serverData.time
    }

    let localUpdateTime = undefined;

    if (localData) {
        if (localData.date_update) {
            localUpdateTime = new Date(localData.date_update);
        } else {
            LData = syncData;
            return Synch.Init().Call(syncData);
        }

        if (new Date(syncData.date_update) > localUpdateTime) {
            LData = syncData;
            return Synch.Init().Call(syncData);
        } else {
            LData = localData;
            return Synch.Init().Call(localData);
        }
    } else {
        LData = syncData;
        return Synch.Init().Call(syncData);
    }
}


class EventUpdate {
    constructor() {
        this.events = [];
    }

    On(e = ({ } = { kodik_episode: 0, kodik_dub: 0, date_update: 0 }) => { }) {
        this.events.push(e);
    }

    Call(data) {
        for (let i = 0; i < this.events.length; i++) {
            const event = this.events[i];
            event(data);
        }
    }
}

export class Synch {
    /**@type {Synch} */
    static #synch = undefined;

    static Init() {
        if (!this.#synch)
            this.#synch = new Synch();
        return this.#synch;
    }

    constructor() {
        this.events = [];
        this.called = false;
        this.data = undefined;
        this.plugins = {
            update: new EventUpdate()
        }
    }

    On(e = ({ } = { kodik_episode: 0, kodik_dub: 0, date_update: 0 }) => { }) {
        if (this.called)
            e(this.data);
        else
            this.events.push(e);
    }

    Call(data) {
        this.data = data;
        this.called = true;
        for (let i = 0; i < this.events.length; i++) {
            const event = this.events[i];
            event(data);
        }
    }

    Update(e = ({ } = { kodik_episode: 0, kodik_dub: 0, date_update: 0 }) => { }) {

    }
}

/**
 * Сохраняет данные аниме и обновляет комментарий
 * @param {number} e - Эпизод аниме
 * @param {number} d - ID озвучки
 */
export function SaveLData(e, d) {
    if (Private.INCOGNITO)
        return;
    const data = {
        kodik_episode: e,
        kodik_dub: d,
        date_update: new Date()
    };
    DataDifference = LData;
    LData = data;

    localStorage.setItem($ID, JSON.stringify(data));

    let user_rate = UserRate().Get();

    if (!SYNC_ENABLE || !user_rate) {
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
    Synch.Init().plugins.update.Call(data);
}

/**
 * Получить массива данных из информации об озвучке и эпизоде
 * @returns Возвращает массив из двух данных, первый [0] являеться новыми данными, второй [1] являеться прошлыми данными
 */
export function DifferenceInData() {
    return [LData, DataDifference];
}

/**
 * Установка предыдущего значения
 * @param {Object} val 
 */
export function SetDifferenceData(val) {
    DataDifference = val;
}

export function SetSynchEnable(val) {
    SYNC_ENABLE = val;
}