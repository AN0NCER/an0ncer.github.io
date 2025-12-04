import { ACard } from "../../modules/AnimeCard.js";
import { Sleep } from "../../modules/functions.js";
import { GraphQl, Users } from "../../modules/api.shiki.js";
import { OnUser } from "../user.js";
import { TCache } from "../../modules/tun.cache.js";

const cache = new TCache();

export function Favourites() {
    OnUser(data => {
        cache.get("requests", `user-${data.id}-favourites`).then((value) => {
            ShowAnimes(value, true);
        });

        Get(data.id).then((value) => {
            let ids = [];
            for (let i = 0; i < value.animes.length; i++) {
                const element = value.animes[i];
                ids.push(element.id);
            }

            if (ids.length === 0)
                return;

            LoadAnimes(ids).then((value) => {
                if (value.length == 0)
                    return $(`[id="favorites"]`).addClass('hide');

                const indexMap = new Map(ids.map((id, i) => [String(id), i]));
                value.sort((a, b) => indexMap.get(b.id) - indexMap.get(a.id));
                cache.put("requests", `user-${data.id}-favourites`, value);

                ShowAnimes(value);
            });
        });
    })
}

let updatet = false;

function ShowAnimes(value, cached = false) {
    if (updatet && cached || !value) return;

    $(`[id="favorites"]`).removeClass('hide');

    const $list = $(`.wrapper-favorites > .list`);
    const $cards = $(`.wrapper-favorites > .list > .card-anime`); 

    for (const anime of value) {
        $list.append(ACard.GenV2({ type: "a", anime }));
    }

    $cards.remove();
}

function LoadAnimes(ids) {
    return new Promise((resolve) => {
        GraphQl.animes({ ids: `"${ids.join(',')}"`, limit: ids.length }, async (response) => {
            if (response.failed) {
                if (response.status === 429) {
                    await Sleep(1000);
                    return resolve(LoadAnimes(ids));
                }
                return resolve([])
            }
            return resolve(response.data.animes);
        }).POST(["id", { poster: ["mainUrl"] }, "russian", { airedOn: ["year"] }, "score"])
    });
}

/**
 * 
 * @param {number} id 
 * @returns {Promise<undefined | {animes:[{id:number, image:string, name:string, russian:string}], characters:[{id:number, image:string, name:string, russian:string}] }>}
 */
function Get(id) {
    return new Promise((resolve) => {
        Users.favourites(id, async (response) => {
            if (response.failed) {
                if (response.status == 429) {
                    await Sleep(1000);
                    return resolve(Get(id));
                }
                return resolve(undefined);
            }
            return resolve(response);
        }).GET();
    });
}