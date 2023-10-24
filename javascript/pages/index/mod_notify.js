import { Users } from "../../modules/ShikiAPI.js";
import { User } from "../../modules/ShikiUSR.js";
import { Sleep } from "../../modules/funcitons.js";

export function LoadNotifycation({ e = () => { }, p = 1 } = {}) {
    if (!User.authorized) {
        return;
    }

    let user_id = User.Storage.Get(User.Storage.keys.whoami).id;

    Users.messages(user_id, { type: 'news', limit: 10, page: p }, async (response) => {
        if (response.failed) {
            if (response.status == 429) {
                await Sleep(1000);
                return LoadNotifycation();
            }
            return;
        }

        if (response.length != 0 && p == 1) {
            $('.content-notifycation').empty();
        }
        //Проходимся по непрочитыным уведомлениям
        for (let i = 0; i < response.length; i++) {
            const element = response[i];
            if (element.kind == "episode" && $(`.notifycation-cnt[data-id="${element.id}"]`).length == 0) {
                $('.content-notifycation').append(GenNotify(element));
            }
        }

        e();

        //Присваеваем управление notify
        _Events();

        if (response.length == 0) {
            return;
        }

        //Ajax прогрузка уведомлений
        const container = $(`.content-notify`);
        container.on("scroll.ajax", function () {
            if (container.scrollTop() + container.innerHeight() >= container[0].scrollHeight - 20) {
                container.off("scroll.ajax");
                _RemoveEvents();
                LoadNotifycation({ p: p + 1 });
            }
        });
    }).GET();
}

function _Events() {
    var startX;
    var isSwiping = false;
    var element;

    let read;
    let del;
    let cnt;

    let readed = false;
    let deletet = false;

    $('.notifycation').on('mousedown touchstart', function (event) {
        isSwiping = true;
        startX = event.clientX || event.originalEvent.touches[0].clientX;
        element = $(event.currentTarget);
        event.preventDefault();

        read = $(element).children(`.controlls-read`);
        del = $(element).children(`.controlls-del`);
        cnt = $(element).children(`.notifycation-cnt`);
    });

    $(document).on("mousemove touchmove", function (event) {
        if (!isSwiping || !element) return;
        var currentX = event.clientX || event.originalEvent.touches[0].clientX;
        var swipeDistance = currentX - startX;

        if (swipeDistance > 0) {
            del.width('0px');
            deletet = false;
            if (swipeDistance < 100) {
                readed = false;
                read.width(`${swipeDistance}px`);
                cnt.css({ transform: `translateX(${swipeDistance}px)` });
                read.css({ transition: `` });
            } else {
                read.css({ transition: `.3s ease-in-out` });
                read.width('100%');
                readed = true;
            }
        } else {
            read.width('0px');
            readed = false;
            if (swipeDistance > -100) {
                del.width(`${-swipeDistance}px`);
                cnt.css({ transform: `translateX(${swipeDistance}px)` });
                del.css({ transition: `` });
                deletet = false;
            } else {
                del.css({ transition: `.3s ease-in-out` });
                del.width('100%');
                deletet = true;
            }
        }
    });

    $(document).on("mouseup touchend", function () {
        if (!element) return;
        isSwiping = false;
        del.width('0px');
        read.width('0px');
        cnt.css({ transform: `translateX(0px)` });
        del.css({ transition: `` });
        cnt.css({ transition: `` });
        element = undefined;

        console.log(readed, deletet);
    });
}

function _RemoveEvents() {
    $('.notifycation').off('mousedown touchstart');
    $(document).off("mousemove touchmove");
    $(document).off("mouseup touchend");
}

function GenNotify(e) {
    let body = e.html_body.split("эпизод аниме");
    let episode = parseInt(body[0].match(/\d+/)[0]);
    body = body[0] + "эпизод аниме" + ` "${e.linked.russian}"`;
    let date = new Date(e.created_at);
    let status = e.linked.status == "ongoing" ? "Онгоинг" : e.linked.status == " anons" ? "Анонс" : "Релиз";
    let issetVoice = localStorage.getItem(e.linked.id) ? true : false;
    return `<div class="notifycation" data-voice="${issetVoice}" data-id="${e.id}" data-loaded="false" data-anime="${e.linked.id}" data-episode="${episode}">
    <div class="controlls-read">
        <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
    </div>
    <div class="notifycation-cnt" data-id="${e.id}">
        <div class="notifycation-cnt-type-date">
            <div class="notify-type">
                <div class="read-${e.read}"></div>Новый эпизод!
            </div>
            <div class="notify-date">${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}</div>
        </div>
        <div class="notifycation-cnt-text">
            <div>${body}</div>
        </div>
        <div class="notifycation-cnt-tags">
            <div class="notifycation-cnt-tags-list">
                <div>${e.linked.episodes_aired} из ${e.linked.episodes}</div>
                <div>Статус: ${status}</div>
            </div>
            ${issetVoice ? ` <div class="notifycation-cnt-tags-onshow" style="">
            <svg class="load" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"/></svg>
            <svg class="loaded" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
            <svg class="error" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
        </div>`: ``}
           
        </div>
    </div>
    <div class="controlls-del">
        <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
    </div>
</div>`;
}