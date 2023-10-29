import { VideoPlayer, toggleFullScreen } from "../tunimeplayer.js";
import { ButtonPlay } from "./mod_animation.js";

export function InitUserControls() {
    if (!$PARAMETERS.player.autonekst) {
        $('.end-slider').hide();
    }

    if ($PARAMETERS.player.standart_controls) {
        $('.player-controls').hide();
        $('.sliders').hide();
        VideoPlayer.setAttribute("controls", "controls");
    }

    //Пауза воспроизведение кнопка
    $('.control-button.btn-play-pause').on('click', function (e) {
        if (VideoPlayer.paused) {
            PlayerFunctions.Play();
        } else {
            PlayerFunctions.Pause();
        }
    });

    $('.btn-play').on('click', () => {
        PlayerFunctions.Play();
    });

    $('.btn-fullscreen').on('click', toggleFullScreen);

    $('.btn-pip').on('click', togglePictureInPicture);

    PanelEvents();
    CurrentPointer();
    EndPointer();
}

//Скроллеры события
function PanelEvents() {
    let target = $('.player-controls');

    //Таймер скрытия  поинтов при наведение на панель контрола
    let timeOut;

    target.on('click mouseenter', function (e) {
        if (!PlayerControls.launched) return;
        $('.sliders').addClass('mouseenter');
        clearTimeout(timeOut);
        timeOut = setTimeout(() => {
            $('.sliders').removeClass('mouseenter');
        }, 3000);
    });

    target.on('mouseleave touchleave', function () {
        if (!PlayerControls.launched) return;
        timeOut = setTimeout(() => {
            $('.sliders').removeClass('mouseenter');
        }, 3000);
    })
}

//Конец времени поинт
function EndPointer() {
    let target = $('.end-slider > .content > .pointer');

    //Таймер скрытия поинта при нажатия
    let timeOutEnter;

    target.on('mousedown touchstart', function (e) {
        $('.player-controls').mouseleave();
        $(e.currentTarget).addClass('mouseenter');
        clearTimeout(timeOutEnter);
    });

    target.on('mouseup touchend', function (e) {
        timeOutEnter = setTimeout(() => {
            $(e.currentTarget).removeClass('mouseenter');
        }, 1500);
    });

    target.on('mousedown touchstart', function (e) {
        if (!PlayerControls.launched || !PlayerControls.duration) return;
        //Координаты нажатия на Pointer
        let startX = e.clientX || e.originalEvent.touches[0].clientX;
        //Текущая длина слайдера
        let curWidth = $('.end-slider').width();
        let event = true;

        target.on('mousemove.endpoint touchmove.endpoint', function (e) {
            //Координаты смещение
            let currentX = e.clientX || e.originalEvent.touches[0].clientX || e.originalEvent.clientX;
            let swipeDistance = currentX - startX;
            if ((window.innerWidth - $('.cur-slider').width()) <= curWidth + -swipeDistance) {
                target.mouseup();
                _endScroll();
                return;
            }
            $('.end-slider').width(curWidth + -swipeDistance);
            e.preventDefault();
        });

        target.on('mouseup.endpoint touchend.endpoint', function (e) {
            _endScroll();
        })

        function _endScroll() {
            if (event) {
                target.off('mousemove.endpoint touchmove.endpoint');
                target.off('mouseup.endpoint touchend.endpoint');
                event = false;
                let prcnt = ($('.end-slider').width() / window.innerWidth) * 100;
                PlayerControls.endtime = PlayerControls.duration - (prcnt / 100) * PlayerControls.duration;
            }
        }
    });
}

