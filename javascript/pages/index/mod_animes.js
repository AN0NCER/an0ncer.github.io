import { Card } from "../../modules/AnimeCard.js";
import { Animes } from "../../modules/ShikiAPI.js";
import { Sleep } from "../../modules/funcitons.js";

const _limitAnime = 8;
const _exclude_ids = [56572, 56560, 56484, 56481, 56575, 56308, 53514];

let _loadedAnime = false;
let _loadedUpdates = false;

let _functionsLoaded = [];

export function LoadAnimeShikimori({ status = 'ongoing', limit = _limitAnime, genre = '', take = 1, reflex = false, order = 'ranked', exclude_ids = _exclude_ids.toString() } = {}) {
    const q = {
        kind: 'tv',
        order,
        status,
        limit,
        genre,
        exclude_ids,
        season: `${new Date().getFullYear() - take}_${new Date().getFullYear()}`
    }

    Animes.list(q, async (response) => {
        if (response.failed && response.status == 429) {
            await Sleep(1000);
            return GetAnimeShikimori();
        }

        const element = $('.section-anime');
        //Очищение елемента
        if (!reflex) {
            element.empty();
        }

        for (let i = 0; i < response.length; i++) {
            element.append(Card().Link(response[i]));
        }

        if ($('.section-anime').find('.card-anime').length < _limitAnime) {
            LoadAnimeShikimori({ limit: _limitAnime - response.length, genre, take: take + 1, status: 'released', reflex: true });
        }

        _loadedAnime = true;
        AnimeLoaded();
    }).GET();
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
        Animes.list({ ids: ids.toString(), limit: 8 }, async (response) => {
            if (response.failed && response.status == 429) {
                await Sleep(1000);
                return _loadAnimes(ids);
            }

            const element = $('.section-update');

            for (let i = 0; i < response.length; i++) {
                element.append(Card().Link(response[i]));
            }

            _loadedUpdates = true;
            AnimeLoaded();
        }).GET();
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