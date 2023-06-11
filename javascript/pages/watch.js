//ID ресурса из Shikimori
const $ID = new URLSearchParams(window.location.search).get("id");

//Продолжение просмотра
let $CONTINUE = new URLSearchParams(window.location.search).get("continue");

//Все возможные статусы пользователя к текущему аниме
const anime_status = [
  { id: 0, name: "Посмотрю", sh: ["planned"] },
  { id: 1, name: "Смотрю", sh: ["watching", "rewatching", "on_hold"] },
  { id: 2, name: "Просмотрел", sh: ["completed"] },
  { id: 3, name: "Забросить", sh: ["dropped"] },
];

//Обьект управляем анимацией загрузки страницы
const load_page = {
  query: ".page-loading",

  /**
   * Remove animation loading page
   * @param {Event} e The event call when loaded.
   */
  loaded: async function (e = () => { }) {
    $(this.query).css("opacity", 0);
    await sleep(600);
    $("body").removeClass("loading");
    $(this.query).css("display", "none");
    e();
  },

  /**
   * Showing animtion loading page
   * @param {Event} e The event call when showed animation loading
   */
  show: async function (e = () => { }) {
    $(this.query).css("display", "block");
    $("body").addClass("loading");
    $(this.query).css("opacity", 1);
    await sleep(600);
    e();
  },
};

//Управление плеером аниме
const player = {
  data: [],
  loaded: false, //Загрузился ли плеер (нужно для его управления)
  loaded_int: 0,
  data_uri: undefined, //Ссылка на плеер kodik

  uri: function (url) {
    this.data_uri = url;
  },

  translation: {
    key: "save-translations",
    id: undefined,
    name: NaN,
    selected: false,

    saved: [],

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
        this.select($(e.currentTarget).data("id"));
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
    select: function (id) {
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
        player.episodes.AnimateSelect(player.episodes.selected_episode);
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
      const top =
        $(element).position().top + $(".episodes > .value").scrollTop();
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
    document
      .querySelector("#kodik-player")
      .contentWindow.location.replace(
        this.data_uri + "?hide_selectors=true" + "&episode=" + episode
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
      player.episodes.AnimateSelect(player.episodes.selected_episode);
    });
  },
};

//Управление историей
const History = {
  shikiData: undefined,
  key: "last-watch",
  maxItems: 5,
  idImage: 0,

  get() {
    return JSON.parse(localStorage.getItem(this.key)) ?? [];
  },

  set(history) {
    localStorage.setItem(this.key, JSON.stringify(history));
  },

  /**
   * Добавляет в историю последних просмотренных аниме для быстрого доступа
   * @param {Boolean} cnt - требуется ля продолжение просмотра
   * @param {Int} duration - текущий таймлайн эпизода
   * @param {Int} i - прибавка эпихода если необходимо (Для переклбчение следующего эпизода)
   * @param {Int} e - текущий эпизод
   */
  add(cnt = false, duration = 0, i = 0, e = player.episodes.selected_episode) {
    if (!this.shikiData) {
      return;
    }
    const history = this.get();
    const { russian, screenshots } = this.shikiData;
    const episode = cnt ? e + i : e + i;
    const image = `${screenshots[this.idImage].original}`;
    const dub = player.translation.name;
    const type = this.shikiData.kind == "movie" ? "Фильм" : this.shikiData.kind == "ova" ? "OVA" : this.shikiData.kind == "ona" ? "ONA" : "Аниме";

    const item = {
      id: $ID,
      continue: cnt,
      duration,
      fullduration: player.video_data.duration,
      episode,
      name: russian,
      image,
      dub,
      type,
      idImg: this.idImage
    };

    const index = history.findIndex((item) => item.id === $ID);

    if (index !== -1) {
      history.splice(index, 1);
    }

    history.unshift(item);

    if (history.length > this.maxItems) {
      history.pop();
    }

    this.set(history);
  },

  //Индивидуальные функции
  custom: {
    /**
     * Инициализация после загрузки изображений slide
     */
    init: function () {
      let history = History.get();
      //Находим ID елемента из списка
      let id = history.findIndex((x) => { return x.id == $ID });

      //Проверяем что есть елемент из истории
      if (history[id]) {
        this.have = true;
        //Получаем ID изображения или стандартное значение 0
        let count = history[id].idImg ? history[id].idImg : 0;
        //Устанавливаем значение в History.idImage
        History.idImage = count;
      }

      //Показываем выбор в визуале
      SetImage();

      //Записуемся на функционал клик по изображение изменение idImage
      $('.galery-slider > .slide').click((e) => {
        let idImage = $(e.currentTarget).data('id');
        History.idImage = idImage ? idImage : 0;
        SetImage();
      });

      function SetImage() {
        $(`.galery-slider > .slide.select`).removeClass('select');
        $(`.galery-slider > .slide[data-id="${History.idImage}"]`).addClass('select');
      }
    }
  }
};

