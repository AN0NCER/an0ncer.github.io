/**
 * Файл:        mod_shortcuts.js
 * Описание:    Мод управляет горячими клавишами управления плеера
 * Библиотеки:  jqery.js
 * Возвращает:  InitShortcuts
 */

import { Player, toggleFullScreen } from "../player.js";
import { SendAPI } from "./mod_api.js";
import { ALTERNATIVE_FULLSCREEN } from "./mod_settings.js";

export function InitShortcuts() {
    $(window).on('keyup', function (event) {
        //Стрелка вправо
        if (event.which == 32) {
            //Пазуа воспроизведение видео
            if (Player.paused) {
                Player.play();
            } else {
                Player.pause();
            }
        }
        //Стрелка влево
        if (event.which == 37) {
            //Перемотка назад на 10 секунд
            Player.currentTime -= 10;
        }
        //Стрелка вправо
        if (event.which == 39) {
            //Перемотка вперед на 10 секунд
            Player.currentTime += 10;
        }
        //Стрелка вверх
        if (event.which == 38) {
            Player.volume += 0.1;
        }
        //Стрелка вниз
        if (event.which == 40) {
            Player.volume -= 0.1;
        }
        //ESC 27
        if (event.which == 27) {
            if (document.fullscreenElement || Player.webkitEnterFullscreen) {
                toggleFullScreen();
            }
            if (ALTERNATIVE_FULLSCREEN) {
                SendAPI.fullscreen(false);
            }
        }
    });
}