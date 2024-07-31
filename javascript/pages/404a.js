import { ACard } from "../modules/AnimeCard.js";
import { ScrollElementWithMouse, Sleep } from "../modules/functions.js";
import { Animes } from "../modules/ShikiAPI.js";
import { Main } from "../modules/ShikiUSR.js";
import { ShowUser } from "./index/mod_account.js";
import { ShowNotifyWindow } from "./index/mod_window.js";

Main((e) => {
    ShowUser(e);
    LoadAnime();
    On();
});

function On() {
    //Событие нажатие на уведомления
    $('.notification').on('click', () => {
        ShowNotifyWindow();
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

    ScrollElementWithMouse('.section-anime');

    $('#btn-main').on('click', function () {
        return document.location.replace('index.html');
    });
    $('#btn-back').on('click', function () {
        return window.history.back();
    });
}

function LoadAnime() {
    Animes.list({ season: `${new Date().getFullYear()}`, limit: 7, order: 'ranked', status: 'ongoing' }, async (res) => {
        if (res.failed) {
            if (res.status == 429) {
                await Sleep(1000);
                return LoadAnime();
            }
            return;
        }
        for (let i = 0; i < res.length; i++) {
            $('.section-anime').append(ACard.Gen({ response: res[i] }));
        }
    }).GET();
}