//Управление пользователем
const user = {
  rate: undefined, //Даные пользователя об аниме
  id: undefined, //Текущий статус аниме
  logged: false, //Авторизирован ли пользователь

  events: {
    /**
     * Изменяет статус аниме в shikimori
     * @param {Int} id - выбраный статус
     */
    changeStatus: function (id) {
      //Проверяем авторизирован ли пользоваетль
      if (user.logged) {
        //Проверяем есть ли у этого аниме rate (данные)
        if (user.rate) {
          //Если нажали на активный статус
          if (user.id == id) {
            //Удаляем данные об аниме
            this.removeData();
          } else {
            //Обновляем данные на новые данные
            this.updateData(id);
          }
        } else {
          //Нет данных и статус не совпадает
          if (user.id != id) {
            //Создаем user rate
            this.updateData(id);
          }
        }
      }
    },

    /**
     * Устанавливает эпизод аниме в user_rate
     * @param {Int} e - Текущий эпизод аниме
     * @param {String} s - Текущий статус
     */
    setEpisode: function (e, s = anime_status[1].sh[0]) {
      if (user.logged) {
        if (user.rate) {
          shikimoriApi.User_rates.id(user.rate.id, async (res) => {
            if (res.failed && res.status == 429) {
              await sleep(1000);
              return this.setEpisode(e, s);
            }

            user.rate = res;
            user.status();
            user.setStatus();
          }).PATCH({ "user_rate": { "episodes": e, "status": s } });
        }
      }
    },

    /**
     * Устанавливает оценку аниме в user_rate
     * @param {Integer} s - значение оценки
     * @returns Ничего не возвращает
     */
    setScore: function (s) {
      if (!user.logged && !user.rate) {
        return;
      }

      shikimoriApi.User_rates.id(user.rate.id, async (res) => {
        if (res.failed && res.status == 429) {
          await sleep(1000);
          return this.setScore(s);
        }

        user.rate = res;
        user.status();
        user.setStatus();
      }).PATCH({ "user_rate": { "score": s } });
    },

    /**
     * Устанавливает значение text (коментарий) anime в user_rate
     * @param {String} s - коментарий к аниме
     * @returns Ничего не возвращает
     */
    setComment: function (s) {
      if (!user.logged && !user.rate) {
        return;
      }

      shikimoriApi.User_rates.id(user.rate.id, async (res) => {
        if (res.failed && res.status == 429) {
          await sleep(1000);
          return this.setComment(s);
        }

        user.rate = res;
        user.status();
        user.setStatus();
      }).PATCH({ "user_rate": { "text": s } });

    },

    /**
     * Обновляет или создает user_rate
     * @param {Int} id - статус 
     */
    updateData: function (id) {
      shikimoriApi.User_rates.user_rates({}, async (res) => {
        if (res.failed && res.status == 429) {
          await sleep(1000);
          return this.createData(id);
        }
        user.rate = res;
        user.status();
        user.setStatus();
      }, { "user_rate": { "status": anime_status[id].sh[0], "target_id": $ID, "target_type": "Anime", "user_id": usr.Storage.Get('access_whoami').id } }).POST();
    },

    /**
     * Удаляет user_rate
     */
    removeData: function () {
      shikimoriApi.User_rates.id(user.rate.id, async (res) => {
        if (res.failed && res.status == 429) {
          await sleep(1000);
          return this.removeData();
        }
      }).DELETE();
      user.rate = undefined;
      user.id = undefined;
      user.unselect();
    }
  },

  /**
   * Инициализация пользователя
   * @param {Object} obj - user_rate shikimori data
   * @param {Boolean} lgd - авторизирован ли пользователь
   */
  init: function (obj, lgd) {
    this.logged = lgd;
    if (obj.user_rate) {
      this.rate = obj.user_rate;
      this.status();
      this.setStatus();
    }

    $('.cur-status > .icon').click(() => {
      this.events.changeStatus($('.cur-status').data('id'));
    });
    $('.list-status > .status').click((e) => {
      this.events.changeStatus($(e.currentTarget).data('id'));
    });
  },

  /**
   * Достает статус из данных
   */
  status: function () {
    const i = anime_status.findIndex(x => x.sh.includes(this.rate.status));
    this.id = anime_status[i].id;
  },

  /**
   * Устанавливает статус для аниме
   * @param {Int} id - статус 
   */
  setStatus: function (id = this.id) {
    //Отоброжаем скрытый елемент
    $('.list-status > .hide').removeClass('hide');

    //Изменяем текст на выбраный статус
    $(`.cur-status > .icon > .text`).text(anime_status[id].name);
    //Изменяем иконку на выбраный статус
    $(`.cur-status > .icon > .safe-area`).html($(`.status[data-id="${id}"] > .safe-area > svg`).clone());

    //Скрываем выбранный статус
    $(`.status[data-id="${id}"]`).addClass('hide');

    //Закрашиваем выбранный статус
    $('.cur-status > .icon').addClass('selected');

    //Изменяем ид выбраного статуса
    $('.cur-status').data('id', id);

    //Если у статуса есть оценка то перекращиваем кнопку оценено
    if (this.rate.score > 0) {
      $('.lb > .btn').addClass('fill');
      $('.user-rate-score').text(`${this.rate.score}/10`);
    }
  },

  unselect: function () {
    $('.cur-status > .icon').removeClass('selected');
  }
}

