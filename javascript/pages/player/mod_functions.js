/**
 * Файл:        mod_functions.js
 * Описание:    Мод управляющий плеером - функциями от пользователя, такие как:
 *              Пауза/Воспроизведение, Режим PIP, Режим полного экрана. А также
 *              управляет жестами пользователся по 3 областям.
 * Библиотеки:  rxjs.js, jqery.js
 * Возвращает:  InitFunctions, CURSOR_WIDTH, onPlaybackRate2$
 */
import { Player, hls, toggleFullScreen } from "../player.js";
import { AnimSkip } from "./mod_animation.js";
import { SendAPI } from "./mod_api.js";
import { onEnded$, onTimeUpdate$ } from "./mod_event.js";
import { ALTERNATIVE_FULLSCREEN } from "./mod_settings.js";
import { InitShortcuts } from "./mod_shortcuts.js";
import { Skips } from "./mod_stream.js";

//Настоящий размер курсора
export const CURSOR_WIDTH = 33;

//Вызов при воспроизведении x2
export const onPlaybackRate2$ = new rxjs.Subject();

let api_nexte_called = false;

/**
 * Инициализация функций плеера
 */
export function InitFunctions() {
    //Воспроизведение / Пауза плеера
    $('.l-controls > .switch-button').on('click', function () {
        if ($(this).hasClass('status-pause')) {
            Player.play();
        } else {
            Player.pause();
        }
    });

    //Включить / Выключтить режим pip
    $('.r-controls > .btn.pip').on('click', function () {
        togglePictureInPicture();
    });

    //Для альтернативного FullScreen
    let fullscreen = false;
    //Включить / Отсключить на весь экран
    $('.r-controls > .btn.fs').on('click', function () {
        if (ALTERNATIVE_FULLSCREEN) {
            fullscreen = !fullscreen;
            SendAPI.fullscreen(fullscreen);
        } else {
            toggleFullScreen();
        }
    });

    //Событие жестов (Центр) Воспроизведение / Пауза плеера
    $('.points-event > .center-event').on('click', function () {
        if (Player.paused) {
            Player.play();
        } else {
            Player.pause();
        }
    });

    let isDoubleClick = false;
    let timeOutDoubleClick;
    let isPressAndHold = false;
    let holdTimeout;

    //Событие жестов (Право) Перемотка вперед на 10 секунда
    $('.points-event > .right-event').on('dblclick', function () {
        Player.currentTime += 10;
        isDoubleClick = true;
        clearTimeout(timeOutDoubleClick);
        timeOutDoubleClick = setTimeout(function () {
            isDoubleClick = false;
        }, 500);
    });

    //Событие жестов (Право) Перемотка вперед на 10 секунда с условием
    $('.points-event > .right-event').on('click', function () {
        if (isDoubleClick == true) {
            Player.currentTime += 10;
            clearTimeout(timeOutDoubleClick);
            timeOutDoubleClick = setTimeout(function () {
                isDoubleClick = false;
            }, 500);
        }
    });

    //Событие жестов (Право) Ускорение видео на 2
    $('.points-event > .right-event').on('mousedown touchstart', function () {
        isPressAndHold = true;
        holdTimeout = setTimeout(function () {
            if (isPressAndHold) {
                Player.playbackRate = 2;
                onPlaybackRate2$.next(true);
            }
        }, 1000); // 1000 миллисекунд = 1 секунда
    });

    //Событие жестов (Право) Ускорение видео на 1
    $('.points-event > .right-event').on('mouseup touchend', function () {
        clearTimeout(holdTimeout);
        isPressAndHold = false;
        Player.playbackRate = 1;
        onPlaybackRate2$.next(false);
    });

    //Событие жестов (Лево) Перемотка назад на 10 секунда
    $('.points-event > .left-event').on('dblclick', function () {
        Player.currentTime -= 10;
        isDoubleClick = true;
        clearTimeout(timeOutDoubleClick);
        timeOutDoubleClick = setTimeout(function () {
            isDoubleClick = false;
        }, 500);
    });
    //Событие жестов (Лево) Перемотка назад на 10 секунда с условием
    $('.points-event > .left-event').on('click', function () {
        if (isDoubleClick == true) {
            Player.currentTime -= 10;
            clearTimeout(timeOutDoubleClick);
            timeOutDoubleClick = setTimeout(function () {
                isDoubleClick = false;
            }, 500);
        }
    });

    onTimeUpdate$.subscribe({
        next: () => {
            if (Skips.list.length <= 0) {
                return;
            }

            const index = Skips.list.findIndex(x => { 
                return (x.start <= Player.currentTime && Player.currentTime <= x.end) 
            });

            if (index > -1 && Skips.index != index) {
                AnimSkip.show(index);
            } else if (index == -1 && Skips.index > -1) {
                AnimSkip.hide();
            }
        }
    });

    onEnded$.subscribe({
        next: () => {
            SendAPI.next();
        }
    });

    CurrentPointScroll();
    InitShortcuts();
}

export function ResetFunctions() {
    api_nexte_called = false;
}

/**
 * Управление currentTime скролл
 */
function CurrentPointScroll() {
    const slid = $('.player-slides > .current-slid');
    const cursor = $('.player-cursors > .current-cursor');

    cursor.on('mousedown touchstart', function (e) {
        //Проверяем что видео прогрузилось и готово
        if (Player.duration == 0) return;
        //Координаты нажатия на cursor
        let startX = e.clientX || e.originalEvent.touches[0].clientX;
        let played = false;
        //Останавливаем плеер если вопсроизводиться
        if (!Player.paused) {
            Player.pause();
            played = true; //Запоминаем что плеер воспроизводился раньше
        }

        //Текущая длина slid
        let curWidth = slid.width();
        //Смещение курсораs
        let cursorLeft = cursor.position().left;
        let event = true;

        $(window).on('mousemove.ev touchmove.ev', function (e) {
            //Координаты смещения
            let currentX = e.clientX || e.originalEvent.touches[0].clientX || e.originalEvent.clientX;
            let swipeDistance = currentX - startX;
            if (curWidth + swipeDistance <= 0) {
                return;
            }
            cursor.css('left', cursorLeft + swipeDistance);
            slid.width(curWidth + swipeDistance);
            e.preventDefault();
        });

        $(window).on('mouseup.ev touchend.ev', function (e) {
            _endevent();
        });

        function _endevent() {
            if (event) {
                $(window).off('mousemove.ev touchmove.ev');
                $(window).off('mouseup.ev touchend.ev');
                event = false;
                let prcnt = (slid.width() / window.innerWidth) * 100;
                let currentTime = (prcnt / 100) * Player.duration;
                Player.currentTime = currentTime;
                slid.css({ width: `${prcnt}%` });
                cursor.css({ left: `calc(${prcnt}% - ${CURSOR_WIDTH / 2}px)` });
                hls.startLoad();
                if (played) Player.play();
            }
        }
    });
}

/**
 * Переключение режима PIP
 */
function togglePictureInPicture() {
    if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
        Player.requestPictureInPicture();
    }
}