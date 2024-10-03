import { InitUI, InitUICallbacks, ResetUI } from "./player/mod_ui.js";
import { InitEvent, onDuration$, onPlay$ } from "./player/mod_event.js";
import { InitFunctions, ResetFunctions } from "./player/mod_functions.js";
import { InitAPI, ParentWindow, SendAPI } from "./player/mod_api.js";
import { FULL_PLAYER, InitSettings, QUALITY } from "./player/mod_settings.js";
import { AnimLoadPlayer } from "./player/mod_animation.js";
import { LoadM3U8, LoadM3U8Episode } from "./player/mod_stream.js";
import { Sleep } from "../modules/functions.js";

/**@type {HTMLVideoElement}*/
export const Player = document.getElementById('player');
export const hls = new Hls();
export const onBuffered$ = new rxjs.Subject();

export const AnimeQuery = { id: new URLSearchParams(window.location.search).get("id"), episode: new URLSearchParams(window.location.search).get("e") };

/**
 * Переключение эпизодов
 * @param {number} e - Эпизод
 */
export async function LoadEpisode(e) {
    if (!e) return;
    AnimLoadPlayer.start();
    ResetUI();
    ResetFunctions();
    const stream_file = await LoadM3U8Episode(AnimeQuery.id, e);
    let b = onDuration$.subscribe({
        next: () => {
            Player.play();
            b.unsubscribe();
        }
    });
    LoadPlayer(stream_file);
}

/**
 * Загрузка аниме
 * @param {number} id - Индентификатор аниме
 * @param {number} e - Эпизод 
 */
async function LoadAnime(id, e) {
    const stream_file = await LoadM3U8(id, e);
    if (typeof stream_file === "undefined") {
        return SendAPI.switch();
    }
    LoadPlayer(stream_file);
}

/**
 * Загрузка экземпляра
 */
function Example() {
    let stream_file = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
    LoadPlayer(stream_file);
}

//Начло запуска
(async () => {
    //Запускаем анимацию загрузки плеера
    AnimLoadPlayer.start();
    //Проверяем на наличие query данных
    if (!AnimeQuery.id || !AnimeQuery.episode) return;

    //Инициализируем библиотеки свзяаные с плеером
    InitEvent();
    InitUI();
    InitUICallbacks();
    InitAPI();
    InitFunctions();
    InitSettings();
    InitPlayer();

    //Проверяем что плеер находится на моем сайте
    if (ParentWindow.location.pathname == "/watch.html" && ParentWindow.location.hostname == window.location.hostname) {
        LoadAnime(AnimeQuery.id, AnimeQuery.episode);
    } else {
        Example();
    }
})();

/**
 * Инициализирует плеер hls или стандартный
 */
function InitPlayer() {
    if (Hls.isSupported()) {
        console.log(`[plr] - Hls supported`)
        hls.on(Hls.Events.BUFFER_APPENDED, function (event, data) {
            var bufferedRanges = Player.buffered;

            if (bufferedRanges.length > 0) {
                var loadedTime = bufferedRanges.end(bufferedRanges.length - 1);
                onBuffered$.next(loadedTime);
            }
        });
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            //Устанавливаем максимальное разрешение с параметров
            let level = -1;
            for (let i = 0; i < hls.levels.length; i++) {
                const element = hls.levels[i];
                if (element.name == QUALITY) {
                    level = i;
                }
            }
            //Ставим максимальный разрешенный уровень прогрузки
            hls.autoLevelCapping = level;
        });
        hls.on(Hls.Events.ERROR, (e, data) => {
            if (data.fatal) {
                SendAPI.error(data.details)
            }
        });
    } else {
        console.log(`[plr] - Hls unsupported`)
        Player.addEventListener('progress', function () {
            var bufferedRanges = Player.buffered;
            if (bufferedRanges.length > 0) {
                var loadedTime = bufferedRanges.end(bufferedRanges.length - 1);
                onBuffered$.next(loadedTime);
            }
        });
    }
}

/**
 * Подключает ресур m3u8 к плееру
 * @param {string} stream_file - URL link к файлу m3u8
 */
function LoadPlayer(stream_file) {
    let s = onDuration$.subscribe({
        next: () => {
            AnimLoadPlayer.stop();
            s.unsubscribe();
        }
    });
    let f = onPlay$.subscribe({
        next: async () => {
            if (FULL_PLAYER) {
                await Sleep(700);
                toggleFullScreen();
            }
            f.unsubscribe();
        }
    });
    if (Hls.isSupported()) {
        hls.loadSource(stream_file);
        hls.attachMedia(Player);
    } else {
        Player.src = stream_file;
    }
}

/**
 * Функция включающая на весь экран плеер
 */
export const toggleFullScreen = async () => {
    const container = document.getElementById('player-wrapper');
    const fullscreenApi = container.requestFullscreen
        || container.webkitRequestFullScreen
        || container.mozRequestFullScreen
        || container.msRequestFullscreen;

    if (fullscreenApi == undefined) {
        if (Player.webkitEnterFullscreen) {
            Player.webkitEnterFullscreen();
        } else if (Player.requestFullscreen) {
            Player.requestFullscreen();
        }
    }
    if (!document.fullscreenElement) {
        fullscreenApi.call(container);
    }
    else {
        document.exitFullscreen();
    }
};