//Текущего времени поинт
function CurrentPointer() {
    let target = $('.cur-slider > .content > .pointer');

    //Таймер скрытия поинта при нажатия
    let timeOutEnter;

    target.on('mousedown touchstart', function (e) {
        $('.player-controls').mouseleave();
        $(e.currentTarget).addClass('mouseenter');
        clearTimeout(timeOutEnter);
    });

    target.on('mouseup touchend', function (e) {
        timeOutEnter = setTimeout(() => {
            $(e.currentTarget).removeClass('mouseenter');
        }, 1500);
    });

    target.on('mousedown touchstart', function (e) {
        if (!PlayerControls.launched || !PlayerControls.duration) return;
        //Координаты нажатия на Pointer
        let startX = e.clientX || e.originalEvent.touches[0].clientX;
        let videoPaused = VideoPlayer.paused;
        if (!videoPaused) PlayerFunctions.Pause();
        //Текущая длина слайдера
        let curWidth = $('.cur-slider').width();
        let event = true;

        target.on('mousemove.crpoint touchmove.crpoint', function (e) {
            //Координаты смещение
            let currentX = e.clientX || e.originalEvent.touches[0].clientX || e.originalEvent.clientX;
            let swipeDistance = currentX - startX;
            $('.cur-slider').width(curWidth + swipeDistance);
            e.preventDefault();
        });

        target.on('mouseup.crpoint touchend.crpoint', function (e) {
            _endScroll();
        })

        function _endScroll() {
            if (event) {
                target.off('mousemove.crpoint touchmove.crpoint');
                target.off('mouseup.crpoint touchend.crpoint');
                event = false;
                let prcnt = ($('.cur-slider').width() / window.innerWidth) * 100;
                PlayerFunctions.setCurrentTime((prcnt / 100) * PlayerControls.duration);
                if (!videoPaused) PlayerFunctions.Play();
            }
        }
    });

}

export const PlayerControls = {
    duration: undefined, //Продолжительность видео
    launched: false, //Запущен плеер
    endtime: undefined,

    scrolls: {
        current: {
            setVal: (time) => {
                $('.cur-slider').css({ width: `${calculatePercentageWatched(PlayerControls.duration, time)}%` });
            }
        }
    },

    playerPlay: function () {
        if (!this.launched) {
            this.launched = true;
            $('.player-controls').click();
            ButtonPlay.play();
            if ($PARAMETERS.player.full) {
                toggleFullScreen();
            }
        }
    },

    setCurrentTime: function (time = { hours: 0, minutes: 0, seconds: 0 }, currentTime) {
        $('.current-timve').text(this.genTextTime(time));
        this.scrolls.current.setVal(currentTime);
        if ($PARAMETERS.player.autonekst && this.endtime) {
            if (currentTime >= this.endtime) {
                PlayerFunctions.Pause();
            }
        }
    },
    setDurationTime: function (durationTime, time = { hours: 0, minutes: 0, seconds: 0 }) {
        $(`.full-time`).text(this.genTextTime(time));
        this.duration = durationTime;
        this.launched = false;
    },
    genTextTime: (time = { hours: 0, minutes: 0, seconds: 0 }) => {
        let text = `${time.minutes}:${time.seconds}`;
        if (time.hours != 0) {
            text = `${time.hours}:${text}`;
        }
        return text;
    }
}

const PlayerFunctions = {
    /**
     * Воспроизведение
     */
    Play: () => {
        VideoPlayer.play();
    },
    /**
     * Пауза
     */
    Pause: () => {
        VideoPlayer.pause();
    },

    /**
     * Установитть текущее время воспроизведения
     * @param {Number} seconds - секунды
     */
    setCurrentTime: (seconds) => {
        VideoPlayer.currentTime = seconds;
    }
}

function togglePictureInPicture() {
    if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
        VideoPlayer.requestPictureInPicture();
    }
}

function calculatePercentageWatched(videoDuration, currentTime) {
    if (videoDuration <= 0 || currentTime < 0) {
        return "Неверные значения времени";
    }

    if (currentTime > videoDuration) {
        currentTime = videoDuration;
    }

    const percentageWatched = (currentTime / videoDuration) * 100;
    return percentageWatched;
}
