import { ScrollElementWithMouse } from "../../modules/funcitons.js";
import { $ID } from "../watch.js";
import { ShowDwonloadWindow } from "./mod_download.js";
import { Player } from "./mod_player.js";
import { LoadImageById } from "./mod_resource.js";
import { ShowTranslationWindow } from "./mod_translation.js";
import { UserRate } from "./mod_urate.js";
import { ShowScoreWindow } from "./mod_wscore.js";

const anime_status = [
    { id: 0, name: "Посмотрю", sh: ["planned"] },
    { id: 1, name: "Смотрю", sh: ["watching", "rewatching", "on_hold"] },
    { id: 2, name: "Просмотрел", sh: ["completed"] },
    { id: 3, name: "Забросить", sh: ["dropped"] },
];

/*
 * Создание событий к визуалу на сайте
 */
export function Functional() {
    const list = [
        { dom: "#change-player", func: ChangePlayer },
        { dom: "#download-anime", func: ShowDwonloadWindow },
        { dom: "#center-player", func: SetPlayerDisplay },
        { dom: "#back-page", func: BackToMainPage },
        { dom: "#show-status", func: ShowStatus },
        { dom: "#window-score", func: ShowScoreWindow },
        { dom: "#share", func: ShareAnime },
        { dom: "#btn-scroll", func: ShowPlayer },
        { dom: '.translations-wrapper > .button-translation', func: ShowTranslationWindow },
        { dom: '.translations-wrapper > .button-stars', func: SaveVoice }
    ]

    for (let i = 0; i < list.length; i++) {
        const element = list[i];
        $(element.dom).click(element.func);
    }

    $('.landscape-player').addClass('reverse-' + $PARAMETERS.watch.episrevers);
    if ($PARAMETERS.watch.episrevers == "top") {
        $("#center-player").css({ display: 'none' });
    }

    UserRate().Events.OnInit((res) => {
        UserRate().Events.OnUpdate((res) => {
            if (res != null && res.score != 0) {
                $("#window-score > .default").addClass('hide');
                $("#window-score > .fill").removeClass('hide');

                $("#userscore > .content-b").text(`${res.score} | 10`)
            } else {
                $("#window-score > .default").removeClass('hide');
                $("#window-score > .fill").addClass('hide');
                $("#userscore > .content-b").text(`0 | 10`)
            }
            SetStatusList(res);
        });
        if (res != null && res.score != 0) {
            $("#window-score > .default").addClass('hide');
            $("#window-score > .fill").removeClass('hide');

            $("#userscore > .content-b").text(`${res.score} | 10`)
        }
        SetStatusList(res);
    });

    AutoLoadGallery();
    ScrollingElements();
    CentrumPlayer();
    AnimeStatusSelect();
}

/**
   * Отображает статус аниме
   */
function ShowStatus() {
    $(".anime-status").hasClass("show-more") ? $(".anime-status").removeClass("show-more") : $(".anime-status").addClass("show-more");
}

function AnimeStatusSelect() {
    $('.cur-status > .icon').click(() => {
        const id = $('.cur-status').data('id');
        const ur = UserRate().Get();
        if (ur != null) {
            UserRate().Controls.Remove();
        } else {
            UserRate().Controls.Create(anime_status[id].sh[0]);
        }
    });
    $('.list-status > .status').click((e) => {
        const id = $(e.currentTarget).data('id')
        const ur = UserRate().Get();
        if (ur != null && ur.status == anime_status[id].sh[0]) {
            UserRate().Controls.Remove();
        } else {
            UserRate().Controls.Create(anime_status[id].sh[0]);
        }
    });
}

function SetStatusList(res) {
    if (res == null) {
        $('.cur-status > .icon').removeClass('selected');
        return;
    }
    let id = status(res.status);

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

    function status(status) {
        const i = anime_status.findIndex(x => x.sh.includes(status));
        return i;
    }
}

/**
 * Функция прогрузки галереи при пролистывании
 */
function AutoLoadGallery() {
    const gallerySlider = document.querySelector('.galery-slider');
    $(".galery-slider").on('scroll', (e) => {
        const slides = gallerySlider.querySelectorAll('.slide img');
        const targetSlide = slides[slides.length - 1];
        const targetSlidePosition = targetSlide.getBoundingClientRect().right;

        if (targetSlidePosition <= window.innerWidth) {
            LoadImageById(slides.length);
        }
    });
}



function ScrollingElements() {
    ScrollElementWithMouse('.similiar-anime');
    ScrollElementWithMouse('.hero-anime');
    ScrollElementWithMouse('.galery-slider');
    ScrollElementWithMouse('#episodes');
    ScrollElementWithMouse('.genres.scroll-none');
    ScrollElementWithMouse('.franchisa-anime');
}

function ChangePlayer() {
    if (Player().name == "tunime") {
        Player().update(false);
    } else {
        Player().update(true);
    }
}

/**
   * Функция выбора текущей озвучки в избранное или удаление его
   */
function SaveVoice() {
    Player().translation.favorites(Player().translation.id);
}

let enableCenter = false;

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

function CentrumPlayer() {
    let timer; // Внешний независимый таймер
    // Получаем ссылку на элемент, до которого нужно долистать
    const element = document.querySelector(".landscape-player");

    //Подписываемся на событие прокрутки
    window.addEventListener('scroll', function () {
        this.clearInterval(timer); // Очищаем интервал пока идет прокрутка
        //Устанавливаем таймер
        timer = setTimeout(function () {
            //Проверяем что функция включена (Включается в функии SetPlayerDisplay) и ориентацию устройства
            if (enableCenter && window.matchMedia("(orientation: landscape)").matches) {
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
}

/**
  * Возвращает на главную страницу
  */
function BackToMainPage() {
    window.location.href = '/index.html';
}

/**
 * Функция поделиться с аниме
 */
function ShareAnime() {
    navigator.share({
        title: $(document).attr("title"),
        text: $('meta[property="og:description"]').attr('content'),
        url: `https://tunime.onrender.com/l/${$ID}`
    }).catch((error) => $DEV.error('Sharing failed', error));
}

/**
 * Функция пролистывания к плееру
 */
function ShowPlayer() {
    document.getElementById('kodik-player').scrollIntoView({ behavior: "smooth", block: "center" });
}