import { Animes } from "../../modules/ShikiAPI.js";
import { Sleep, TrackElement } from "../../modules/funcitons.js";
import { SearchHistory } from "./_history.js";
import { GetState, SetState } from "./_searchState.js";

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
                    $('main.result > .content').append(Card().Div(response[i]));
                }
            }

            SetState(3)

            $("main.result > .content > .card-anime").unbind('click').on('click', (e) => {
                let target = $(e.currentTarget);
                const id = target.data('id');
                SearchHistory.addHistory(id);

                //Если это уже есть в списке перенести на первое место
                if ($(`.history > .content > a[data-id="${id}"]`).length > 0) {
                    $(`.history > .content > a[data-id="${id}"]`).detach().prependTo($('.history > .content'));
                } else {
                    if ($(`.history > .content > a`).length >= 10) {
                        $(`.history > .content > a:last`).remove();
                    }

                    $(`.history > .content`).prepend(`<a href="/watch.html?id=${id}" data-id="${id}">
                    <div class="card-anime" data-anime="${id}"><div class="content-img"><div class="saved"></div>
                    <div class="title">${$(`.result > .content > .response-anime[data-id="${id}"] > .preview > .title`).text()}</div>
                    <img src="${$(`.result > .content > .response-anime[data-id="${id}"] > .preview > img`).attr('src')}" alt="${$(`.result > .content > .response-anime[data-id="${id}"] > .preview > .title`).text()}">
                    </div><div class="content-inf"><div class="inf-year">${$(`.result > .content > .response-anime[data-id="${id}"] > .info > .year`).text()}</div><div class="inf-rtng"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path></svg>${$(`.result > .content > .response-anime[data-id="${id}"] > .info > .score`).text()}</div></div></div></a>`);
                }

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