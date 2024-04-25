import { WindowManagement } from "../../modules/Windows.js";
import { $ID } from "../watch.js";
import { Player } from "./mod_player.js";

const WindowTranslation = {
    init: function () {
        $('.voice-bar > .window-close').on('click', () => {
            this.hide();
            _windowTranslation.hide();
        });

        //Переключение парамерта дубляжи избранное по франшизе
        $('.translation-param').on('click', (e) => {
            if (e.target.checked != undefined) {
                //Переключаем парамерт
                setParameter('dubanime', e.target.checked);

                if (e.target.checked) {
                    Player().translation.key = "save-translations-" + $ID;
                } else {
                    Player().translation.key = "save-translations";
                }

                Player().translation.saved = JSON.parse(localStorage.getItem(Player().translation.key));
                Player().translation.saved = Player().translation.saved ? Player().translation.saved : [];

                //Сделать переключение избранных озвучек
                //Отключаем все в визуале
                $(".translations-wrapper > .button-stars").removeClass("selected");
                $('.voice-save.select').removeClass("select");

                //Добавляем только нужные
                const data = Player().translation.saved;
                //Проверим выбранное

                if (data.findIndex(x => x == Player().translation.id) != -1) {
                    $(".translations-wrapper > .button-stars").addClass("selected");
                }

                for (let i = 0; i < data.length; i++) {
                    const id = data[i];
                    $(`.voice[data-id="${id}"] > .voice-save`).addClass('select');
                }
            }
        });

        $('.translation-param > .checkbox > input').prop('checked', $PARAMETERS.watch.dubanime);

        //Автоматическое скрытие окна при выборе озвучки
        Player().translation.events.onselected((e) => {
            this.hide();
            _windowTranslation.hide();
        });
    },
    show: () => {
        $("body").addClass("loading");
        const element = $('.content-translation');
        if (element.height() >= window.innerHeight) {
            element.css({ 'border-radius': '0px' });
        }
    },
    hide: () => {
        $("body").removeClass("loading");
    },
    verif: () => { return true }
}

const _windowTranslation = new WindowManagement(WindowTranslation, '.window-translation');

export const ShowTranslationWindow = () => { _windowTranslation.click(); }