const WindowScore = {
  /**
  * Инициализация функции окна, запускается если прошел верификацию (this.verif)
  */
  init: function () {
    let whoami = usr.Storage.Get(usr.Storage.keys.whoami);

    //Кнопка закрытия окна
    $('.block-close>.btn.close').click(() => {
      this.hide();
      WindowManagment.hide();
    });

    //Проверяем на наличие у пользователя user_rate
    if (user.rate) {
      //Проверяем оценку пользователя
      if (user.rate.score != 0) {
        //Если есть оценка, то устанавливаем значение в input и включаем кнопку очистки значения
        $('.range > label > input').val(user.rate.score);
        $('.range-score > .rm-score').removeClass('disabled');
        //Изменяем title на оценено
        $('.content-score > .content-wraper > .block-close > .title').text("Оценено");
      }

      //Проверяем комментарий пользователя
      console.log(user.rate);
      if (user.rate.text) {
        //Устанавливаем значения комментария в input
        $('.comment-wrap > label > textarea').val(user.rate.text);
        auto_grow(document.querySelector('.comment-wrap > label > textarea'));
        //Изменяем кнопку на удалить

      }
    }

    //Устанавливаем для комментариев аватарку пользоватея
    $('.comment-wrap > .avatar > img').attr('src', whoami.image['x160']);

    //Отслеживаем изменения оценки пользователем
    $('.range > label > input').change(function () {
      const val = this.value;
      if (val <= 0) {
        return;
      }
      user.events.setScore(val);
      $('.range-score > .rm-score').removeClass('disabled');
      //Изменяем title на оценено
      $('.content-score > .content-wraper > .block-close > .title').text("Оценено");
    });

    //Отслеживаем изменение нажатие на кнопку очистить оценку
    $('.range-score > .rm-score').click(function () {
      if ($(this).hasClass('disabled')) {
        return;
      }

      user.events.setScore(0);
      $('.range-score > .rm-score').addClass('disabled');
      //Изменяем title на оценено
      $('.content-score > .content-wraper > .block-close > .title').text("Оценить");
    })

    $('.content-score > .content-wraper > .btn-commit').click(function () {
      const val = $('.comment-wrap > label > textarea').val();
      if (!val && val.length >= 0) {
        return;
      }
      user.events.setComment(val);
    });
  },

  /**
  * Отображение окна
  */
  show: async function () {
    $('.content-score').removeClass('hide');
    await sleep(10);
    $('.content-score').css('transform', 'translateY(0%)')
  },

  /**
  * Скрытие окна
  */
  hide: async function () {
    $('.content-score').css('transform', '');
    await sleep(300);
    $('.content-score').addClass('hide');
  },

  /**
  * Проверка для инициализация окна. Если проверка не нужна просто верни true
  * @returns Возвращает boolean
  */
  verif: function () {
    return WindowManagment.authorized;
  }
}

