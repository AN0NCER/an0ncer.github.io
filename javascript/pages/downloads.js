import { InitMenu } from "../menu.js";
import { TDAnime, TDownload } from "../modules/TDownload.js";
import { IManager } from "./downloads/mod_manager.js";
import { LoadPlayer } from "./downloads/mod_player.js";
import { countVideo, formatBytes } from "./downloads/mod_utils.js";

/// <reference path="/javascript/types/t_db_downloader.js" />

/**@type {DBControls} */
let db = undefined;

((() => InitMenu())(), async () => {
    // Подключаемся к базе данных
    db = (await TDownload.Manager(new TDAnime())).db;
    //Получаем все аниме и отображаем его
    await showAnime(await getAnime())
    //Инициализируем функционал
    reloadUI();

    $(".btn.manager").on("click", function () {
        IManager();
    });
})();

function reloadUI() {
    $(".card-anime").off("click.card");
    $(".card-anime").on("click.card", function () {
        const id = $(this).data("id");
        LoadPlayer(id);
    });
}

async function getAnime() {
    /**@type {[]} */
    const anime_list = await db.getAll("anime");
    if (anime_list.length === 0) {
        $('.empty-list').removeClass('hide');
        return anime_list;
    }

    let response = [];

    anime_list.forEach((anime) => {
        response.push({
            id: anime.id,
            name: anime.name,
            count: countVideo(anime.video),
            img: URL.createObjectURL(anime.poster.h),
            size: formatBytes(anime.size)
        });
    })

    return response;
}

async function showAnime(list = []) {
    const html = ({ id, img, name, count, size } = {}) => {
        return `<span class="card-anime" data-id="${id}"><div class="card-content"><img src="${img}" class="blur"><img src="${img}"><div class="title"><span>${name}</span></div></div><div class="card-information"><div class="score"><span class="val">${count}</span><span class="ticon i-film"></span></div><div class="year">${size}</div></div><span>`;
    }

    let isHide = true;

    list.forEach((anime) => {
        if (anime.count > 0) {
            $('.anime-list').append(html(anime));
            isHide = false;
        }
    });

    if(isHide){
        $('.empty-list').removeClass('hide');
    }
}

/**
 * @param {number} id 
 */
export async function CardUpdate(id) {
    /**@type {AnimeTable} */
    const anime = await db.get("anime", { id });
    const $element = $(`.card-anime[data-id="${id}"]`);

    $('.empty-list').addClass('hide');

    if ($element.length > 0) {
        $element.find('.score > .val').text(countVideo(anime.video));
        $element.find('.year').text(formatBytes(anime.size));
    } else {
        showAnime([{ id: anime.id, name: anime.name, count: countVideo(anime.video), img: URL.createObjectURL(anime.poster.h), size: formatBytes(anime.size) }]);

        reloadUI();
    }
}