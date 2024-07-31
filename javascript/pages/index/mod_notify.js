import { Messages, Users } from "../../modules/ShikiAPI.js";
import { User } from "../../modules/ShikiUSR.js";
import { Sleep } from "../../modules/functions.js";

let LOADED = false;
let USER_ID = undefined;
const LIMIT_CALL = 10;
let PAGE = 1;
/**@type {[{notify_ids:[], anime:{id:number,episode:number}, voice:{loaded: boolean, lastepisode: number}}]} */
let VOICES = [];

export function LoadNotifycation({ e = () => { }, p = 1 } = {}) {
    if (!User.authorized || LOADED) {
        return;
    }

    USER_ID = User.Storage.Get(User.Storage.keys.whoami).id;
    GetNotifycation((e) => {
        $('.notify-load').addClass('hide');
        $('.notify-content').removeClass('hide');
        if (e.length != 0) {
            $('.content-notifycation').empty();
            AddNotifycation().episode(e);
            _Events();
            Loop();
        }
        LOADED = true;
    });
}

function Loop() {
    //Ajax прогрузка уведомлений
    const container = $(`.content-notify`);
    container.on("scroll.ajax", function () {
        if (container.scrollTop() + container.innerHeight() >= container[0].scrollHeight - 20) {
            container.off("scroll.ajax");
            GetNotifycation((e) => {
                if (e.length != 0) {
                    AddNotifycation().episode(e);
                    _Events();
                    Loop();
                }
            });
        }
    });
}

function GetNotifycation(e = () => { }) {
    Users.messages(USER_ID, { type: 'news', limit: LIMIT_CALL, page: PAGE }, async (response) => {
        if (response.failed) {
            if (response.status == 429) {
                await Sleep(1000);
                return GetNotifycation(e);
            }
            return;
        }
        e(response);
        PAGE++;
        LoadVoices();
    }).GET();
}

async function LoadVoices() {
    for (let i = 0; i < VOICES.length; i++) {
        const data = VOICES[i];
        if (data.voice == undefined) {
            const data_anime = JSON.parse(localStorage.getItem(data.anime.id));
            const kodik = await KodikGetEpisode(data.anime.id, data_anime.kodik_dub);
            data.voice = { loaded: true, lastepisode: kodik.last_episode };
            VOICES[i] = data;
            for (let a = 0; a < data.notify_ids.length; a++) {
                const element = data.notify_ids[a];
                SetVoiceStatus(kodik.last_episode, $(`.notifycation[data-id="${element}"]`).data('episode'), element);
            }
        } else {
            for (let a = 0; a < data.notify_ids.length; a++) {
                const element = data.notify_ids[a];
                SetVoiceStatus(data.voice.lastepisode, $(`.notifycation[data-id="${element}"]`).data('episode'), element);
            }
        }
    }
}

function SetVoiceStatus(last_episode, episode, notify) {
    if (last_episode >= episode) {
        $(`.voice-status.load[data-id="${notify}"]`).addClass('available');
        $(`.voice-status.load[data-id="${notify}"]`).removeClass('load');
    } else {
        $(`.voice-status.load[data-id="${notify}"]`).addClass('unavailable');
        $(`.voice-status.load[data-id="${notify}"]`).removeClass('load');
    }
}

function KodikGetEpisode(anime_id, translation_id) {
    return new Promise((resolve) => {
        kodikApi.search({ shikimori_id: anime_id, translation_id: translation_id, limit: 1 }, (response) => {
            return resolve(response.results[0]);
        });
    });
}

function AddNotifycation() {
    return {
        episode: (response) => {
            if (!response) {
                return false;
            }
            for (let i = 0; i < response.length; i++) {
                const element = response[i];
                if (element.kind == "episode" && $(`.notifycation[data-id="${element.id}"]`).length == 0) {
                    $('.content-notifycation').append(GENERATE().episode(element));
                } else if (element.kind == "released" && $(`.notifycation[data-id="${element.id}"]`).length == 0) {
                    $('.content-notifycation').append(GENERATE().release(element));
                }
            }
        }
    }
}

