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
    window.addEventListener('keydown', (event) => {
        const tag = document.activeElement?.tagName;
        const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;

        if (isTyping) return;

        switch (event.code) {

            case 'Space':
                event.preventDefault();
                if (Player.paused) {
                    Player.play();
                } else {
                    Player.pause();
                }
                break;

            case 'ArrowLeft':
                Player.currentTime = Math.max(0, Player.currentTime - 10);
                break;

            case 'ArrowRight':
                Player.currentTime = Math.min(Player.duration, Player.currentTime + 10);
                break;

            case 'ArrowUp':
                Player.volume = Math.min(1, Player.volume + 0.1);
                break;

            case 'ArrowDown':
                Player.volume = Math.max(0, Player.volume - 0.1);
                break;

            case 'Escape':
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
                if (ALTERNATIVE_FULLSCREEN) {
                    SendAPI.fullscreen(false);
                }
                break;

            case 'KeyF':
                event.preventDefault();
                toggleFullScreen();
                break;
        }
    });
}