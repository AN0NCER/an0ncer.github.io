import { TWindow } from "../../core/window.core.js";
import { PullToClose, WindowIntercator } from "../../modules/win.module.js";
import { $ANIME } from "./mod.resource.js";
import { IPlayer } from "./mod_player.js";
import tmpl from "../../library/tmpl.lib.js";
import { $ID } from "../watch.js";
import { watchSequence } from "./mod.chronology.js";

const Player = IPlayer.Init();

const windowDUBS = new TWindow({
    oninit: () => {
        //Кнопка закрытия окна
        $('.dubs-bar > .window-close').on('click', () => {
            windowDUBS.hide();
        });

        //Автоскрытие окна после выбора озвучки
        Player.CTranslation.on('selected', () => {
            windowDUBS.hide();
        });

        //Слушатель на добавление и удаление из избранных
        Player.CTranslation.on('favorite', ({ type, id }) => {
            const div = $(`.dub-wrapper[data-id="${id}"] .btn-dub-favorite`);
            if (type === 'save') {
                div.addClass('-e-favorite');
            } else {
                div.removeClass('-e-favorite');
            }

            if (id == Player.CTranslation.id) {
                const btn = $('.dub-controller');
                if (type === 'save') {
                    btn.addClass('-favor');
                } else {
                    btn.removeClass('-favor');
                }
            }
        })

        //Нажатие на озвучку
        $('.dubs-list-wrapper').on('click', '.dub-select-btn', (e) => {
            if (!Player.isOwner) return;
            /**@type {HTMLDivElement} */
            const div = $(e.currentTarget).closest('.dub-wrapper');
            const id = Number(div.attr('data-id'));

            Player.CTranslation.Select({ id, user_handler: true });
        });

        //Нажатие добавить в избранное
        $('.dubs-list-wrapper').on('click', '.btn-dub-favorite', (e) => {
            /**@type {HTMLDivElement} */
            const div = $(e.currentTarget).closest('.dub-wrapper');
            const id = Number(div.attr('data-id'));

            Player.CTranslation.Favorites(id);
        });

        //Переключение парамерта дубляжи избранное по франшизе
        $('.dub-checkbox').on('click', (e) => {
            const checked = e.target.checked;
            if (typeof checked === "undefined") return;
            //Переключаем парамерт
            setParameter('dubanime', checked);

            if (checked) {
                Player.CTranslation.lskey = "save-translations-" + $ID;
            } else {
                Player.CTranslation.lskey = "save-translations";
            }

            Player.CTranslation.saved = new Set((JSON.parse(localStorage.getItem(Player.CTranslation.lskey)) ?? []));

            if (checked) {
                for (let i = 0; i < watchSequence.length; i++) {
                    const fid = watchSequence[i];
                    (JSON.parse(localStorage.getItem(`save-translations-${fid}`)) || []).forEach(x => Player.CTranslation.saved.add(x));
                }
            }

            $('.btn-dub-favorite.-e-favorite')?.removeClass('-e-favorite');
            $('.dub-controller.-favor')?.removeClass('-favor');

            if(Player.CTranslation.saved.has(Player.CTranslation.id)){
                $('.dub-controller').addClass('-favor');
            }

            Player.CTranslation.saved.forEach((id) => {
                const div = $(`.dub-wrapper[data-id="${id}"] .btn-dub-favorite`);
                div.addClass('-e-favorite');
            });
        })

        $('.dub-checkbox > input').prop('checked', $PARAMETERS.watch.dubanime);
    },
    onshow: () => {
        $(`.dub-wrapper.-select`)?.removeClass('-select');
        $(`.dub-wrapper[data-id="${Player.CTranslation.id}"]`).addClass('-select');
    },
    onhide: () => { },
}, '.window-dubs');

windowDUBS.module.add(WindowIntercator);
windowDUBS.module.add(PullToClose, { scroll: '.window-content.content-dubs > .content-wrapper' });

//Auto INIT
(() => {
    Player.on('inited', ({ resultsVoice }) => {
        // Сохраненные эпизоды
        const saved = Player.CTranslation.saved;

        //Ждем загрузки аниме данных
        $ANIME.then((anime) => {
            const episodes = anime?.episodes ?? undefined;
            /**@type { 'anons' | 'ongoing' | 'released'} */
            const status = anime.status ?? 'ongoing';

            const coming = __createList('coming');
            const aired = __createList('aired');

            const stat = {
                coming: 0,
                aired: 0
            }

            //Создание DUBS карточек в window
            resultsVoice.forEach(({ translation, episodes_count }) => {
                const { id, title } = translation;

                const canNotify = status !== 'released' && episodes_count !== episodes ||
                    status === 'released' && episodes_count !== episodes;

                const dubCard = __createDub(id, title, episodes_count, canNotify, saved.has(id));

                if (status !== 'released' || episodes_count !== episodes) {
                    coming.append(dubCard);
                    stat.coming++;
                } else {
                    aired.append(dubCard);
                    stat.aired++;
                }
            });

            //Добавление только нужных спикох с озвучками
            const list_wrapper = document.querySelector('.dubs-list-wrapper');
            if (stat.aired > 0) {
                list_wrapper.append(aired);
            }

            if (stat.coming > 0) {
                list_wrapper.append(coming);
            }
        })
    });

    /**
     * Создает список для DUB карточек
     * @param {'coming' | 'aired'} type 
     * @returns {HTMLDivElement}
     */
    function __createList(type) {
        const element = document.createElement('div');
        element.classList.add('grid-wrapper-list');
        element.setAttribute('data-type', type);
        return element;
    }

    const _tmpl = tmpl('#tpl-dub');

    /**
     * Создает DUB карточку для списоков (coming, aired)
     */
    function __createDub(id, name, count, notify = false, favor = false) {
        const clone = _tmpl.clone({
            id, name,
            count: `${count} EP`,
        });


        if (notify) {
            const el_notify = clone.el.querySelector('.dub-buttons-wrapper');
            el_notify.classList.add('-e-notify');
        }

        if (favor) {
            const el_favor = clone.el.querySelector('.btn-dub-favorite');
            el_favor.classList.add('-e-favorite');
        }

        return clone.el;
    }
})();

export function ShowDUBSWindow() {
    windowDUBS.show();
}