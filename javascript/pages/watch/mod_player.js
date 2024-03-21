import { AutoScrollEpisodes } from "./mod_scrolling.js";
import { $ID } from "../watch.js";

//Управление плеером аниме
const player = {
    data: [],
    loaded: false, //Загрузился ли плеер (нужно для его управления)
    loaded_int: 0, // Количество раз загрузки
    data_uri: undefined, //Ссылка на плеер kodik
    data_id: undefined,
    alredy: false, // Готов плеер (ссылки для загрузки) для загрузки
    name: 'kodik', //Название запущеного плеера

    uri: function (url) {
        this.data_uri = url;
    },

    translation: {
        key: "save-translations", // <- Ключ localstorage
        id: undefined, // <- Текущая выбранная озвучка аниме
        name: NaN, // <- Текущие название озвучки
        selected: false, // <- Выбранна ли озвучка

        saved: [], // <- Сохраненые озвучки id (Избранное)

        //События связанные с озвучками
        events: {
            selected: [],

            /**
             * Событие выбора озвучки аниме программно и пользователем пользователем
             * @param {Function} e - функция для вызова
             */
            onselected: function (e) {
                if (typeof e == "function" && e.length > 0) {
                    this.selected.push(e);
                }
            }
        },

        /**
         * Инициализация управление переводами аниме
         * @param {Object} data - данные с kodik
         */
        init: function (data) {
            if ($PARAMETERS.watch.dubanime) this.key = "save-translations-" + $ID;
            this.saved = JSON.parse(localStorage.getItem(this.key));
            this.saved = this.saved ? this.saved : [];

            //Проверяем что доступны озвучки в аниме
            if (data.length != 0) {
                //Удаляем заглушку
                $(".content-voices").empty();
            }

            for (let i = 0; i < data.length; i++) {
                const element = data[i];
                const translation = element.translation;
                let finded = false;

                //Ищем в сохраненый переводах
                if (this.saved && this.saved.indexOf(translation.id) != -1) {
                    finded = true;
                }

                $(".content-voices").append(_genVoice(translation.id, translation.title, element.last_episode, finded));

                //Выбрать дефолт
                if (!this.selected && finded) {
                    this.select(translation.id);
                }
            }

            if (!this.selected && data.length > 0) {
                this.select(data[0].translation.id);
            }

            //Нажатие на перевод
            $(".voice > .voice-content").click((e) => {
                this.select($(e.currentTarget).data("id"), true);
            });

            //Добавить в избранное
            $(".voice > .voice-save").click((e) => {
                this.favorites($(e.currentTarget).data("id"));
            });

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
        },

        /**
         * Выберает озвучку аниме
         * @param {Int} id - перевода
         */
        select: function (id, user_handler = false) {
            if (this.id == id) return;
            // Проверяем на существование такго обьекта в DOM
            const element = $(`.voice[data-id="${id}"]`)[0];
            const data = player.data.find((x) => x.translation.id == id);

            if (this.selected) {
                $(`.voice[data-id="${this.id}"]`).removeClass("select");
            }

            this.id = id; //Индентификатор озвучки
            this.selected = true;
            this.name = data.translation.title;//Название озвучки

            $(".current-translation > span").text(data.translation.title); //Title translation
            $(".count-current-translation").text(data.last_episode); //Last episode translation
            $(element).addClass("select");

            //Проверяем что выбранная озвучка в избранном
            if (this.saved && this.saved.indexOf(id) != -1) {
                $(".translations-wrapper > .button-stars").addClass("selected");
            } else {
                $(".translations-wrapper > .button-stars").removeClass("selected");
            }

            player.selectedTranslation(this.id);

            //Событие выбора озвучки
            this.events.selected.forEach((event) =>
                event(this.id, user_handler)
            );
        },

        /**
         * Добавляет озвучку в избранное
         * @param {Int} id - перевод
         */
        favorites: function (id) {
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
            localStorage.setItem(this.key, JSON.stringify(this.saved));
        },
    },

    episodes: {
        episodes_count: 0,
        last_episode: 0,
        selected_episode: 1,

        events: {
            clicked: [],
            load: [],

            onclicked: function (e) {
                if (typeof e == "function" && e.length > 0) {
                    this.clicked.push(e);
                }
            },

            onload: function (e) {
                if (typeof e == "function" && e.length > 0) {
                    this.load.push(e);
                }
            },
        },

        ShowEpisodes: function () {
            AddEpisodes(this.last_episode);

            function AddEpisodes(i = 1) {
                $(".episodes > .value > .episode").remove();

                for (let index = 1; index < i + 1; index++) {
                    const html = `<span class="episode" data-index="${index}">${index}<span class="ep-name">EP</span></span>`;
                    $(".episodes > .value").append(html);
                }

                Init(); //Инициализация функционала
                //При инициализации проверяем выбраный эпизод и если эпизод выше возможного то изменяем на 1ый эпизод
                if (player.episodes.selected_episode > player.episodes.last_episode) {
                    player.episodes.selected_episode = 1;
                }
                //Анимируем выбор первого эпизода автоматически
                player.episodes.AnimateSelect(player.episodes.selected_episode, () => { AutoScrollEpisodes(); });
                //Даем плееру задачу обновить свои данные
                player.update();
                //Вызываем событие обновление/изменение эпизодв
                player.episodes.events.load.forEach((event) =>
                    event(player.episodes.episodes_count)
                );
            }

            /**
             *  Инициадизирует функционал кнопок епизодов
             */
            function Init() {
                $(`.episode[data-index]`).on("click", function (e) {
                    const target = e.currentTarget;
                    let episode = $(target).data("index"); //Епизод
                    //Проверяем если эпизод не выбран, выбираем его, делаем анимацию выбора, изменяем плеер
                    if (
                        !player.episodes.selected_episode ||
                        player.episodes.selected_episode != episode
                    ) {
                        //Вызываем подписанные события
                        player.episodes.events.clicked.forEach((event) =>
                            event(episode, player.translation.id)
                        );
                        //Выбираем эпизод
                        player.episodes.selected_episode = episode;
                        //Анимируем выбор эпизода
                        player.episodes.AnimateSelect(episode);
                        //Указываем плееру что были обновленны данные
                        player.update();
                    }
                });
            }
        },

        /**
         * Делает анимацию выбора эпизода
         * @param {Int} i - выбранный епизод
         * @param {Event} e - событие после выполнение анимации
         * @param {Event} u - событие обновление данных анимции - передается текущая анимация anime
         * @returns
         */
        AnimateSelect: function (i = 1, e, u) {
            const element = $(".episodes > .value > .episode")[i - 1];
            if (!element) {
                return;
            }
            if (this.selected) {
                anime({
                    targets: this.selected,
                    color: "#555657",
                    easing: "easeOutElastic(1, 1)",
                });
            }
            this.selected = element;
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
                    if (e) {
                        e();
                    }
                },
                update: function (anim) {
                    if (u) {
                        u(anim);
                    }
                },
                easing: "easeOutElastic(1, 1)",
            });
            anime({
                targets: element,
                color: "#020202",
                easing: "easeOutElastic(1, 1)",
            });
        },
    },

    events: {
        loaded: [],
        paused: [],
        played: [],
        error: [],
        next: [],
        fullscreen: [],
        alredy: [],

        /**
         * Подписывается на обработчик загрузки плеера
         * @param {Function} e - Событие которое будет вызвано
         */
        onloaded: function (e) {
            if (typeof e == "function" && e.length > 0) {
                this.loaded.push(e);
            }
        },

        onpause: function (e) {
            if (typeof e == "function" && e.length > 0) {
                this.paused.push(e);
            }
        },

        onplayed: function (e) {
            if (typeof e == "function" && e.length > 0) {
                this.played.push(e);
            }
        },

        onerror: function (e) {
            if (typeof e == "function" && e.length > 0) {
                this.error.push(e);
            }
        },

        onnext: function (e) {
            if (typeof e == "function" && e.length > 0) {
                this.next.push(e);
            }
        },

        onfullscreen: function (e) {
            if (typeof e == "function" && e.length > 0) {
                this.fullscreen.push(e);
            }
        },

        onalredy: function (e) {
            if (typeof e == "function" && e.length > 0) {
                this.alredy.push(e);
            }
        }
    },

    functional: {
        methods: [
            "play", // Запуск плеера
            "pause", // Пауза
            "seek", // Перемотка на заданную точку. Время указывается в секундах
            "volume", // Изменение громкости. Значение громкости может быть от 0 до 1
            "mute", // Выключение звука
            "unmute", // Включение звука
            "change_episode", // Переключение серии
            "enter_pip", // Вход в режим "Картинка в картинке"
            "exit_pip", // Выход из режима "Картинка в картинке"
            "get_time", // Получение текущего времени
            "set_episode" //Включение эпизода (только Tunime Player)
        ],

        /**
         * Функция для вызова управления плеером
         * @param {String} method - метод функции
         * @param {Object} data - данныне для отправки
         */
        control: function (method = this.methods[0], data = {}) {
            if (!player.loaded) {
                return;
            }

            let value = Object.assign({ method }, data);

            document.querySelector("#kodik-player").contentWindow.postMessage({ key: "kodik_player_api", value: value }, '*');
        }
    },

    video_data: {
        duration: 0, //Продолжительность эпизода
        time: 0, //Текущее время просмотра
    },

    /**
     * Вабрана озвучка аниме
     * * @param {Int} id - перевод
     */
    selectedTranslation: function (id) {
        //Id текущего елемента перевода
        const idData = this.data.findIndex((x) => x.translation.id == id);

        //Елемент который выбрал пользователь
        const element = this.data[idData];

        //Устанавливаем url адрес плеера
        this.uri(element.link);
        this.data_id = element.id;

        //Устанавливаем количество еаизодов
        this.episodes.episodes_count = element.episodes_count;
        this.episodes.last_episode = element.last_episode;

        //Отображаем епизоды пользователю
        this.episodes.ShowEpisodes();
    },

    /**
     * Событие изменение данных плеера
     */
    update: function (standart = $PARAMETERS.player.standart) {
        //Выбранный эпизод
        const episode = this.episodes.selected_episode;

        //Проверяем эпизод на наличие данных
        if (!episode) {
            console.log("Ошибка с выбранным епизодом");
            return;
        }

        //Проверяем на наличие ссылки на плеер
        if (!this.data_uri) {
            console.log("Ошибка с ссылкой на плеер", this.data_uri);
            return;
        }

        //Указываем что плеер не загружен
        this.loaded = false;

        //Изменяем ссылку на плеер (не используем тег src для того чтобы не созранять его в истори браузера)

        let url = this.data_uri + "?hide_selectors=true" + "&episode=" + episode
        this.name = "kodik";
        if (standart) {
            url = `player.html?id=${this.data_id}&e=${episode}`;
            this.name = "tunime";
        }

        if (!this.alredy) {
            this.alredy = true;
            this.events.alredy.forEach((event) => event(this.alredy));
        } else {
            document.querySelector("#kodik-player").contentWindow.location.replace(url);
        }

        //Вызываем функцию которая будет отслеживать загрузился ли плеер и добавлять количество какой раз загрузился плеер
        this.loading();
    },

    /**
     * Функция ожидание загрузки плеера
     */
    loading: function () {
        //Находим елемент на страницe
        const element = document.querySelector("#kodik-player");
        if (element) {
            let interval;

            interval = setInterval(() => {
                try {
                    if (element.contentWindow.document) {
                        if (element.contentWindow.window.location.href.indexOf("player") != -1) {
                            //Очищаем интервао
                            clearInterval(interval);

                            //Устанавливаем значения
                            this.loaded = true;
                            this.loaded_int++;

                            //Вызываем событие
                            this.events.loaded.forEach((event) => event(this.loaded_int));
                        }
                    }
                    //Когда плеер загрузится будет ошибка CORS
                } catch (error) {
                    //Очищаем интервао
                    clearInterval(interval);

                    //Устанавливаем значения
                    this.loaded = true;
                    this.loaded_int++;

                    //Вызываем событие
                    this.events.loaded.forEach((event) => event(this.loaded_int));
                }
            }, 100);
        }
    },

    /**
     *
     * @param {Int} e - Эпизод аниме
     * @param {Int} d - ID дубляжа
     */
    loadAnime: function (e, d) {
        this.episodes.selected_episode = e;
        this.translation.select(d);
        this.episodes.AnimateSelect(e);
        this.update();
    },

    saveAnime: function () { },

    playerMessage: function (message) {
        //Продолжительность всего видео
        if (message.data.key == "kodik_player_duration_update") {
            player.video_data.duration = message.data.value;
        }

        //Текущее время видео
        if (message.data.key == "kodik_player_time_update") {
            player.video_data.time = message.data.value;
        }

        //Статус плеера изменен на паузу
        if (message.data.key == "kodik_player_pause") {
            //Вызываем событие
            player.events.paused.forEach((event) => event(player.video_data));
        }

        //Статус плеера изменен на воспроизведение
        if (message.data.key == "kodik_player_play") {
            //Вызываем событие
            player.events.played.forEach((event) => event(player.video_data));
        }

        //Статус плеера tunime ошибка
        if (message.data.key == "tunime_error") {
            //Вызываем событие
            player.events.error.forEach((event) => event(message.data.value));
        }

        //Статус плеера переключение эпизода
        if (message.data.key == "tunime_next") {
            player.events.next.forEach((event) => event(player));
        }

        if (message.data.key == "tunime_fullscreen") {
            player.events.fullscreen.forEach((event) => event(message.data.value));
        }
    },

    /**
     * Инизиализирует обьект на правильную работу
     * @param {Object} data - ответ с ресурса kodikDB
     */
    init: function (data) {
        this.data = data;
        this.translation.init(this.data);

        //Прослушиваем данные которые присылает нам плеер kodik
        if (window.addEventListener) {
            window.addEventListener("message", this.playerMessage);
        } else {
            window.attachEvent("onmessage", this.playerMessage);
        }

        //Отслеживаем изменение ориентации экрана для правильного отображения выбраного эпизода
        window.addEventListener("orientationchange", function () {
            player.episodes.AnimateSelect(player.episodes.selected_episode, () => { AutoScrollEpisodes() });
        });
    },
};

export const Player = () => { return player; }