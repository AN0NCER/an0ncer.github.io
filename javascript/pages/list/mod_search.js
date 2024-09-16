import { ACard } from "../../modules/AnimeCard.js";
import { ShowInfo } from "../../modules/Popup.js";
import { Carousel } from "./mod_carousel.js";
import { CSearch } from "./mod_collections.js";
import { ASearch } from "./mod_core.js";
import { ISearch } from "./mod_html.js";
/*
 * Поиск по списку аниме и в коллекциях
 */

/**
 * Типы статусов аниме, начиная с 4 - это типы аниме
 */
const TLIST = {
    "0": "watching",
    "1": "planned",
    "2": "completed",
    "3": ["dropped", "on_hold"],
    "4": "tv",
    "5": "movie"
}

// Поиск по аниме
const aSearch = ASearch();
// Поиск по коллекциям
const cSearch = CSearch();
// Карусель фильтрации
const eCarousel = Carousel.Init();
// Управление иконкой поиска
const iSearch = new ISearch();

export const InitSearch = () => {
    let last = ""; // Последний поисковый запрос
    let clast = ""; // Последний поисковый запрос
    let count = 0; // Количество запросов
    let cci = '-1'; // ID текущего карусели
    let hci = '-1'; // ID предыдущего карусели
    let lst = 0; // Последний скролл
    let load = false; // Загрузка Fetch поиска
    let isSearch = false; // Флаг поиска

    $('#mainsearch').on(`keyup`, (e) => {
        const value = e.target.value.trim();

        if ((e.key === 'Enter' || e.which == 13) && value && last != value) {
            // Если нажата клавиша Enter
            $('#mainsearch').blur();
            last = value;
            $(`.anime-search-result`).append(`<div class="card-loader"><span class="loader"></span></div>`);

            Show();
            hci = eCarousel.id;
            aSearch.Search({ value }).then((animes) => {
                if (animes.length === 0) {
                    Hide();
                    return ShowInfo("Ничего не найдено", "info");
                }

                if ($('.app').scrollTop() >= 308) {
                    $('.app').scrollTop($('.app').scrollTop() + $(`.anime-content`).position().top - 60);
                }

                $(`.anime-search-result > .card-loader`).remove();
                count = animes.length;
                iSearch.Result(count);

                for (let i = 0; i < animes.length; i++) {
                    const anime = animes[i];
                    $('.anime-search-result').append(ACard.GenV2({ type: 'a', anime, data: { status: anime.userRate.status, score: anime.userRate.score, kind: anime.kind } }));
                }

                cSearch.Search({ title: value, animes });

                eCarousel.enabled = true;
                eCarousel.$Selector.hide();
                load = false;
            });
        } else if (!value && last != value && isSearch) {
            // Если нет значения, то сбрасываем поиск
            last = "";
            Hide();
        }

        if (value && clast != value) {
            clast = value;
            cSearch.Entry(clast);
        } else if (!value && clast != value) {
            cSearch.Clear();
        }
    });

    $('.app').on('scroll', function () {
        if ((cci !== '-1' || aSearch.loaded) || !isSearch) return;
        const $this = $(this);
        const scrollTop = $this.scrollTop();
        if (scrollTop < lst) return;
        lst = scrollTop <= 0 ? 0 : scrollTop;
        if ((scrollTop + 200 + $this.innerHeight()) >= $this[0].scrollHeight && !load) {
            load = true;
            eCarousel.enabled = false;
            $(`.anime-search-result`).append(`<div class="card-loader"><span class="loader"></span></div>`);
            aSearch.Load().then((animes) => {
                $(`.anime-search-result > .card-loader`).remove();
                count += animes.length;
                cSearch.Next(animes);
                iSearch.Result(count);
                for (let i = 0; i < animes.length; i++) {
                    const anime = animes[i];
                    $('.anime-search-result').append(ACard.GenV2({ type: 'a', anime, data: { status: anime.userRate.status, score: anime.userRate.score, kind: anime.kind } }));
                }
                eCarousel.enabled = true;
            });
        }
    });

    $('#active-icon').on('click', function () {
        if (!isSearch) {
            return $('#mainsearch')[0].dispatchEvent(new KeyboardEvent('keyup', { 'key': 'Enter' }));
        } else {
            if (iSearch.status !== 'empty') {
                if (cci !== '-1') {
                    eCarousel.Select($(`.carousel  > .item-wrapper[data-id="${cci}"]`));
                }
                iSearch.Empty();
            } else {
                last = "";
                Hide();
            }
        }
    });

    eCarousel.on('select', (c) => {
        if (!isSearch) return;
        ToTop();
        cci = c.id;
        eCarousel.$Selector.show();

        $(`.anime-search-result > .card-anime`).addClass("hide");

        if (["4", "5"].includes(c.id)) {
            $(`.anime-search-result > .card-anime[data-kind="${TLIST[c.id]}"]`).removeClass("hide");
        } else {
            $(`.anime-search-result > .card-anime[data-status="${TLIST[c.id]}"]`).removeClass("hide");
        }

        iSearch.Result(count);
    });

    eCarousel.on('click', (c) => {
        if (!isSearch) return;
        ToTop();

        if (cci === c.id) {
            cci = '-1';
            eCarousel.$Selector.hide();
            return $(`.anime-search-result > .card-anime`).removeClass("hide");
        }

        cci = c.id;
        eCarousel.$Selector.show();

        $(`.anime-search-result > .card-anime`).addClass("hide");

        if (["4", "5"].includes(c.id)) {
            $(`.anime-search-result > .card-anime[data-kind="${TLIST[c.id]}"]`).removeClass("hide");
        } else {
            $(`.anime-search-result > .card-anime[data-status="${TLIST[c.id]}"]`).removeClass("hide");
        }
    });

    cSearch.on('found', (c) => {
        if(c.length === 0){
            ToTop();
        }else{
            cSearch.Load(c);
        }
    });

    const Hide = () => {
        cSearch.Clear();
        isSearch = false;
        eCarousel.$Selector.show();
        eCarousel.enabled = true;
        eCarousel.Select($(`.carousel  > .item-wrapper[data-id="${hci}"]`));
        $(`.anime-list`).removeClass("hide");
        $(`.anime-search-result`).addClass("hide");
        iSearch.Clear();

        if ($('.app').scrollTop() > 308) {
            $('.app').scrollTop(0);
        }

        aSearch.Complete();
    }

    const Show = () => {
        isSearch = true;
        eCarousel.enabled = false;
        $(`.anime-list`).addClass("hide");
        $(`.anime-search-result`).empty();
        $(`.anime-search-result`).removeClass("hide");
        iSearch.Search();
        count = 0;
        lst = 0;
        load = true;
        aSearch.Reset();
    }

    const ToTop = () => {
        let top = 0;

        if ((top = $('.app').scrollTop()) >= 308) {
            $('.app').scrollTop(top + $(`.anime-content`).position().top - 60);
        } else {
            $(`.app`)[0].scrollTo({ top: top + $(`.anime-content`).position().top - 60, behavior: 'smooth' });
        }
    }
}