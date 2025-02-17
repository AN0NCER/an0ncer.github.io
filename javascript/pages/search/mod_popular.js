import { ACard } from "../../modules/AnimeCard.js";
import { Sleep } from "../../modules/functions.js";
import { GraphQl } from "../../modules/ShikiAPI.js";
import { Tunime } from "../../modules/TunimeApi.js";

function load(ids, poster = undefined) {
    const body = ["id", "russian", { airedOn: ["year"] }, "score"];

    if (poster === undefined)
        body.push({ poster: ["mainUrl"] });

    GraphQl.animes({ ids: `"${ids}"`, limit: ids.length }, async (response) => {
        if (response.failed) {
            if (response.status === 429) {
                await Sleep(2000);
                return load(ids, poster);
            }
            return;
        }

        const el = $('.content-popular');
        response.data.animes.forEach(anime => {
            if (poster)
                anime = { ...anime, poster: { "mainUrl": poster[anime.id] } }
            el.append(ACard.GenV2({ type: 'a', anime }));
        });

        $('.main > .title.hide').removeClass('hide');
        $('.content-popular').removeClass('hide');
    }).POST(body);
}

function tunime(){
    Tunime.Anime.Popular().then((anime) => {
        console.log(anime);
        if(!anime)
            return jikan();

        load(anime.toString())
    });
}

function jikan(){
    fetch('https://api.jikan.moe/v4/seasons/now?sfw&limit=10').then(response => {
        if (response.status !== 200)
            return;

        response.json().then((data) => {
            const list = Object.fromEntries(data.data.map(el => [el.mal_id, el.images.webp.image_url]));
            const ids = data.data.map(x => x.mal_id);

            load(ids, list);
        });
    });
}

export function TPopular() {
    try{
        if ($SHADOW.state.hasApiAccess){
            tunime();
        }else{
            jikan();
        }
    }catch{
        jikan();
    }
}