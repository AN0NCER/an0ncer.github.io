import { WindowManagement } from "../../modules/Windows.js";
import { TTSearch } from "./mod_search.js";
import { ClearGenres, SetGenres, WGenres } from "./mod_w_genres.js";
const data = {
    order: [
        { name: 'По популярности', value: 'popularity' },
        { name: 'По Оценкам', value: 'ranked' },
        { name: 'По Имени', value: 'name' },
        { name: 'По Эпизодам', value: 'episodes' },
        { name: 'По Релизам', value: 'aired_on' },
        { name: 'По Имени', value: 'name' }
    ],
    status: [
        { name: 'Все', value: undefined },
        { name: 'Анонс', value: 'anons' },
        { name: 'Онгоинг', value: 'ongoing' },
        { name: 'Вышел', value: 'released' }
    ],
    kind: [
        { name: 'Все', value: undefined },
        { name: 'TV-Сериал', value: 'tv' },
        { name: 'Фильм', value: 'movie' },
        { name: 'OVA', value: 'ova' },
        { name: 'ONA', value: 'ona' }
    ],
    score: [
        { name: 'Все', value: undefined },
        { name: '9+', value: 9 },
        { name: '8+', value: 8 },
        { name: '7+', value: 7 },
        { name: '6+', value: 6 },
        { name: '5+', value: 5 },
        { name: '4+', value: 4 },
        { name: '3+', value: 3 },
        { name: '2+', value: 2 },
        { name: '1+', value: 1 }
    ],
    rating: [
        { name: 'Все', value: undefined },
        { name: 'G', value: 'g' },
        { name: 'PG', value: 'pg' },
        { name: 'PG-13', value: 'pg_13' },
        { name: 'R-17', value: 'r' },
        { name: 'R+', value: 'r_plus' },
    ]
};

let seleted = {
    order: 'popularity',
};

function setRating() {
    const { rating } = data;
    const dom = $(`.filter--rating > .list-wrapper`);

    for (let i = 0; i < rating.length; i++) {
        const el = rating[i];
        dom.append(`<div class="rating" data-id="${i}">${el.name}</div>`);
    }

    $(`.list-wrapper > .rating[data-id="0"]`).addClass('sel');
    if (rating[0].value !== undefined) {
        seleted.rating = `"${rating[0].value}"`;
    }
}

function setScore() {
    const { score } = data;
    const dom = $(`.filter--score > .list-wrapper`);

    for (let i = 0; i < score.length; i++) {
        const el = score[i];
        dom.append(`<div class="score" data-id="${i}">${el.name}</div>`);
    }

    $(`.list-wrapper > .score[data-id="0"]`).addClass('sel').addClass('all');
    if (score[0].value !== undefined) {
        seleted.score = score[0].value;
    }
}

function setKind() {
    const { kind } = data;
    const dom = $(`.filter--type > .list-wrapper`);

    for (let i = 0; i < kind.length; i++) {
        const el = kind[i];
        dom.append(`<div class="type" data-id="${i}">${el.name}</div>`);
    }

    $(`.list-wrapper > .type[data-id="0"]`).addClass('sel');
    if (kind[0].value !== undefined) {
        seleted.kind = `"${kind[0].value}"`;
    }
}

function setSort() {
    const { order } = data;
    const domL = $(`.filter--sort > .sort-wrapper-line`);
    const domS = $(`.filter--sort > .sort-wrapper-list`);

    for (let i = 0; i < order.length; i++) {
        const el = order[i];
        if (i <= 1) {
            domL.append(`<div class="sort-by" data-id="${i}">${el.name}</div>`);
            continue;
        }
        domS.append(`<div class="sort-by" data-id="${i}">${el.name}</div>`);
    }

    domL.append(`<div class="btn btn-list"><div class="ticon i-angles-down"></div></div>`);
    $(`.sort-by[data-id="0"]`).addClass('sel');
    seleted.order = order[0].value;
}

