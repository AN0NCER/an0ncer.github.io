import { Kodik } from "../../modules/api.kodik.js";
import { AutoScrollEpisodes } from "./utils/util.scroll.js";
import { $ID } from "../watch.js";
import { watchSequence } from "./mod.chronology.js";
import { DUB } from "./mod.dubs.js";
import { WEpisodes } from "./mod.episode.win.js";

let _player = undefined;

const player_callbacks = {
    inited: [],
    loaded: []
}

const message_callabcks = {
    pause: [],
    play: [],
    error: [],
    next: [],
    fullscreen: [],
    switch: [],
    seek: [],
    skip_button: []
}

const translation_callbacks = {
    selected: [],
    loaded: [],
    favorite: []
}

const episodes_callbacks = {
    selected: [],
    load: []
}

const control_methods = {
    "play": '', // Запуск плеера
    "pause": '', // Пауза
    "seek": '', // Перемотка на заданную точку. Время указывается в секундах
    "volume": '', // Изменение громкости. Значение громкости может быть от 0 до 1
    "mute": '', // Выключение звука
    "unmute": '', // Включение звука
    "change_episode": '', // Переключение серии
    "enter_pip": '', // Вход в режим "Картинка в картинке"
    "exit_pip": '', // Выход из режима "Картинка в картинке"
    "get_time": '', // Получение текущего времени
    "set_episode": '' //Включение эпизода (только Tunime Player)
}

class Episodes {
    #callbacks = episodes_callbacks;
    /**
     * @param {Player} Player 
     */
    constructor(Player) {
        this.Player = Player;

        this.hasMenu = false;
        this.wrappers = $('.episode-scroll-wrapper');
        this.selected = 1;
        this.count = 0;

        //Инициализация функционала эпизода
        this.#Functional();
    }

    /**
     * **Управление эпизодами**
     * 
     * `вызывается после выбора озвучки (автоматичечски)`
     * @param {{last_episode:number}} dub 
     * @returns {void}
     */
    Init(dub) {
        // Количество эпизодов доступных для просмотра
        this.count = dub.last_episode;

        // Добавление эпизодов в DOM
        const e_list = $('.episode-list');

        e_list.empty();

        this.hasMenu = this.count > 40;

        if (this.hasMenu && $PARAMETERS.watch.epismenu) {
            //Добавление меню выбора эпизодов
            this.wrappers.css('--items', 1);
            e_list.append(`<div class="btn-win-episode" data-index="-1"><svg viewBox="0 0 640 640" aria-hidden="true"><use href="#i-grip"></use></svg><span class="ep-name">EPS</span></div>`);
        } else {
            this.wrappers.css('--items', '');
        }

        for (let i = 1; i < this.count + 1; i++) {
            const html = `<span class="episode" data-index="${i}">${i}<span class="ep-name">EP</span></span>`;
            e_list.append(html);
        }

        // Сразу выбираем эпизод (это будет 1 если пользователь ничего не выбирал или другого жпизода не доступно)
        if (this.selected > this.count) {
            //Тогда выбираем ближайший доступный
            this.selected = this.count;
        }

        // Авто выбор эпизода (запускает загрузку плеера для определенного эпизода)
        this.#Dispatch('selected', { episode: this.selected, translation: this.Player.CTranslation.id, user_handler: false });
        this.#Animate({ episod: this.selected, event: () => { AutoScrollEpisodes(); } });
    }

    Select(e) {
        if (e > this.count) return;
        this.selected = e;
        this.#Animate({ episod: this.selected });
    }

    Revise() {
        this.#Animate({ episod: this.selected, event: () => { AutoScrollEpisodes(); } })
    }

    #Functional() {
        let lastScroll = 0;
        let lastScrollTop = 0;
        let rafPending = false;

        this.wrappers.on('scroll', (e) => {
            if (!this.hasMenu) return;
            if (rafPending) return;

            rafPending = true;


            requestAnimationFrame(() => {
                rafPending = false;

                const el = e.currentTarget;
                const scrollLeft = el.scrollLeft;
                const scrollTop = el.scrollTop;

                if (scrollLeft !== lastScroll) {
                    if (lastScroll > scrollLeft) {
                        $('[data-scroll="horizontal"] .btn-win-episode').addClass('-show');
                    } else {
                        $('[data-scroll="horizontal"] .btn-win-episode').removeClass('-show');
                    }
                    lastScroll = scrollLeft;
                }

                if (scrollTop !== lastScrollTop) {
                    if (lastScrollTop > scrollTop) {
                        $('[data-scroll="vertical"] .btn-win-episode').addClass('-show');
                    } else {
                        $('[data-scroll="vertical"] .btn-win-episode').removeClass('-show');
                    }
                    lastScrollTop = scrollTop;
                }
            });
        });

