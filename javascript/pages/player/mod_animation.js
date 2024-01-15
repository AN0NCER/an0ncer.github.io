/**
 * Файл:        mod_animation.js
 * Описание:    Мод добавляющий анимацию загрузки плеера при запросе на сервер 
 *              Tunime, также первое воспроизведение нового медио, и анимации
 *              кнопок воспроизведения / пауза
 * Библиотеки:  anime.js, jqery.js
 * Возвращает:  AnimLoadPlayer, AnimationPlay, AnimButtonStatus, AnimSettings, 
 *              AnimRate, AnimSkip
 */

import { Skips } from "./mod_stream.js";

//Отвечает за анимацию загрузки плеера
export const AnimLoadPlayer = {
    load: false,
    start: function () {
        this.load = false;
        _amLoad();
    },
    stop: function () {
        this.load = true;
    }
};

//Отвечает за анимацию состояния плеера Play / Pause
export const AnimButtonStatus = {
    play: () => _amBPlay(),
    pause: () => _amBPause()
};

//Отвечает за анимацию настроик
export const AnimSettings = {
    show: () => _amSShow(),
    hide: () => _amSHide()
}

//Отвечает за анимацию скорости воспроизведение
export const AnimRate = {
    show: () => _amRShow(),
    hide: () => _amRhide()
}

//Отвечает за анимацию кнопки пропуска
export const AnimSkip = {
    show: (index) => _amSkShow(index),
    hide: () => _amSkHide()
}

//Html анимцации загрузки 
const LOAD_PLAYER_HTML = `<div class="spinner-wrapper"><div class="spinner"><div class="sk-folding-cube"><div class="sk-cube1 sk-cube"></div><div class="sk-cube2 sk-cube"></div><div class="sk-cube4 sk-cube"></div><div class="sk-cube3 sk-cube"></div></div></div></div>`;

/**
 * Анимация загрузки плеера
 */
function _amLoad() {
    if ($('.spinner-wrapper').length == 0)
        $('body').append(LOAD_PLAYER_HTML);

    const tl = anime
        .timeline({
            loop: true,
            delay: 0,
            easing: "linear",
            opacity: 1,
            duration: 300,
            loopComplete: () => {
                if (!AnimLoadPlayer.load) return;
                tl.pause();
                _amLoadEnd();
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
}

/**
 * Завершение анимации загрузки плеера
 */
function _amLoadEnd() {
    anime.timeline({
        easing: "linear",
        duration: 200,
        delay: 0
    }).add({
        targets: ".sk-folding-cube",
        rotateZ: ["45deg", "0deg"],
        complete: () => {
            $('.spinner-wrapper').css({ 'pointer-events': 'none' })
            anime({
                easing: "spring(1, 80, 10, 0)",
                targets: ".btn-play",
                opacity: 1,
                scale: [0.5, 1]
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
        background: "rgba(16, 19, 24, 0)",
        complete: () => {
            $('.spinner-wrapper').hide();
            $('.spinner-wrapper').remove();
        }
    });
}

/**
 * Анимация кнопки воспроизведения
 */
function _amBPlay() {
    anime({
        easing: "linear",
        targets: ".btn.switch-button > .play",
        opacity: 0,
        duration: 200,
        scale: [1, 0.5]
    });
    anime({
        easing: "linear",
        targets: ".btn.switch-button > .pause",
        opacity: 1,
        duration: 200,
        scale: [0.5, 1]
    });
}

/**
 * Анимация кнопки паузы
 */

function _amBPause() {
    anime({
        easing: "linear",
        targets: ".btn.switch-button > .pause",
        opacity: 0,
        duration: 200,
        scale: [1, 0.5]
    });
    anime({
        easing: "linear",
        targets: ".btn.switch-button > .play",
        opacity: 1,
        duration: 200,
        scale: [0.5, 1]
    });
}

/**
 * Анимация показа настроек
 */
function _amSShow() {
    $('.controls-wrapper > .player-settings').css({ display: 'flex' });
    anime({
        easing: "easeInQuad",
        targets: ".player-settings",
        opacity: [0, 1],
        duration: 200,
        translateY: [240, 0]
    });
}

/**
 * Анимация скрытия настроек
 */
function _amSHide() {
    anime({
        easing: "easeInQuad",
        targets: ".player-settings",
        opacity: [1, 0],
        duration: 200,
        translateY: [0, 240]
    });
}

/**
 * Анимация отображение скорости воспроизведения
 */
function _amRShow() {
    anime({
        targets: ".video-speed",
        easing: "easeInQuad",
        duration: 100,
        translateX: 110
    });
}

/**
 * Анимация скрытия скорости воспроизведения
 */
function _amRhide() {
    anime({
        targets: ".video-speed",
        easing: "easeInQuad",
        duration: 100,
        translateX: 0
    })
}

/**
 * Анимация отображение кнопки пропуска сегмента
 */
function _amSkShow(index) {
    if (!Skips.showed) {
        anime({
            targets: ".player-skip",
            easing: "easeInQuad",
            duration: 100,
            right: 10
        });
        Skips.index = index;
        Skips.showed = !Skips.showed;
    }
}

/**
 * Анимация скрытия кнопки пропуска сегмента
 */
function _amSkHide(){
    if(Skips.showed){
        anime({
            targets: ".player-skip",
            easing: "easeInQuad",
            duration: 100,
            opacity: 0,
            complete:() => {
                $('.player-skip').css({right: '', opacity: ''});
            }
        });
        Skips.index = -1;
        Skips.showed = !Skips.showed;
    }
}