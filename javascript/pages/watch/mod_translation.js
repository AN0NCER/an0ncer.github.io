import { WindowManagement } from "../../modules/Windows.js";
import { $ID } from "../watch.js";
import { Franchises } from "./mod_franchise.js";
import { IPlayer } from "./mod_player.js";

const Player = IPlayer.Init();

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
                    Player.CTranslation.lskey = "save-translations-" + $ID;
                } else {
                    Player.CTranslation.lskey = "save-translations";
                }

                Player.CTranslation.saved = JSON.parse(localStorage.getItem(Player.CTranslation.lskey));
                Player.CTranslation.saved = Player.CTranslation.saved ? Player.CTranslation.saved : [];

                //Сделать переключение избранных озвучек
                //Отключаем все в визуале
                $(".translations-wrapper > .button-stars").removeClass("selected");
                $('.voice-save.select').removeClass("select");

                //Добавляем только нужные
                const data = Player.CTranslation.saved;

                //Проверим выбранное
                if (data.findIndex(x => x == Player.CTranslation.id) != -1) {
                    $(".translations-wrapper > .button-stars").addClass("selected");
                }

                for (let i = 0; i < data.length; i++) {
                    const id = data[i];
                    $(`.voice[data-id="${id}"] > .voice-save`).addClass('select');
                }

                WindowTranslation.selectfavorits();
            }
        });

        $('.translation-param > .checkbox > input').prop('checked', $PARAMETERS.watch.dubanime);

        //Автоматическое скрытие окна при выборе озвучки
        Player.CTranslation.on('selected', () => {
            this.hide();
            _windowTranslation.hide();
        });
    },
    show: async () => {
        WindowTranslation.selectfavorits();
        $("body").addClass("loading");
    },
    hide: () => {
        $("body").removeClass("loading");
    },
    verif: () => { return true },
    selectfavorits: () => {
        if ($PARAMETERS.watch.dubanime) {
            Franchises.forEach((value) => {
                /**@type {[number]} */
                const data = JSON.parse(localStorage.getItem(`save-translations-${value.id}`)) || [];
                for (let i = 0; i < data.length; i++) {
                    const tid = data[i];
                    $(`.voice-save[data-id="${tid}"]`).addClass('select');
                }
            });
        }
    }
}

const _windowTranslation = new WindowManagement(WindowTranslation, '.window-translation');

export const ShowTranslationWindow = () => { _windowTranslation.click(); }