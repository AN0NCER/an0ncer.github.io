import { ScrollElementWithMouse, Sleep } from "../../modules/functions.js";
import { ACard } from "../../modules/AnimeCard.js";
import { GraphQl } from "../../modules/ShikiAPI.js";
import { Tunime } from "../../modules/TunimeApi.js";
import { Jikan } from "../../modules/api.jikan.js";
import { TCache } from "../../modules/tun.cache.js";

function ui_load(ids, poster = undefined) {
    const body = ["id", "russian", { airedOn: ["year"] }, "score"];

    if (poster === undefined)
        body.push({ poster: ["mainUrl"] });

    return GraphQl.animes({ ids: `"${ids}"`, limit: ids.length }, async (response) => {
        if (response.failed) {
            if (response.status === 429) {
                await Sleep(2000);
                return ui_load(ids, poster);
            }
            return;
        }

        const el = $('.content-popular');

        response.data.animes.forEach(anime => {
            if (poster)
                anime = { ...anime, poster: { "mainUrl": poster[anime.id] } }
            $('head').append(`<link rel="preload" as="image" href="${anime.poster.mainUrl}" fetchpriority="high">`);
            el.append(ACard.GenV2({ type: 'a', anime, priority: true }));
        });
        ScrollElementWithMouse('.content-popular');
    }).POST(body);
}

function tun_load() {
    const cache = new TCache();

    cache.get("requests", "tunpopular").then((val) => {
        if (val) {
            return ui_load(val.toString());
        }
        return Tunime.Anime.Popular().then((anime) => {
            if (!anime) throw new Error("Tunime API is not available");
            cache.put("requests", "tunpopular", anime);
            ui_load(anime.toString())
        });
    });
}

function jikan_load() {
    return Jikan.seasons.getSeasonNow({ sfw: true, continuing: false, limit: 10 }, ({ data }) => {
        const list = Object.fromEntries(data.map(el => [el.mal_id, el.images.webp.image_url]));
        const ids = data.map(x => x.mal_id);
        ui_load(ids, list);
    }).GET({}, true, 7 * 24 * 60 * 60 * 1000);
}

export function Popular() {
    if ($SHADOW.state.hasApiAccess) {
        try {
            return tun_load();
        } catch {
            return jikan_load();
        }
    }
    return jikan_load();
}