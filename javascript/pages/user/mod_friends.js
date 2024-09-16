import { Sleep } from "../../modules/functions.js";
import { Users } from "../../modules/ShikiAPI.js";
import { OnUser } from "../user.js";

export function InitFriends() {
    OnUser(data => {
        Get(data.id).then((value) => {
            if(value.length !== 0){
                $(`[id="friends"]`).removeClass('hide');
            }
            for (let i = 0; i < value.length; i++) {
                const element = value[i];
                const last_online_at = new Date(element.last_online_at).getTime();
                const different_time = new Date().getTime() - last_online_at;
                $(`.wrapper-friends > .list`).append(`<a href="/user.html?id=${element.id}">
                <img src="${element.image.x80}">
                <span class="info">
                    <div class="nickname">${element.nickname}</div>
                    <div class="user-online">
                        <div class="point ${different_time < (30 * 60 * 1000)?"online":"offline"}"></div>
                        <span class="status">${different_time < (30 * 60 * 1000)?"online":"offline"}</span>
                    </div>
                </span>
            </a>`)
            }
        })
    });
}

/**
 * 
 * @param {number} id 
 * @returns {Promise<[] | [{avatar:string, id:number, image:{x160:string, x148:string, x80:string, x64:string, x48:string, x32:string, x16:string},last_online_at:string, nickname:string, url:string }]>}
 */
function Get(id) {
    return new Promise((resolve) => {
        Users.friends(id, { limit: 10000 }, async (response) => {
            if (response.failed) {
                if (response.status == 429) {
                    await Sleep(1000);
                    return resolve(Get(id));
                }
                return resolve([]);
            }
            return resolve(response);
        }).GET();
    });
}