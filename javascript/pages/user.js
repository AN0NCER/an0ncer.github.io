import { InitMenu } from "../menu.js";
import { Main, User } from "../modules/ShikiUSR.js";
import { Friends, Users } from "../modules/ShikiAPI.js";
import { ScrollElementWithMouse, Sleep } from "../modules/functions.js";
import { InitAchivements } from "./user/mod_achivements.js";
import { InitLeve } from "./user/mod_level.js";
import { GetIdLoadUser, LoadScreen, UserData } from "./user/mod_load.js";
import { Franchises } from "./user/mod_franchises.js";
import { Stats } from "./user/mod_stats.js";
import { Favourites } from "./user/mod_favorites.js";
import { InitFriends } from "./user/mod_friends.js";
import { History } from "./user/mod_history.js";
import { Tunime } from "../modules/TunimeApi.js";
import { ShowInfo } from "../modules/Popup.js";
import { Genres } from "./user/mod_genres.js";

/**
 * @callback LUser
 * @param {{about:string, about_html:string, avatar:string, banned:boolean, common_info: [string], full_years:number, id:number, image:{ x160:string, x148:string, x80:string, x16:string, x32:string, x48:string, x64:string }, in_friends:null, is_ignored:boolean, last_online:string, last_online_at:string, location:null, name:null, nickname:string, sex:string, show_comments:boolean, stats:{activity:[{name:[number], value:number}], full_statuses:{anime:[{grouped_id:string, id:number, name:string, size:number, type:string}], manga:[{grouped_id:string, id:number, name:string, size:number, type:string}]},genres:[], has_anime?:boolean, has_manga?:boolean, publishers:[], ratings:{anime:[{name:string, value:number}]}, scores:{anime:[{name:string, value:number}], manga:[]}, statuses:{anime:[{grouped_id:string, id:number, name:string, size:number, type:string}],manga:[{grouped_id:string, id:number, name:string, size:number, type:string}]},studios:[],types:{anime:[{name:string, value:number}], manga:[{name:string, value:number}]}}, style_id:number, url:string, website:string}} data
 */

//Индентификатор пользователя
export let $USER = new URLSearchParams(window.location.search).get("id");

const MODS = [InitLeve, Franchises, Stats, Favourites, InitFriends, History, Genres];

let Loaded = false; // Были ли загружен пользователь
let Callbacks = []; //Функция возврата Пользователя
let LUser = undefined; // Пользователя с shikimori

export function OnUser(/**@type {LUser}*/event = (data) => { }) {
    if (Loaded)
        event(LUser);

    Callbacks.push(event);
}

function InitUser(data) {
    LUser = data;
    Loaded = true;
    Callbacks.forEach((event) => event(LUser));
}

//Начало программы страницы
Main((e) => {
    if (!e && $USER === null)
        window.location.href = "/login.html";
    GetIdLoadUser().then((value) => {
        $USER = value;

        MODS.forEach((event) => event());

        GetUserById($USER, e).then((value) => {
            if (value === undefined)
                return window.location.href = "/404a.html";
            InitAchivements(value.id);
            InitUser(value);
            ShowHeader(value);

            if (value.id === (JSON.parse(localStorage.getItem(User.Storage.keys.whoami))?.id || undefined)) {
                $(`.btn#edit-user`).attr('href', `https://shikimori.one/${value.nickname}/edit/account`);
                $(`.btn#edit-user`).removeClass('hide');
            } else if (value.in_friends !== undefined) {
                if (value.in_friends) {
                    $(`#add-user`).css({ 'display': 'none' });
                    $(`#remove-user`).css({ 'display': 'flex', 'opacity': 1 });
                }
                $(`.list-button`).removeClass('hide');
            }

            // if (value.in_friends === false) {
            $(`.btn#add-user`).on('click', function () {
                anime({
                    targets: "#add-user",
                    scale: [1, 0.5],
                    opacity: [1, 0],
                    begin: function () {
                        $(`.loader`).css('display', `flex`);
                        anime({
                            targets: ".loader",
                            scale: [0.5, 1],
                            opacity: [0, 1]
                        })
                    },
                    complete: function () {
                        $(`#add-user`).css('display', `none`);
                        AddToFriends(value.id);
                    }
                })
                return;
            });

            $(`.btn#remove-user`).on('click', function () {
                anime({
                    targets: "#remove-user",
                    scale: [1, 0.5],
                    opacity: [1, 0],
                    begin: function () {
                        $(`.loader`).css('display', `flex`);
                        anime({
                            targets: ".loader",
                            scale: [0.5, 1],
                            opacity: [0, 1]
                        })
                    },
                    complete: function () {
                        $(`#remove-user`).css('display', `none`);
                        RemoveFromFriends(value.id);
                    }
                })
            });
            // }

            $(`.btn#share`).on('click', function () {
                const link = Tunime.Share.User(value.id);
                try {
                    navigator.share({
                        title: $(document).attr("title"),
                        url: link
                    });
                } catch {
                    navigator?.clipboard?.writeText(link).then(function () {
                        ShowInfo('Скопировано', 'copy');
                    }, function (err) {
                        console.error('Async: Could not copy text: ', err);
                    });
                }
            });

            ScrollElementWithMouse('.block-user-stats');
            ScrollElementWithMouse('.wrapper-favorites');
            ScrollElementWithMouse('.wrapper-achivements');
            ScrollElementWithMouse('.wrapper-achivements-unfinished');
            ScrollElementWithMouse('.wrapper-genres');
            ScrollElementWithMouse('.wrapper-friends');
        });
    });

    InitMenu();
});

