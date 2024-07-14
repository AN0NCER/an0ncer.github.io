/**
 * Файл:        mod_settings.js
 * Описание:    Мод управляющий настройками плеера, такие как: Установка
 *              качества, Переключение на следующий эпизод, Упарвлению
 *              громкостью видео.
 * Библиотеки:  rxjs.js, jqery.js
 * Возвращает:  InitSettings, QUALITY, FULL_PLAYER, AUTOQUALITY,
 *              STANDART, STANDART_CONTROLS, onQualityChange$, 
 *              ALTERNATIVE_FULLSCREEN
 */

import { Player, hls } from "../player.js";
import { onVolumeChange$ } from "./mod_event.js";

export let QUALITY = $PARAMETERS.player.quality;
export const FULL_PLAYER = $PARAMETERS.player.full;
export const AUTOQUALITY = $PARAMETERS.player.autoquality;
export const STANDART = $PARAMETERS.player.standart;
export const STANDART_CONTROLS = $PARAMETERS.player.standart_controls;
export const ALTERNATIVE_FULLSCREEN = $PARAMETERS.player.alternative_full;

/**
 * Изменение качество видеоролика
 */
export const onQualityChange$ = new rxjs.Subject().pipe(
    rxjs.distinctUntilChanged()
);

/**
 * Инициализация окна с настройками
 */
export function InitSettings() {
    $('.quality-setup > .quality').on('click', function () {
        $(`.quality-setup > .quality.selected`).removeClass('selected');
        $(this).addClass('selected');
        QUALITY = $(this).attr('data-q');
        onQualityChange$.next(QUALITY);
    });

    //Управление громкостью видео
    $(`.player-settings > .volume > .slide`).on('mousedown touchstart', function (e) {
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
                let prcnt = (slide.width() / fullWidth) * 100;
                Player.volume = prcnt / 100;
            }
        }
    });

    onVolumeChange$.subscribe({
        next: () => {
            let prcnt = Player.volume * 100;
            $(`.player-settings > .volume > .slide > .current-slide`).css({ width: `${prcnt}%` });
        }
    });

    SetVolume();

    $(`.quality-setup > .quality[data-q="${QUALITY}"]`).addClass('selected');
}

//Изменение качество видеоролика
onQualityChange$.subscribe({
    next: (quality) => {
        let level = -1
        for (let i = 0; i < hls.levels.length; i++) {
            const element = hls.levels[i];
            if (element.name == quality) {
                //Выбранный уровень по названию
                level = i;
            }
        }
        //Если выбранный уровень лучше чем текущий сегмент то перегрузить буффер
        if (hls.levels[hls.currentLevel].bitrate <= hls.levels[level].bitrate) {
            hls.nextLevel = level;
        }
        //Ставим максимальный разрешенный уровень прогрузки
        hls.autoLevelCapping = level;
        //Загружаем, нужно если видео было загружено до отрезки и буфер был сброшен
        hls.startLoad();
    }
})

/**
 * Устанавливает значение громкости в настройках
 */
function SetVolume() {
    let prcnt = Player.volume * 100;
    $(`.player-settings > .volume > .slide > .current-slide`).css({ width: `${prcnt}%` });
}