import { Users } from "../../modules/api.shiki.js";
import { Sleep } from "../../modules/functions.js";
import { AnimeLoaded } from "./mod_animes.js";
import { OAuth } from "../../core/main.core.js";

/**
 * Отображение авторизованого пользователя
 * @param {boolean} looged 
 */
export function ShowUser(looged = false) {
    getPosition();
    if (!looged) {
        autoLogin();
        return;
    }

    let data = OAuth.user;

    $('.image-profile > img').attr('src', data.avatar);
    $('.name > b').text(data.nickname);
    $('.name > span').text('С возврашением,')
    $('.account > a').attr('href', 'user.html');

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
                $('.notification').addClass('dot');
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

/**
 * Получаем положение пользователя по ip
 */
function getPosition() {
    fetch('https://api.sypexgeo.net/json/').then(async (response) => {
        const data = await response.json();
        let country = data.country.name_en;
        if (data.city?.name_en) {
            country += `, ${data.city.name_en}`;
        }
        $('.position > span').text(country);
    });
}