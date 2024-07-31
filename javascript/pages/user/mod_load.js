import { Sleep } from "../../modules/functions.js";
import { Users } from "../../modules/ShikiAPI.js";
import { User } from "../../modules/ShikiUSR.js";
import { $USER } from "../user.js";

/**@type {{avatar:string, birth_on:null, full_years:number, id:number, image:{ x160:string, x148:string, x80:string, x16:string, x32:string, x48:string, x64:string }, last_online_at:string, locale:string, name:null, nickname:string, sex:string, url:string, website: string} | undefined} */
export let UserData = undefined;

/**
 * Вернет индентификатор загружаемого пользователя
 * @returns {Promise<number | undefined>}
 */
export async function GetIdLoadUser() {
    return new Promise((resolve) => {
        if ($USER === null && User.authorized) {
            Whoami().then((value) => {
                if (value !== undefined) {
                    UserData = value;
                    localStorage.setItem(User.Storage.keys.whoami, JSON.stringify(UserData));
                    return resolve(value.id);
                }
            });
        } else if ($USER !== null) {
            return resolve($USER);
        } else {
            window.location.href = "/404a.html";
        }
    });
}

/**
 * 
 * @returns {Promise<undefined | {avatar:string, birth_on:null, full_years:number, id:number, image:{ x160:string, x148:string, x80:string, x16:string, x32:string, x48:string, x64:string }, last_online_at:string, locale:string, name:null, nickname:string, sex:string, url:string, website: string}>}
 */
export function Whoami() {
    return new Promise((resolve) => {
        Users.whoami(async (response) => {
            if (response.failed) {
                if (response.status == 429) {
                    await Sleep(1000);
                    return resolve(Whoami());
                }
                return resolve(undefined);
            }
            resolve(response);
        }).GET();
    });
}

//Класс управляем анимацией загрузки страницы
export class LoadScreen {
    static query = ".page-loading";

    /**
     * Завершает анимацию загрузки страницы
     * @param {Function} e 
     * @returns {true}
     */
    static loaded(e = () => { }) {
        return new Promise(async (resolve) => {
            $(this.query).css("opacity", 0);
            await Sleep(600);
            $("body").removeClass("loading");
            $(this.query).css("display", "none");
            e();
            return resolve(true);
        });
    }
}