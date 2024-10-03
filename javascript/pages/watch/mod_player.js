import { Kodik } from "../../modules/Kodik.js";
import { AutoScrollEpisodes } from "./mod_scrolling.js";
import { $ID } from "../watch.js";
import { Franchises } from "./mod_franchise.js";

//Функция генерация HTML перевода
function _genVoice(id, title, episod, save = false) {
    return `<div class="voice" data-id="${id}">
    <div class="voice-content" data-id="${id}">
       <span class="voice-title">${title}</span>
       <span class="voice-count">${episod ? episod : 1}</span>
    </div>
    <div class="voice-save ${save ? "select" : ''}" data-id="${id}">
       <svg xmlns="http://www.w3.org/2000/svg" class="select" height="1em" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>
       <svg xmlns="http://www.w3.org/2000/svg" class="unselect" height="1em" viewBox="0 0 576 512"><path d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.6 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"/></svg>
    </div>
 </div>`;
}

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
    switch: []
}

const translation_callbacks = {
    selected: [],
    loaded: []
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

        this.selected = 1;
        this.count = 0;
    }

    Init(element) {
        //Устанавливаем количество эпизодов
        this.count = element.last_episode;

        $(".episodes > .value > .episode").remove();

        for (let i = 1; i < this.count + 1; i++) {
            const html = `<span class="episode" data-index="${i}">${i}<span class="ep-name">EP</span></span>`;
            $(".episodes > .value").append(html);
        }

        //Инициалзация функционала
        this.#Functional();

        if (this.selected > this.count) {
            this.selected = 1;
        }

        this.#Animate({ episod: this.selected, event: () => { AutoScrollEpisodes(); } })

        this.#Dispatch('selected', { episode: this.selected, translation: this.Player.CTranslation.id, user_handler: false });
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
        $(`.episode[data-index]`).on("click", (e) => {
            const target = e.currentTarget;
            const episode = $(target).data("index");

            //Проверяем если эпизод не выбран то выбираем его
            if (!this.selected || this.selected != episode) {
                this.selected = episode;

                this.#Animate({ episod: this.selected });

                this.#Dispatch('selected', { episode, translation: this.Player.CTranslation.id, user_handler: true });
            }
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
        const element = $(".episodes > .value > .episode")[episod - 1];
        if (!element) {
            return;
        }
        if (this.#el) {
            anime({
                targets: this.#el,
                color: "#555657",
                easing: "easeOutElastic(1, 1)",
            });
        }
        this.#el = element;
        const left = $(element).position().left;
        const top = $(element).position().top + $(".episodes > .value").scrollTop();
        anime({
            targets: ".sel",
            top: top,
            easing: "easeOutElastic(1, 1)",
        });
        anime({
            targets: ".sel",
            left: left,
            complete: function (anim) {
                if (event) {
                    event();
                }
            },
            update: function (anim) {
                if (update) {
                    update(anim);
                }
            },
            easing: "easeOutElastic(1, 1)",
        });
        anime({
            targets: element,
            color: "#020202",
            easing: "easeOutElastic(1, 1)",
        });
    }

    /**
     * Подписка на событие
     * @param {keyof typeof episodes_callbacks} event - Название события (ключ из player_callbacks)
     * @param {*} callback - Функция-обработчик для события
     * @returns {void}
     */
    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
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
        this.saved = [] //Сохранненые ID озвучек (Избранное)
        this.selected = false; //Выбрана ли озвучка
        this.id = undefined; //ID Выбранной озвучки
        this.name = undefined; // Название выбранной озвучки
    }

    /**
     * Инициализация озвучек
     * @param {[{translation:{id:number, title:string},last_episode:number}]} data 
     */
    Init(data, id) {
        if ($PARAMETERS.watch.dubanime) this.lskey = "save-translations-" + $ID;
        this.saved = JSON.parse(localStorage.getItem(this.lskey)) || [];

        if ($PARAMETERS.watch.dubanime) {
            for (let i = 0; i < Franchises.length; i++) {
                const fid = Franchises[i];
                this.saved = this.saved.concat(JSON.parse(localStorage.getItem(`save-translations-${fid}`)) || [])
            }
        }

        if (data.length != 0) {
            //Удалить заглушку
            $(".content-voices").empty();
        }

        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            const translation = element.translation;
            let finded = false;

            if (this.saved && this.saved.indexOf(translation.id) != -1) {
                finded = true;
            }

            $(".content-voices").append(_genVoice(translation.id, translation.title, element.last_episode, finded));

            if (!this.selected && finded && id === undefined) {
                this.Select({ id: translation.id });
            }
        }

        if (!this.selected && data.length > 0 && id === undefined) {
            this.Select({ id: data[0].translation.id });
        } else if (!this.selected && data.length > 0 && id) {
            this.Select({ id });
        }

        //Нажатие на перевод
        $(".voice > .voice-content").click((e) => {
            this.Select({ id: $(e.currentTarget).data("id"), user_handler: true });
        });

        //Добавить в избранное
        $(".voice > .voice-save").click((e) => {
            this.Favorites($(e.currentTarget).data("id"));
        });

        this.#Dispatch('loaded', this.Player);
    }

    Favorites(id) {
        const element = $(`.voice > .voice-save[data-id="${id}"]`);
        if (this.saved && this.saved.indexOf(id) != -1) {
            //Удаляем с избранных
            const index = this.saved.indexOf(id);
            this.saved.splice(index, 1);

            element.removeClass('select');
            //Если выбран текущий перевод
            if (this.id == id) {
                $(".translations-wrapper > .button-stars").removeClass("selected");
            }

        } else {
            //Добавляем в избранное
            this.saved.push(id);
            element.addClass('select');
            //Если выбран текущий перевод
            if (this.id == id) {
                $(".translations-wrapper > .button-stars").addClass("selected");
            }
        }

        //Сохраняем избранное
        localStorage.setItem(this.lskey, JSON.stringify(this.saved));
    }

    /**
     * Выберает озвучку для аниме
     * @param {{id: number, user_handler:boolean}} param0 
     */
    Select({ id, user_handler = false }) {
        if (this.id == id || id === undefined) return;

        const element = $(`.voice[data-id="${id}"]`)[0];
        const data = this.Player.results.find(x => x.translation.id == id);

        if (!data) return console.log('Translation not found');

        if (this.selected) {
            $(`.voice[data-id="${this.id}"]`).removeClass("select");
        }

        this.id = id; //Индентификатор озвучки
        this.selected = true;
        this.name = data.translation.title; //Название озвучки

        $(".current-translation > span").text(data.translation.title); //Название озвучки

        if (data.last_episode) {
            $(".count-current-translation").text(data.last_episode); //Last episode translation
        } else if (data) {
            $(".count-current-translation").text('1');
            $("#episodes").addClass('hide');
        }

        $(element).addClass("select");

        if (this.saved && this.saved.indexOf(id) != -1) {
            $(".translations-wrapper > .button-stars").addClass("selected");
        } else {
            $(".translations-wrapper > .button-stars").removeClass("selected");
        }

        this.#Dispatch('selected', { id: this.id, user_handler });
    }

    /**
     * Подписка на событие
     * @param {keyof typeof translation_callbacks} event - Название события (ключ из player_callbacks)
     * @param {*} callback - Функция-обработчик для события
     * @returns {void}
     */
    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
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
        //Продолжительность всего видео
        if (message.data.key == "kodik_player_duration_update") {
            this.Player.VData.duration = message.data.value;
        }

        //Текущее время видео
        if (message.data.key == "kodik_player_time_update") {
            this.Player.VData.time = message.data.value;
        }

        //Статус плеера изменен на паузу
        if (message.data.key == "kodik_player_pause") {
            this.#Dispatch('pause', this.Player.VData);
        }

        //Статус плеера изменен на воспроизведение
        if (message.data.key == "kodik_player_play") {
            this.#Dispatch('play', this.Player.VData);
        }

        //Статус плеера tunime ошибка
        if (message.data.key == "tunime_error") {
            this.#Dispatch('error', { value: message.data.value });
        }

        //Статус плеера переключение эпизода
        if (message.data.key == "tunime_next") {
            this.#Dispatch('next', this.Player);
        }

        // Альтернативный полный экран
        if (message.data.key == "tunime_fullscreen") {
            this.#Dispatch('fullscreen', { value: message.data.value });
        }

        // Переключение плеера
        if (message.data.key == "tunime_switch") {
            this.#Dispatch('switch', { value: message.data.value });
        }
    }

    /**
     * Подписка на событие
     * @param {keyof typeof message_callabcks} event - Название события (ключ из player_callbacks)
     * @param {*} callback - Функция-обработчик для события
     * @returns {void}
     */
    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
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

    constructor({ standart = false } = {}) {
        this.results = [];

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

        this.CTranslation.on('selected', ({ id }) => {
            // Порядковый номервыбраного елемента (озвучки)
            const idData = this.results.findIndex(x => x.translation.id == id);

            // Выбранный елемент текущей озвучки
            this.selected = this.results[idData];
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
                this.results = response.results;
                this.CTranslation.Init(this.results, kodik_dub);
                this.#Dispatch('inited', this.results);
                return resolve(this.results);
            });
        });
    }

    Switch() {
        this.name = this.name === "kodik" ? "tunime" : "kodik";
        this.#Update({ episode: this.CEpisodes.selected });
    }

    #Update({ episode }) {
        const uri = this.selected.link;
        this.loaded = false;
        let url = `${uri}?hide_selectors=true&episode=${episode}`;
        if (this.name === "tunime") {
            url = `player.html?id=${this.selected.id}&e=${episode}`
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
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
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