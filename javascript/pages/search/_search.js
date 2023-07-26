import { Animes } from "../../modules/ShikiAPI.js";
import { TrackElement } from "../../modules/funcitons.js";
import { SearchHistory } from "./_history.js";
import { SetState, GetState } from "./_searchState.js";

//Поиск
const InputSearch = $(`.search-input > input`);

const Tracker = TrackElement();

//Поиск по озвучек
export let SearchVoice = [];

//Поисковой фильтр
export let SearchFilter = {
    limit: 16, //Лимит елементов ответа
    censored: $PARAMETERS.censored, //Цензура
    page: 1, //Страница результата
}

//Функция поиска
export function Search(search) {
    SearchClear();
    InputSearch.blur();
    SearchFilter.page = 1;
    Tracker.removeEvent();

    if (SearchVoice.length == 0) {
        ShikimoriSearch(search);
    } else {
        VoiceSearch(search);
    }

    function ShikimoriSearch(search) {
        SearchFilter["search"] = search;
        Animes.list(SearchFilter, async (response) => {
            if (response.failed) {
                await Sleep(1000);
                return ShikimoriSearch(search);
            }

            GenerateList(response);

            if (response.length <= 0) return;


            Tracker.eventScroll(".scroll-end-func", () => {
                if (GetState().id != "result") return;
                SearchFilter.page++;
                console.log('here');
                ShikimoriSearch(search)
            });
        }).GET();

        function GenerateList(response) {
            SetState(3);

            for (let i = 0; i < response.length; i++) {
                $('main.result > .content').append(GenElement(response[i]));
            }

            $("main.result > .content > .card-anime").unbind('click').on('click', (e) => {
                const target = $(e.currentTarget);
                const id = target.data('id');
                SearchHistory.addHistory(id);
                window.location.href = "/watch.html?id=" + id;
            });
        }
    }

    async function VoiceSearch(search) {
        let list_animes = []

        await kodikApi.search({ types: 'anime-serial,anime', translation_id: SearchVoice, title: search }, (response) => {
            const data = response;

            let ids = [];
            for (let i = 0; i < data.total; i++) {
                const e = data.results[i];
                if (ids.findIndex(x => x == e.shikimori_id) == -1) ids.push(e.shikimori_id);
                if (ids.length == 16) {
                    list_animes.push(ids);
                    ids = [];
                }
            }
            if (ids.length > 0) list_animes.push(ids);
            LoadShikimori();
        });

        function LoadShikimori() {
            if (list_animes.length <= 0) return;
            let custom_Filter = SearchFilter;
            custom_Filter["ids"] = list_animes[0].toString();
            custom_Filter["limit"] = list_animes[0].length;
            Animes.list(custom_Filter, async (response) => {
                if (response.failed) {
                    await Sleep(1000);
                    return LoadShikimori();
                }

                SetState(3);
                list_animes.splice(0, 1);

                for (let i = 0; i < response.length; i++) {
                    $('main.result > .content').append(GenElement(response[i]));
                }

                $("main.result > .content > .card-anime").unbind('click').on('click', (e) => {
                    const target = $(e.currentTarget);
                    const id = target.data('id');
                    SearchHistory.addHistory(id);
                    window.location.href = "/watch.html?id=" + id;
                });

                if (list_animes.length <= 0) return;

                Tracker.eventScroll(".scroll-end-func", () => {
                    if (GetState().id != "result") return;
                    LoadShikimori();
                });

            }).GET();
        }
    }

    function GenElement(response) {
        const url = "https://nyaa.shikimori.me/";
        return `<div class="card-anime" data-id="${response.id}">
<div class="card-content"><img src="https://moe.shikimori.me/${response.image.original}"><div class="title"><span>${response.russian}</span></div></div><div class="card-information"><div class="year">${new Date(response.aired_on).getFullYear()}</div><div class="score"><svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.73196 0.745728C4.65834 0.595337 4.50279 0.499634 4.33196 0.499634C4.16112 0.499634 4.00696 0.595337 3.93196 0.745728L3.0389 2.55452L1.04446 2.84436C0.877789 2.86897 0.7389 2.98381 0.687511 3.14104C0.636122 3.29827 0.677789 3.4719 0.797233 3.58811L2.24446 4.99768L1.90279 6.98967C1.87501 7.15374 1.94446 7.32053 2.08196 7.4176C2.21946 7.51467 2.4014 7.52698 2.5514 7.44905L4.33334 6.51252L6.11529 7.44905C6.26529 7.52698 6.44723 7.51604 6.58473 7.4176C6.72223 7.31917 6.79168 7.15374 6.7639 6.98967L6.42084 4.99768L7.86807 3.58811C7.98751 3.4719 8.03057 3.29827 7.97779 3.14104C7.92501 2.98381 7.78751 2.86897 7.62084 2.84436L5.62501 2.55452L4.73196 0.745728Z" fill="#FFE600"/></svg>${response.score}</div></div>
    </div>`;
    }
}

function SearchClear() {
    $('main.result > .content').empty();
}

export function GetEmptyFilter() {
    return {
        limit: 16, //Лимит елементов ответа
        censored: $PARAMETERS.censored, //Цензура
        page: 1, //Страница результата
    }
}

export function SetEmptyFilter(){
    SearchFilter = {
        limit: 16, //Лимит елементов ответа
        censored: $PARAMETERS.censored, //Цензура
        page: 1, //Страница результата
    }
}

export function SetEmptyVoice(){
    SearchVoice = [];
}