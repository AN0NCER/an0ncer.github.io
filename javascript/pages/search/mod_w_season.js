import { Jikan } from "../../modules/api.jikan.js";
import { WindowManagement } from "../../modules/Windows.js"
import { TSearchType, TTSearch } from "./mod_search.js";

const setup = {
    top: [
        { year: 2013, seas: "spring", anime: "Атака Титанов" },
        { year: 2014, seas: "summer", anime: "Tokyo Ghoul" },
        { year: 2015, seas: "fall", anime: "One Punch Man" },
        { year: 2016, seas: "spring", anime: "Re:Zero" },
        { year: 2017, seas: "fall", anime: "Невеста чародея" },
        { year: 2019, seas: "summer", anime: "Kimetsu no Yaiba" },
        { year: 2020, seas: "fall", anime: "Jujutsu Kaisen" },
        { year: 2021, seas: "spring", anime: "Fruits Basket" },
        { year: 2022, seas: "spring", anime: "Spy x Family" },
        { year: 2022, seas: "fall", anime: "Chainsaw Man" }
    ],
    ru: {
        "winter": "Зима",
        "spring": "Весна",
        "summer": "Лето",
        "fall": "Осень"
    }
}

let isLoad = false; // Уже идет загрузка окна
let onLoad = false; // Проверка на существование сезона

let year = undefined; // Выбранный год
let season = "fall"; // Выбранный сезон

const window = {
    loaded: false,
    years: [],
    init: () => {
        let logicalIndex = 0; // Логический индекс текущего поля
        let timer; // Таймер поиска сезона

        $(".td").on("mousedown", function (e) {
            if ($(".td:focus").length > 0) {
                e.preventDefault();
                return select($(".td").index(this));
            }
            select($(".td").index(this));
        })

        $(".td").on("blur", () => {
            $(".td.sel").removeClass('sel');
        });

        $(".td").on("keydown", function (e) {
            e.preventDefault();
            let inputs = $(".td");
            if ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].includes(parseInt(e.key))) {
                if ($(inputs[logicalIndex]).val() === '') {
                    _val($(inputs[logicalIndex]), e.key);
                    return select(logicalIndex + 1);
                }

                _val($(inputs[logicalIndex]), e.key);

                select(logicalIndex + 1);
            }
            if (e.key === "Backspace") {
                if ($(inputs[logicalIndex]).val() !== '') {
                    _val($(inputs[logicalIndex]), '');
                    return select(logicalIndex - 1);
                }
                return select(logicalIndex - 1);
            }
        });

        function _val(inputs, val) {
            inputs.val(val);

            let combinedValue = $(".td").map(function () {
                return $(this).val(); // Получаем значение каждого input
            }).get().join('');

            _proc(combinedValue);
        }

        function _proc(val) {
            clearTimeout(timer);
            if (val.length != 4) return;

            onLoad = true;
            window.input.load(val);

            timer = setTimeout(() => {
                window.input.year(val);
                onLoad = false;
            }, 500);
        }

        function select(index) {
            if (index >= 4 || index < 0) return;
            logicalIndex = index;
            $(".td.sel").removeClass('sel');
            $($(".td")[logicalIndex]).addClass('sel');
        }

        function _open(year, season) {
            if (onLoad) return;
            const data = { id: { year, season }, val: `${setup.ru[season]} ${year}` };
            new TTSearch(TSearchType.season(data)).search();
            return window.hide();
        }

        $(".form-wrapper > .btn-submit").on('click', () => {
            return _open(year, season);
        });

        $(".season-wrapper > .btn").on("click", (e) => {
            const el = $(e.currentTarget);
            window.input.season(el.attr('data-id'));
        });

        $(".top-seasons").on("click", ".btn", (e) => {
            const id = $(e.currentTarget).attr('data-id');
            const { year, seas } = setup.top[id];
            return _open(year, seas);
        });

        setup.top.forEach((anime, index) => {
            $(`.top-seasons`).append(`<div class="btn" data-id="${index}"><div class="title">${setup.ru[anime.seas]} <span>${anime.year}</span></div><div class="anime">${anime.anime}</div></div>`)
        });
    },
    show: function () {
        isLoad = false;
    },
    hide: () => {
        win.hide();
    },
    verif: () => { return true },
    input: {
        set: (val) => {
            let chars = val.split(''); // Разбиваем строку на массив символов

            $(".td").each(function (index) {
                $(this).val(chars[index] || ''); // Заполняем input или оставляем пустым
            });
        },

        get: () => {
            return $(".td").map(function () {
                return $(this).val(); // Получаем значение каждого input
            }).get().join('');
        },

        year: (y) => {
            const icon = $(`.form-wrapper > .status > .icon`);
            const text = $(`.form-wrapper > .status > .text`);

            icon.removeClass(['state-1', 'state-2']);
            if (window.years.findIndex(x => x == y) == -1) {
                year = undefined;
                icon.addClass('state-2');
                return text.html(`Сезон <span class="err">"${y}"</span> не существует`);
            }

            year = y
            icon.addClass('state-1');
            return text.html(`Сезон <span>"${y}"</span> доступен для просмотра`);
        },

        load: (year) => {
            const icon = $(`.form-wrapper > .status > .icon`);
            const text = $(`.form-wrapper > .status > .text`);

            icon.removeClass(['state-1', 'state-2']);
            return text.html(`Загрузка "${year}" сезон...`);
        },

        season: (val) => {
            season = val;
            $(`.season-wrapper > .btn.sel`).removeClass("sel")
            $(`.season-wrapper > .btn[data-id="${season}"]`).addClass("sel");
        }
    }
}

const win = new WindowManagement(window, '.window-season');

export const WSeason = () => {
    if (isLoad) return;

    isLoad = true;

    if (window.years.length > 0) return win.click();

    Jikan.seasons.getSeasonsList(({ data }) => {
        window.years = data.map(x => x.year);

        const year = window.years.find(x => x === new Date().getFullYear()) || window.years[0];

        window.input.year(year);
        window.input.season(season);

        $(`.season-list-availble`).html(`Доступны сезоны начиная с <span>“${window.years[window.years.length - 1]}”</span> по <span>“${window.years[0]}"</span> года`);

        win.click();
    }).GET({}, true, 7 * 24 * 60 * 60 * 1000).catch((reason) => {
        isLoad = false;
    });
}