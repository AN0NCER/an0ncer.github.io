import { Kodik } from "../../modules/api.kodik.js";
import { $ID, Player } from "../watch.js";

const ru = {
    "tv": "TV Сериал",
    "movie": "Фильм",
    "ova": "OVA",
    "ona": "ONA",
    "special": "Спецвыпуск",
    "tv_special": "TV Спецвыпуск"
}

const el = {
    "anons": `<div class="status">анонс</div>`,
    "ongoing": `<div class="status">онгоинг</div>`
}

/** @type {[] | [number]} Последовательность просмотра */
export let watchSequence = [];

export function tChronology(data) {
    for (let i = 0; i < data.length; i++) {
        const { typefrc } = $PARAMETERS.watch;
        const { id, kind, name, russian, score, airedOn: { year }, userRate, status } = data[i];
        watchSequence.push(id);
        const html = `<a data-id="${id}" class="franchise ${typefrc.includes(ru[kind]) ? "show" : "hide"} ${$ID == id ? "selected" : ""}"><div class="anime-info"><div class="title">${russian || name}</div>${['anons', 'ongoing'].includes(status) ? `${el[status] || ``}` : ``}<div class="bloc-info"> <div class="anime-type">${ru[kind]}</div><div class="wrapper"> <div class="year">${year}</div> <div class="score" data-id="${id}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"> <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" /> </svg><span>${score}</span></div> </div> </div> </div> <div class="icon-info" data-id="${id}"> <div class="${[`status`, userRate?.status].join(' ')}"><svg class="i-watching" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"></path></svg><svg class="i-planned" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z"/></svg>
        <svg class="i-completed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z"/></svg><svg class="i-dropped" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg></div> <div class="voice none"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"> <path d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z" /> </svg> <div class="circle"> <svg class="i-xmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"> <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /> </svg> <svg class="i-circle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg> </div></div> </div> </a>`;
        $(".list-franchise").append(html);
        if ($(".list-franchise > a.show").length > 0 || $(".list-franchise > a.selected").length > 0) {
            $(`.list-franchise`).show();
            $(`.franchise-title`).show();
        }
    }
}

export async function tChronologyVoice() {
    tUpdate()
    Player.CTranslation.on("selected", () => {
        $('.container-l').show();
        $(`.icon-info > .voice`).addClass('none');
        tUpdate();
    })
}

export async function tReload(data) {
    const cache = new (await import('../../modules/tun.cache.js')).TCache();

    data.forEach(async ({ userRate, id }) => {
        const el = $(`.franchise[data-id="${id}"] > .icon-info > .status`);
        const st = ["planned", "watching", "rewatching", "completed", "on_hold", "dropped"];
        const key = `anime-${id}`;

        if (el.length > 0) {
            el.removeClass(st);
            if (userRate) el.addClass(userRate.status)
        }

        let anime = await cache.get("metadata", key);

        if (anime) {
            anime["chronology"] = data;
            cache.put("metadata", key, anime, parseInt($PARAMETERS.anime.anicachlive) * 24 * 60 * 60 * 1000);
        }
    });

    console.log(`[mod.chronology] - reload`);
}

async function tUpdate() {
    const transId = Player.CTranslation.id
    const promises = [];

    if (watchSequence.length <= 0 || !transId) {
        return hideLoad();
    }

    for (let i = 0; i < watchSequence.length; i++) {
        const id = watchSequence[i];
        promises.push(new Promise((resolve) => {
            Kodik.Search({ shikimori_id: id, translation_id: transId }, ({ results }) => {
                if (results <= 0) {
                    $(`.icon-info[data-id="${id}"] > .voice`).addClass('none');
                } else {
                    $(`.icon-info[data-id="${id}"] > .voice`).removeClass('none');
                }
                return resolve(true);
            });
        }));
    }

    for (let i = 0; i < promises.length; i++) {
        await promises[i];
    }

    hideLoad();
}

function hideLoad() {
    $('.container-l').hide();
}