import { ACard } from "../../modules/AnimeCard.js";
import { Animes } from "../../modules/ShikiAPI.js";
import { Sleep, TrackElement } from "../../modules/functions.js";
import { SearchHistory } from "./mod_history.js";
import { SetState, GetState } from "./mod_searchState.js";

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
                ShikimoriSearch(search)
            });
        }).GET();

        function GenerateList(response) {
            SetState(3);

            for (let i = 0; i < response.length; i++) {
                $('main.result > .content').append(ACard.Gen({response: response[i], link: false}));
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
                    
                    $('main.result > .content').append(ACard.Gen({response: response[i], link: false}));
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