import { ApiTunime } from "../modules/TunimeApi.js";
import { SetLoaded, SiteAnimation } from "./tunimeplayer/mod_animation.js";
import { OnPlayerPlay, RegEvents } from "./tunimeplayer/mod_events.js";

export const VideoPlayer = document.getElementById('main-player'); //Видео Плеер <video />
export const ParentWindow = window.parent; // Данные с iframe

export const Datas = { id: new URLSearchParams(window.location.search).get("id"), episode: new URLSearchParams(window.location.search).get("e") };

let _hls = undefined;

(() => {
    SiteAnimation.loadData();
    if (!Datas.id || !Datas.episode) return;
    RegEvents();
    LoadData();
    $('.btn-play').on('click', function () {
        if (SiteAnimation.complete.loadedData) {
            SiteAnimation.playAnimation(PlayVideo);
        }
    });

    $('.btn-fullscreen').click(function () {
        if (VideoPlayer.webkitEnterFullscreen) {
            VideoPlayer.webkitEnterFullscreen();
        } else if (VideoPlayer.requestFullscreen) {
            VideoPlayer.requestFullscreen();
        }
    });

    $('.btn-control-play').click(function () {
        if (VideoPlayer.paused) {
            VideoPlayer.play();
        } else {
            VideoPlayer.pause();
        }
    });
})();

let first_play = false;

OnPlayerPlay(() => {
    if (!first_play) {
        if ($PARAMETERS.player.full) {
            SiteAnimation.fullScreen(() => {
                if (VideoPlayer.webkitEnterFullscreen) {
                    VideoPlayer.webkitEnterFullscreen();
                } else if (VideoPlayer.requestFullscreen) {
                    VideoPlayer.requestFullscreen();
                }
            })
        }
    }
    if ($PARAMETERS.player.standart_controls) {
        $('.controls').css({ 'display': 'none' });
        VideoPlayer.setAttribute("controls", "controls");
    }
});

function PlayVideo() {
    VideoPlayer.play();
}

// Внутри фрейма, добавляем обработчик события message
window.addEventListener('message', function (event) {
    // Проверяем, что сообщение пришло от родительского окна
    if (event.source === parent) {
        // event.data содержит данные, переданные из родительского окна
        console.log('Received message from parent window:', event.data);
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
        }
    }
});


/*
 * Загружает ресуры stream
 */
function LoadData() {
    kodikApi.search({ id: Datas.id }, async (res) => {
        const data = res.results[0];

        let link = data.link + `?episode=${Datas.episode}`;
        if (!link.includes("http")) {
            link = `https:${link}`;
        }
        try {
            //Получаем данные к Tunime api сервера
            const stream = await ApiTunime.stream(link);
            //Качество подгружаемого видео из параметров
            const quality = $PARAMETERS.player.quality;

            //Ссылка на m3u8 файл
            let url = stream[quality][0].src;
            if (!url.includes("http")) {
                url = `https:${url}`;
            }

            //Тип загрузки данных
            if (Hls.isSupported()) {
                console.log('HLS supported');
                _hls = new Hls();
                _hls.loadSource(url);
                _hls.attachMedia(VideoPlayer);
                OnErrors(_hls);
            } else {
                console.warn('HLS unsupported');
                VideoPlayer.src = url
            }

            SetLoaded();

            loadFirstSuccessfulImage(stream.thumbinals)
                .then((successfulImage) => {
                    if (successfulImage !== null) {
                        VideoPlayer.setAttribute('poster', successfulImage);
                    }
                })

        } catch (err) {
            console.log(err);
        }
    });
}

function OnErrors(hls) {
    hls.on(Hls.Events.ERROR, (e, data) => {
        if (data.fatal) {
            ParentWindow.postMessage({ key: 'tunime_error', value: data.details }, "*");
        }
    })
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
