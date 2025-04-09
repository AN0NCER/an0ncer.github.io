import { InitMenu } from "../menu.js";
import { WFilter } from "./search/mod_w_filter.js";
import { HistoryLoaded, SearchHistory } from "./search/mod_history.js";

import { TInfo, TSearchType, TTSearch } from "./search/mod_search.js";
import { Main } from "../modules/ShikiUSR.js";
import { ClearParams } from "../modules/functions.js";
import { TCache } from "../modules/tun.cache.js";

const q = new URLSearchParams(window.location.search).get('q');
const g = new URLSearchParams(window.location.search).get('g');
const s = new URLSearchParams(window.location.search).get('s');
const v = new URLSearchParams(window.location.search).get('v');

ClearParams(['q', 'g', 's', 'v']);

export let IsLogged = false;
export let IsLaden = false

InitMenu();

Main(async (logged) => {
    IsLogged = logged;
    input();

    if (g && v) {
        return import("./search/mod_genres.js").then(({ GenreInfo }) => {
            return new TTSearch(TSearchType.genre({ id: parseInt(g), val: v }), {
                info: TInfo.genre({ g: v, info: GenreInfo(parseInt(g)) }),
                on: { destroy: reset }
            }).search();
        });
    } else if (s) {
        return import("./search/mod_genres.js").then(({ LoadStudioById }) => {
            return LoadStudioById(s).then(data => {
                new TTSearch(TSearchType.studio({ id: parseInt(s), val: data.name }), {
                    on: { destroy: reset },
                    info: data.info
                }).search();
            })
        });

    } else if (q) {
        $(`.input-wrapper > input`).val(q);
        return new TTSearch(TSearchType.default(), {
            on: { destroy: reset }
        }).search(q);
    }

    reset();
});

function input() {
    const body = $('.body-wrapper');
    const results = $(`.results-wrapper`);
    const el = $(`.input-wrapper > input`);
    let timeOut = setTimeout;

    const _search = () => {
        el.blur();
        const val = el.val().trim() || null;
        if (TTSearch.instance !== null) {
            TTSearch.instance.search(val);
        } else {
            new TTSearch(TSearchType.default()).search(val);
        }
    }

    el.on('focus', () => {
        if (TTSearch.instance == null && !el.val()) {
            if (HistoryLoaded) {
                body.addClass('state-1');
            }
        }
    });

    el.on('blur', () => {
        body.removeClass('state-1');
    });

    el.on('keydown', (e) => {
        const key = e.originalEvent.keyCode;
        const val = el.val().trim();
        const { engine } = TTSearch.instance || { engine: null };

        if (key == 8 && !val) {
            if (engine == null) {
                clearTimeout(timeOut);
            }
            if (engine == null || engine.type === "default") return;
            TTSearch.instance.destroy();
        }

        if (key == 13) {
            clearTimeout(timeOut);
            _search();
        }

        if (val) {
            body.removeClass('state-1');
            if (engine == null && !body.hasClass('state-2')) {
                body.addClass('state-2');
                results.removeClass(['state-0', 'empty']).addClass('load');
                $(`.results`).empty();
            }
        }
    });

    el.on('input', () => {
        const val = el.val().trim();
        const { engine } = TTSearch.instance || { engine: null };
        clearTimeout(timeOut);
        if (!val && engine != null && engine.type === "default") {
            return TTSearch.instance.destroy();
        }
        if (!val) {
            return _search();
        }
        return timeOut = setTimeout(_search, 1000);
    });

    $(`.end > .btn`).on('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    $(`.search-controls > .btn-remove`).on('click', () => {
        if (TTSearch.instance) {
            TTSearch.instance.destroy();
        }
    });

    $(`.input-wrapper > .btn-empty`).on('click', () => {
        el.val('');
        _search();
    });

    $(`.search-controls > .btn-filter`).on('click', () => {
        WFilter.click();
    });

    $(`.seasons-list > .btn-wrapper > .btn`).on('click', () => {
        import("./search/mod_w_season.js").then(({ WSeason }) => { WSeason() });
    });

    $(`.empty > .btn`).on('click', () => {
        if (TTSearch.instance) {
            TTSearch.instance.destroy();
        }
        el.focus();
    });

    (() => {
        const $btn = $('.btn-menu[data-id="search"]');

        // Делаем глубокую копию обработчиков до off
        const rawHandlers = $._data($btn[0], "events")?.click || [];
        const oldClickHandlers = rawHandlers.map(h => ({ ...h }));

        $btn.off('click');

        // Ставим новый обработчик
        $btn.on('click', function (e) {
            if (TTSearch.instance) {
                window.scrollTo({ top: 0 });
                return TTSearch.instance.destroy();
            }

            // Вызов старых обработчиков
            for (const handler of oldClickHandlers) {
                handler.handler.call(this, e);
            }
        });
    })();

    (() => {
        $(document).on('click', 'div.card-anime-h', function (e) {
            const $el = $(e.currentTarget);

            if ($(e.target).closest('.btn-status').length > 0) {
                return; // Прерываем выполнение — был клик по .btn-status
            }

            const id = parseInt($el.attr('data-id'));
            SearchHistory.addHistory(id);
            window.location.href = `/watch.html?id=${id}&iss=true`;
        });
    })();
}

function reset() {
    if (IsLaden) return;
    IsLaden = true;

    import('./search/mod_popular.js').then(({ Popular }) => {
        Popular();
    });

    import('./search/mod_seasons.js').then(({ LoadSeasons }) => {
        LoadSeasons();
    });

    import('./search/mod_genres.js').then(({ LoadGenres }) => {
        LoadGenres();
    });

    import("./search/mod_voicelist.js").then(({ LoadVoiceList }) => {
        LoadVoiceList();
    });

    import("./search/mod_studios.js").then(({ LoadStudios }) => {
        LoadStudios();
    });

    import("./search/mod_history.js").then(({ LoadHistory }) => {
        LoadHistory();
    });

    new TCache().cleanup();
}