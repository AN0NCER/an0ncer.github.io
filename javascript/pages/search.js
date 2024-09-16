import { Main } from "../modules/ShikiUSR.js";
import { Sleep, ScrollElementWithMouse, isObjectEqual } from "../modules/functions.js";
import { Animes, Genres } from "../modules/ShikiAPI.js";
import { GetState, SetState } from "./search/mod_searchState.js";
import { SearchHistory } from "./search/mod_history.js";
import { Recomendation } from "./search/mod_recomendation.js";
import { Search, SearchFilter, SetEmptyFilter, SearchVoice, GetEmptyFilter, SetEmptyVoice } from "./search/mod_search.js";
import { AnimeFromVoices } from "./search/mod_list.js";
import { WindowManagement } from "../modules/Windows.js";
import { InitMenu } from "../menu.js";
import { ACard } from "../modules/AnimeCard.js";

//Поиск
const InputSearch = $(`.search-input > input`);

//Результаты ответа Жанров и Озвучек
let responseGenres = undefined;
let responseVoices = undefined;

const WindowFilter = {
    data: {
        status: [
            { id: "anons", name: "Анонс" },
            { id: "ongoing", name: "Онгоинг" },
            { id: "released", name: "Вышел" },
        ],

        kind: [
            { id: "tv", name: "TV-Сериал" },
            { id: "movie", name: "Фильм" },
            { id: "ova", name: "OVA" },
            { id: "ona", name: "ONA" },
            { id: "special", name: "Спешл" },
        ],
        rating: [
            { id: "g", name: "G" },
            { id: "pg", name: "PG" },
            { id: "pg_13", name: "PG-13" },
            { id: "r", name: "R-17" },
            { id: "r_plus", name: "R+" },
            { id: "rx", name: "Rx" },
        ]
    },
    /**
     * Инициализация функции окна, запускается если прошел верификацию (this.verif)
     */
    init: function () {
        for (let i = 0; i < this.data.status.length; i++) {
            const e = this.data.status[i];
            $(`.filter--status`).append(`<div data-id="${e.id}">${e.name}</div>`);
        }
        for (let i = 0; i < this.data.kind.length; i++) {
            const e = this.data.kind[i];
            $(`.filter--kind`).append(`<div data-id="${e.id}">${e.name}</div>`);
        }
        for (let i = 0; i < this.data.rating.length; i++) {
            const e = this.data.rating[i];
            let censored = $PARAMETERS.censored && e.id == "rx" ? true : false;
            $(`.filter--rating`).append(`<div ${censored ? `class="disabled"` : ''} data-id="${e.id}">${e.name}</div>`);
        }

        //Close
        $(`.filte-bar > .window-close, .filte-bar > .btn-accept`).click(() => {
            this.hide();
        });
        //Kind
        $(`.filter--kind > div`).click((e) => {
            let selected = $(`.filter--kind > div.selected`);
            let element = $(e.currentTarget);
            if (element.attr("data-id") == SearchFilter.kind) {
                element.removeClass("selected");
                delete SearchFilter.kind;
                ChangeFilter();
                return;
            }

            selected.removeClass('selected');
            element.addClass('selected');
            SearchFilter["kind"] = element.attr("data-id");
            ChangeFilter();
        });
        //Status
        $(`.filter--status > div`).click((e) => {
            let element = $(e.currentTarget);
            let selected = $(`.filter--status > div.selected`);
            if (element.attr("data-id") == SearchFilter.status) {
                element.removeClass("selected");
                delete SearchFilter.status;
                ChangeFilter();
                return;
            }

            selected.removeClass('selected');
            element.addClass('selected');
            SearchFilter["status"] = element.attr("data-id");
            ChangeFilter();
        });
        //Rating
        $(`.filter--rating > div`).click((e) => {
            let element = $(e.currentTarget);
            if (element.hasClass('disabled')) return;
            let selected = $(`.filter--rating > div.selected`);
            if (element.attr("data-id") == SearchFilter.rating) {
                element.removeClass("selected");
                delete SearchFilter.rating;
                ChangeFilter();
                return;
            }

            selected.removeClass('selected');
            element.addClass('selected');
            SearchFilter["rating"] = element.attr("data-id");
            ChangeFilter();
        });
        //Score
        $(`.score-list > .sc`).click((e) => {
            let element = $(e.currentTarget);
            let selected = $(`.score-list > .sc.selected`);
            if (parseInt(element.attr("data-score")) == SearchFilter.score) {
                element.removeClass("selected");
                delete SearchFilter.score;
                ChangeFilter();
                return;
            }
            selected.removeClass('selected');
            element.addClass('selected');
            SearchFilter["score"] = parseInt(element.attr("data-score"));
            ChangeFilter();
        });

        //Clear
        $(`.filte-bar > .btn-clear`).click((e) => {
            SetEmptyFilter();
            SetEmptyVoice();

            const elements = [$(`.filter--kind > div.selected`), $(`.filter--status > div.selected`), $(`.filter--rating > div.selected`), $(`.score-list > .sc.selected`), $(`.content-genres > div.genre.selected`), $(`.content-voices > .voice.selected`)];

            for (let i = 0; i < elements.length; i++) {
                const e = elements[i];
                for (let a = 0; a < e.length; a++) {
                    const f = $(e[a]);
                    f.removeClass('selected');
                }
            }

            $(`.full-btn.filter--voices > .info`).text(0);
            $(`.full-btn.filter--genres > .info`).text(0);
            ChangeFilter();
        });
    },
    /**
     * Отображение окна
     */
    show: function () { },
    /**
     * Скрытие окна
     */
    hide: function () {
        windowFilter.hide();
    },
    /**
     * Проверка для инициализация окна. Если проверка не нужна просто верни true
     * @returns Возвращает boolean
     */
    verif: function () { return true; },
}

