import { UserRates } from "../../modules/ShikiAPI.js";
import { User } from "../../modules/ShikiUSR.js";
import { Sleep } from "../../modules/functions.js";
import { $ID } from "../watch.js";

/**@type {null | { id:number, user_id:number, target_id:number, target_type:string, score:number, status:string, rewatches:number, episodes:number, volumes:number, chapters:number, text:null | string, text_html:string, created_at:string, updated_at:string}} */
let userRate = null;
let isLogged = false;
let isInit = false;

const listEvents = {
    oninit: [],
    onupdate: [],
    call: function (name, data = undefined) {
        for (let i = 0; i < listEvents[name].length; i++) {
            const element = listEvents[name][i];
            element(data);
        }
    }
}

const user = {
    /**
     * Инициализация UserRate управления на странице аниме
     * @param {null | Object} obj user_rate данные из запроса shikimori 
     * @param {boolean} logged авторизирован ли пользователь
     */
    init: function (obj, logged) {
        isLogged = logged;
        userRate = obj;
        isInit = true;
        listEvents.call("oninit", userRate);
    },

    Get: function(){
        return userRate;
    },

    Events: {
        /**
         * Событие после инициализации данных
         * @param {Function} e Обратное событие
         */
        OnInit: function (e) {
            if (typeof e == "function") {
                listEvents.oninit.push(e);
            }
            if (isInit) {
                e(userRate);
            }
        },

        /**
         * Событие при обновлении данных
         * @param {Function} e Обратное событие
         */
        OnUpdate: function (e) {
            if (typeof e == "function") {
                listEvents.onupdate.push(e);
            }
        }
    },

    Controls: {
        /**
         * Создает UserRate если пользователь авторизирова
         * @param {"planned" | "watching" | "rewatching" | "on_hold" | "completed" | "dropped"} status Утсанавливаеммый статус на аниме
         * @returns {userRate}
         */
        Create: function (status = "planned") {
            if (!isLogged || !isInit) {
                return;
            }
            return Fetch({
                body: { "user_rate": { "status": status, "target_id": $ID, "target_type": "Anime", "user_id": User.Storage.Get('access_whoami').id } },
                event: function (res) {
                    listEvents.call("onupdate", res);
                }
            }).list();
        },

        /**
         * Обновляет UserRate
         * @param {"planned" | "watching" | "rewatching" | "on_hold" | "completed" | "dropped"} status Утсанавливаеммый статус на аниме
         * @returns {userRate}
         */
        Update: function (status = "planned") {
            return this.Create(status);
        },

        /**
         * Устанавливает просмотренный эпизод
         * @param {number} episode Просмотренный эпизод
         * @param {undefined | "planned" | "watching" | "rewatching" | "on_hold" | "completed" | "dropped"} status Утсанавливаеммый статус на аниме
         * @returns {userRate}
         */
        Episode: function (episode, status = undefined) {
            if (!isLogged || !isInit || userRate == null) {
                return;
            }
            if (status == undefined) {
                status = userRate.status;
            }
            return Fetch({
                body: {
                    "user_rate": { "episodes": episode, "status": status }
                },
                event: function (res) {
                    listEvents.call("onupdate", res);
                }
            }).show(userRate.id);
        },


        /**
         * Устанавливает оценку для текущего аниме
         * @param {number} score Оценка аниме
         * @returns {userRate}
         */
        Score: function (score) {
            if (!isLogged || !isInit || userRate == null) {
                return;
            }
            return Fetch({
                body: {
                    "user_rate": { "score": score }
                },
                event: function (res) {
                    listEvents.call("onupdate", res);
                }
            }).show(userRate.id);
        },

        /**
         * Устанавливает заметку для текущего аниме
         * @param {string} note Текст заметки
         * @returns {userRate}
         */
        Note: function (note) {
            if (!isLogged || !isInit || userRate == null) {
                return;
            }
            return Fetch({
                body: {
                    "user_rate": { "text": note }
                },
                event: function (res) {
                    listEvents.call("onupdate", res);
                }
            }).show(userRate.id);
        },

        /**
         * Удаляет данные текущего аниме из списка пользователя
         * @returns {Promise<undefined>}
         */
        Remove: function () {
            if (!isLogged || !isInit || userRate == null) {
                return;
            }
            return new Promise((resolve) => {
                UserRates.show(userRate.id, async (res) => {
                    if (res.failed) {
                        if (res.status == 429) {
                            await Sleep(1000);
                            return resolve(Fetch({ body, query, event }).list());
                        }
                        return;
                    }
                    userRate = null;
                    listEvents.call("onupdate", null);
                }).DELETE();
            });
        }
    }
}

function Fetch({ body = {}, query = {}, event = undefined } = {}) {
    return {
        list: function () {
            return new Promise((resolve) => {
                UserRates.list(query, async (res) => {
                    if (res.failed) {
                        if (res.status == 429) {
                            await Sleep(1000);
                            return resolve(Fetch({ body, query, event }).list());
                        }
                        return;
                    }
                    userRate = res;
                    if (typeof event == "function") {
                        event(res);
                    }
                    return resolve(res);
                }).POST(body);
            });
        },

        show: function (id) {
            return new Promise((resolve) => {
                UserRates.show(id, async (res) => {
                    if (res.failed) {
                        if (res.status == 429) {
                            await Sleep(1000);
                            return resolve(Fetch({ body, query, event }).show(id));
                        }
                        return;
                    }
                    userRate = res;
                    if (typeof event == "function") {
                        event(res);
                    }
                    return resolve(res);
                }).PATCH(body);
            });
        }
    }
}

export const UserRate = () => { return user; }