import { ParentWindow, VideoPlayer } from "../tunimeplayer.js";

export function RegEvents() {
    VideoPlayer.addEventListener("error", (e) => {
        ParentWindow.postMessage({ key: 'tunime_error', value: "Error Player" }, "*");
    });
    VideoPlayer.addEventListener("loadedmetadata", () => {
    });

    VideoPlayer.addEventListener("pause", () => {
        ParentWindow.postMessage({ key: 'kodik_player_pause' }, '*');
    });

    VideoPlayer.addEventListener("play", () => {
        ParentWindow.postMessage({ key: 'kodik_player_play' }, '*');
        _elistPlay.forEach((x) => {
            x();
        })
    });

    VideoPlayer.addEventListener("timeupdate", () => {
        ParentWindow.postMessage({ key: 'kodik_player_time_update', value: Math.floor(VideoPlayer.currentTime) }, '*');
        var minutes = Math.floor(VideoPlayer.currentTime / 60);
        var seconds = Math.floor(VideoPlayer.currentTime - minutes * 60)
        var x = minutes < 10 ? "0" + minutes : minutes;
        var y = seconds < 10 ? "0" + seconds : seconds;
        $('.current-time').text(`${x}:${y}`);
    });

    VideoPlayer.addEventListener("durationchange", () => {
        ParentWindow.postMessage({ key: 'kodik_player_duration_update', value: VideoPlayer.duration }, '*');
        var minutes = Math.floor(VideoPlayer.duration / 60);
        var seconds = Math.floor(VideoPlayer.duration - minutes * 60)
        var x = minutes < 10 ? "0" + minutes : minutes;
        var y = seconds < 10 ? "0" + seconds : seconds;
        $('.video-duration').text(`${x}:${y}`);
    });

    VideoPlayer.addEventListener("ended", () => {
        ParentWindow.postMessage({ key: 'kodik_player_video_ended' }, '*');
    });

    VideoPlayer.addEventListener('volumechange', () => {
        ParentWindow.postMessage({ key: 'kodik_player_volume_change', value: { muted: VideoPlayer.muted, volume: VideoPlayer.volume } }, '*');
    });
}


//Список с событиями
const _elistPlay = [];

export function OnPlayerPlay(e = () => { }) {
    if (typeof e == "function") {
        _elistPlay.push(e);
    }
}