import { Sleep } from "../modules/functions.js";
import { ShowInfo } from "../modules/Popup.js";
import { UserRates } from "../modules/ShikiAPI.js";
import { User } from "../modules/ShikiUSR.js";

const SYNC_ENABLE = $PARAMETERS.anime.syncdata;
const AUTO_ENABLE = $PARAMETERS.download.dautoset;

(async () => {
    const key = "download-a";

    /**
    * @type {[{id_ur: number, episodes: number, downloaded: [{episode: number, date:string}], duration: number}] | []} 
    */
    const data = JSON.parse(localStorage.getItem(key)) || [];

    if (data.length === 0 || !User.authorized || !AUTO_ENABLE)
        return;

    let set = [];

    const a = new Date();

    for (let i = 0; i < data.length; i++) {
        const element = data[i];
        let allowed = true;
        for (let e = 0; e < element.downloaded.length; e++) {
            const episode = element.downloaded[e];
            let b = new Date(episode.date);

            b.setMinutes(b.getMinutes() + element.duration);
            b.setTime(b.getTime() + (12 * 60 * 60 * 1000));

            if (a.getTime() > b.getTime() && allowed) {
                set.push({ id: element.id_ur, episode: episode.episode });
            } else {
                allowed = false;
                set = set.filter(item => item.id !== element.id_ur);
            }
        }
    }

    set = Filter(set);

    let ids = [];

    for (let i = 0; i < set.length; i++) {
        const element = set[i];

        await Sleep(1000);
        const completed = await Update(element.id, element.episode, element.count);

        if (completed)
            ids.push(element.id);
    }

    for (let i = 0; i < ids.length; i++) {
        const element = ids[i];
        const index = data.findIndex(x => x.id_ur == element);
        if (index != -1) {
            data.splice(index, 1);
        }
    }

    if (ids.length != 0)
        ShowInfo(`Обновлено ${ids.length} загруженных аниме`, key);

    if (data.length === 0)
        return localStorage.removeItem(key);
    localStorage.setItem(key, JSON.stringify(data));
})();

function Update(id, episode, count) {
    const status = ["watching", "rewatching", "planned", "dropped"]
    return new Promise((resolve) => {
        UserRates.show(id, async (response) => {
            if (response.failed && response.status == 429) {
                await Sleep(1000);
                return resolve(Update(id));
            }

            if (response.failed) {
                return resolve(false);
            }

            if (response.episodes < episode && status.includes(response.status) && (response.episodes + count + 1) === episode) {
                return resolve((await SetWatched(episode, response)));
            } else {
                return resolve(true);
            }
        }).GET();
    })
}


/**
 * 
 * @param {*} data 
 * @returns {[{ id: number, episode: number, count: number }]}
 */
function Filter(data) {
    // Создаем объект для хранения эпизодов по каждому id
    const ids = {};

    // Разбиваем данные по id
    for (const item of data) {
        if (!ids[item.id]) {
            ids[item.id] = { episodes: [] };
        }
        ids[item.id].episodes.push(item.episode);
    }

    const retData = [];

    // Проходимся по каждому id и находим максимальный эпизод
    for (const id in ids) {
        if (Object.hasOwnProperty.call(ids, id)) {
            const episodes = ids[id].episodes;
            episodes.sort((a, b) => a - b);

            // Находим максимальный эпизод и считаем количество эпизодов после него
            let maxEpisode = episodes[0];
            let count = 0;
            for (let i = 0; i < episodes.length; i++) {
                if (episodes[i] >= maxEpisode && episodes[i] - maxEpisode === 1) {
                    maxEpisode = episodes[i];
                    count++;
                }
            }

            // Добавляем данные в результирующий массив
            retData.push({ id: parseInt(id), episode: maxEpisode, count });
        }
    }

    return retData;
}

/**
 * Сохраняет данные аниме и обновляет комментарий
 * @param {number} e - Эпизод аниме
 * @param {Object} user_rate - данные прользователя об аниме
 */
function SetWatched(e, user_rate) {
    return new Promise((resolve) => {
        let body = { "user_rate": { "episodes": e } };

        if (user_rate.status == "planned" || user_rate.status == "dropped")
            body.user_rate["status"] = "watching";

        if (localStorage.getItem(user_rate.target_id)) {
            /**@type {{kodik_episode:number, kodik_dub:number, date_update:number} || null} */
            const data = JSON.parse(localStorage.getItem(user_rate.target_id)) || null;

            if (data != null) {
                data.kodik_episode = e;
                data.date_update = new Date();

                localStorage.setItem(user_rate.target_id, JSON.stringify(data));

                if (SYNC_ENABLE) {
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
                    body.user_rate["text"] = user_rate.text;
                }
            }
        }
        return resolve(Fetch(user_rate.id, body));
    });
}

function Fetch(id, body) {
    return new Promise((resolve) => {
        UserRates.show(id, async (response) => {
            if (response.failed && response.status == 429) {
                await Sleep(1000);
                return resolve(Fetch(id, body));
            }

            if (response.failed) {
                return resolve(false);
            }

            return resolve(true);
        }).PATCH(body);
    });
}