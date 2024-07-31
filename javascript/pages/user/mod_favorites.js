import { ACard } from "../../modules/AnimeCard.js";
import { Sleep } from "../../modules/functions.js";
import { Animes, Users } from "../../modules/ShikiAPI.js";
import { OnUser } from "../user.js";



export function Favourites() {
    OnUser(data => {
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
                    return;

                $(`[id="favorites"]`).removeClass('hide');

                for (let i = 0; i < ids.length; i++) {
                    const id = ids[i];
                    const index = value.findIndex(x => x.id === id);
                    if (index !== -1)
                        $(`.wrapper-favorites > .list`).append(ACard.Gen({ response: value[index] }));
                }
            });
        });
    })
}

function LoadAnimes(ids) {
    return new Promise((resolve) => {
        Animes.list({ ids: ids, limit: ids.length }, async (response) => {
            if (response.failed) {
                if (response.status == 429) {
                    await Sleep(1000);
                    return resolve(LoadAnimes(ids));
                }
                return resolve([]);
            }
            return resolve(response);
        }).GET();
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