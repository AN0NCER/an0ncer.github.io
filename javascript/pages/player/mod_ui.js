/**
 * Файл:        mod_ui.js
 * Описание:    Мод управляющий визуальным видео плеера, такие как: текущий
 *              слайдер видео, запуск анимаций, Установки громкости, 
 *              Автоматическое скрытия управления плеера.
 * Библиотеки:  rxjs.js, jqery.js
 * Возвращает:  InitUI, InitUICallbacks
 */

import { Player, onBuffered$ } from "../player.js";
import { AnimButtonStatus, AnimRate, AnimSettings } from "./mod_animation.js";
import { onDuration$, onPause$, onPlay$, onTimeUpdate$, onVolumeChange$ } from "./mod_event.js";
import { CURSOR_WIDTH, onPlaybackRate2$ } from "./mod_functions.js";
import { STANDART_CONTROLS } from "./mod_settings.js";
import { Skips } from "./mod_stream.js";

/**
 * Инициализация управления визуалом плеера
 */
export function InitUI() {
    //Стандартный контролер
    if (STANDART_CONTROLS) {
        Player.setAttribute("controls", "controls");
        $('.points-event').hide();
        $('.controls-wrapper').hide();
    }
    //Включить / Отключить звук
    $('.l-controls > .volume > .icon-controls').on('click', function () {
        Player.muted = !Player.muted;
        if (Player.muted) {
            $('.volume > .icon-controls > .mute').removeClass('hide');
        } else {
            $('.volume > .icon-controls > .mute').addClass('hide');
        }
    });

    //Открытия настроек
    $('.r-controls > .btn.settings').on('click', function () {
        ClickSettings();
    });

    //Управление громкостью
    $(`.volume > .volume-slider > .slide`).on('mousedown touchstart', function (e) {
        let startX = e.clientX || e.originalEvent.touches[0].clientX;
        let slide = $(this).find('.current-slide');
        let fullWidth = $(this).width();
        slide.css({ width: `${(e.offsetX / fullWidth) * 100}%` });
        let width = slide.width();
        let event = true;
        $(window).on('mousemove.sound touchmove.sound', function (e) {
            let currentX = e.clientX || e.originalEvent.touches[0].clientX || e.originalEvent.clientX;
            let swipeDistance = currentX - startX;
            slide.width(width + swipeDistance);
            let prcnt = (slide.width() / fullWidth) * 100;
            Player.volume = prcnt / 100;
            if (width + swipeDistance <= 0) {
                return;
            }
        });
        $(window).on('mouseup.sound touchend.sound', function (e) {
            _endevent();
        });
        function _endevent() {
            if (event) {
                $(window).off('mousemove.sound touchmove.sound');
                $(window).off('mouseup.sound touchend.sound');
                event = false;
            }
        }
    });

    $('.player-skip').on('click', function () {
        Skips.Skip();
    });

    SetVolume();

    SubscribePlayerControlsEvent();
    SubscribeCurrentCursorsEvents();
}

/**
 * Инициализация общения между плеером и визуалом
 */
export function InitUICallbacks() {
    onPause$.subscribe({
        //переключение switch button на статус паузы
        next: () => {
            AnimButtonStatus.pause();
            $('.l-controls > .switch-button').addClass('status-pause');
            subCurrentCursor$.next(true);
            subControls$.next('p.pause');
        }
    });
    onPlay$.subscribe({
        //переключение switch button на статус воспроизведение
        next: () => {
            AnimButtonStatus.play();
            $('.l-controls > .switch-button').removeClass('status-pause');
            if (onSettings) {
                ClickSettings();
            }
            subControls$.next('p.play');
        }
    });
    onBuffered$.subscribe({
        next: (time) => {
            const prcnt = calculatePercentageWatched(Player.duration, time);
            $('.loaded-slid').css({ width: `${prcnt}%` })
        }
    });
    onTimeUpdate$.subscribe({
        next: () => {
            let time = secondsToTime(Player.currentTime);
            let texttime = genTextTime(time);
            $('.player-time > .current-time').text(texttime);
        }
    });
    onTimeUpdate$.subscribe({
        next: () => {
            const prcnt = calculatePercentageWatched(Player.duration, Player.currentTime);
            $('.player-slides > .current-slid').css({ width: `${prcnt}%` });
            $('.player-cursors > .current-cursor').css({ left: `calc(${prcnt}% - ${CURSOR_WIDTH / 2}px)` });
        }
    });
    onDuration$.subscribe({
        next: () => {
            let time = secondsToTime(Player.duration);
            let texttime = genTextTime(time);
            $('.player-time > .durration').text(texttime);
        }
    });
    onVolumeChange$.subscribe({
        next: () => {
            SetVolume();
        }
    });
    onPlaybackRate2$.subscribe({
        next: (israte) => {
            if (israte) {
                AnimRate.show();
            } else {
                AnimRate.hide();
            }
        }
    })
}

