import { ACard } from "../../modules/AnimeCard.js";
import { Animes } from "../../modules/ShikiAPI.js";
import { Sleep, TrackElement } from "../../modules/functions.js";
import { SearchHistory } from "./mod_history.js";
import { GetState, SetState } from "./mod_searchState.js";

const Tracker = TrackElement();

export function AnimeFromGenres(genrId) {

}

export async function AnimeFromVoices(voiceId, nexPage = undefined) {
    let data = undefined;

    if (nexPage)
        data = await FetchUrl(nexPage);
    else
        data = await kodikApi.list({ types: 'anime-serial,anime', sort: 'shikimori_rating', translation_id: voiceId });

    let ids = [];

    for (let i = 0; i < data.results.length; i++) {
        const el = data.results[i];
        ids.push(el.shikimori_id);
    }

    LoadListShiki(ids);

    function LoadListShiki(ids) {
        Animes.list({ ids: ids.toString(), limit: ids.length, order: 'ranked' }, async (response) => {
            if (response.failed) {
                await Sleep(1000);
                return LoadListShiki(ids);
            }

            for (let i = 0; i < response.length; i++) {
                if ($(`main.history > .content > a[data-id="${response[i].id}"]`).length >= 0) {
                    $('main.result > .content').append(ACard.Gen({ response: response[i], link: false }));
                }
            }

            SetState(3)

            $("main.result > .content > .card-anime").unbind('click.history').on('click.history', (e) => {
                let target = $(e.currentTarget);
                const id = target.data('id');
                SearchHistory.addHistory(id);
                window.location.href = "/watch.html?id=" + id;
            });

            if (data.next_page) {
                Tracker.eventScroll('.scroll-end-func', () => {
                    if (GetState().id == 'result') {
                        AnimeFromVoices(voiceId, data.next_page);
                    }
                });
            }
        }).GET();
    }

    function FetchUrl(url) {
        return new Promise((resolve) => {
            fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            })
                .then(response => response.json())
                .then(response => resolve(response))
        });
    }
}