const WindowGenres = {
    selected: 0,
    /**
     * Инициализация функции окна, запускается если прошел верификацию (this.verif)
     */
    init: function () {
        $(`.genre-bar > .window-close, .genre-bar > .btn-accept`).click(() => {
            this.hide();
        });

        //Фильтр по жанрам
        $(`.gnr-filter.search-filter > input`).keyup((e) => {
            const value = $(e.currentTarget).val().toLowerCase();
            const genres = $('.content-genres > .genre');
            for (let i = 0; i < genres.length; i++) {
                const element = $(genres[i]);
                if (!element.text().toLowerCase().includes(value)) {
                    element.addClass('none');
                } else {
                    element.removeClass('none');
                };
            }
        });


        //Очистка
        $(`.genre-bar > .btn-clear`).click((e) => {
            delete SearchFilter.genre;
            const elements = [$(`.content-genres > div.genre.selected`)];
            for (let i = 0; i < elements.length; i++) {
                const e = elements[i];
                for (let a = 0; a < e.length; a++) {
                    const f = $(e[a]);
                    f.removeClass('selected');
                }
            }
            $(`.full-btn.filter--genres > .info`).text(0);
            ChangeFilter();
        });
    },
    /**
     * Отображение окна
     */
    show: function () {
        if ($(`.content-genres > div`).length > 0) return;
        for (let i = 0; i < responseGenres.length; i++) {
            const e = responseGenres[i];
            if (e.entry_type != "Anime") continue;
            let censored = e.name == "Hentai" || e.name == "Erotica";
            $(`.content-genres`).append(`<div class="genre ${censored && $PARAMETERS.censored ? `disabled` : ''}" data-id="${e.id}">${e.russian}</div>`);
        }

        $(`.content-genres > div.genre`).click((e) => {
            let element = $(e.currentTarget);
            if (element.hasClass('disabled')) return;
            let id = parseInt(element.attr("data-id"));
            if (!SearchFilter?.genre) {
                SearchFilter["genre"] = [];
            }
            let findIndex = SearchFilter.genre.findIndex(x => x == id);
            if (findIndex != -1) {
                SearchFilter.genre.splice(findIndex, 1);
                element.removeClass("selected");
                if (SearchFilter.genre.length == 0) delete SearchFilter.genre;
                this.selected--;
                UpdateValue(this.selected);
                return;
            }
            this.selected++;
            element.addClass('selected');
            SearchFilter.genre.push(id);
            UpdateValue(this.selected);
        });

        function UpdateValue(val) {
            $(`.full-btn.filter--genres > .info`).text(val);
            ChangeFilter();
        }
    },
    /**
     * Скрытие окна
     */
    hide: function () {
        windowGenres.hide();
    },
    /**
     * Проверка для инициализация окна. Если проверка не нужна просто верни true
     * @returns Возвращает boolean
     */
    verif: function () { return windowFilter.showed && responseGenres; },
}

