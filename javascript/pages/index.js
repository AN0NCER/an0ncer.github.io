import { InitMenu } from "../menu.js";
import { ShowUser } from "./index/mod_account.js";
import { UserRates, Users } from "../modules/ShikiAPI.js";
import { GitHubRel } from "./index/mod_github.js";
import { Main, User } from "../modules/ShikiUSR.js";
import { SetUserRate } from "./index/mod_trailers.js";
import { GetHistoryWatch } from "./index/mod_history_watch.js";
import { ScrollElementWithMouse, Sleep } from "../modules/funcitons.js";
import { AnimeLoaded, LoadAnimeShikimori, LoadUpdatetAnime } from "./index/mod_animes.js";
import { ShowNotifyWindow } from "./index/mod_window.js";

InitMenu();

Main((e) => {
    ShowUser(e);
    LoadAnimeShikimori();
    LoadUpdatetAnime();
});

(() => {
    GitHubRel();
    GetHistoryWatch();
    LoadUserRate();
    LoadUserNotifycation();
    On();
})();

ScrollElementWithMouse('.section-genres');
ScrollElementWithMouse('.section-anime');
ScrollElementWithMouse('.section-update');

function LoadUserRate() {
    AnimeLoaded(() => {
        if (!User.authorized) {
            return;
        }
        let user_id = User.Storage.Get(User.Storage.keys.whoami).id;
        UserRates.list({ user_id }, async (response) => {
            if (response.failed) {
                if (response.status == 429) {
                    await Sleep(1000);
                    return LoadUserRate();
                }
                return;
            }
            SetUserRate(response);
        }).GET();
    });
}

function LoadUserNotifycation() {
    AnimeLoaded(() => {
        if (!User.authorized) {
            return;
        }
        let user_id = User.Storage.Get(User.Storage.keys.whoami).id;
        Users.messages(user_id, { type: 'news' }, async (response) => {
            if (response.failed) {
                if (response.status == 429) {
                    await Sleep(1000);
                    return LoadUserNotifycation();
                }
                return;
            }
            console.log(response);
            //Проходимся по непрочитыным уведомлениям
            for (let i = 0; i < response.length; i++) {
                const element = response[i];
                if(element.read == false){
                    console.log(element);
                    //Если уведомление об эпизоде
                    if(element.kind == "episode"){
                        let locData = localStorage.getItem(element.linked.id);
                        if(locData){
                            locData = JSON.parse(locData);
                            kodikApi.search({shikimori_id: element.linked.id, translation_id: locData.kodik_dub, limit: 1}, (response) => {
                                console.log(response);
                            })
                        }
                    }
                }
            }
            // await kodikApi.search({shikimori_id: 51009, limit: 1, translation_id: 1811}, (data) => {
            //     console.log(data);
            // });
        }).GET();
    })
}

function On() {
    //Событие нажатие на жанр
    $('.genres').click((e) => {
        const target = $(e.currentTarget);
        if (target.hasClass('selected')) {
            return;
        }

        //Снимаем выдиление с другого елемента и перезначаем его
        $('.section-genres > .selected').removeClass('selected');
        target.addClass('selected');
        const genres = target.data('id');
        LoadAnimeShikimori({ genre: genres });
    });

    //Событие на нажатие кнопки поиска
    $('.search > .btn').click((e) => {
        //Получение значения посика
        let value = $(e.currentTarget.parentNode)[0].firstElementChild.value;

        window.location.href = '/search.html?val=' + value;
    });

    //Событие Enter unput search
    $('.search > input').on('keypress', function (e) {
        if (e.which == 13) {
            let value = this.value;
            if (value.length <= 0) {
                return;
            }
            window.location.href = '/search.html?val=' + value;
        }
    });

    //Событие нажатие на уведомления
    $('.notification').on('click', ()=>{
        ShowNotifyWindow();
    });
}