//Управление окнами визуала
const WindowManagment = {
  authorized: false,
  showed: false,

  target: {
    /**
     * Инициализация функции окна, запускается если прошел верификацию (this.verif)
     */
    init: function () { },
    /**
     * Отображение окна
     */
    show: function () { },
    /**
     * Скрытие окна
     */
    hide: function () { },
    /**
     * Проверка для инициализация окна. Если проверка не нужна просто верни true
     * @returns Возвращает boolean
     */
    verif: function () { return true; },
  },

  init: function (authorized) {
    this.authorized = authorized;
    $('.hide-window').click(() => {
      this.hide();
      this.target.hide();
    })
  },

  click: function (target = this.target) {
    if (!target.verif()) {
      return;
    }
    this.target = target;
    this.target.init();
    this.show();
    this.target.show();
  },

  hide: async function () {
    this.showed = false;
    let el = $('.windowed');
    $('.hide-window').css('opacity', 0);
    await sleep(300);
    el.addClass('hide');
    $('.hide-window').css('opacity', '');
  },

  show: async function () {
    this.showed = true;
    let el = $('.windowed.hide');
    el.css('display', 'block');
    await sleep(10);
    $('.hide-window').css('opacity', 1);
    el.removeClass('hide');
    el.css('display', '');
    await sleep(300);
    $('.hide-window').css('opacity', '');
  }
}

/*
 * Создание событий к визулу
 */
function Functional() {
  const VFClick = [
    { dom: ".anime-status > .cur-status > .more-status", func: ShowStatus },
    { dom: ".translations--current--object", func: ShowTranslations },
    { dom: ".title-player > .btn", func: SetPlayerDisplay },
    { dom: ".btn-back", func: BackToMainPage },
    { dom: ".btn-play > .btn", func: ShowPlayer },
    { dom: ".btn-wrapper.rb > .btn", func: ShareAnime },
    { dom: ".btn-wrapper.lb > .btn", func: ShowWindowScore },
  ];

  let showdStatus = false; // Показаны ли статусы аниме
  let enableCenter = false; // Включена ли отцентровка плеера в горизонтальном режиме

  for (let i = 0; i < VFClick.length; i++) {
    const element = VFClick[i];
    $(element.dom).click(element.func);
  }

  //Функция отцинтровки плеера в горизонтальном режиме
  //Из за того что обращается глобально должен быть вызван один раз
  (() => {
    let timer; // Внешний независимый таймер
    // Получаем ссылку на элемент, до которого нужно долистать
    const element = document.querySelector(".landscape-player");

    //Подписываемся на событие прокрутки
    window.addEventListener('scroll', function () {
      this.clearInterval(timer); // Очищаем интервал пока идет прокрутка
      //Устанавливаем таймер
      timer = setTimeout(function () {
        //Проверяем что функция включена (Включается в функии SetPlayerDisplay) и ориентацию устройства
        if (enableCenter && current_device_orientation == 'horizontal') {
          var scrollPosition = window.scrollY; // Текущеее полажение страницы scroll
          var elementPosition = element.getBoundingClientRect().top + window.scrollY; // Позиция елемента
          var elementHeight = element.offsetHeight; // Высота елемента

          if (Math.abs(scrollPosition - elementPosition) < elementHeight * 0.4) {
            // Код, который нужно выполнить, если разница между scroll и элементом меньше 40%
            element.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });
          } else {
            // Код, который нужно выполнить, если разница между scroll и элементом больше или равна 40%
            enableCenter = false; // Отключаем центровку
          }
        }
      }, 500);
    });
  })();

  //Добавляет из параметров настройку положение плеера в горизонтальном режиме
  $('.landscape-player').addClass('reverse-' + $PARAMETERS.watch.episrevers);

  /**
   * Отображает статус аниме
   */
  function ShowStatus() {
    if (!showdStatus) $(".anime-status").addClass("show-more");
    else $(".anime-status").removeClass("show-more");
    showdStatus = !showdStatus;
  }

  /**
   * Отображение окна с оцениваением
   */
  function ShowWindowScore() {
    WindowManagment.click(WindowScore);
  }

  /**
   * Отображает все возможные озвучки аниме
   */
  function ShowTranslations() {
    //Отключаем отцинтровку плеера из за того что они расположены рядом и код может неправильно отработать и навеститьь на плеер во время выбора озвучки
    enableCenter = false;
    //Получаем bool скрыт ли лист переводов
    const show_list = $(".translations--list").hasClass("hide") ? true : false;
    //Скрываем либо показываем
    show_list
      ? $(".translations--list").removeClass("hide")
      : $(".translations--list").addClass("hide");
    //Пролистать до открытого списка
    if (show_list && player.data.length > 1) {
      $("body").addClass("loading");
      let element = document.getElementsByClassName("translations--current")[0];
      let elementPosition = element.getBoundingClientRect().top;
      let windowHeight = window.innerHeight;
      let elementHeight = element.offsetHeight;
      let bottomOffset = 10;
      let offsetPosition =
        elementPosition +
        window.pageYOffset -
        windowHeight +
        elementHeight +
        bottomOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "auto",
      });
    } else {
      $("body").removeClass("loading");
    }
  }

  /**
   * Выравнивает плеер по центру для горизонтальных экранов
   */
  function SetPlayerDisplay() {
    // Получаем ссылку на элемент, до которого нужно долистать
    const element = document.querySelector(".landscape-player");

    //Включаем функцию отцентровки экрана
    enableCenter = true;

    // Наводим на плеер
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }

  function BackToMainPage() {
    window.location.href = '/index.html';
  }

  function ShowPlayer() {
    document.getElementById('kodik-player').scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function ShareAnime() {
    navigator.share({
      title: $(document).attr("title"),
      text: $('meta[property="og:description"]').attr('content'),
      url: window.location.origin + window.location.pathname + '?id=' + $ID + '&share'
    }).catch((error) => $DEV.error('Sharing failed', error));
  }
}

