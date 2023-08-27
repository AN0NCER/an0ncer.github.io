const mainVideo = document.getElementById('main-player'),
    shiki_id = new URLSearchParams(window.location.search).get("id"),
    episode = new URLSearchParams(window.location.search).get("e"),
    parentWindow = window.parent;

const quality = $PARAMETERS.player.quality;

let loaded = false;

let first = true;

mainVideo.addEventListener("pause", () => {
    parentWindow.postMessage({ key: 'kodik_player_pause' }, '*');
});

mainVideo.addEventListener("play", () => {
    parentWindow.postMessage({ key: 'kodik_player_play' }, '*');
    if (first) {
        if ($PARAMETERS.player.full) {
            // Check if the user agent includes "iPhone" or "iPad"
            const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (isiOS) {
                anime({
                    targets: '.fullscreen-wrapper .fk-cube',
                    easing: "spring(1, 80, 10, 0)",
                    duration: 1000,
                    opacity: [0, 0.5, 0, 0.5, 0],
                    complete: () => {
                        $(`.fullscreen-wrapper`).css({ display: 'none' });

                        if (mainVideo.webkitEnterFullscreen) {
                            mainVideo.webkitEnterFullscreen();
                        } else if (mainVideo.requestFullscreen) {
                            mainVideo.requestFullscreen();
                        }
                        anime({
                            targets: '.controls',
                            easing: 'easeInBack',
                            translateY: [40, 0],
                            duration: 500
                        });
                    }
                });
            } else {
                $(`.fullscreen-wrapper`).css({ display: 'none' });
                anime({
                    targets: '.controls',
                    easing: 'easeInBack',
                    translateY: [40, 0],
                    duration: 500
                });
            }

        } else {
            $(`.fullscreen-wrapper`).css({ display: 'none' });
            anime({
                targets: '.controls',
                easing: 'easeInBack',
                translateY: [40, 0],
                duration: 500
            });
        }

        first = false;
    }
});

mainVideo.addEventListener("timeupdate", () => {
    parentWindow.postMessage({ key: 'kodik_player_time_update', value: Math.floor(mainVideo.currentTime) }, '*');
    var minutes = Math.floor(mainVideo.currentTime / 60);
    var seconds = Math.floor(mainVideo.currentTime - minutes * 60)
    var x = minutes < 10 ? "0" + minutes : minutes;
    var y = seconds < 10 ? "0" + seconds : seconds;
    $('.current-time').text(`${x}:${y}`);
});

mainVideo.addEventListener("durationchange", () => {
    parentWindow.postMessage({ key: 'kodik_player_duration_update', value: mainVideo.duration }, '*');
    var minutes = Math.floor(mainVideo.duration / 60);
    var seconds = Math.floor(mainVideo.duration - minutes * 60)
    var x = minutes < 10 ? "0" + minutes : minutes;
    var y = seconds < 10 ? "0" + seconds : seconds;
    $('.video-duration').text(`${x}:${y}`);
});

mainVideo.addEventListener("ended", () => {
    parentWindow.postMessage({ key: 'kodik_player_video_ended' }, '*');
});

mainVideo.addEventListener('volumechange', () => {
    parentWindow.postMessage({ key: 'kodik_player_volume_change', value: { muted: mainVideo.muted, volume: mainVideo.volume } }, '*');
});

// Внутри фрейма, добавляем обработчик события message
window.addEventListener('message', function (event) {
    // Проверяем, что сообщение пришло от родительского окна
    if (event.source === parent) {
        // event.data содержит данные, переданные из родительского окна
        console.log('Received message from parent window:', event.data);
        // Далее можно выполнять нужные действия на основе полученных данных
        if (event.data.key == "kodik_player_api") {
            if (event.data.value.method == "play") {
                mainVideo.play();
                return;
            }
            if (event.data.value.method == "pause") {
                mainVideo.pause();
                return;
            }
            if (event.data.value.method == "seek") {
                mainVideo.currentTime = event.data.value.seconds;
                return;
            }
            if (event.data.value.method == "volume") {
                mainVideo.volume = event.data.value.volume;
                return;
            }

            if (event.data.value.method == "mute") {
                mainVideo.muted = true;
                return;
            }

            if (event.data.value.method == "unmute") {
                mainVideo.muted = false;
                return;
            }

            if (event.data.value.method == "get_time") {
                parentWindow.postMessage({ key: 'kodik_player_time_update', value: Math.floor(mainVideo.currentTime) }, '*');
                return;
            }
        }
    }
});

