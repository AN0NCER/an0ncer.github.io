import { Sleep } from "../../modules/functions.js";
import { GraphQl } from "../../modules/ShikiAPI.js";
import { IsLogged } from "../search.js";
import { ACardH } from "./mod_card.js";

export let HistoryLoaded = false;

export const SearchHistory = {
    key: 'search-history',
    data: [],

    /**
     * Загружает историю поиска из локального хранилища и передает ее в функцию обратного вызова (event).
     * @param {function} event - Функция обратного вызова, которой передается загруженная история.
     */
    loadHistory: function (event) {
        let data = localStorage.getItem(this.key);
        if (data)
            this.data = JSON.parse(data);
        event(this.data);
    },

    /**
     * Добавляет элемент в историю поиска.
     * @param {string} id - Идентификатор элемента, который нужно добавить в историю.
     */
    addHistory: function (id) {
        if (this.data == []) {
            this.data = localStorage.getItem(this.key) ? JSON.parse(localStorage.getItem(this.key)) : [];
        }
        // Check if the id already exists in the history
        let index = this.data.indexOf(id);
        if (index !== -1) {
            // If it does, move it to the first position
            this.data.splice(index, 1);
            this.data.unshift(id);
        } else {
            // If it doesn't, add it to the first position
            this.data.unshift(id);
            // And check if we have reached the maximum history length
            if (this.data.length > 10) {
                this.data.pop();
            }
        }
        localStorage.setItem(this.key, JSON.stringify(this.data));
        $('footer').css({ display: '' });
        //Если это уже есть в списке перенести на первое место
        if ($(`.history-list > a[data-id="${id}"]`).length > 0) {
            $(`.history-list > a[data-id="${id}"]`).detach().prependTo($('.history-list'));
        } else {
            if ($(`.history-list > a`).length >= 10) {
                $(`.history-list > a:last`).remove();
            }

            const clone = $(`.results > .card-anime-h[data-id="${id}"]`).clone();
            let $link = $('<a></a>')
                .html(clone.html()) // копируем содержимое
                .attr('href', `/watch.html?id=${clone.attr('data-id')}&iss=true`); // задаём ссылку

            // Копируем атрибуты
            $.each(clone[0].attributes, function (index, attr) {
                $link.attr(attr.name, attr.value);
            });

            $(`.history-list`).prepend($link);
        }
    },

    /**
     * Очищает историю поиска, удаляя все элементы из нее.
     */
    clearHistory: function () {
        this.data = [];
        localStorage.setItem(this.key, JSON.stringify(this.data));
    }
}

export async function LoadHistory() {
    const observer = new IntersectionObserver(([entry], obs) => {
        if (entry.isIntersecting === true) {
            obs.disconnect();
            fetchHistory();
        }
    }, { rootMargin: '0px' });

    observer.observe($(`.voices > .sentinel`)[0]);
}

function fetchHistory() {
    const card = new ACardH({ isLogged: IsLogged });

    const _fetch = (data) => {
        return new Promise((resolve) => {
            GraphQl.animes({ ids: `"${data.toString()}"`, limit: data.length }, async (response) => {
                if (response.failed) {
                    if (response.status === 429) {
                        await Sleep(2000);
                        return _fetch(data);
                    }
                    return resolve(null);
                }
                return resolve(response);
            }).POST(["id", { "poster": ["main2xUrl"] }, "name", "russian", "kind", "season", "episodesAired", "episodes", "status", { "statusesStats": ["status", "count"] }, "score", { "userRate": ["status", "id"] }, { "airedOn": ["year"] }], IsLogged)
        });
    }

    SearchHistory.loadHistory(async (data) => {
        $(`.history-list`).empty();

        if (data.length <= 0) {
            return $('footer').css({ display: 'none' });
        }

        const response = await _fetch(data);

        if (response == null) {
            return $('footer').css({ display: 'none' });
        }

        const { animes } = response.data;

        data.forEach(id => {
            const anime = animes.find(x => x.id == id);

            anime.personen = anime.statusesStats.reduce((sum, item) => sum + item.count, 0);
            $(`.history-list`).append(card.gen({ anime, redirects: { image: "poster.main2xUrl" } }, "a"));
        })

        HistoryLoaded = true;
    });
}