Main((e) => {
  //Функционал страницы (контролеров)
  Functional();

  //Загрузка данных аниме shikimori
  LoadAnime(() => {
    //Завершаем анимацию загрузки страницы
    load_page.loaded();
  }, e);

  //Инициализация функции оценивание пользователя
  WindowManagment.init(e);

  //Загрузка данных аниме плеера kodik
  kodikApi.search({ shikimori_id: $ID }, (r) => {
    //Инициализируем плеер
    player.init(r.results);
  });

  //Подписываемся на обработчик событий для загрузки плеера
  //Этот обработчик будет загружать из сохранения последние аниме
  player.events.onloaded(async (i) => {
    //Если загружен только 1-й раз то загружаем наше сохранение
    if (i == 1) {
      let save = JSON.parse(localStorage.getItem($ID));

      if (!save) {
        return;
      }

      player.loadAnime(save.kodik_episode, save.kodik_dub);
    }
  });

  //Подписываемся на обработчик событий выбора эпизода
  //Этот обработчик будет сохранять последние выбраное аниме аниме
  player.episodes.events.onclicked((e, d) => {
    const data = {
      kodik_episode: e,
      kodik_dub: d,
    };

    //Сохраняем последние выбранное аниме
    localStorage.setItem($ID, JSON.stringify(data));

    //Добавляем истоию просмотра
    History.add(false, 0, 0, e);
  });

  //Подписываемся на обработчик событий пауза плеера
  player.events.onpause((d) => {
    History.add(true, d.time)
  });

  //Подписываемся на обрботчик событий
  player.events.onplayed((e) => {
    user.events.setEpisode(player.episodes.selected_episode);

    //Делаем проверку на продолжение воспроизведения anime
    if ($CONTINUE != null && $CONTINUE != false) {
      //Получаем историю спика продолжение просмотра
      let history = History.get();
      //Находим ID елемента из истории
      let id = history.findIndex((x) => { return x.id == $ID });

      //Если найдено и совпадают текущии эпизоды
      if (id != -1 && player.episodes.selected_episode == history[id].episode) {
        //Воспроизводим с остановившегося момента
        player.functional.control("seek", { seconds: history[id].duration });
        //Устанавливаем что продолжение было включено
        $CONTINUE = false;
      }
    }
  })
});

/**
 * Делает загрузку аниме данных с shikimori а также загружает картинку аниме в высоком разрешении
 * @param {Event} e функция вызывается после загрузки аниме
 * @param {Boolean} l авторизирован пользователь
 */