        const selectEpisode = (episode) => {
            if (!this.Player.isOwner) return false;

            //Проверяем если эпизод не выбран то выбираем его
            if (!this.selected || this.selected != episode) {
                this.selected = episode;
                this.#Dispatch('selected', { episode, translation: this.Player.CTranslation.id, user_handler: true });
                this.#Animate({ episod: episode });
                return true;
            }

            return false;
        }

        this.wrappers.on('click', '.btn-win-episode, .episode[data-index]', (e) => {
            if (!this.Player.isOwner) return;
            const episode = $(e.currentTarget).data('index');

            if (episode === -1) {
                WEpisodes(this.count, this.selected, {
                    onselect: (episode, win) => {
                        const selected = selectEpisode(episode);

                        if (win && selected) {
                            win.hide();
                            AutoScrollEpisodes();
                        }
                    }
                });
                return;
            }

            selectEpisode(episode);
        });
    }

    #el = undefined;

    /**
     * Выполняет анимацию выбора эпизода
     * @param {Object} params - Параметры для анимации
     * @param {number} [params.episod=1] - Номер выбранного эпизода (по умолчанию 1)
     * @param {Event} params.event - Событие, происходящее после выполнения анимации
     * @param {Event} params.update - Событие для обновления данных анимации (передается текущая анимация)
     * @returns {void}
     */
    #Animate({ episod = 1, event, update } = {}) {
        const element = $(`.episode[data-index="${episod}"]`);
        $('.episode.-select').removeClass('-select');
        $('.episodes > .value, .episodes > .episodes-wrapper, .episode-scroll-wrapper').css(`--episod`, episod);
        element.addClass('-select');
        if (event) {
            event();
        }
        // const element = $(".episodes > .value > .episode")[episod - 1];
        // if (!element) {
        //     return;
        // }
        // if (this.#el) {
        //     anime({
        //         targets: this.#el,
        //         color: "#555657",
        //         easing: "easeOutElastic(1, 1)",
        //     });
        // }
        // this.#el = element;
        // const left = $(element).position().left;
        // const top = $(element).position().top + $(".episodes > .value").scrollTop();
        // anime({
        //     targets: ".sel",
        //     top: top,
        //     easing: "easeOutElastic(1, 1)",
        // });
        // anime({
        //     targets: ".sel",
        //     left: left,
        //     complete: function (anim) {
        //         if (event) {
        //             event();
        //         }
        //     },
        //     update: function (anim) {
        //         if (update) {
        //             update(anim);
        //         }
        //     },
        //     easing: "easeOutElastic(1, 1)",
        // });
        // anime({
        //     targets: element,
        //     color: "#020202",
        //     easing: "easeOutElastic(1, 1)",
        // });
    }

    /**
     * Подписка на событие
     * @param {keyof typeof episodes_callbacks} event - Название события (ключ из player_callbacks)
     * @param {*} callback - Функция-обработчик для события
     * @returns {void}
     */
    on(event, callback) {
        if (typeof callback !== "function") return () => { };
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
        return () => {
            this.#callbacks[event] = this.#callbacks[event].filter(cb => cb !== callback);
        }
    }


    /**
     * Вызов события
     * @param {keyof typeof episodes_callbacks} event - Название события (ключ из player_callbacks)
     * @param {object} data - Данные обратного вызова
     * @returns {void}
     */
    #Dispatch(event, data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(data));
    }
}

class Translation {
    #callbacks = translation_callbacks;
    /**
     * @param {Player} Player 
     */
    constructor(Player) {
        this.Player = Player;

        this.lskey = "save-translations";
        this.saved = new Set(); //Сохранненые ID озвучек (Избранное)
        this.selected = false; //Выбрана ли озвучка
        this.id = undefined; //ID Выбранной озвучки
        this.name = undefined; // Название выбранной озвучки
    }

    /**
     * Инициализация озвучек
     * @param {Map<string, {translation:{id:number, title:string},last_episode:number}>} data 
     * @param {number} [dubId] - Выбранна определенная озвучка 
     */
    Init(data, dubId) {
        if ($PARAMETERS.watch.dubanime) this.lskey = "save-translations-" + $ID;
        this.saved = new Set((JSON.parse(localStorage.getItem(this.lskey)) ?? []))

        if ($PARAMETERS.watch.dubanime) {
            for (let i = 0; i < watchSequence.length; i++) {
                const fid = watchSequence[i];
                (JSON.parse(localStorage.getItem(`save-translations-${fid}`)) || []).forEach(x => this.saved.add(x));
            }
        }

        for (const [id, item] of data) {
            const translation = item.translation;

            let finded = false;

            if (this.saved.has(translation.id)) {
                finded = true;
            }

            if (!this.selected && finded && dubId === undefined) {
                this.Select({ id: translation.id });
            }
        }

        if (!this.selected && data.size > 0 && dubId === undefined) {
            this.Select({ id: data.values().next().value.translation.id });
        } else if (!this.selected && data.size > 0 && dubId) {
            this.Select({ id: dubId });
        }

        this.#Dispatch('loaded', this.Player);
    }

