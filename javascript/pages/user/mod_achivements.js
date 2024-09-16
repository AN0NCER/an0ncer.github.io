/**
 * @callback Achivements
 * @param {[id:number, neko_id:string, level:number, progress:number, user_id:number, created_at:string, updated_at:string] | undefined} data
 */

import { Sleep } from "../../modules/functions.js";
import { Achievements } from "../../modules/ShikiAPI.js";

let Loaded = false; // Были ли загружены очивки
let Callbacks = []; //Функция возврата Ачивок
let Achivements = undefined; // Ачивки пользователя с shikimori

/**
 * Загружает файл с данными Ачивок по URL
 * @param {string} url - адресс на файл yaml
 * @returns {[{neko_id:string, level:number, algo:string, threshold:number, metadata: {title_ru:string, text_ru:string, title_en:string, text_en:string, image:string, border_color:string}}] | undefined}
 */
export function LoadYaml(url) {
    return new Promise((resolve) => {
        fetch(url).then((value) => {
            if (!value.ok)
                return resolve(undefined)
            return value.text();
        }).then((value) => {
            try {
                const data = jsyaml.load(value);
                return resolve(data);
            } catch (err) {
                console.log('Не удалось преобразовать данные из yaml в json.', err);
                return resolve(undefined);
            }
        }).catch((reason) => {
            return resolve(undefined);
        })
    })
}

/**
 * Подписыаться на инициализацию Ачивок
 * @param {Function} event - callback
 */
export function OnAchivements(/**@type {Achivements} */ event = (data) => { }) {
    if (Loaded)
        event(Achivements);

    Callbacks.push(event);
}

/**
 * Инициализирует управление Ачивками
 * @param {number} id - id пользователя
 */
export async function InitAchivements(id) {
    const achivements = await LoadAchivements(id);
    CallAchivements(achivements, id);
}

function CallAchivements(achivements, id) {
    Achivements = achivements;
    Loaded = true;
    Callbacks.forEach((event) => {
        event(Achivements, id);
    });
}

/**
 * Загружает Ачивки пользователя
 * @param {number} id - пользователя
 * @returns {[id:number, neko_id:string, level:number, progress:number, user_id:number, created_at:string, updated_at:string] | undefined}
 */
function LoadAchivements(id) {
    return new Promise((resolve) => {
        Achievements.achievements({ user_id: id }, async (response) => {
            if (response.failed) {
                if (response.status == 429) {
                    await Sleep(1000);
                    return resolve(LoadAchivements(id));
                }
                return resolve(undefined);
            }
            resolve(response);
        }).GET();
    });
}