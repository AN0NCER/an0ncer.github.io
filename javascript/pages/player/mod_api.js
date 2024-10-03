/**
 * Файл:        mod_api.js
 * Описание:    Мод добавляющий апи для общения PrentWindow и Плеера,
 *              также слушает запросы с PrentWindow, и занимаеться 
 *              отправкой значения в ParentWindow
 * Библиотеки:  rxjs.js
 * Возвращает:  InitAPI, ParentWindow, SendAPI
 */

import { LoadEpisode, Player } from "../player.js";
import { onDuration$, onEnded$, onError$, onPause$, onPlay$, onTimeUpdate$, onVolumeChange$ } from "./mod_event.js";

export const ParentWindow = window.parent; // Данные с iframe

/**
 * Инициализация API плеера между окнами (PrentWindow)
 */
export function InitAPI() {
    onError$.subscribe({
        next: (e) => {
            console.log(e);
            ParentWindow.postMessage({ key: 'tunime_error', value: e }, "*");
        }
    });

    onPause$.subscribe({
        next: () => {
            ParentWindow.postMessage({ key: 'kodik_player_pause' }, '*');
        }
    });

    onPlay$.subscribe({
        next: () => {
            ParentWindow.postMessage({ key: 'kodik_player_play' }, '*');
        }
    });

    onTimeUpdate$.subscribe({
        next: () => {
            ParentWindow.postMessage({ key: 'kodik_player_time_update', value: Math.floor(Player.currentTime) }, '*');
        }
    });

    onDuration$.subscribe({
        next: () => {
            ParentWindow.postMessage({ key: 'kodik_player_duration_update', value: Player.duration }, '*');
        }
    });

    onEnded$.subscribe({
        next: () => {
            ParentWindow.postMessage({ key: 'kodik_player_video_ended' }, '*');
        }
    });

    onVolumeChange$.subscribe({
        next: () => {
            ParentWindow.postMessage({ key: 'kodik_player_volume_change', value: { muted: Player.muted, volume: Player.volume } }, '*');
        }
    });

    //Прослушивание запросов с PrentWindow
    window.addEventListener('message', function (event) {
        //Проверяем что сообщение пришло от родительского окна
        if (event.source === this.parent) {
            let key = event.data.key;
            if (key && key == "kodik_player_api") {
                let value = event.data.value;
                //Присутствует ключ, можем выполнять дествия
                switch (value.method) {
                    case "play":
                        Player.play();
                        break;
                    case "pause":
                        Player.pause();
                        break;
                    case "seek":
                        Player.currentTime = event.data.value.seconds;
                        break;
                    case "volume":
                        Player.volume = event.data.value.volume;
                        break;
                    case "mute":
                        Player.muted = true;
                        break;
                    case "unmute":
                        Player.muted = false;
                        break;
                    case "get_time":
                        ParentWindow.postMessage({ key: 'kodik_player_time_update', value: Math.floor(VideoPlayer.currentTime) }, '*');
                        break;
                    case "set_episode":
                        //Сделать загрузку по текущему аниме но на другой эпизод
                        LoadEpisode(event.data.value.episode);
                        break;
                    default:
                        break;
                }
            }
        }
    });
}

/**
 * Отправляет сообщения ParentWindow
 */
export const SendAPI = {
    fullscreen: (val) => {
        ParentWindow.postMessage({ key: 'tunime_fullscreen', value: { full: val } }, '*')
    },

    next: () => {
        ParentWindow.postMessage({ key: 'tunime_next', value: {} }, '*');
    },

    error: (val) => {
        ParentWindow.postMessage({ key: 'tunime_error', value: val }, "*");
    },

    switch: () => {
        ParentWindow.postMessage({ key: 'tunime_switch', value: true }, "*");
    }
}