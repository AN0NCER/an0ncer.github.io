/**
 * Файл:        mod_event.js
 * Описание:    Мод добавляет прослушку к событиям Player через библиотеку rxjs
 * Библиотеки:  rxjs.js
 * Возвращает:  InitEvent, onPause$, onPlay$, onDuration$, onTimeUpdate$, 
 *              onError$, onEnded$, onVolumeChange$
 */

import { Player } from "../player.js";

export let onPause$, onPlay$, onDuration$, onTimeUpdate$, onError$, onEnded$, onVolumeChange$ = undefined;

/**
 * Инициализация событий плеера в rxjs
 */
export function InitEvent() {
    onPause$ = rxjs.fromEvent(Player, 'pause');
    onPlay$ = rxjs.fromEvent(Player, 'play');
    onDuration$ = rxjs.fromEvent(Player, 'durationchange');
    onTimeUpdate$ = rxjs.fromEvent(Player, 'timeupdate');
    onError$ = rxjs.fromEvent(Player, 'error');
    onEnded$ = rxjs.fromEvent(Player, 'ended');
    onVolumeChange$ = rxjs.fromEvent(Player, 'volumechange');
}