function RemoveFromFriends(id) {
    Friends.friends(id, async (response) => {
        let begin = function () {
            $(`#add-user`).css({ 'display': 'flex' });
            anime({
                targets: "#add-user",
                opacity: [0, 1],
                scale: [0.5, 1]
            });
        };
        if (response.failed) {
            if (response.status == 429) {
                await Sleep(1000);
                return RemoveFromFriends(id);
            }
            begin = function(){
                anime({
                    targets: "#remove-user",
                    scale: [0.5, 1],
                    opacity: [0, 1]
                })
            }
        }

        anime({
            targets: ".loader",
            scale: [1, 0.5],
            opacity: [1, 0],
            begin: begin,
            complete: function () {
                $(`.loader`).css('display', ``);
            }
        })
    }).DELETE();

}

function AddToFriends(id) {
    Friends.friends(id, async (response) => {
        let begin = function () {
            $(`#remove-user`).css('display', `flex`);
            anime({
                targets: "#remove-user",
                opacity: [0, 1],
                scale: [0.5, 1]
            });
        };
        if (response.failed) {
            if (response.status == 429) {
                await Sleep(1000);
                return AddToFriends(id);
            }
            begin = function () {
                anime({
                    targets: "#add-user",
                    scale: [0.5, 1],
                    opacity: [0, 1]
                })
            };
        }
        return anime({
            targets: ".loader",
            scale: [1, 0.5],
            opacity: [1, 0],
            begin: begin,
            complete: function () {
                $(`.loader`).css('display', ``);
            }
        })
    }).POST();
}

/**
 * Получить данные о пользователя через id
 * @param {number} id - индентификатор пользователя
 * @param {boolean} [logged=false] - авторизирован ли пользователь
 * @returns {Promise<undefined | {about:string, about_html:string, avatar:string, banned:boolean, common_info: [string], full_years:number, id:number, image:{ x160:string, x148:string, x80:string, x16:string, x32:string, x48:string, x64:string }, in_friends:null, is_ignored:boolean, last_online:string, last_online_at:string, location:null, name:null, nickname:string, sex:string, show_comments:boolean, stats:{activity:[{name:[number], value:number}], full_statuses:{anime:[{grouped_id:string, id:number, name:string, size:number, type:string}], manga:[{grouped_id:string, id:number, name:string, size:number, type:string}]},genres:[], has_anime?:boolean, has_manga?:boolean, publishers:[], ratings:{anime:[{name:string, value:number}]}, scores:{anime:[{name:string, value:number}], manga:[]}, statuses:{anime:[{grouped_id:string, id:number, name:string, size:number, type:string}],manga:[{grouped_id:string, id:number, name:string, size:number, type:string}]},studios:[],types:{anime:[{name:string, value:number}], manga:[{name:string, value:number}]}}, style_id:number, url:string, website:string}>}
 */
function GetUserById(id, logged = false) {
    return new Promise((resolve) => {
        Users.show(id, {}, async (response) => {
            if (response.failed) {
                if (response.status == 429) {
                    await Sleep(1000);
                    return resolve(GetUserById(id));
                }
                return resolve(undefined);
            }
            resolve(response);
        }).GET(logged);
    });
}

function ShowHeader(data) {
    $(`.user-nickname > h1`).text(data.nickname);
    $(`.user-icon > img`).attr('src', data.image.x160);

    const last_online_at = new Date(data.last_online_at).getTime();
    const different_time = new Date().getTime() - last_online_at;

    if (different_time < (30 * 60 * 1000)) {
        $(`.user-online > .point`).addClass('online');
        $(`.user-online > .point`).removeClass('offline');
    }
    LoadScreen.loaded();
}