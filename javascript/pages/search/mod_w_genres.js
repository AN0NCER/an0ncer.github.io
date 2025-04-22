import { md5 } from "../../library/md5.wasm.min.js";
import { GraphQl } from "../../modules/ShikiAPI.js";
import { TCache } from "../../modules/tun.cache.js";
import { WindowManagement } from "../../modules/Windows.js";

const setup = {
    censored: [9, 539, 12, 105, 33, 133, 129, 34],
    ru: {
        "genre": "жанр",
        "theme": "тема",
        "demographic": "аудитория"
    }
}

let selected = [];

const genres = {
    init: function () {
        loadGenres().then((value) => {
            const dom = $('.window-genres-list');
            for (let i = 0; i < value.length; i++) {
                const element = value[i];
                const html = `<div class="genre" data-id="${element.id}">${element.russian}<div class="type">${setup.ru[element.kind]}</div></div>`;
                dom.append(html);
            }
        });

        $('.window-genres-list').on('click', (event) => {
            const el = $(event.target);
            if (el.hasClass('genre')) {
                const id = el.data('id');
                if (selected.includes(id)) {
                    selected.splice(selected.indexOf(id), 1);
                    el.removeClass('sel');
                } else {
                    selected.push(id);
                    el.addClass('sel');
                }
            }
        });

        $(`.search-filter > .search-wrapper > input`).on('input', (e) => {
            const value = $(e.currentTarget).val().toLowerCase();
            const genres = $('.window-genres-list > .genre');
            for (let i = 0; i < genres.length; i++) {
                const element = $(genres[i]);
                if (!element.text().toLowerCase().includes(value)) {
                    element.addClass('none');
                } else {
                    element.removeClass('none');
                };
            }
        });

        $(`.bar-genres > .window-close`).on('click', () => {
            this.hide();
        });

        $(`.genres-footer > .btn-accept`).on('click', () => {
            this.hide();
        });

        $(`.genres-footer > .btn-clear`).on('click', () => {
            ClearGenres();
        });
    },
    show: function () { },
    hide: function () {
        WGenres.hide();
        $(`.btn-genres > .btn-wrapper >.type > .count`).text(`${selected.length}`);
    },
    verif: function () { return true; }
}

async function loadGenres() {
    const load = () => {
        return new Promise((resolve) => {
            GraphQl.genres({ entryType: `Anime` }, async (response) => {
                if (response.failed) {
                    if (response.status == 429) {
                        await Sleep(1000);
                        return load();
                    }
                    return resolve(null);
                }
                if (response?.data?.genres) {
                    return resolve(response.data.genres);
                }
                return resolve(null);
            }).POST(["id", "kind", "russian"]);
        });
    }

    return new Promise(async (resolve) => {
        const cache = new TCache();
        const path = await md5(`genres|type|Anime`);

        cache.get("requests", path).then(async (val) => {
            if (val !== null)
                return resolve(val);

            const l = await load();
            if (l === null)
                return;

            cache.put("requests", path, l, 30 * 24 * 60 * 60 * 1000).finally(() => {
                resolve(l);
            });
        });
    });
}

export const WGenres = new WindowManagement(genres, '.window-genres');
export const SetGenres = (params) => {
    if (selected.length > 0) {
        params.genre = `"${selected.toString()}"`;
    } else {
        delete params.genre;
    }
    return params;
}
export const ClearGenres = () => {
    selected = [];
    $(`.window-genres-list > .genre.sel`).removeClass('sel');
    $(`.btn-genres > .btn-wrapper >.type > .count`).text(`${selected.length}`);
}