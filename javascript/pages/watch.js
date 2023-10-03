import { History } from "./watch/mod_history.js";
import { LoadPage } from "./watch/mod_loadingpage.js";
import { Player } from "./watch/mod_player.js";
import { AnimeUserRate } from "./watch/mod_userrate.js";
import { LoadAnime, ELA, GetShikiData, GetShikiScreenshots } from "./watch/mod_resources.js";
import { Main, User } from "../modules/ShikiUSR.js";
import { ShowScoreWindow } from "./watch/mod_window.js";
import { ShowDwonloadWindow } from "./watch/mod_download.js";
import { OnLocalData, SaveDataAnime } from "./watch/mod_synch.js";

//ID ресурса из Shikimori
export const $ID = new URLSearchParams(window.location.search).get("id");
//Продолжение просмотра
export let $CONTINUE = new URLSearchParams(window.location.search).get("continue");

export const $SHOWPLAYER = new URLSearchParams(window.location.search).get("player");

Main((e) => {
  //Функционал страницы (контролеров)
  Functional();

  //Загрузка данных аниме shikimori
  LoadAnime(() => {
    //Завершаем анимацию загрузки страницы
    LoadPage().loaded();
  }, e);

  //Загрузка данных аниме плеера kodik
  kodikApi.search({ shikimori_id: $ID }, (r) => {
    //Инициализируем плеер
    Player().init(r.results);
  });

  //Подписываемся на обработчик получение данных Синхронизации
  OnLocalData((save) => {
    console.log("Loaded save", save);

    if (!save) {
      return;
    }

    if (!Player().loaded) {
      // Подписываемся на обработчик событий для загрузки плеера
      // Этот обработчик будет загружать из сохранения последние аниме
      Player().events.onloaded(async (i) => {
        //Если загружен только 1-й раз то загружаем наше сохранение
        if (i == 1) {
          Player().loadAnime(save.kodik_episode, save.kodik_dub);
        }
      });
    } else {
      if (Player().loaded_int == 1) {
        Player().loadAnime(save.kodik_episode, save.kodik_dub);
      }
    }
  });

  //Выполняем сохранение аниме если выбирается озвучка только первого эпизода
  Player().translation.events.onselected((id_translation, user) => {
    let e = Player().episodes.selected_episode;
    if (user && e == 1 && id_translation) {
      SaveDataAnime(e, id_translation);
    }
  });

  //Подписываемся на обработчик событий выбора эпизода
  //Этот обработчик будет сохранять последние выбраное аниме аниме
  Player().episodes.events.onclicked((e, d) => {
    SaveDataAnime(e, d);

    //Добавляем истоию просмотра
    History().add(false, 0, 0, e);
  });

  //Подписываемся на обработчик событий пауза плеера
  Player().events.onpause((d) => {
    History().add(true, d.time)
  });

  //Подписываемся на обрботчик событий
  Player().events.onplayed((e) => {
    AnimeUserRate().events.setEpisode(Player().episodes.selected_episode);

    //Делаем проверку на продолжение воспроизведения anime
    if ($CONTINUE != null && $CONTINUE != false) {
      //Получаем историю спика продолжение просмотра
      let history = History().get();
      //Находим ID елемента из истории
      let id = history.findIndex((x) => { return x.id == $ID });

      //Если найдено и совпадают текущии эпизоды
      if (id != -1 && Player().episodes.selected_episode == history[id].episode) {
        //Воспроизводим с остановившегося момента
        Player().functional.control("seek", { seconds: history[id].duration });
        //Устанавливаем что продолжение было включено
        $CONTINUE = false;
      }
    }
  });
});

//Выполнена загрузка аниме 
ELA.onload(() => {
  //Загружаем пользователя
  AnimeUserRate().init(GetShikiData(), User.authorized);
  History().shikiData = GetShikiData();
  History().screenData = GetShikiScreenshots();
  History().custom.init();
  //Нводимся на плеер
  //Наводимся на плеер
  if ($SHOWPLAYER && $PARAMETERS.watch.showplayer) {
    const element = document.querySelector(".landscape-player");
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }
});

/*
 * Создание событий к визулу
 */
function Functional() {
  const VFClick = [
    { dom: ".anime-status > .cur-status > .more-status", func: ShowStatus },
    { dom: ".translations--current--object", func: ShowTranslations },
    { dom: ".title-player > .btn-wrapper > .btn-lock-view", func: SetPlayerDisplay },
    { dom: ".btn-back", func: BackToMainPage },
    { dom: ".btn-play > .btn", func: ShowPlayer },
    { dom: ".btn-wrapper.rb > .btn", func: ShareAnime },
    { dom: ".btn-wrapper.lb > .btn", func: ShowWindowScore },
    { dom: ".btn-change-player", func: ChangePlayer },
    { dom: '.btn-download-episode', func: DownloadEpisode }
    //Сюда функцию новой кнопки изменить плеер
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


  function DownloadEpisode() {
    ShowDwonloadWindow();
    // location.replace(`./download.html?id=${Player().data_id}&e=${Player().episodes.selected_episode}`);
  }
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
    ShowScoreWindow()
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
    if (show_list && Player().data.length > 1) {
      $("body").addClass("loading");
      let element = document.getElementsByClassName("translations--current")[0];
      let elementPosition = element.getBoundingClientRect().top;
      let windowHeight = window.innerHeight;
      let elementHeight = element.offsetHeight;
      let bottomOffset = 10;
      let offsetPosition =
        elementPosition +
        window.scrollY -
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

  //Функция изменение на плеер Tunime
  function ChangePlayer() {
    console.log(Player());
    document.querySelector("#kodik-player").contentWindow.location.replace(`./tunimeplayer.html?id=${Player().data_id}&e=${Player().episodes.selected_episode}`);
  }
}

/**
 * Функция сохранение аниме (ид аниме, ид озвучки, и текущий эпизод)
 * @param {Int} e - номер эпизода 
 * @param {Int} d - ид озвчки аниме
 */
function SaveLocalDataAnime(e, d) {
  const data = {
    kodik_episode: e,
    kodik_dub: d,
    date_update: new Date()
  };

  //Сохраняем последние выбранное аниме
  localStorage.setItem($ID, JSON.stringify(data));
}