const WindowVoices = {
    /**
     * Инициализация функции окна, запускается если прошел верификацию (this.verif)
     */
    init: function () {
        $(`.voice-bar > .window-close, .voice-bar > .btn-accept`).click(() => {
            this.hide();
        });

        //Фильтр по озвучке
        $(`.voi-filter.search-filter > input`).keyup((e) => {
            const value = $(e.currentTarget).val().toLowerCase();
            const voices = $('.content-voices  > .voice');
            for (let i = 0; i < voices.length; i++) {
                const element = $(voices[i]);
                if (!element.text().toLowerCase().includes(value)) {
                    element.addClass('none');
                } else {
                    element.removeClass('none');
                };
            }
        });

        //Очистка
        $(`.voice-bar > .btn-clear`).click((e) => {
            SetEmptyVoice();
            const elements = [$(`.content-voices > .voice.selected`)];
            for (let i = 0; i < elements.length; i++) {
                const e = elements[i];
                for (let a = 0; a < e.length; a++) {
                    const f = $(e[a]);
                    f.removeClass('selected');
                }
            }
            $(`.full-btn.filter--voices > .info`).text(0);
            ChangeFilter();
        });
    },
    /**
     * Отображение окна
     */
    show: function () {
        if ($(`.content-voices > .voice`).length > 0) return;

        for (let i = 0; i < responseVoices.length; i++) {
            const e = responseVoices[i];
            $(`.content-voices`).append(`<div data-id="${e.id}" class="voice"><div class="title">${e.title}</div><div class="count">${e.count}</div></div>`);
        }

        $(`.content-voices > .voice`).click((e) => {
            const element = $(e.currentTarget);
            const id = parseInt(element.attr("data-id"));
            const findeIndex = SearchVoice.findIndex(x => x == id);
            if (findeIndex != -1) {
                SearchVoice.splice(findeIndex, 1);
                element.removeClass("selected");
                UpdateValue();
                return;
            }

            element.addClass("selected");
            SearchVoice.push(id);
            UpdateValue();
            ChangeFilter();
        });

        function UpdateValue() {
            $(`.full-btn.filter--voices > .info`).text(SearchVoice.length);
        }
    },
    /**
     * Скрытие окна
     */
    hide: function () {
        windowVoices.hide();
    },
    /**
     * Проверка для инициализация окна. Если проверка не нужна просто верни true
     * @returns Возвращает boolean
     */
    verif: function () { return windowFilter.showed && responseVoices; },
}

//Window Managment
const windowFilter = new WindowManagement(WindowFilter, '.window-filter');
const windowGenres = new WindowManagement(WindowGenres, '.window-genres');
const windowVoices = new WindowManagement(WindowVoices, '.window-voices');

Main((e) => {
    ShowGenres();
    ShowVoice();
    ShowHistory();
    Events();
    // Recomendation();
    $('.recomendation-none > span').text('Рекомендации отключены разработчиком');
    localStorage.removeItem('recomendation-database');
    localStorage.removeItem('tunime-recomendation');
});

InitMenu();

function Events() {
    _searchEvenet();
    _functionWindows();

    $(`header > .btn--clear`).click(() => {
        InputSearch.val("");
        SearchClear();
        SetState(0);
    });

    ScrollElementWithMouse('.content-recomendation.scroll-none');
    ScrollElementWithMouse('.block-line.genres.scroll-none');
    ScrollElementWithMouse('.block-line.voices.scroll-none');
    ScrollElementWithMouse('.history > .content.scroll-none');

    //Проверяем есть ли запрос из вне
    const searchParams = new URLSearchParams(window.location.search).get('val');
    if (searchParams) {
        InputSearch.val(searchParams);
        Search(searchParams);
    }
}

function _searchEvenet() {
    let typingTimeout;

    InputSearch.keydown(() => {
        clearInterval(typingTimeout);
    });

    InputSearch.keyup((e) => {
        if (InputSearch.val().length > 0 && GetState().id != "filter") {
            SetState(2);
        } else if (InputSearch.val().length == 0) {
            SetState(1);
        }

        if (e.which == 13) {
            return;
        }

        clearInterval(typingTimeout);

        typingTimeout = setTimeout(() => {
            if (InputSearch.val().length > 0) {
                //Производится поиск
                Search(InputSearch.val());
            }
        }, 1500);
    });

    InputSearch.on('keypress', function (e) {
        if (e.which == 13) {
            let value = this.value;
            if (value.length <= 0) {
                return;
            }
            clearInterval(typingTimeout);
            Search(InputSearch.val());
        }
    });

    InputSearch.focus(() => {
        if ($('main.result > .content > .card-anime').length <= 0) {
            SetState(1);
        }
    });

    InputSearch.blur(() => {
        if (InputSearch.val().length == 0) {
            SetState(0);
        }
    });
}