function GENERATE() {
    return {
        episode: (e) => {
            let body = e.html_body.split("эпизод аниме");
            let episode = parseInt(body[0].match(/\d+/)[0]);
            body = body[0] + "эпизод аниме <b>" + ` "${e.linked.russian}"</b>`;
            const status = e.linked.status == "ongoing" ? "Онгоинг" : e.linked.status == " anons" ? "Анонс" : "Релиз";
            const issetVoice = localStorage.getItem(e.linked.id) ? true : false;
            if (issetVoice) {
                const index = VOICES.findIndex(x => x.anime.id == e.linked.id);
                if (index == -1) {
                    VOICES.push({ notify_ids: [e.id], anime: { id: e.linked.id, episode: episode }, voice: undefined });
                } else {
                    if (VOICES[index].notify_ids.findIndex(x => x == e.id) == -1) {
                        VOICES[index].notify_ids.push(e.id);
                    }
                }
            }
            return GENERATE().html(e.read, e.id, episode, e.linked.id, e.created_at, body, e.linked.episodes_aired, e.linked.episodes, issetVoice, "Новый эпизод");
        },
        release: (e) => {
            const body = `Завершён показ аниме <b>"${e.linked.russian}"</b>`;
            const issetVoice = localStorage.getItem(e.linked.id) ? true : false;
            if (issetVoice) {
                const index = VOICES.findIndex(x => x.anime.id == e.linked.id);
                if (index == -1) {
                    VOICES.push({ notify_ids: [e.id], anime: { id: e.linked.id, episode: e.linked.episodes }, voice: undefined });
                } else {
                    if (VOICES[index].notify_ids.findIndex(x => x == e.id) == -1) {
                        VOICES[index].notify_ids.push(e.id);
                    }
                }
            }
            return GENERATE().html(e.read, e.id, e.linked.episodes, e.linked.id, e.created_at, body, e.linked.episodes, e.linked.episodes, issetVoice, "Релиз");
        },

        html: (isRead, notifyId, episode, animeId, notifyDate, body, episodesAired, episodesAnime, issetVoice, title) => {
            return `<div class="notifycation ${isRead}" data-id="${notifyId}" data-episode="${episode}" data-anime="${animeId}">
                ${!isRead ? `<div class="status-unread"></div>` : ''}
                <div class="notification-data">
                    <div class="notify-title-date">
                        <span class="notify-title">${title}</span>
                        <span class="notify-date">${formatDate(notifyDate)}</span>
                    </div>
                    <div class="notify-text">${body}</div>
                    <div class="notify-user-info">
                        <div class="anime-episodes">
                            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z" /> </svg>
                            <span class="count-anime">${episodesAired} из ${episodesAnime}</span>
                        </div>
                        ${issetVoice ? `<div class="voice-status load" data-id="${notifyId}" data-anime="${animeId}">
                                            <div class="available">
                                                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512">
                                                    <path
                                                        d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z" />
                                                </svg>
                                                <span class="text">Доступно</span>
                                            </div>
                                            <div class="unavailable">
                                                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512">
                                                    <path
                                                        d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z" />
                                                </svg>
                                                <span class="text">Не&nbsp;доступно</span>
                                            </div>
                                            <div class="load">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="scale-down-center" height="1em" viewBox="0 0 512 512">
                                                    <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
                                                </svg>
                                                <span class="text">Обновляем</span>
                                            </div>
                                        </div>`: ''}
                    </div>
                </div>
                <div class="remove-event">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                </div>
                <div class="read-event">
                    <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M313.4 32.9c26 5.2 42.9 30.5 37.7 56.5l-2.3 11.4c-5.3 26.7-15.1 52.1-28.8 75.2H464c26.5 0 48 21.5 48 48c0 18.5-10.5 34.6-25.9 42.6C497 275.4 504 288.9 504 304c0 23.4-16.8 42.9-38.9 47.1c4.4 7.3 6.9 15.8 6.9 24.9c0 21.3-13.9 39.4-33.1 45.6c.7 3.3 1.1 6.8 1.1 10.4c0 26.5-21.5 48-48 48H294.5c-19 0-37.5-5.6-53.3-16.1l-38.5-25.7C176 420.4 160 390.4 160 358.3V320 272 247.1c0-29.2 13.3-56.7 36-75l7.4-5.9c26.5-21.2 44.6-51 51.2-84.2l2.3-11.4c5.2-26 30.5-42.9 56.5-37.7zM32 192H96c17.7 0 32 14.3 32 32V448c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32V224c0-17.7 14.3-32 32-32z"/></svg>
                </div>
            </div>`;
        }
    }
}

