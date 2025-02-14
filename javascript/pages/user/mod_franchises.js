import { SHIKIURL } from "../../modules/Settings.js";
import { LoadYaml, OnAchivements } from "./mod_achivements.js";
import { ShowAnimeList } from "./mod_w_anime.js";

const URL = "https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/_franchises.yml";

export async function Franchises() {
    const data = await LoadYaml(URL);

    let ids = [];

    for (let i = 0; i < data.length; i++) {
        const element = data[i];
        if (!ids.includes(element.neko_id))
            ids.push(element.neko_id);
    }

    OnAchivements((achivements) => {
        if (achivements === undefined)
            return;
        achivements = achivements.filter(x => ids.includes(x.neko_id));
        let unfinished = achivements.filter(x => x.level === 0 && achivements.findIndex(e => e.neko_id === x.neko_id && e.level === 1) === -1);
        unfinished = unfinished.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        if (unfinished.length !== 0) {
            $(`[id="unfinished"]`).removeClass('hide');
        }

        for (let i = 0; i < unfinished.length; i++) {
            const element = unfinished[i];
            const index = data.findIndex(x => x.neko_id === element.neko_id && x.level === 1);
            if (index !== -1) {
                $(`.wrapper-achivements-unfinished > .list`).append(`<div class="achivement" data-exclude="${JSON.stringify(data[index]?.filters?.not_anime_ids || [])}" data-id="${data[index].neko_id}"><span class="title">${data[index].metadata.title_ru}</span><span class="loader"><div class="ticon i-circle-notch"></div></span><div class="wrapper"><div class="progress"><div class="current-progress">${element.progress}%</div><div class="to-next-level">${data[index]?.generator?.threshold || data[index].threshold}</div><div class="value" style="width:${element.progress}%;"></div></div></div></div>`);
            }
        }

        let finished = achivements.filter(x => x.level === 1);
        finished = finished.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        if (finished.length !== 0) {
            $(`[id="franchises"]`).removeClass('hide');
        }

        for (let i = 0; i < finished.length; i++) {
            const element = finished[i];
            const index = data.findIndex(x => x.neko_id === element.neko_id && x.level === 1);
            if (index !== -1) {
                $('.achivements-swiper').append(`<div class="swiper-slide achivement" data-exclude="${JSON.stringify(data[index]?.filters?.not_anime_ids || [])}" data-id="${data[index].neko_id}"><div class="img-wrapper"><div class="ticon i-circle-notch"></div><img src="${SHIKIURL.url}${data[index].metadata.image}"></div><div class="content-swiper-wrapper"><div class="text-wrapper"><div class="title">${data[index].metadata.title_ru}</div><div class="more">${data[index].threshold} Просмотренно</div></div></div></div>`)
            }
        }

        $(`.achivement`).on('click', function () {
            const id = $(this).attr('data-id');
            const exclude = JSON.parse($(this).attr('data-exclude'));
            ShowAnimeList(id, exclude);
        });

        new Swiper('.swiper', {
            pagination: {
                el: '.swiper-pagination',
                type: "fraction",
            },
            spaceBetween: 10,
            breakpoints: {
                740: {
                    slidesPerView: 2
                }
            },
            on: {
                init: function () {
                    const src = $('.achivement.swiper-slide-active').find('img').attr('src');
                    $('.bg-active').attr('src', src);
                },

                slideChange: function (swiper) {
                    const active = $('.bg-active');
                    const help = $('.bg-help');

                    const src = $(`.achivement.swiper-slide-${swiper.swipeDirection}`).find('img').attr('src');
                    help.attr('src', src);

                    help.removeClass('bg-help').addClass('bg-active');
                    active.removeClass('bg-active').addClass('bg-help');
                }
            }
        })
    });
}