function _functionWindows() {
    $(`header > .btn.btn--filter`).click(function () {
        windowFilter.click();
    });
    $(`.full-btn.filter--genres`).click(function () {
        windowGenres.click();
    });
    $(`.full-btn.filter--voices`).click(function () {
        windowVoices.click();
    });
}

function ChangeFilter() {
    const excludedKeys = ["limit", "censored", "page"];
    let standartFilter = GetEmptyFilter();
    const isChanged = !isObjectEqual(SearchFilter, standartFilter, excludedKeys);
    if (isChanged || SearchVoice.length > 0) {
        $('.btn--filter').addClass('on-filter')
    } else {
        $('.btn--filter').removeClass('on-filter')
    }

    if (InputSearch.val().length > 0) {
        Search(InputSearch.val());
    }
}

//Получаем жанры аниме
function ShowGenres() {
    Genres.list(async (response) => {
        if (response.failed) {
            await Sleep(1000);
            return ShowGenres();
        }

        responseGenres = response;

        //Разбиваем на 3 строки
        let i = 1;

        for (let index = 0; index < response.length; index++) {
            const element = response[index];
            if (element.entry_type == "Anime") {
                const HasCensored = element.name == "Hentai" || element.name == "Erotica" ? true : false;
                $('.genres > .line-' + i).append(`<div class="${$PARAMETERS.censored && HasCensored ? "disabled" : ''}">${element.russian}</div>`);
                i == 1 ? i = 2 : i == 2 ? i = 3 : i = 1;
            }
        }
    }).GET();
}

//Получаем доступные озвуки аниме
function ShowVoice() {
    kodikApi.translations({ types: 'anime-serial', translation_type: 'voice', sort: 'count' }, (response) => {
        let i = 1;

        let id_dub = [];

        const numericKeys = getNumericKeysFromLocalStorage();

        for (let index = 0; index < numericKeys.length; index++) {
            const e = numericKeys[index];
            let t = JSON.parse(localStorage.getItem(e));
            id_dub.push(t.kodik_dub);
        }

        responseVoices = response.results;

        for (let index = 0; index < response.results.length; index++) {
            const element = response.results[index];
            let star_icon = `<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>`;
            if (element.count >= 10) {
                $('.voices > .line-' + i).append(`
                <div class="voice-card" data-id="${element.id}" data-title="${element.title}">${element.title}
                    <div class="count">${id_dub.findIndex((x) => x == element.id) != -1 ? star_icon : ''}${element.count}
                    </div>
                </div>`);
                i == 1 ? i = 2 : i == 2 ? i = 3 : i = 1;
            }
        }

        //Функция нажатия на озвучки
        $('.voice-card').click(async (e) => {
            AnimeFromVoices($(e.currentTarget).attr('data-id'));
        });
    })
}

function ShowHistory() {
    SearchHistory.loadHistory((data) => {
        if (data && data.length > 0) {
            //есть данные            
            for (let i = 0; i < data.length; i++) {
                $('main.history > .content').append(`<a href="/watch.html?id=${data[i]}" class="card-anime" data-id="${data[i]}"></a>`);
            }
            loadHistory(data);
        } else {
            //Истории нет, нужно скрыть вкладку истории
            $('.history').css('display', 'none');
        }
    });

    function loadHistory(list) {
        Animes.list({ ids: list.toString(), limit: list.length }, async (response) => {
            if (response.failed) {
                await Sleep(1000);
                return loadHistory(list);
            }

            for (let i = 0; i < response.length; i++) {
                const element = response[i];
                $(`main.history > .content > a[data-id="${element.id}"]`).append(ACard.Gen({ response: element, link: false }));
            }
        }).GET();
    }
}

function SearchClear() {
    $('main.result > .content').empty();
}

function getNumericKeysFromLocalStorage() {
    const keys = Object.keys(localStorage);
    const numericKeys = [];

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (/^\d+$/.test(key)) {
            numericKeys.push(key);
        }
    }

    return numericKeys;
}