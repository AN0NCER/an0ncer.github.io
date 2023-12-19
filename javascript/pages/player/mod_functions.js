/**
 * Файл:        mod_functions.js
 * Описание:    Мод управляющий плеером - функциями от пользователя, такие как:
 *              Пауза/Воспроизведение, Режим PIP, Режим полного экрана. А также
 *              управляет жестами пользователся по 3 областям.
 * Библиотеки:  rxjs.js, jqery.js
 * Возвращает:  InitFunctions, CURSOR_WIDTH, onPlaybackRate2$
 */
import { AnimeQuery, Player, hls, onBuffered$, toggleFullScreen } from "../player.js";
import { SendAPI } from "./mod_api.js";
import { onDuration$, onTimeUpdate$ } from "./mod_event.js";
import { ALTERNATIVE_FULLSCREEN, AUTO_NEKST } from "./mod_settings.js";
import { InitShortcuts } from "./mod_shortcuts.js";

let END_TIME = 0; //Продолжительность видео после обрезки
//Настоящий размер курсора
export const CURSOR_WIDTH = 33;

//Вызов события при изменения endtime
const onEndTime$ = new rxjs.Subject();

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



    onDuration$.subscribe({
        next: () => {
            if (AUTO_NEKST && Player.duration) {
                let end_time_list = localStorage.getItem('tun-end-point');
                if (!end_time_list) end_time_list = {}; else end_time_list = JSON.parse(end_time_list);
                if (end_time_list && end_time_list[AnimeQuery.id]) {
                    END_TIME = Player.duration - end_time_list[AnimeQuery.id].time;
                } else {
                    //Сделать проверку если видео нету обрезки то поставить на 2%
                    END_TIME = Player.duration - (2 / 100) * Player.duration;
                }
                onEndTime$.next(END_TIME);
            }
        }
    });

    onTimeUpdate$.subscribe({
        next: () => {
            if (AUTO_NEKST && END_TIME != 0) {
                if (Player.currentTime >= END_TIME && !api_nexte_called) {
                    Player.currentTime = 0;
                    SendAPI.next();
                    api_nexte_called = !api_nexte_called;
                }
            }
        }
    });

    onBuffered$.subscribe({
        next: (time) => {
            if (AUTO_NEKST && END_TIME != 0) {
                if (time >= END_TIME) {
                    console.log('[plr] - Buffered stoped');
                    hls.stopLoad();
                }
            }
        }
    });

    CurrentPointScroll();
    TrimPointScroll();
    InitShortcuts();
}

export function ResetFunctions(){
    api_nexte_called = false;
}

onEndTime$.subscribe({
    next: (endtime) => {
        const slid = $('.player-slides > .trim-slid');
        const cursor = $('.player-cursors > .trim-cursor');
        let prcnt = ((Player.duration - endtime) / Player.duration) * 100;
        slid.width(`${prcnt}%`)
        cursor.css({ right: `calc(${prcnt}% - ${CURSOR_WIDTH / 2}px)` });
        hls.startLoad();
    }
})

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
 * Управление trim скролл
 */
function TrimPointScroll() {
    const slid = $('.player-slides > .trim-slid');
    const cursor = $('.player-cursors > .trim-cursor');

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
        //Смещение курсора
        let cursorLeft = cursor.position().left;
        let event = true;

        $(window).on('mousemove.ev touchmove.ev', function (e) {
            //Координаты смещения
            let currentX = e.clientX || e.originalEvent.touches[0].clientX || e.originalEvent.clientX;
            let swipeDistance = currentX - startX;
            let width = curWidth + -swipeDistance;
            if ((window.innerWidth - $('.player-slides > .current-slid').width()) <= width) {
                _endevent();
                return;
            }
            cursor.css('right', (window.innerWidth - cursorLeft) - swipeDistance);
            cursor.css({ right: `calc(${(window.innerWidth - cursorLeft) - swipeDistance - (CURSOR_WIDTH / 2)}px - ${CURSOR_WIDTH / 2}px)` });
            slid.width((curWidth + -swipeDistance));
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
                let timeTrim = (prcnt / 100) * Player.duration;
                END_TIME = Player.duration - timeTrim;
                slid.css({ width: `${prcnt}%` });
                cursor.css({ right: `calc(${prcnt}% - ${CURSOR_WIDTH / 2}px)` });
                if (played) Player.play();
                let end_time_list = localStorage.getItem('tun-end-point');
                if (!end_time_list) end_time_list = {}; else end_time_list = JSON.parse(end_time_list);
                let time = Player.duration - END_TIME
                end_time_list[AnimeQuery.id] = { date: new Date(), time: time };
                localStorage.setItem('tun-end-point', JSON.stringify(end_time_list));
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