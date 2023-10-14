import { Users } from "../../modules/ShikiAPI.js";
import { User } from "../../modules/ShikiUSR.js";
import { Sleep } from "../../modules/funcitons.js";
import { AnimeLoaded } from "./mod_animes.js";

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

    let data = User.Storage.Get(User.Storage.keys.whoami);

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
                $('.notification > .dot').removeClass('hide');
            }
        }).GET();
    });
}

/**
 * Автоматическая авторизация
 */
function autoLogin() {
    //Проверяем если пользователь не авторизирован, и то что у пользователя включена автоматический вход
    if (!User.authorized && $PARAMETERS.autologin && localStorage.getItem('application_event') != "autologin") {
        //Нужно будет создать в localStorage ячейку c указанием текущим событием программы
        localStorage.setItem('application_event', "autologin");
        //Для тестового режима своя страничка авторизации
        if (User.isteste) {
            return window.location.href = "/login.html";
        }

        //Пробуем авторизоваться
        return window.location.href = User.Oauth.GetUrl();
    }
}

/**
 * Получаем положение пользователя по ip
 */
function getPosition() {
    fetch('https://api.sypexgeo.net/json/').then(async (response) => {
        const data = await response.json();
        $('.position > span').text(data.country.name_en + ', ' + data.city.name_en);
    });
}