async function LoadAnime(e = () => { }, l = false) {
  const data = await LoadAnimeShikimori($ID);

  //Загружаем пользователя
  user.init(data, l);

  History.shikiData = data;

  //console.log(data);

  await SetAnimeImageAndTitle(data);
  SetGenres(data);
  SetDuration(data);
  SetStatus(data);
  SetGallery();
  SetDescription(data);
  SetHeroes();
  SetFranchise();
  SetSimiliar();
  SetStudio(data);
  SetTitle(data);
  MetaTags(data);

  e();

  scrollElementWithMouse('.similiar-anime');
  scrollElementWithMouse('.hero-anime');
  scrollElementWithMouse('.galery-slider');
  scrollElementWithMouse('#episodes');

  //Получение аниме из Shikimori
  /**
   * Возвращает данные об аниме
   * @param {Int} id - Anime
   * @returns {Object} Возвращает обьект аниме
   */
  async function LoadAnimeShikimori(id) {
    return new Promise((resolve) => {
      shikimoriApi.Animes.id(id, async (response) => {
        if (response.failed) {
          await sleep(1000);
          resolve(LoadAnimeShikimori(id));
        }
        resolve(response);
      }, l);
    });
  }

  /**
   * Получает ссылку на изображение из ресурса api.jikan.moe
   * @param {int} id - shikimori
   * @returns Ссылку на изображение
   */
  async function LoadImageJikan(id) {
    return new Promise((resolve) => {
      fetch("https://api.jikan.moe/v4/anime/" + id + "/full").then(
        async (response) => {
          let data = await response.json();
          resolve(data.data.images.webp.large_image_url);
        }
      );
    });
  }

  /**
   * Загружает изображение в ресурсы сайта
   * @param {String} src ссылка на ресурс
   * @returns String src - ссылка до ресура
   */
  async function AsyncLoadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      //img.crossOrigin = "Anonymous"; // to avoid CORS if used with Canvas
      img.src = src;
      img.onload = () => {
        resolve(src);
      };
      img.onerror = (e) => {
        reject(e);
      };
    });
  }

  /**
   * Устанавливает изображение аниме и данные(название, рейтинг)
   * @param {Object} data - обьект аниме
   */
  async function SetAnimeImageAndTitle(data) {
    const image = await LoadImageJikan($ID);
    $(".bg-paralax-img > img").attr("src", await AsyncLoadImage(image));
    $(".title-with-raiting > .title > .russian").text(data.russian);
    $(".title-with-raiting > .title > .name").text(data.name);
    $(".title-with-raiting > .raiting > span").text(data.score);
  }

  async function SetFranchise() {
    shikimoriApi.Animes.franchise($ID, async (res) => {
      if (res.failed && res.status == 429) {
        await sleep(1000);
        return SetFranchise();
      }
      //Проверяем если есть у нас фрашиза
      if (res.nodes) {
        //Отоброжаем блок с франшизой
        for (let i = 0; i < res.nodes.length; i++) {
          const element = res.nodes[i]; // Обьект с франшизой

          //Изначально франшизы скрыты, но после добавления отображаются

          //Отбираем франшизы по правилам пользователя
          if ($PARAMETERS.watch.typefrc.indexOf(element.kind) == -1) {
            continue;
          }

          //Создаем елемент
          const html = `<a data-id="${element.id}" class="${$ID == element.id ? "selected" : ""
            }"><div class="franchise"><div class="title">${element.name
            }</div><div class="type">${element.kind
            }</div></div><div class="year">${element.year}</div></a>`;

          //Добавляем елемент
          $(".franchisa-anime").append(html);
          //Отображаем франщизы
          $(".franchise-title, .franchisa-anime").css("display", "");
        }

        //Событие нажатие
        $(".franchisa-anime > a").click((e) => {
          //Перенаправляем пользователя без истории
          window.location.replace(
            "watch.html?id=" + $(e.currentTarget).data("id")
          );
        });
      }

      if (
        $PARAMETERS.watch.dubanime &&
        $PARAMETERS.watch.dubanimefrc &&
        res.nodes &&
        res.nodes.length > 0
      ) {
        res.nodes.forEach((element) => {
          let data = JSON.parse(
            localStorage.getItem("save-translations-" + element.id)
          );
          if (data && element.id != $ID) {
            data.forEach((element) => {
              $(
                `.translations--list--element--count-save--save[data-id="${element}"] > svg`
              ).css("fill", "yellow");
            });
          }
        });
      }
    });
  }

  async function SetSimiliar() {
    shikimoriApi.Animes.similar($ID, async (r) => {
      if (r.failed && r.status == 429) {
        await sleep(1000);
        return SetSimiliar();
      }
      $(".with-count > .similiar-count").text(r.length);
      if (r.length > 0) {
        $(".similiar-title , .similiar-anime").css("display", "");
      }
      for (let i = 0; i < r.length; i++) {
        const element = r[i];
        $(".similiar-anime").append(CreateElementAnime(element));
      }
    });

    //Функция создание елемента anime-card
    function CreateElementAnime(data) {
      return `<a href="/watch.html?id=${data.id}"  class="card-anime" data-id="${data.id}">
      <div class="card-content"><img src="https://moe.shikimori.me/${data.image.original}"><div class="title"><span>${data.russian}</span></div></div><div class="card-information"><div class="year">${new Date(data.aired_on).getFullYear()}</div><div class="score"><svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.73196 0.745728C4.65834 0.595337 4.50279 0.499634 4.33196 0.499634C4.16112 0.499634 4.00696 0.595337 3.93196 0.745728L3.0389 2.55452L1.04446 2.84436C0.877789 2.86897 0.7389 2.98381 0.687511 3.14104C0.636122 3.29827 0.677789 3.4719 0.797233 3.58811L2.24446 4.99768L1.90279 6.98967C1.87501 7.15374 1.94446 7.32053 2.08196 7.4176C2.21946 7.51467 2.4014 7.52698 2.5514 7.44905L4.33334 6.51252L6.11529 7.44905C6.26529 7.52698 6.44723 7.51604 6.58473 7.4176C6.72223 7.31917 6.79168 7.15374 6.7639 6.98967L6.42084 4.99768L7.86807 3.58811C7.98751 3.4719 8.03057 3.29827 7.97779 3.14104C7.92501 2.98381 7.78751 2.86897 7.62084 2.84436L5.62501 2.55452L4.73196 0.745728Z" fill="#FFE600"/></svg>${data.score}</div></div>
      </a>`;
    }
  }

  /**
   * Устанавливает жанры аниме
   * @param {Object} data - обьект аниме
   */
  function SetGenres(data) {
    for (let index = 0; index < data.genres.length; index++) {
      const element = data.genres[index];
      $(".genres").append(`<a href="#">${element.russian}</a>`);
    }
  }

  /**
   * Устанавливает название аниме на сайте
   * @param {Object} data - обьект аниме
   */
  function SetTitle(data) {
    $(document).attr("title", "TUN - " + data.russian);
  }

  /**
   * Устанавливает продолжительность аниме
   * @param {Object} data - обьект аниме
   */
  function SetDuration(data) {
    if (data.episodes_aired == 0 && data.status == "released") {
      $(".text-witch-pg > .episodes_aired").text(`${data.episodes}EP`);
      $(".duration > .content > b").text(
        `${getTimeFromMins(data.episodes * data.duration)}`
      );
    } else {
      $(".text-witch-pg > .episodes_aired").text(`${data.episodes_aired}EP`);
      $(".duration > .content > b").text(
        `${getTimeFromMins(data.episodes_aired * data.duration)}`
      );
    }

    //https://ru.stackoverflow.com/questions/646511/Сконвертировать-минуты-в-часыминуты-при-помощи-momentjs
    function getTimeFromMins(mins) {
      let hours = Math.trunc(mins / 60);
      let minutes = mins % 60;
      return hours + "ч. " + minutes + "мин.";
    }
  }

  /**
   * Устанавливает статус аниме
   * @param {Object} data - обьект аниме
   */
  function SetStatus(data) {
    $(".status > .content > b").text(
      data.status == "anons"
        ? "Анонс"
        : data.status == "ongoing"
          ? "Онгоинг"
          : "Вышел"
    );
    let rating = data.rating == 'none' || data.rating == 'g'
      ? '0'
      : data.rating == 'pg'
        ? '7'
        : data.rating == 'pg_13'
          ? '13'
          : data.rating == 'r'
            ? '17'
            : '18';
    $(".pg-rating").text(`${rating}+`);
  }

  /**
   * Устанавливает галерею
   */
  function SetGallery() {
    shikimoriApi.Animes.screenshots($ID, async (r) => {
      if (r.failed && r.status == 429) {
        await sleep(1000);
        return SetGallery();
      }
      if (r.length == 0) {
        $(".title-gallery").css("display", "none");
      }

      for (let index = 0; index < r.length; index++) {
        const element = r[index];
        $(".galery-slider").append(
          `<div class="slide" data-id="${index}"><img src="https://shikimori.me${element.preview}"></div>`
        );
      }

      //Инициализация cursotm функции истории
      History.custom.init();
    });
  }

  /**
   *  Устанавливает главных героев аниме
   */
  function SetHeroes() {
    shikimoriApi.Animes.roles($ID, async (r) => {
      if (r.failed && r.status == 429) {
        await sleep(1000);
        return SetHeroes();
      }

      for (let i = 0; i < r.length; i++) {
        const element = r[i];
        if (element.roles.includes('Main')) {
          $('.hero-anime, .hero-anime-title').css('display', '');
          $('.hero-anime > .val').append(`<a href="https://shikimori.me${element.character.url}"><img src="https://nyaa.shikimori.me${element.character.image.original}"/><div class="hero"><div class="name">${element.character.russian}</div><div class="name-en">${element.character.name}</div></div></a>`);
        }
      }
    })
  }

  /**
   * Устанавливает описание аниме
   * @param {Object} data - обьект аниме
   */
  function SetDescription(data) {
    if (!data.description) {
      $(".description").append(data.english[0]);
      return;
    }
    $(".description").append(data.description_html);
  }

  function SetStudio(data) {
    if (data.studios.length > 0) {
      $(".studio > .title").text(data.studios[0].filtered_name);
    }
  }

  /**
   * Генерирует теги Open Graph на страницу для индексаций страницы
   * @param {Object} data - response Shikimori
   */
  function MetaTags(data) {
    // Создаем мета-тег Open Graph для заголовка страницы
    var ogTitle = $("<meta/>", {
      "property": "og:title",
      "content": `TUN - ${data.russian}`
    });

    var ogType = $("<meta/>", {
      "property": "og:type",
      "content": `${data.kind == "movie" ? "video.movie" : "video.tv_show"}`
    });

    var ogImage = $("<meta/>", {
      "property": "og:image",
      "content": `https://moe.shikimori.me${data.image.original}`
    });

    var ogDescription = $("<meta/>", {
      "property": "og:description",
      "content": `${data?.description?.substr(0, 100)}... Смотрите на Tunime`
    });

    var ogRelease = $("<meta/>", {
      "property": "og:release_date",
      "content": `${data.aired_on}`
    });

    var ogRating = $("<meta/>", {
      "property": "og:rating",
      "content": data.score + "/10"
    });

    // Добавляем мета-тег Open Graph в раздел head нашего HTML документа
    $("head").append(ogTitle, ogType, ogImage, ogDescription, ogRelease, ogRating);
  }

  //Функция для прокручивания елемента с помощью мышки
  function scrollElementWithMouse(dom) {
    const element = $(dom)[0];

    let isDragging = false;
    let currentX;
    let initialMouseX;
    let scrollLeft;

    element.addEventListener('mousedown', (e) => {
      initialMouseX = e.clientX;
      scrollLeft = element.scrollLeft;
      isDragging = true;
    });

    element.addEventListener('mousemove', (e) => {
      if (isDragging) {
        currentX = e.clientX - initialMouseX;
        element.scrollLeft = scrollLeft - currentX;
      }
    });

    element.addEventListener('mouseup', () => {
      isDragging = false;
    });

    element.addEventListener('mouseleave', () => {
      isDragging = false;
    });

    element.addEventListener('wheel', (e) => {
      // Проверить, достигнут ли конец элемента
      if (Math.abs(element.scrollLeft - (element.scrollWidth - element.clientWidth)) <= 2 && e.deltaY > 0) {
        return;
      }
      //Проверить если число явсляется отрицательным и мы на начале элемента то прокручивать на врех дальше
      if (e.deltaY < 0 && element.scrollLeft == 0) {
        return;
      }
      e.preventDefault();
      element.scrollLeft += e.deltaY;
    });
  }
}