function _Events() {
    const elements = $('.notifycation');

    //Свайпы
    let swipeElement; //< - Текущий елемент свайпа
    let isSwiping = false;
    let warisSwiping = false;
    let startX; // < - Стартовой координат

    let disable_read = false; // < - Параметр отвечающий за отключение параметра отметить как прочитанное
    const block_size = 85; // < - Размер блоков свайпов

    let deleteElement;
    let readElement;

    let readed = false;
    let deletet = false;

    elements.on('mousedown.notify touchstart.notify', function (event) {
        swipeElement = $(this);

        // Добавьте код для проверки касания по краям элемента
        var elementWidth = swipeElement.width();
        var touchX = event.clientX || event.originalEvent.touches[0].clientX;
        var edgeThreshold = 50; // Порог для определения, что касание произошло по краю

        if (touchX < swipeElement.offset().left + edgeThreshold) {
            // Касание по левому краю элемента
            isSwiping = true;
            event.preventDefault();
        } else if (touchX > swipeElement.offset().left + elementWidth - edgeThreshold) {
            // Касание по правому краю элемента
            isSwiping = true;
            event.preventDefault();
        }

        startX = event.clientX || event.originalEvent.touches[0].clientX;

        disable_read = false;

        deleteElement = swipeElement.children(`.remove-event`);
        readElement = swipeElement.children(`.read-event`);

        if (swipeElement.hasClass('true')) {
            disable_read = true;
        }
    });

    $(document).on('mousemove.notify touchmove.notify', function (event) {
        if (!isSwiping || !swipeElement) return;

        var currentX = event.clientX || event.originalEvent.touches[0].clientX;
        var swipeDistance = currentX - startX;
        if (swipeDistance > 0 && !disable_read) {
            warisSwiping = true;
            deleteElement.width(0);
            deletet = false;
            //Отметить как прочитаное
            if (swipeDistance < block_size) {
                readElement.width(`${swipeDistance}px`);
                readed = false;
            } else {
                readElement.width('100%');
                readed = true;
            }
        } else {
            readElement.width(0);
            warisSwiping = true;
            readed = false;
            //Удалить навсегда
            if (swipeDistance > -block_size) {
                deleteElement.width(`${-swipeDistance}px`);
                deletet = false
            } else {
                deleteElement.width('100%');
                deletet = true;
            }
        }
    });

    $(document).on("mouseup.notify touchend.notify", function (event) {
        if (!swipeElement) return;
        if (!isSwiping) return;
        event.preventDefault();
        isSwiping = false;
        deleteElement.width('0px');
        readElement.width('0px');
        EventsNotify(readed, deletet, swipeElement);
        readed = false;
        deletet = false;
        swipeElement = undefined;
    });

    elements.on('click.notify', function () {
        if (warisSwiping) {
            warisSwiping = false;
            return;
        }
        let target = $(this);
        if (target.hasClass('true')) {
            location.href = `watch.html?id=${target.attr('data-anime')}&player=true`;
        } else {
            EventsNotify(true, false, target, () => {
                location.href = `watch.html?id=${target.attr('data-anime')}&player=true`;
            });
        }
    });

}

function EventsNotify(readed, deletet, element, e = () => { }) {
    const id = element.attr('data-id');
    if (readed) {
        Messages.mark_read(async (res) => {
            if (res.failed) {
                if (response.status == 429) {
                    await Sleep(1000);
                    return EventsNotify(readed, deletet, element);
                }
                return;
            }
            $(`.notifycation[data-id="${id}"] > .status-unread`).remove();
            $(`.notifycation[data-id="${id}"]`).removeClass('false');
            $(`.notifycation[data-id="${id}"]`).addClass('true');
            e();
        }).POST({ ids: id, is_read: "1" });
    } else if (deletet) {
        Messages.delete(id, async (res) => {
            if (res.failed) {
                if (response.status == 429) {
                    await Sleep(1000);
                    return EventsNotify(readed, deletet, element);
                }
                return;
            }
            $(`.notifycation[data-id="${id}"]`).remove();
            e();
        }).DELETE();
    }
}

function formatDate(inputDate) {
    const currentDate = new Date();
    const inputDateTime = new Date(inputDate);
    const diffInMilliseconds = Math.abs(currentDate - inputDateTime);
    const diffInMinutes = Math.floor(diffInMilliseconds / (60 * 1000));
    const diffInHours = Math.floor(diffInMilliseconds / (60 * 60 * 1000));
    const diffInDays = Math.floor(diffInMilliseconds / (24 * 60 * 60 * 1000));

    if (diffInMinutes < 60) {
        return `${diffInMinutes} ${pluralize(diffInMinutes, 'минуту', 'минуты', 'минут')}`;
    } else if (diffInHours < 24) {
        return `${diffInHours} ${pluralize(diffInHours, 'час', 'часа', 'часов')}`;
    } else if (diffInDays < 4) {
        return `${diffInDays} ${pluralize(diffInDays, 'день', 'дня', 'дней')}`;
    } else {
        const options = { month: 'numeric', day: 'numeric' };
        return inputDateTime.toLocaleDateString('ru-RU', options);
    }
}

function pluralize(count, singular, genitiveSingular, plural) {
    const lastTwoDigits = count % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 20) {
        return plural;
    }

    const lastDigit = count % 10;
    if (lastDigit === 1) {
        return singular;
    } else if (lastDigit >= 2 && lastDigit <= 4) {
        return genitiveSingular;
    } else {
        return plural;
    }
}