function setStatus() {
    const { status } = data;
    const dom = $(`.filter--status > .list-wrapper`);

    for (let i = 0; i < status.length; i++) {
        const el = status[i];
        dom.append(`<div class="status" data-id="${i}">${el.name}</div>`);
    }

    $(`.list-wrapper > .status[data-id="0"]`).addClass('sel');

    if (status[0].value !== undefined) {
        seleted.status = `"${status[0].value}"`;
    }
}

const filter = {
    init: function () {
        setSort();

        $('.filter--sort').on('click', (event) => {
            const el = $(event.target);
            if (el.hasClass('btn-list')) {
                return $(`.filter--sort`).toggleClass('hide-list');
            }
            if (el.hasClass('sort-by')) {
                $(`.sort-by`).removeClass('sel');
                el.addClass('sel');
                seleted.order = data.order[el.data('id')].value;
            }
        });

        setStatus();

        $('.filter--status').on('click', (event) => {
            const el = $(event.target);
            if (el.hasClass('status')) {
                $(`.status`).removeClass('sel');
                el.addClass('sel');

                if (data.status[el.data('id')].value === undefined) {
                    delete seleted.status;
                    return;
                }
                seleted.status = `"${data.status[el.data('id')].value}"`;
            }
        });

        setKind();

        $('.filter--type').on('click', (event) => {
            const el = $(event.target);
            if (el.hasClass('type')) {
                $(`.type`).removeClass('sel');
                el.addClass('sel');
                if (data.kind[el.data('id')].value === undefined) {
                    delete seleted.kind;
                    return;
                }
                seleted.kind = `"${data.kind[el.data('id')].value}"`;
            }
        });

        setScore();

        $('.filter--score').on('click', (event) => {
            const el = $(event.target);
            if (el.hasClass('score')) {
                $(`.score`).removeClass('sel');
                el.addClass('sel');
                if (data.score[el.data('id')].value === undefined) {
                    delete seleted.score;
                    return;
                }
                seleted.score = data.score[el.data('id')].value;
            }
        });

        setRating();

        $('.filter--rating').on('click', (event) => {
            const el = $(event.target);
            if (el.hasClass('rating')) {
                $(`.rating`).removeClass('sel');
                el.addClass('sel');
                if (data.rating[el.data('id')].value === undefined) {
                    delete seleted.rating;
                    return;
                }
                seleted.rating = `"${data.rating[el.data('id')].value}"`;
            }
        });

        $(`.bar-filter > .window-close`).on('click', () => {
            this.hide();
        });
        $(`.btn-genres`).on('click', () => {
            WGenres.click();
        });
        $(`.filter-footer > .btn-accept`).on('click', () => {
            this.hide();
        });
        $(`.filter-footer > .btn-clear`).on('click', () => {
            for (const key in data) {
                if (key === "order") {
                    $(`.sort-by.sel`).removeClass('sel');
                    $(`.sort-by[data-id="0"]`).addClass('sel');
                    continue;
                }
                if (key == "kind") {
                    $(`.type.sel`).removeClass('sel');
                    $(`.type[data-id="0"]`).addClass('sel');
                    continue;
                }
                $(`.list-wrapper > .${key}.sel`).removeClass('sel');
                $(`.list-wrapper > .${key}[data-id="0"]`).addClass('sel');
            }
            ClearGenres();
            seleted = {
                order: 'popularity',
            };
        });
    },
    show: function () { },
    hide: function () {
        WFilter.hide();
        if (TTSearch.instance && TTSearch.instance.engine.type === "default") {
            TTSearch.instance.search($(`.input-wrapper > input`).val().trim() || null);
        }
    },
    verif: function () {
        return true;
    }
}

export const WFilter = new WindowManagement(filter, '.window-filter');
export const GetFilter = () => {
    seleted = SetGenres(seleted);
    return seleted;
}