import { TWindow } from "../../core/window.core.js";
import { PullToClose, WindowIntercator } from "../../modules/win.module.js";
import { $ANIME } from "./mod.resource.js";
import { IPlayer } from "./mod_player.js";
import tmpl from "../../library/tmpl.lib.js";
import { $ID } from "../watch.js";
import { watchSequence } from "./mod.chronology.js";
import { TNotifi } from "../../modules/tun.notification.js";
import { DBAnime } from "./mod.db.js";
import { ANotifi } from "./mod.notifi.js";
import { Providers } from "../../providers/registry.js";

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
            const id = parseDubId(div.attr('data-id'));

            Player.CTranslation.Select({ id, user_handler: true });
        });

        //Нажатие добавить в избранное
        $('.dubs-list-wrapper').on('click', '.btn-dub-favorite', (e) => {
            /**@type {HTMLDivElement} */
            const div = $(e.currentTarget).closest('.dub-wrapper');
            const id = parseDubId(div.attr('data-id'));

            Player.CTranslation.Favorites(id);
        });

        let hasNotifiProcess = false;

        //Нажатие подписаться на уведомления
        $('.dubs-list-wrapper').on('click', '.btn-dub-notify', (e) => {
            if (hasNotifiProcess) return;
            hasNotifiProcess = true;

            const div = $(e.currentTarget).closest('.dub-wrapper');
            const id = parseDubId(div.attr('data-id'));

            const kodikId = Player.resultsVoice.get(id).id;

            const process = ANotifi.hasNotify(kodikId) ? () => ANotifi.unsubscribe(kodikId) : () => ANotifi.subscribe(kodikId);

            process().finally(() => hasNotifiProcess = false);
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

            if (Player.CTranslation.saved.has(Player.CTranslation.id)) {
                $('.dub-controller').addClass('-favor');
            }

            Player.CTranslation.saved.forEach((id) => {
                const div = $(`.dub-wrapper[data-id="${id}"] .btn-dub-favorite`);
                div.addClass('-e-favorite');
            });
        });

        $('.dub-checkbox > input').prop('checked', $PARAMETERS.watch.dubanime);

        //Кнопка отписаться от всех уведомлений
        const clearBtn = $('.btn-notify-clear');

        const updateBtnNotifi = () => {
            const list = DBAnime.get('notifications');
            if (list.length > 0) {
                clearBtn.removeClass('-disable');
            } else {
                clearBtn.addClass('-disable');
            }
        }

        clearBtn.on('click', () => {
            if (hasNotifiProcess) return;
            hasNotifiProcess = true;

            TNotifi.requestWin('Вы точно хотите отписаться от всех уведомлений данного аниме?').then((permision) => {
                if (permision === 1) {
                    ANotifi.unsubscribeAll().finally(() => hasNotifiProcess = false);
                } else {
                    hasNotifiProcess = false;
                }
            });
        });

        //Кнопка рандомного выбора озвучки
        $('.btn-dub-random').on('click', () => {
            Player.CTranslation.Select({ id: getRandomWithMaxEpisodes(Player.resultsVoice) });
        });


        //Событие отписки и подписки уведомлений
        ANotifi.on('subscribe', (dubs) => {
            dubs.forEach((kodikId) => {
                const kodik = Player.results.get(kodikId);
                if (kodik) {
                    const id = kodik.translation.id;
                    $(`.dub-wrapper[data-id="${id}"] .btn-dub-notify`).addClass('-on');
                }
            });
            updateBtnNotifi();
        });

        ANotifi.on('unsubscribe', (dubs) => {
            dubs.forEach((kodikId) => {
                const kodik = Player.results.get(kodikId);
                if (kodik) {
                    const id = kodik.translation.id;
                    $(`.dub-wrapper[data-id="${id}"] .btn-dub-notify`).removeClass('-on');
                }
            });
            updateBtnNotifi();
        });

        updateBtnNotifi();
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
    // Список строится после выбора стартовой озвучки и перестраивается,
    // когда приходят озвучки медленных провайдеров (модов)
    let inited = false;

    Player.on('inited', () => {
        inited = true;
        Render();
    });

    Player.core.on('voices', () => {
        if (inited) Render();
    });

    /**
     * Озвучки по провайдерам (в порядке priority), внутри — «вышло» и «выходит».
     * Заголовки групп — только если провайдеров больше одного
     */
    async function Render() {
        //Ждем загрузки аниме данных
        const anime = await $ANIME;
        const episodes = anime?.episodes ?? undefined;
        /**@type { 'anons' | 'ongoing' | 'released'} */
        const status = anime.status ?? 'ongoing';

        // Сохраненные эпизоды
        const saved = Player.CTranslation.saved;
        const notifi = new Set(DBAnime.get("notifications") || []);

        /** @type {Map<string, import('../../providers/registry.js').Voice[]>} */
        const groups = new Map();
        for (const voice of Player.core.voices.values()) {
            if (!groups.has(voice.provider)) groups.set(voice.provider, []);
            groups.get(voice.provider).push(voice);
        }

        const fragment = document.createDocumentFragment();

        groups.forEach((voices, provider) => {
            if (groups.size > 1) {
                fragment.append(__createTitle(Providers.get(provider)?.title ?? provider));
            }

            const coming = __createList('coming');
            const aired = __createList('aired');

            //Создание DUBS карточек в window
            voices.forEach(({ id, title, episodes: last_episode }) => {
                const canNotify = Player.can('notify', id) && (typeof last_episode !== 'undefined') && (status !== 'released' && last_episode !== episodes ||
                    status === 'released' && last_episode !== episodes);

                const dubCard = __createDub(id, title, last_episode, canNotify, saved.has(id), notifi.has(Player.resultsVoice.get(id)?.id));

                if (status !== 'released' || last_episode !== episodes) {
                    coming.append(dubCard);
                } else {
                    aired.append(dubCard);
                }
            });

            //Добавление только нужных спикох с озвучками
            if (aired.childElementCount > 0) fragment.append(aired);
            if (coming.childElementCount > 0) fragment.append(coming);
        });

        document.querySelector('.dubs-list-wrapper').replaceChildren(fragment);
        $(`.dub-wrapper[data-id="${Player.CTranslation.id}"]`).addClass('-select');
    }

    /**
     * Заголовок группы озвучек провайдера
     * @param {string} title
     * @returns {HTMLDivElement}
     */
    function __createTitle(title) {
        const element = document.createElement('div');
        element.classList.add('dubs-provider-title');
        element.textContent = title;
        return element;
    }

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
    function __createDub(id, name, count, notify = false, favor = false, hasSubscription = false) {
        const clone = _tmpl.clone({
            id, name,
            count: `${count || 1} EP`,
        });


        if (notify && [0, 1].includes(TNotifi.getUIState())) {
            const el_notify = clone.el.querySelector('.dub-buttons-wrapper');
            el_notify.classList.add('-e-notify');
        }

        if (favor) {
            const el_favor = clone.el.querySelector('.btn-dub-favorite');
            el_favor.classList.add('-e-favorite');
        }

        if (hasSubscription) {
            const el_notifi = clone.el.querySelector('.btn-dub-notify');
            el_notifi.classList.add('-on');
        }

        return clone.el;
    }
})();

export function ShowDUBSWindow() {
    windowDUBS.show();
}

/**
 * id озвучки из data-id: у Kodik число (так оно хранится в избранном), у модов — строка `thd:…`
 * @param {string} value
 * @returns {number|string}
 */
function parseDubId(value) {
    return /^\d+$/.test(value) ? Number(value) : value;
}

function getRandomWithMaxEpisodes(map) {
    const maxEpisodes = Math.max(...[...map.values()].map(v => v.last_episode));
    const candidates = [...map.entries()].filter(([, v]) => v.last_episode === maxEpisodes);
    const [key, value] = candidates[Math.floor(Math.random() * candidates.length)];
    return key;
}