    Favorites(id) {
        let type = 'save';

        if (this.saved.has(id)) {
            type = 'remove';
            //Удаляем с избранных
            this.saved.delete(id);
        } else {
            //Добавляем в избранное
            this.saved.add(id);
        }

        //Сохраняем избранное
        localStorage.setItem(this.lskey, JSON.stringify([...this.saved]));
        this.#Dispatch('favorite', { type, id });
    }

    /**
     * Выберает озвучку для аниме
     * @param {{id: number, user_handler:boolean}} param0 
     */
    Select({ id, user_handler = false }) {
        if (this.id == id || id === undefined) return;

        const data = this.Player.resultsVoice.get(id);

        if (!data) return console.error('Translation not found');

        this.id = id; //Индентификатор озвучки
        this.selected = true;
        this.name = data.translation.title; //Название озвучки

        DUB.select(data, this.saved.has(id));
        this.#Dispatch('selected', { id: this.id, user_handler });
    }

    /**
     * Подписка на событие
     * @param {keyof typeof translation_callbacks} event - Название события (ключ из player_callbacks)
     * @param {*} callback - Функция-обработчик для события
     * @returns {void}
     */
    on(event, callback) {
        if (typeof callback !== "function") return () => { };
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
        return () => {
            this.#callbacks[event] = this.#callbacks[event].filter(cb => cb !== callback);
        }
    }


    /**
     * Вызов события
     * @param {keyof typeof translation_callbacks} event - Название события (ключ из player_callbacks)
     * @param {object} data - Данные обратного вызова
     * @returns {void}
     */
    #Dispatch(event, data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(data));
    }
}

class Control {
    /**
     * @param {Player} Player 
     */
    constructor(Player) {
        this.Player = Player;
    }

    /**
     * Укправление плеером
     * @param {keyof typeof control_methods} method - Название события (ключ из player_callbacks)
     * @param {object} data - Данные для отправки
     * @returns {void}
     */
    Exec(method, data = {}) {
        if (!this.Player.loaded) {
            return;
        }

        let value = Object.assign({ method }, data);

        document.querySelector("#kodik-player").contentWindow.postMessage({ key: "kodik_player_api", value: value }, '*');
    }
}

class Message {
    #callbacks = message_callabcks;

    /**
     * @param {Player} Player 
     */
    constructor(Player) {
        this.Player = Player;
        if (window.addEventListener) {
            window.addEventListener("message", this.#Listener.bind(this));
        } else {
            window.attachEvent("onmessage", this.#Listener.bind(this));
        }
    }

    #Listener(message) {
        const actions = {
            //Продолжительность всего видео
            kodik_player_duration_update: () => {
                this.Player.VData.duration = message.data.value;
            },
            //Текущее время видео
            kodik_player_time_update: () => {
                this.Player.VData.time = message.data.value;
            },
            //Статус плеера изменен на паузу
            kodik_player_pause: () => {
                this.#Dispatch('pause', this.Player.VData);
            },
            //Статус плеера изменен на воспроизведение
            kodik_player_play: () => {
                this.#Dispatch('play', this.Player.VData);
            },
            //Статус плеера tunime ошибка
            tunime_error: () => {
                this.#Dispatch('error', { value: message.data.value });
            },
            //Статус плеера переключение эпизода
            tunime_next: () => {
                this.#Dispatch('next', this.Player);
            },
            // Альтернативный полный экран
            tunime_fullscreen: () => {
                this.#Dispatch('fullscreen', { value: message.data.value });
            },
            // Переключение плеера
            tunime_switch: () => {
                this.#Dispatch('switch', { value: message.data.value });
            },
            // Запрос из вне на точное время
            kodik_player_time: () => {
                this.#Dispatch('time', { value: message.data.value });
            },
            // Перемотка на заданную точку
            kodik_player_seek: () => {
                this.#Dispatch('seek', { value: message.data.value });
            },
            // Нажатие на кнопку пропуска интро/аутро
            kodik_player_skip_button: () => {
                this.#Dispatch('skip_button', { value: message.data.value });
            }
        };

        if (actions[message.data.key]) {
            actions[message.data.key]();
        }
    }

    /**
     * Подписка на событие
     * @param {keyof typeof message_callabcks} event - Название события (ключ из player_callbacks)
     * @param {*} callback - Функция-обработчик для события
     * @returns {void}
     */
    on(event, callback) {
        if (typeof callback !== "function") return () => { };
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
        return () => {
            this.#callbacks[event] = this.#callbacks[event].filter(cb => cb !== callback);
        }
    }


    /**
     * Вызов события
     * @param {keyof typeof message_callabcks} event - Название события (ключ из player_callbacks)
     * @param {object} data - Данные обратного вызова
     * @returns {void}
     */
    #Dispatch(event, data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(data));
    }
}

