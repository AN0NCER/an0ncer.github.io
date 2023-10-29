import { LoadAnimeByEpisode, ParentWindow, VideoPlayer } from "../tunimeplayer.js";
import { PlayAnimation } from "./mod_animation.js";
import { PlayerControls } from "./mod_controls.js";

export function RegWindowEvents() {
    VideoPlayer.addEventListener("error", (e) => {
        ParentWindow.postMessage({ key: 'tunime_error', value: e }, "*");
    });

    VideoPlayer.addEventListener("loadedmetadata", () => {
    });

    VideoPlayer.addEventListener("pause", () => {
        ParentWindow.postMessage({ key: 'kodik_player_pause' }, '*');
    });

    VideoPlayer.addEventListener("play", () => {
        ParentWindow.postMessage({ key: 'kodik_player_play' }, '*');
    });

    VideoPlayer.addEventListener("timeupdate", () => {
        ParentWindow.postMessage({ key: 'kodik_player_time_update', value: Math.floor(VideoPlayer.currentTime) }, '*');
    });

    VideoPlayer.addEventListener("durationchange", function () {
        ParentWindow.postMessage({ key: 'kodik_player_duration_update', value: VideoPlayer.duration }, '*');
        PlayerControls.setDurationTime(VideoPlayer.duration, secondsToTime(VideoPlayer.duration));
    });

    VideoPlayer.addEventListener("ended", () => {
        ParentWindow.postMessage({ key: 'kodik_player_video_ended' }, '*');
    });

    VideoPlayer.addEventListener('volumechange', () => {
        ParentWindow.postMessage({ key: 'kodik_player_volume_change', value: { muted: VideoPlayer.muted, volume: VideoPlayer.volume } }, '*');
    });
}

export function InitVideoEvets() {
    const jqVideoPlayer = $('#main-player');
    jqVideoPlayer.on('timeupdate.tunime', function (event) {
        PlayerControls.setCurrentTime(secondsToTime(this.currentTime), this.currentTime);
    });

    jqVideoPlayer.on("durationchange.tunime", function (event) {

    });

    jqVideoPlayer.on("play.tunime", function (event) {
        PlayAnimation.play();
        PlayerControls.playerPlay();
    });

    jqVideoPlayer.on("pause.tunime", function (event) {
        PlayAnimation.pause();
    });
}

// Внутри фрейма, добавляем обработчик события message
window.addEventListener('message', function (event) {
    // Проверяем, что сообщение пришло от родительского окна
    if (event.source === parent) {
        // Далее можно выполнять нужные действия на основе полученных данных
        if (event.data.key == "kodik_player_api") {
            if (event.data.value.method == "play") {
                VideoPlayer.play();
                return;
            }
            if (event.data.value.method == "pause") {
                VideoPlayer.pause();
                return;
            }
            if (event.data.value.method == "seek") {
                VideoPlayer.currentTime = event.data.value.seconds;
                return;
            }
            if (event.data.value.method == "volume") {
                VideoPlayer.volume = event.data.value.volume;
                return;
            }

            if (event.data.value.method == "mute") {
                VideoPlayer.muted = true;
                return;
            }

            if (event.data.value.method == "unmute") {
                VideoPlayer.muted = false;
                return;
            }

            if (event.data.value.method == "get_time") {
                ParentWindow.postMessage({ key: 'kodik_player_time_update', value: Math.floor(VideoPlayer.currentTime) }, '*');
                return;
            }

            if (event.data.value.method == "set_episode") {
                LoadAnimeByEpisode(event.data.value.episode);
            }
        }
    }
});

function secondsToTime(seconds) {
    if (seconds < 0) {
        return "Время не может быть отрицательным!";
    }

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const timeObject = {
        hours: hours,
        minutes: minutes,
        seconds: remainingSeconds
    };

    return timeObject;
}