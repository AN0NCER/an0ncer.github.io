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
                    $('main.result > .content').append(ElementResponse(response[i]));
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

function ElementResponse(response) {
    const url = "https://nyaa.shikimori.me/";
    return `<div class="card-anime" data-id="${response.id}">
<div class="card-content"><img src="${url}${response.image.original}"><div class="title"><span>${response.russian}</span></div></div><div class="card-information"><div class="year">${new Date(response.aired_on).getFullYear()}</div><div class="score"><svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.73196 0.745728C4.65834 0.595337 4.50279 0.499634 4.33196 0.499634C4.16112 0.499634 4.00696 0.595337 3.93196 0.745728L3.0389 2.55452L1.04446 2.84436C0.877789 2.86897 0.7389 2.98381 0.687511 3.14104C0.636122 3.29827 0.677789 3.4719 0.797233 3.58811L2.24446 4.99768L1.90279 6.98967C1.87501 7.15374 1.94446 7.32053 2.08196 7.4176C2.21946 7.51467 2.4014 7.52698 2.5514 7.44905L4.33334 6.51252L6.11529 7.44905C6.26529 7.52698 6.44723 7.51604 6.58473 7.4176C6.72223 7.31917 6.79168 7.15374 6.7639 6.98967L6.42084 4.99768L7.86807 3.58811C7.98751 3.4719 8.03057 3.29827 7.97779 3.14104C7.92501 2.98381 7.78751 2.86897 7.62084 2.84436L5.62501 2.55452L4.73196 0.745728Z" fill="#FFE600"/></svg>${response.score}</div></div>
</div>`;
}