if ($PARAMETERS.player.info) {
    $('.info-panel').removeClass('hide');
}

$('.btn-fullscreen').click(function () {
    if (mainVideo.webkitEnterFullscreen) {
        mainVideo.webkitEnterFullscreen();
    } else if (mainVideo.requestFullscreen) {
        mainVideo.requestFullscreen();
    }
});

$('.btn-control-play').click(function () {
    if (mainVideo.paused) {
        mainVideo.play();
    } else {
        mainVideo.pause();
    }
});

kodikApi.search({ id: shiki_id }, async (res) => {
    $('.name').text(res.results[0].title);
    $('.type').text(res.results[0].translation.title)


    fetch("https://anime-m3u8.onrender.com/link-anime", { body: new URLSearchParams({ 'link': 'https:' + res.results[0].link + `?episode=${episode}` }), method: 'post' })
        .then(function (response) { return response.json(); })
        .then(async function (data) {
            const url = data[quality][0].src.indexOf("http") != -1 ? data[quality][0].src : "https:" + data[quality][0].src;
            mainVideo.setAttribute('src', url);

            loadFirstSuccessfulImage(data.thumbinals)
                .then((successfulImage) => {
                    if (successfulImage !== null) {
                        loaded = true;
                        mainVideo.setAttribute('poster', successfulImage);
                    } else {
                        console.log("No successful image found.");
                    }
                })
                .catch((error) => {
                    console.log("Error:", error);
                });
        });
});

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

var tm = anime
    .timeline({
        loop: true,
        delay: 0,
        easing: "linear",
        duration: 300,
        loopComplete: () => {
            if (!loaded) return;
            tm.pause();
            anime
                .timeline({
                    easing: "linear",
                    duration: 200,
                    delay: 0
                })
                .add({
                    targets: ".sk-folding-cube",
                    rotateZ: ["45deg", "0deg"],
                    complete: () => {
                        parentWindow.postMessage({ key: 'tunime_player_loaded', value: { loaded: true } }, '*');
                        anime({
                            easing: "spring(1, 80, 10, 0)",
                            targets: ".btn-play",
                            opacity: 1,
                            scale: [0.5, 1],
                            complete: () => {
                                $('.btn-play').click(() => {
                                    anime({
                                        targets: '.btn-play',
                                        scale: 0,
                                        duration: 300,
                                        easing: 'easeInBack',
                                        complete: () => {
                                            mainVideo.play();
                                            $('.wrapper').css({ display: 'none' });
                                        }
                                    });
                                    anime({
                                        targets: ".spinner-wrapper",
                                        background: "rgba(16, 19, 24, 0)",
                                        duration: 300,
                                        complete: () => {
                                            $('.spinner-wrapper').css({ display: 'none' });
                                        }
                                    })
                                    // mainVideo.paused ? mainVideo.play() : mainVideo.pause();
                                });
                            }
                        });
                        anime({
                            targets: ".sk-folding-cube",
                            easing: "spring(1, 80, 10, 0)",
                            opacity: 0,
                            scale: [1, 0.5]
                        });
                    }
                });
            anime({
                targets: ".spinner-wrapper",
                background: "rgba(16, 19, 24, 0.20)"
            });
        }
    })
    .add({
        targets: ".sk-cube1",
        rotateY: "90deg",
        opacity: 0,
        delay: 300
    })
    .add({
        targets: ".sk-cube2",
        rotateX: "90deg",
        transformOrigin: ["100% 100%", "100% 100%"],
        opacity: 0
    })
    .add({
        targets: ".sk-cube3",
        rotateY: "90deg",
        opacity: 0
    })
    .add({
        targets: ".sk-cube4",
        rotateX: "90deg",
        transformOrigin: ["0% 0%", "0% 0%"],
        opacity: 0
    })
    .add({
        targets: ".sk-cube1",
        rotateX: ["90deg", "0deg"],
        rotateY: ["0deg", "0deg"],
        opacity: 1
    })
    .add({
        targets: ".sk-cube2",
        rotateY: ["90deg", "0deg"],
        transformOrigin: ["0% 0%", "0% 0%"],
        rotateX: ["0deg", "0deg"],
        opacity: 1
    })
    .add({
        targets: ".sk-cube3",
        rotateX: ["90deg", "0deg"],
        rotateY: ["0deg", "0deg"],
        opacity: 1
    })
    .add({
        targets: ".sk-cube4",
        rotateY: ["90deg", "0deg"],
        rotateX: ["0deg", "0deg"],
        transformOrigin: ["100% 100%", "100% 100%"],
        opacity: 1
    });