class Player {
    #callbacks = player_callbacks;

    #name = undefined;

    set name(value) {
        this.#name = value;
        const el = document.querySelector('.player');
        el.setAttribute('data-type', this.#name);
        el.setAttribute('default-controls', $PARAMETERS.player.standart_controls);
    }

    get name() {
        return this.#name;
    }

    constructor({ standart = false } = {}) {
        this.results = new Map();

        this.VData = {
            duration: 0, //Продолжительность эпизода
            time: 0 //Текущее время просмотра
        }

        this.CMessage = new Message(this);
        this.PControl = new Control(this);
        this.CTranslation = new Translation(this);
        this.CEpisodes = new Episodes(this);

        this.selected = undefined;
        this.loaded = false;
        this.name = standart ? "tunime" : "kodik";
        this.isOwner = true;

        this.CTranslation.on('selected', ({ id }) => {
            // Выбранный елемент текущей озвучки
            this.selected = this.resultsVoice.get(id);
            this.CEpisodes.Init(this.selected);
        });

        this.CEpisodes.on('selected', this.#Update.bind(this));
    }

    Init({ kodik_episode = undefined, kodik_dub = undefined } = {}) {
        return new Promise((resolve) => {
            Kodik.Search({ shikimori_id: $ID }, (response) => {
                if (kodik_episode) {
                    this.CEpisodes.selected = kodik_episode;
                }
                this.#buildIndexes(response.results);
                this.CTranslation.Init(this.results, kodik_dub);
                this.#Dispatch('inited', { results: this.results, resultsVoice: this.resultsVoice });
                return resolve(this.results);
            });
        });
    }

    Load() {
        this.#Update({ episode: this.CEpisodes.selected });
    }

    Switch() {
        this.name = this.name === "kodik" ? "tunime" : "kodik";
        this.#Update({ episode: this.CEpisodes.selected });
    }

    #buildIndexes(list) {
        this.results = new Map();
        this.resultsVoice = new Map();

        for (const item of list) {
            // 1) основной ключ
            if (item?.id) this.results.set(item.id, item);

            // 2) вторичный ключ
            const trId = item?.translation?.id;
            if (trId != null) this.resultsVoice.set(trId, item);
        }
    }

    #Update({ episode }) {
        const uri = this.selected.link;
        this.loaded = false;
        let url = `${uri}?hide_selectors=true&episode=${episode}`;
        if (this.name === "tunime") {
            url = `tplayer.html?id=${this.selected.id}&e=${episode}`
        }
        document.querySelector("#kodik-player").contentWindow.location.replace(url);
        this.#Loading();
    }

    #loadCount = 0;

    #Loading() {
        //Находим елемент на страницe
        const element = document.querySelector("#kodik-player");
        let interval = setInterval(() => {
            try {
                if (element.contentWindow.document) {
                    if (element.contentWindow.window.location.href.indexOf("player") != -1) {
                        //Очищаем интервао
                        clearInterval(interval);

                        //Устанавливаем значения
                        this.loaded = true;
                        this.#loadCount++;

                        this.#Dispatch('loaded', { count: this.#loadCount, name: this.name });
                    }
                }
                //Когда плеер загрузится будет ошибка CORS
            } catch (error) {
                //Очищаем интервао
                clearInterval(interval);

                //Устанавливаем значения
                this.loaded = true;
                this.#loadCount++;

                this.#Dispatch('loaded', { count: this.#loadCount, name: this.name });
            }
        }, 100);
    }

    static Construct({ standart = false } = {}) {
        _player.name = standart ? "tunime" : "kodik";
    }

    /**
     * Созданние класса плеера
     * @returns {Player}
     */
    static Init(param) {
        if (typeof _player === "undefined") {
            _player = new Player(param);
        } else if (param) {
            Player.Construct(param);
        }
        return _player;
    }

    /**
     * Подписка на событие
     * @param {keyof typeof player_callbacks} event - Название события (ключ из player_callbacks)
     * @param {*} callback - Функция-обработчик для события
     * @returns {void}
     */
    on(event, callback) {
        if (typeof callback !== "function") return () => { };
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
        return () => {
            this.#callbacks[event] = this.#callbacks[event].filter(cb => cb !== callback);
        }
    }


    /**
     * Вызов события
     * @param {keyof typeof player_callbacks} event - Название события (ключ из player_callbacks)
     * @param {object} data - Данные обратного вызова
     * @returns {void}
     */
    #Dispatch(event, data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(data));
    }
}

export const IPlayer = Player;