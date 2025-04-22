import { Jikan } from "../../modules/api.jikan.js";
import { TSearchType, TTSearch } from "./mod_search.js";

const setup = {
    show: 4,
    ru: {
        "winter": "Зима",
        "spring": "Весна",
        "summer": "Лето",
        "fall": "Осень"
    }
}

export async function LoadSeasons() {
    const seasons = await Jikan.seasons.getSeasonsList().GET({}, true, 7 * 24 * 60 * 60 * 1000);

    const { data } = seasons;

    let showed = 0;

    data[0].seasons.forEach(season => {
        showed++;
        $('.seasons-wrapper').prepend(`<div class="season ${season}" data-year="${data[0].year}" data-season="${season}"><div class="title">${setup.ru[season]}</div><div class="yeahr">${data[0].year}</div><div class="bg"><div class="img"></div><div class="grd"></div></div></div>`)
    });

    if (data[0].seasons.length < 4) {
        arrayRotate(data[1].seasons, true)
        for (let i = 0; i < setup.show - showed; i++) {
            const season = data[1].seasons[i];
            $('.seasons-wrapper').append(`<div class="season ${season}" data-year="${data[0].year}" data-season="${season}"><div class="title">${setup.ru[season]}</div><div class="yeahr">${data[1].year}</div><div class="bg"><div class="img"></div><div class="grd"></div></div></div>`)
        }
    }

    $(`.seasons-wrapper`).on('click', '.season', (e) => {
        const el = $(e.currentTarget);
        const year = parseInt(el.attr('data-year'));
        const season = el.attr('data-season');
        const data = { id: { year, season }, val: `${setup.ru[season]} ${year}` };
        
        new TTSearch(TSearchType.season(data)).search();
    });
}

function arrayRotate(arr, reverse) {
    if (reverse) arr.unshift(arr.pop());
    else arr.push(arr.shift());
    return arr;
}