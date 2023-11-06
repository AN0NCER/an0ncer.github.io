import { UserRates } from "../../modules/ShikiAPI.js";
import { Sleep } from "../../modules/funcitons.js";
import { $ID } from "../watch.js";
import { AnimeUserRate } from "./mod_userrate.js";

// Константы для имён модулей и переменных
const ANIME_SYNC_ENABLED = $PARAMETERS.anime.syncdata;

let _urate = undefined; // Переменная для хранения данных пользователя
let _localDate = undefined; // Переменная для хранения локальных данных
let _onLocalData = []; // Массив функций, ожидающих вызова
let onCalledLocalData = false; // Флаг для отслеживания вызова события

/**
 * Синхронизация данных пользователя с локальными данными
 * @param {Object} user_rate - Данные пользователя
 */
export async function SynchLocalData(user_rate) {
    const str_local_data = localStorage.getItem($ID);
    let localData = undefined;

    if (str_local_data) {
        localData = JSON.parse(str_local_data);
    }

    if (!ANIME_SYNC_ENABLED || !user_rate) {
        _localDate = localData;
        return CallLocalData(_localDate);
    }

    _urate = user_rate;
    const regex = /\[tunime-sync:(\d+):(\d+):"(.+?)"]/;
    let match = undefined;

    if (user_rate.text) {
        match = user_rate.text.match(regex);
    }

    if (!match) {
        _localDate = localData;
        return CallLocalData(_localDate);
    }

    const episode = parseInt(match[1], 10);
    const id = parseInt(match[2], 10);
    const updateTimeStr = match[3];
    const updateTime = new Date(updateTimeStr);
    let localUpdateTime = undefined;

    const kodik_data = {
        kodik_episode: episode,
        kodik_dub: id,
        date_update: updateTime
    };

    if (localData) {
        if (localData.date_update) {
            localUpdateTime = new Date(localData.date_update);
        } else {
            _localDate = kodik_data;
            return CallLocalData(_localDate);
        }

        if (updateTime > localUpdateTime) {
            _localDate = kodik_data;
            return CallLocalData(_localDate);
        } else {
            _localDate = localData;
            return CallLocalData(_localDate);
        }
    } else {
        _localDate = kodik_data;
        return CallLocalData(_localDate);
    }
}

/**
 * Регистрация функций для события получения данных аниме
 * @param {Function} func - Обратная функция вызова
 */
export function OnLocalData(func = (data) => { }) {
    if (onCalledLocalData) {
        return func(_localDate);
    }
    if (typeof func == "function") {
        _onLocalData.push(func);
    }
}

export function SetSynchUserRate(user_rate) {
    _urate = user_rate;
}

/**
 * Вызов события получения данных аниме
 * @param {Object} data - Данные аниме
 */
function CallLocalData(data) {
    if (!data) {
        return;
    }
    onCalledLocalData = true;
    for (let i = 0; i < _onLocalData.length; i++) {
        const element = _onLocalData[i];
        element(data);
    }
}

/**
 * Сохраняет данные аниме и обновляет комментарий
 * @param {number} e - Эпизод аниме
 * @param {number} d - ID озвучки
 */
function saveAnimeData(e, d) {
    const data = {
        kodik_episode: e,
        kodik_dub: d,
        date_update: new Date()
    };

    localStorage.setItem($ID, JSON.stringify(data));
    let user_rate = _urate;

    if (!ANIME_SYNC_ENABLED || !user_rate) {
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

    user_rate.text = "";

    if (user_rate.text) {
        user_rate.text = user_rate.text.trim();
    }

    user_rate.text += `\r\n[tunime-sync:${data.kodik_episode}:${data.kodik_dub}:${JSON.stringify(data.date_update)}]`;

    updateComment(user_rate);
}

/**
 * Обновляет комментарий пользователя
 * @param {Object} user_rate - Данные пользователя
 */
async function updateComment(user_rate) {
    UserRates.show(user_rate.id, async (res) => {
        if (res.failed && res.status == 429) {
            await Sleep(1000);
            return updateComment(user_rate);
        }
        AnimeUserRate().rate = res;
        _urate = res;
    }).PATCH({ "user_rate": { "text": user_rate.text } });
}

/**
 * Сохраняет данные аниме
 * @param {number} e - Эпизод аниме
 * @param {number} d - ID озвучки
 */
export async function SaveDataAnime(e, d) {
    saveAnimeData(e, d);
}
