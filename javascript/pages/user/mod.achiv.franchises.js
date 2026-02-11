import EmblaCarousel from "../../library/embla.esm.js";
import { ScrollElementWithMouse } from "../../modules/functions.js";
import { SHIKIURL } from "../../modules/Settings.js";
import { TCache } from "../../modules/tun.cache.js";
import { TAchivements } from "./mod.achievements.io.js";
import { WAnime } from "./mod.anime.win.js";

class RulesList {
    #data = undefined;

    constructor() {
        this.cache = new TCache();
        this.url = "https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/_franchises.yml";
        this.key = "achiv-franchises-rules";
    }

    async getList() {
        if (this.#data) return this.#data;
        try {
            this.#data = await this.#load();
        } catch (err) {
            console.log(err);
        }
        return this.#data;
    }

    async #load() {
        const value = await this.cache.get("metadata", this.key);
        if (value)
            return jsyaml.load(value);
        const response = await fetch(this.url)
        if (!response.ok) return undefined;
        const raw = await response.text();
        this.cache.put("metadata", this.key, raw, 14 * 24 * 60 * 60 * 1000)
        return jsyaml.load(raw)
    }
}

export class AchievementsFranchises {
    constructor(/**@type {TAchivements} */ io) {
        this.yml = new RulesList();
        this.map = new Map();
        io.on('init', (achivements) => {
            this.#load(achivements);

            let isProcessing = false;

            $(`.franchises-completed`).on('click', '.achivement', async (e) => {
                if (isProcessing) return;
                isProcessing = true;

                const element = $(e.currentTarget);
                const $loader = $(`<span class="load"><div class="ticon i-circle-notch"></div></span>`);

                try {
                    element.addClass('-load');
                    element.find('.img-wrapper').append($loader);

                    const rule = $(e.currentTarget).attr('rule');
                    const exclude = this.map.get(rule);
                    await WAnime(rule, { exclude });
                } finally {
                    element.removeClass('-load');
                    $loader.remove();
                    isProcessing = false
                }
            });

            $(`.franschises-unfinished`).on('click', '.achivement', async (e) => {
                if (isProcessing) return;
                isProcessing = true;

                const element = $(e.currentTarget);
                const $loader = $(`<span class="load"><div class="ticon i-circle-notch"></div></span>`);

                try {
                    element.addClass('-load');
                    element.append($loader);

                    const rule = $(e.currentTarget).attr('rule');
                    const exclude = this.map.get(rule);
                    await WAnime(rule, { exclude });
                } finally {
                    element.removeClass('-load');
                    $loader.remove();
                    isProcessing = false
                }
            });
        }, { replay: true });
    }

    #process_unfinished(achivements, data) {
        let achiv = achivements.filter(x => x.level === 0 && achivements.findIndex(e => e.neko_id === x.neko_id && e.level === 1) === -1);
        achiv = achiv.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        const $list = $(`.franschises-unfinished > .list`);

        for (let i = 0; i < achiv.length; i++) {
            const element = achiv[i];
            const index = data.findIndex(x => x.neko_id === element.neko_id && x.level === 1);
            if (index !== -1) {
                const rule = data[index].neko_id;
                const img = `${SHIKIURL.url}${data[index].metadata.image}`;
                this.map.set(rule, data[index]?.filters?.not_anime_ids || [])
                $list.append(`<div rule="${rule}" class="achivement"><span class="background" style="--img: url('${img}');"></span><span class="title">${data[index].metadata.title_ru}</span><div class="wrapper"><div class="progress"><div class="current-progress">${element.progress}%</div><div class="to-next-level">${data[index]?.generator?.threshold || data[index].threshold}</div><div class="value" style="width:${element.progress}%;"></div></div></div></div>`);
            }
        }

        if(achiv.length !== 0){
            $('.-hide-unfinished').removeClass('-hide-unfinished');
            //  <div class="user-achivements-franchises-wrapper -hide">
            // <div class="user-achivements-content-wrapper -hide-completed -hide-unfinished"></div>
        }

        ScrollElementWithMouse('.franschises-unfinished');
    }


    #process_completed(achivements, data) {
        let finished = achivements.filter(x => x.level >= 1);
        finished.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        const emblaNode = document.querySelector('.franchises-completed > .embla__viewport');
        const fraction = document.querySelector('.franchises-completed > .embla__fraction');

        const imgs = [];

        const $list = $('.embla__viewport > .embla__container');
        const $el = $('.franchises-completed');
        for (let i = 0; i < finished.length; i++) {
            const element = finished[i];
            const index = data.findIndex(x => x.neko_id === element.neko_id && x.level === 1);
            if (index !== -1) {
                const rule = data[index].neko_id;
                const img = `${SHIKIURL.url}${data[index].metadata.image}`;
                this.map.set(rule, data[index]?.filters?.not_anime_ids || [])
                imgs.push(img);
                $el.append(`<div data-id="${imgs.length - 1}" class="embla__bg -help" style="--img: url('${img}');"></div>`)
                $list.append(`<div rule="${rule}" class="embla__slide achivement"><div class="img-wrapper"><img src="${img}"></div><div class="achivement-content"><div class="text-wrapper"><div class="title">${data[index].metadata.title_ru}</div><div class="more">${data[index].threshold} Просмотренно</div></div></div></div>`);
            }
        }

        if(finished.length !== 0){
            $('.-hide-completed').removeClass('-hide-completed');
        }


        const options = {
            slidesToScroll: 1,
            align: 'start',
        }

        const embla = EmblaCarousel(emblaNode, options);
        const mq = window.matchMedia('(min-width: 740px)');

        function slidesPerView() {
            return mq.matches ? 2 : 1;
        }

        function updateActiveSlides() {
            const ids = []
            const slides = embla.slideNodes();
            const selectedIndex = embla.selectedScrollSnap();
            const visibleCount = slidesPerView();

            slides.forEach((slide, i) => {
                // Убираем все классы по умолчанию
                slide.classList.remove('-activ', '-prev');

                if (i < selectedIndex) {
                    // Все слайды до активных — прошлые
                    slide.classList.add('-prev');
                } else if (i >= selectedIndex && i < selectedIndex + visibleCount) {
                    // Видимые слайды
                    slide.classList.add('-activ');
                    ids.push(i);
                }
                // Слайды после активных остаются без классов
            });

            updateImg(ids);
            updateFraction(visibleCount);
        }

        function updateImg(ids = []) {
            if (ids.length !== 1) return;

            const active = $('.embla__bg.-activ');
            const help = $(`.embla__bg[data-id="${ids[0]}"]`);

            help.removeClass('-help').addClass('-activ');
            active.removeClass('-activ').addClass('-help');
        }

        function updateFraction(view) {
            const index = embla.selectedScrollSnap();
            const totalSlides = embla.slideNodes().length;

            fraction.textContent = `${Math.min(index + view, totalSlides)} / ${totalSlides}`;
        }

        embla.on('init', () => {
            updateFraction();
            updateActiveSlides();
        }).on('select', updateActiveSlides);

        mq.addEventListener('change', updateActiveSlides);
    }

    async #load(achivements) {
        /** @type {[]} */
        const data = await this.yml.getList();

        const ids = [...new Set(data.map(e => e.neko_id))];
        achivements = achivements.filter(x => ids.includes(x.neko_id));

        this.#process_unfinished(achivements, data);
        this.#process_completed(achivements, data);

        if(achivements.length !== 0){
            $('.user-achivements-franchises-wrapper').removeClass('-hide');
        }
    }
}