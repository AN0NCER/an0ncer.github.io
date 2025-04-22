import { ScrollElementWithMouse } from "../../modules/functions.js";
import { Jikan } from "../../modules/api.jikan.js";
import { TInfo, TSearchType, TTSearch } from "./mod_search.js";

let isLoad = false;

export async function LoadStudios() {
    await fetchStudios();
    ScrollElementWithMouse('.studios-list');
    $(`.studios-list`).on('click', '.studio', (e) => {
        if (isLoad) return;
        isLoad = true;
        const el = $(e.currentTarget);

        el.addClass('load');

        const id = parseInt(el.attr('mal-id'));
        const val = el.attr('data-val');

        Jikan.producers.getProducerById(id, ({ data }) => {
            const img = data.images.jpg.image_url;
            const eng = data.titles.find(x => x.type === "Default")?.title;
            const jp = data.titles.find(x => x.type === "Synonym")?.title || data.titles.find(x => x.type === "Japanese")?.title;
            const count = data.count;
            const year = new Date(data.established).getFullYear();
            new TTSearch(TSearchType.studio({ id, val }), { info: TInfo.studio({ img, eng, jp, count, year }) }).search();
            isLoad = false;
            el.removeClass('load');
        }).GET({}, false);

    })
}

export function LoadStudioById(id) {
    return new Promise((resolve) => {
        Jikan.producers.getProducerById(id, ({ data }) => {
            const img = data.images.jpg.image_url;
            const eng = data.titles.find(x => x.type === "Default")?.title;
            const jp = data.titles.find(x => x.type === "Synonym")?.title || data.titles.find(x => x.type === "Japanese")?.title;
            const count = data.count;
            const year = new Date(data.established).getFullYear();
            resolve({ info: TInfo.studio({ img, eng, jp, count, year }), name: eng });
        }).GET({}, false);
    })
}

async function fetchStudios(page = 1) {
    const studios = await Jikan.producers.getProducers({ order_by: 'favorites', sort: 'desc', page: page }).GET({}, true, 24 * 24 * 60 * 60 * 1000);

    const { data, pagination } = studios;

    requestAnimationFrame(() => {
        for (let i = 0; i < data.length; i++) {
            const studio = data[i];
            const html = `<div class="studio" mal-id="${studio.mal_id}" data-val="${studio.titles[0].title}"><div class="title">${studio.titles[0].title}</div><div class="count"><div class="ticon i-film"></div><span>${studio.count}</span></div></div>`;

            // Получаем все три линии
            const lines = [".studios-list > .line-1", ".studios-list > .line-2", ".studios-list > .line-3"];

            // Определяем линию с наименьшей шириной
            let minLine = lines.reduce((min, line) => {
                return $(line).width() < $(min).width() ? line : min;
            }, lines[0]);

            $(minLine).append(html);

            if (i < 25)
                anime({
                    targets: $(`.studio[mal-id="${studio.mal_id}"]`)[0],
                    opacity: [0, 1],
                    translateX: [50, 0],
                    duration: 800,
                    easing: "easeOutQuad",
                    delay: i * 50, // Поочередная задержка
                });
        }

        const observer = new IntersectionObserver(([entry], obs) => {
            if (entry.isIntersecting === true) {
                obs.disconnect();
                fetchStudios(page + 1);
            }
        }, { rootMargin: '0px' });

        if (pagination.has_next_page) {
            observer.observe($(`.studios-list > .line-2 > .sentinel`)[0]);
        }
    });
}