export function ResetUI() {
    $('.player-slides > .current-slid').css({ width: '' });
    $('.player-cursors > .current-cursor').css({ left: '' });
    AnimButtonStatus.pause();
}

/**
 * Установка громкости плеера
 */
function SetVolume() {
    let prcnt = Player.volume * 100;
    $(`.volume > .volume-slider > .slide > .current-slide`).css({
        width: `${prcnt}%`
    })
}

/**
 * Показать / Скрыть настройки
 */
function ClickSettings() {
    if (onSettings) {
        AnimSettings.hide();
        onSettings = false;
        onSettings$.next(false);
    } else {
        AnimSettings.show();
        onSettings = true;
        onSettings$.next(true);
    }
}

const subControls$ = new rxjs.Subject().pipe();
const onSettings$ = new rxjs.Subject().pipe(
    rxjs.distinctUntilChanged()
);

onSettings$.subscribe({
    next: (opened) => {
        if (opened) {
            Player.pause();
        }
    }
})

let inWindow = false;
let inControls = false;
let inCursor = false;
let onSettings = false;

/**
 * События контроллера плеера
 */
function SubscribePlayerControlsEvent() {
    const controls = $('.player-controls');
    controls.on('mouseenter', function () {
        inControls = true;
        subControls$.next('c.mouseenter');
        subCurrentCursor$.next(true);
    });
    controls.on('mousemove', function () {
        subCurrentCursor$.next(true);
    });
    controls.on('mouseleave', function () {
        inControls = false;
        subControls$.next('c.mouseleave');
    })
    $('#player-wrapper').on('mouseleave', function () {
        inWindow = false;
        subControls$.next('w.mouseleave');
    });
    $('#player-wrapper').on('mouseenter', function () {
        inWindow = true;
        subControls$.next('w.mouseenter');
    });
    $('#player-wrapper').on('mousemove', function () {
        inWindow = true;
        subControls$.next('w.mousemove');
    });
}

//Здесь фильтруються сигналы для скрытия контроллера
subControls$.subscribe({
    next: (targets) => {
        if (Player.paused) {
            $('.player-wrapper').removeClass('hide');
            $('.controls-wrapper').removeClass('hide');
            clearTimeout(timerHideControls);
            return;
        }
        if (onSettings || inCursor || inControls) {
            clearTimeout(timerHideControls);
            return;
        }
        if (inWindow) {
            HideControls();
        } else {
            HideControls(2000);
            return;
        }
    }
});

//Таймер бездействия сокрытия панель управлением
let timerHideControls;

//Скрытие панель управлением
function HideControls(time = 5000) {
    $('.player-wrapper').removeClass('hide');
    $('.controls-wrapper').removeClass('hide');
    clearTimeout(timerHideControls);
    timerHideControls = setTimeout(() => {
        if (onSettings || Player.paused || inCursor || inControls) {
            return;
        }
        $('.controls-wrapper').addClass('hide');
        $('.player-wrapper').addClass('hide');
    }, time);
}

const subCurrentCursor$ = new rxjs.Subject();

function SubscribeCurrentCursorsEvents() {
    $('.player-cursors > .current-cursor').on('touchstart mouseenter', function () {
        inCursor = true;
        clearTimeout(timerHideCurrentCursors);
        clearTimeout(timerHideControls);

        clearTimeout(timerHideCurrentCursors);
        $('.player-cursors > .trim-cursor').addClass('hide');
    });
    $('.player-cursors > .current-cursor').on('touchend mouseleave', function () {
        inCursor = false;
        subCurrentCursor$.next(true);
        subControls$.next('cl.mouseleave');
    })
}

subCurrentCursor$.subscribe({
    next: () => {
        HideCurerentCursor();
    }
});

//Таймер бездействия курсора
let timerHideCurrentCursors;

//Скрытие курсора по бездействию
function HideCurerentCursor() {
    $('.player-cursors > .current-cursor').removeClass('hide');
    clearTimeout(timerHideCurrentCursors);
    timerHideCurrentCursors = setTimeout(() => {
        $('.player-cursors > .current-cursor').addClass('hide');
    }, 3000);
}


export function calculatePercentageWatched(videoDuration, currentTime) {
    if (currentTime > videoDuration) {
        currentTime = videoDuration;
    }

    const percentageWatched = (currentTime / videoDuration) * 100;
    return percentageWatched;
}

function secondsToTime(seconds) {
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

function genTextTime(time = { hours: 0, minutes: 0, seconds: 0 }) {
    let text = `${time.minutes}:${time.seconds}`;
    if (time.hours != 0) {
        text = `${time.hours}:${text}`;
    }
    return text;
}