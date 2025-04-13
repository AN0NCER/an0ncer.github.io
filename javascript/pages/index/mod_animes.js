import { ACard } from "../../modules/AnimeCard.js";
import { GraphQl } from "../../modules/ShikiAPI.js";
import { Sleep } from "../../modules/functions.js";

const _limitAnime = 8;
const _exclude_ids = {
    '': [60108], // Все
    4: [], // Комедия
    24: [58379, 57827, 59883], // Фантастика
    14: [], // Ужасы
    10: [], // Фэнтэзи
    22: [], // Романтика
    8: [], // Драма
    18: [57827, 59387], // Меха
    7: [], // Дэтэктив
    38: [60207] // Военное
}

let _loadedAnime = false;
let _loadedUpdates = false;

let _functionsLoaded = [];

export function LoadAnimeShikimori({ status = 'ongoing', limit = _limitAnime, genre = '', take = 1, reflex = false, order = 'ranked', exclude_ids = _exclude_ids.toString() } = {}) {
    const arg = {
        kind: `"tv,movie"`,
        order: `${order}`,
        status: `"${status}"`,
        limit: limit,
        genre: `"${genre}"`,
        excludeIds: `"${(_exclude_ids[genre] || []).toString()}"`,
        season: `"${new Date().getFullYear() - take}_${new Date().getFullYear()}"`
    }

    if(!reflex){
        for (let i = 0; i < limit; i++) {
            $(`.section-anime`).append(ACard.LoadV2({id: i}));
        }
    }

    GraphQl.animes(arg, async (response) => {
        if (response.failed && response.status == 429) {
            await Sleep(1000);
            return LoadAnimeShikimori({ status, limit, genre, take, reflex, order, exclude_ids });
        }

        const element = $('.section-anime');
        //Очищение елемента
        if (!reflex) {
            element.empty();
        }

        //Пролистываем в начало
        element.scrollLeft(0)

        const animes = response.data.animes;

        for (let i = 0; i < animes.length; i++) {
            element.append(ACard.GenV2({ type: "a", anime: animes[i] }));
        }

        if ($('.section-anime').find('.card-anime').length < _limitAnime) {
            LoadAnimeShikimori({ limit: _limitAnime - animes.length, genre, take: take + 1, status: 'released', reflex: true });
        }


        _loadedAnime = true;
        AnimeLoaded();
    }).POST(["id", { poster: ["mainUrl"] }, "russian", { airedOn: ["year"] }, "score"]);
}

/**
 * Получаем обновленные аниме в kodik плеере
 */
export async function LoadUpdatetAnime() {
    const response = await kodikApi.list({
        sort: 'updated_at',
        limit: _limitAnime,
        types: 'anime-serial'
    });

    if (response.failed) {
        await Sleep(1000);
        return LoadUpdatetAnime();
    }

    let ids = [];

    for (let index = 0; index < response.results.length; index++) {
        ids.push(response.results[index].shikimori_id);
    }

    _loadAnimes(ids)

    //Достает данные с shikimori cо взятых id из kodik сервера
    function _loadAnimes(ids) {
        for (let i = 0; i < ids.length; i++) {
            $(`.section-update`).append(ACard.LoadV2({id: i}));
        }
        GraphQl.animes({ ids: `"${ids.toString()}"`, limit: ids.length }, async (response) => {
            if (response.failed && response.status == 429) {
                await Sleep(1000);
                return _loadAnimes(ids);
            }

            const element = $('.section-update');
            const animes = response.data.animes;

            $(`.section-update`).empty();

            for (let i = 0; i < animes.length; i++) {
                element.append(ACard.GenV2({ type: "a", anime: animes[i] }));
            }

            _loadedUpdates = true;
            AnimeLoaded();
        }).POST(["id", { poster: ["mainUrl"] }, "russian", { airedOn: ["year"] }, "score"]);
    }
}


//Функция будет вызвана только тогда когда аниме будет загружено
export function AnimeLoaded(event) {
    if (event && typeof event == "function") {
        if (_loadedAnime && _loadedUpdates) {
            return event();
        }

        return _functionsLoaded.push(event);
    }

    for (let i = 0; i < _functionsLoaded.length; i++) {
        const e = _functionsLoaded[i];
        e();
    }
    _functionsLoaded = [];
}