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
        try {
            const data = JSON.parse(sessionStorage.getItem('shadow-api'));
            if (data?.scope.includes("player")) {
                $(`.access-data > .pin`).addClass('green');
            } else {
                $(`.access-data > .pin`).addClass('red');
            }
        } catch {
            $(`.access-data > .pin`).addClass('red');
        }
    },
    stop: async function () {
        this.load = true;
        _amLoadEnd();
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
const LOAD_PLAYER_HTML = `<div class="spinner-wrapper">
<span class="access-data">
  <span class="pin"></span>
  Доступ
</span>
<span class="player-name">
  <span class="name">Tunime</span>
  <span class="untertitle">Player</span>
   <div class="loader"></div>
</span>
</div>`;

/**
 * Анимация загрузки плеера
 */
function _amLoad() {
    if ($('.spinner-wrapper').length == 0)
        $('body').append(LOAD_PLAYER_HTML);
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
        targets: ".spinner-wrapper",
        opacity: [1, 0],
        complete: () => {
            $('.spinner-wrapper').hide();
            $('.spinner-wrapper').remove();
        },
        begin: () => {
            $('.spinner-wrapper').css({ 'pointer-events': 'none' })
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
function _amSkHide() {
    if (Skips.showed) {
        anime({
            targets: ".player-skip",
            easing: "easeInQuad",
            duration: 100,
            opacity: 0,
            complete: () => {
                $('.player-skip').css({ right: '', opacity: '' });
            }
        });
        Skips.index = -1;
        Skips.showed = !Skips.showed;
    }
}