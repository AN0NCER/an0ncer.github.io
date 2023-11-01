import { ApiTunime } from "../modules/TunimeApi.js";
import { LoadAnimation } from "./tunimeplayer/mod_animation.js";
import { InitUserControls, Restart } from "./tunimeplayer/mod_controls.js";
import { InitVideoEvets, RegWindowEvents } from "./tunimeplayer/mod_events.js";

export const VideoPlayer = document.getElementById('main-player'); //Видео Плеер <video />
export const ParentWindow = window.parent; // Данные с iframe

export const Datas = { id: new URLSearchParams(window.location.search).get("id"), episode: new URLSearchParams(window.location.search).get("e") };

let _hls;
let data_anime;

//Функция на весь экран
export const toggleFullScreen = async () => {
    const container = document.getElementById('player-wrapper');
    const fullscreenApi = container.requestFullscreen
        || container.webkitRequestFullScreen
        || container.mozRequestFullScreen
        || container.msRequestFullscreen;

    if (fullscreenApi == undefined) {
        if (VideoPlayer.webkitEnterFullscreen) {
            VideoPlayer.webkitEnterFullscreen();
        } else if (VideoPlayer.requestFullscreen) {
            VideoPlayer.requestFullscreen();
        }
    }
    if (!document.fullscreenElement) {
        fullscreenApi.call(container);
    }
    else {
        document.exitFullscreen();
    }
};

(async () => {
    //Запускаем анимацию загрузки аниме
    LoadAnimation.start();

    //Проверяем на данные
    if (!Datas.id || !Datas.episode) return;

    RegWindowEvents();
    InitVideoEvets();
    InitUserControls();

    if (ParentWindow.location.pathname == "/watch.html" && ParentWindow.location.hostname == window.location.hostname) {
        LoadAnimeByID(Datas.id, Datas.episode);
    } else {
        LoadTestPlayer();
    }
})();

function LoadAnimeByID(id, e) {
    LoadAnimation.start();
    kodikApi.search({ id: id }, async (res) => {
        data_anime = res.results[0];
        let link = data_anime.link + `?episode=${e}`;
        if (!link.includes("http")) {
            link = `https:${link}`;
        }

        $(document).prop('title', data_anime.title);

        try {
            //Получаем данные от Tunime сервера
            const stream = await ApiTunime.stream(link);
            //Качество подгружаемого видео из параметров
            const quality = $PARAMETERS.player.quality;

            //Ссылка на m3u8 файл
            let url = stream[quality][0].src;
            if (!url.includes("http")) {
                url = `https:${url}`;
            }

            //Тип загрузки данных
            StartPlayer(url);

            LoadAnimation.loaded = true;

            loadFirstSuccessfulImage(stream.thumbinals)
                .then((successfulImage) => {
                    if (successfulImage !== null) {
                        VideoPlayer.setAttribute('poster', successfulImage);
                    } else {
                        VideoPlayer.setAttribute('poster', "/images/preview-image.png");
                    }
                });

        } catch (err) {
            ParentWindow.postMessage({ key: 'tunime_error', value: err }, "*");
        }
    });
}

export async function LoadAnimeByEpisode(e) {
    if (!Datas.id || !e || !data_anime) return;
    let link = data_anime.link + `?episode=${e}`;
    if (!link.includes("http")) {
        link = `https:${link}`;
    }

    try {
        //Получаем данные от Tunime сервера
        const stream = await ApiTunime.stream(link);
        //Качество подгружаемого видео из параметров
        const quality = $PARAMETERS.player.quality;

        //Ссылка на m3u8 файл
        let url = stream[quality][0].src;
        if (!url.includes("http")) {
            url = `https:${url}`;
        }

        StartPlayer(url);

        Restart();

        loadFirstSuccessfulImage(stream.thumbinals)
            .then((successfulImage) => {
                if (successfulImage !== null) {
                    VideoPlayer.setAttribute('poster', successfulImage);
                } else {
                    VideoPlayer.setAttribute('poster', "/images/preview-image.png");
                }
            });
    } catch (err) {
        ParentWindow.postMessage({ key: 'tunime_error', value: err }, "*");
    }
}

function LoadTestPlayer() {
    StartPlayer("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
    LoadAnimation.loaded = true;
}

function StartPlayer(link) {
    //Тип загрузки данных
    if (Hls.isSupported()) {
        if (!_hls)
            _hls = new Hls();
        _hls.loadSource(link);
        _hls.attachMedia(VideoPlayer);
        OnErrors(_hls);
    } else {
        VideoPlayer.src = link;
    }
}

function OnErrors(hls) {
    hls.on(Hls.Events.ERROR, (e, data) => {
        if (data.fatal) {
            ParentWindow.postMessage({ key: 'tunime_error', value: data.details }, "*");
        }
    });
}

function LoadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            resolve(url);
        };
        image.onerror = (e) => {
            console.log("Error loading image:", e);
            resolve(null); // Resolve with null in case of error
        };
        image.src = url;
    });
}

async function loadFirstSuccessfulImage(urls) {
    for (let url of urls) {
        url = url.indexOf("http") != -1 ? url : "https:" + url;
        const result = await LoadImage(url);
        if (result !== null) {
            return result; // Return the first successful image
        }
    }
    return null; // Return null if no successful image found
}