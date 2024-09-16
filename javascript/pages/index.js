import { InitMenu } from "../menu.js";
import { ShowUser } from "./index/mod_account.js";
import { UserRates } from "../modules/ShikiAPI.js";
import { GitHubRel } from "./index/mod_github.js";
import { Main, User } from "../modules/ShikiUSR.js";
import { SetUserRate } from "./index/mod_trailers.js";
import { GetHistoryWatch } from "./index/mod_history_watch.js";
import { ScrollElementWithMouse, Sleep } from "../modules/functions.js";
import { AnimeLoaded, LoadAnimeShikimori, LoadUpdatetAnime } from "./index/mod_animes.js";
import { ShowNotifyWindow } from "./index/mod_window.js";
// import { InitCountdown } from "./index/mod_countdown.js";

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
    On();
    // InitCountdown();
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

    $(document).on('keydown', (e) => {
        if (e.originalEvent.key === "/") {
            e.preventDefault();
            $('.desktop > #search-input').focus();
        }
    });

    //Событие нажатие на уведомления
    $('.notification').on('click', () => {
        ShowNotifyWindow();
    });
}