import { AutoScrollEpisodes } from "./mod_scrolling.js";
import { $ID } from "../watch.js";

//Управление плеером аниме
const player = {
    data: [],
    loaded: false, //Загрузился ли плеер (нужно для его управления)
    loaded_int: 0,
    data_uri: undefined, //Ссылка на плеер kodik
    data_id: undefined,

    uri: function (url) {
        this.data_uri = url;
    },

    translation: {
        key: "save-translations",
        id: undefined,
        name: NaN,
        selected: false,

        saved: [],

        events: {
            selected: [],

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

            for (let i = 0; i < data.length; i++) {
                const element = data[i];
                const translation = element.translation;
                let finded = false;

                //Ищем в сохраненый переводах
                if (this.saved && this.saved.indexOf(translation.id) != -1) {
                    finded = true;
                }

                $(".translations--list")
                    .append(`<div class="translations--list--element" data-id="${translation.id
                        }">
                  <div class="translations--list--element--icon-title" data-id="${translation.id
                        }">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                          <path d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z"></path>
                      </svg>
                      <span>${translation.title}</span>
                  </div>
                  <div class="translations--list--element--count-save">
                      <div class="translations--list--element--count-save--count">${element.last_episode ? element.last_episode : 1
                        }</div>
                      <div class="translations--list--element--count-save--save ${finded ? "saved-translation" : ""
                        }" data-id="${translation.id}">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="${finded
                            ? "M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"
                            : "M287.9 0C297.1 0 305.5 5.25 309.5 13.52L378.1 154.8L531.4 177.5C540.4 178.8 547.8 185.1 550.7 193.7C553.5 202.4 551.2 211.9 544.8 218.2L433.6 328.4L459.9 483.9C461.4 492.9 457.7 502.1 450.2 507.4C442.8 512.7 432.1 513.4 424.9 509.1L287.9 435.9L150.1 509.1C142.9 513.4 133.1 512.7 125.6 507.4C118.2 502.1 114.5 492.9 115.1 483.9L142.2 328.4L31.11 218.2C24.65 211.9 22.36 202.4 25.2 193.7C28.03 185.1 35.5 178.8 44.49 177.5L197.7 154.8L266.3 13.52C270.4 5.249 278.7 0 287.9 0L287.9 0zM287.9 78.95L235.4 187.2C231.9 194.3 225.1 199.3 217.3 200.5L98.98 217.9L184.9 303C190.4 308.5 192.9 316.4 191.6 324.1L171.4 443.7L276.6 387.5C283.7 383.7 292.2 383.7 299.2 387.5L404.4 443.7L384.2 324.1C382.9 316.4 385.5 308.5 391 303L476.9 217.9L358.6 200.5C350.7 199.3 343.9 194.3 340.5 187.2L287.9 78.95z"
                        }"></path></svg>
                      </div>
                  </div>
              </div>`);

                //Выбрать дефолт
                if (!this.selected && finded) {
                    this.select(translation.id);
                }
            }

            if (!this.selected && data.length > 0) {
                this.select(data[0].translation.id);
            }

            //Нажатие на перевод
            $(".translations--list--element--icon-title").click((e) => {
                this.select($(e.currentTarget).data("id"), true);
            });

            //Добавить в избранное
            $(".translations--list--element--count-save--save").click((e) => {
                this.favorites($(e.currentTarget).data("id"));
            });
        },

        /**
         * Выберает озвучку аниме
         * @param {Int} id - перевода
         */
        select: function (id, user_handler = false) {
            // Проверяем на существование такго обьекта в DOM
            const element = $('.translations--list--element[data-id="' + id + '"]')[0];
            const data = player.data.find((x) => x.translation.id == id);

            if (this.selected) {
                $($('.translations--list--element[data-id="' + this.id + '"]')[0]).removeClass("hide");
            }

            this.id = id; //Индентификатор озвучки
            this.selected = true;
            this.name = data.translation.title;//Название озвучки

            $(element).addClass("hide");
            $(".translations--current--object--icon-title > span").text(data.translation.title); //Title translation
            $(".translations--current--object--count").text(data.last_episode); //Last episode translation
            $(".translations--list").addClass("hide");
            $("body").removeClass("loading");

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
            const element = $('.translations--list--element--count-save--save[data-id="' + id + '"]');
            if (this.saved && this.saved.indexOf(id) != -1) {
                //Удаляем с избранных
                const index = this.saved.indexOf(id);
                this.saved.splice(index, 1);

                element.find("svg > path").attr("d", "M287.9 0C297.1 0 305.5 5.25 309.5 13.52L378.1 154.8L531.4 177.5C540.4 178.8 547.8 185.1 550.7 193.7C553.5 202.4 551.2 211.9 544.8 218.2L433.6 328.4L459.9 483.9C461.4 492.9 457.7 502.1 450.2 507.4C442.8 512.7 432.1 513.4 424.9 509.1L287.9 435.9L150.1 509.1C142.9 513.4 133.1 512.7 125.6 507.4C118.2 502.1 114.5 492.9 115.1 483.9L142.2 328.4L31.11 218.2C24.65 211.9 22.36 202.4 25.2 193.7C28.03 185.1 35.5 178.8 44.49 177.5L197.7 154.8L266.3 13.52C270.4 5.249 278.7 0 287.9 0L287.9 0zM287.9 78.95L235.4 187.2C231.9 194.3 225.1 199.3 217.3 200.5L98.98 217.9L184.9 303C190.4 308.5 192.9 316.4 191.6 324.1L171.4 443.7L276.6 387.5C283.7 383.7 292.2 383.7 299.2 387.5L404.4 443.7L384.2 324.1C382.9 316.4 385.5 308.5 391 303L476.9 217.9L358.6 200.5C350.7 199.3 343.9 194.3 340.5 187.2L287.9 78.95z");
                element.removeClass("saved-translation");
            } else {
                //Добавляем в избранное
                this.saved.push(id);
                element.find("svg > path").attr("d", "M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z");
                element.addClass("saved-translation");
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
            "get_time" // Получение текущего времени
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
        const idData = this.data.findIndex((x) => x.translation.id === id);
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
    update: function () {
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
        if ($PARAMETERS.player.standart) {
            url = `tunimeplayer.html?id=${this.data_id}&e=${episode}`;
        }
        document
            .querySelector("#kodik-player")
            .contentWindow.location.replace(
                url
            );

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
                        if (element.contentWindow.window.location.href.indexOf("tunimeplayer") != -1) {
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