import { History } from "./watch/mod_history.js";
import { LoadPage } from "./watch/mod_loadingpage.js";
import { Player } from "./watch/mod_player.js";
import { AnimeUserRate } from "./watch/mod_userrate.js";
import { LoadAnime, ELA, GetShikiData, GetShikiScreenshots } from "./watch/mod_resources.js";
import { Main, User } from "../modules/ShikiUSR.js";
import { ShowScoreWindow, ShowTranslationWindow } from "./watch/mod_window.js";
import { ShowDwonloadWindow } from "./watch/mod_download.js";
import { DifferenceInData, OnLocalData, SaveDataAnime, SetDifferenceData } from "./watch/mod_synch.js";
import { ApiTunime } from "../modules/TunimeApi.js";

//ID ресурса из Shikimori
export const $ID = new URLSearchParams(window.location.search).get("id");
//Продолжение просмотра
export let $CONTINUE = new URLSearchParams(window.location.search).get("continue");

export const $SHOWPLAYER = new URLSearchParams(window.location.search).get("player");

//Событие ошибка Tunime плеера
Player().events.onerror((data) => {
  console.log(`Eror Tunime Player: ${data}`);
  //Убираем автомотический выбор плеера из за ошибки
  $PARAMETERS.player.standart = false;
  //Если ошибка Tunime плеера то переключаем на обычный плеер Kodik
  Player().update();
});

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

  //Событие отправки выбора озвучки первого просмотра 
  Player().events.onplayed((e) => {
    const data = DifferenceInData();
    if (!data[0] && !data[1])
      return;
    if (data[0] && !data[1]) {
      ApiTunime.tsset($ID, data[0].kodik_dub);
      SetDifferenceData(data[0]);
    } else if (data[0] && data[1]) {
      if (data[0].kodik_dub != data[1].kodik_dub) {
        ApiTunime.tsset($ID, data[0].kodik_dub);
        SetDifferenceData(data[0]);
      }
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

  //Обработчик события следующего эпизода
  Player().events.onnext((e) => {
    //Проверяем на количество эпизодов
    if (e.episodes.episodes_count == e.episodes.selected_episode) return;
    const next_episode = e.episodes.selected_episode + 1;
    e.functional.control(e.functional.methods[10], { episode: next_episode });
    e.episodes.selected_episode = next_episode;
    e.episodes.AnimateSelect(next_episode);
    SaveDataAnime(next_episode, e.translation.id);
    History().add(false, 0, 0, next_episode);
  });

  //Альтернативный полный экран видеоплеера
  Player().events.onfullscreen((e) => {
    if (e.full) {
      $('.player').addClass('fullscreen');
    } else {
      $('.player').removeClass('fullscreen');
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
  //Наводимся на плеер
  if ($SHOWPLAYER) {
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
    { dom: ".anime-status > .cur-status > .more-status", func: ShowStatus }, // Боковая кнопка статуса (Показать все статусы)
    { dom: ".title-player > .btn-wrapper > .btn-lock-view", func: SetPlayerDisplay },
    { dom: ".btn-back", func: BackToMainPage },
    { dom: ".btn-play > .btn", func: ShowPlayer },
    { dom: ".btn-wrapper.rb > .btn", func: ShareAnime },
    { dom: ".btn-wrapper.lb > .btn", func: ShowWindowScore },
    { dom: ".btn-change-player", func: ChangePlayer },
    { dom: '.btn-download-episode', func: DownloadEpisode },
    { dom: '.translations-wrapper > .button-translation', func: ShowTranslationWindow }, //Кнопка выбора озвучки
    { dom: '.translations-wrapper > .button-stars', func: SaveVoice }, //Кнопка добавление озвучки в избранное
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
      url: `https://tunime.onrender.com/l/${$ID}`
    }).catch((error) => $DEV.error('Sharing failed', error));
  }

  //Функция изменение на плеер Tunime
  function ChangePlayer() {
    console.log(Player());
    document.querySelector("#kodik-player").contentWindow.location.replace(`./player.html?id=${Player().data_id}&e=${Player().episodes.selected_episode}`);
  }

  //Функция выбора текущей озвучки в избранное или удаление его
  function SaveVoice() {
    Player().translation.favorites(Player().translation.id);
  }
}