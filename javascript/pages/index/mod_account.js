import { Users } from "../../modules/api.shiki.js";
import { Sleep } from "../../modules/functions.js";
import { AnimeLoaded } from "./mod_animes.js";
import { ShowNotifyWindow } from "./mod_window.js";
import { OAuth } from "../../core/main.core.js";
import { THeader } from "../settings/mod.header.js";

/**
 * Отображение авторизованого пользователя
 * @param {boolean} looged 
 */
export function ShowUser(looged = false) {
    THeader.init({
        events: {
            onprofil: () => {
                let location = "login.html";
                if (OAuth.auth)
                    location = "user.html";

                window.location.href = location;
            },
            onbutton: () => {
                ShowNotifyWindow();
            },
            onsearch: (value) => {
                value = value.trim();
                if (value.length <= 0) {
                    return;
                }
                window.location.href = '/search.html?q=' + value;
            }
        }
    });
    
    if (!looged) {
        autoLogin();
        return;
    }

    let data = OAuth.user;

    $('.ava-wrapper').css('--p-ava-img', `url('${data.image['x160']}')`);
    $('.profile-content > .page-title').text(data.nickname);
    $('.profile-content > .username').text('С возвращением');

    userNotification(data.id);
}

//Отображение количество уведомлений на аккаунте пользователя
function userNotification(id) {
    AnimeLoaded(() => {
        Users.unread_messages(id, async (response) => {
            if (response.failed) {
                if (response.status == 429) {
                    await Sleep(1000);
                    return userNotification(id);
                }
                return;
            }

            //Смотрим только на количество notifications
            let count = response.messages + response.news + response.notifications;

            if (count > 0) {
                $('#account-edit').append(`<span class="count">${count}</span>`)
            }
        }).GET();
    });
}

/**
 * Автоматическая авторизация
 */
function autoLogin() {
    //Проверяем если пользователь не авторизирован, и то что у пользователя включена автоматический вход
    if (!OAuth.auth && $PARAMETERS.autologin && OAuth.access && localStorage.getItem('application_event') != "autologin") {
        //Нужно будет создать в localStorage ячейку c указанием текущим событием программы
        localStorage.setItem('application_event', "autologin");
        //Для тестового режима своя страничка авторизации
        if (OAuth.mode === 'test') {
            return window.location.href = "/login.html";
        }

        //Пробуем авторизоваться
        return window.location.href = OAuth.events.genLink();
    }
}