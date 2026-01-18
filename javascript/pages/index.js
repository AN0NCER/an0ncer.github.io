import { TMenu } from "../core/menu.core.js";
import { ShowUser } from "./index/mod_account.js";
import { UserRates } from "../modules/api.shiki.js";
import { GitHubRel } from "./index/mod_github.js";
import { Main, OAuth } from "../core/main.core.js";
import { SetUserRate } from "./index/mod_trailers.js";
import { GetHistoryWatch } from "./index/mod_history_watch.js";
import { ScrollElementWithMouse, Sleep } from "../modules/functions.js";
import { AnimeLoaded, LoadAnimeShikimori, LoadUpdatetAnime } from "./index/mod_animes.js";
import { ShowNotifyWindow } from "./index/mod_window.js";

TMenu.init();

Main((e) => {
    ShowUser(e);
    LoadUpdatetAnime();
});

(() => {
    LoadAnimeShikimori();
    GitHubRel();
    GetHistoryWatch();
    LoadUserRate();
    On();
})();

ScrollElementWithMouse('.section-genres');
ScrollElementWithMouse('.section-anime');
ScrollElementWithMouse('.section-update');

function LoadUserRate() {
    AnimeLoaded(() => {
        if (!OAuth.auth) {
            return;
        }
        let user_id = OAuth.user.id;
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
            window.location.href = '/search.html?q=' + value;
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

    $('.downloads-link > .wrapper').on('click', () => {
        window.location.href = "/downloads.html";
    });

    if (!window.navigator.onLine) {
        $('.mobile.search').after($('.downloads-link'));
    }
}