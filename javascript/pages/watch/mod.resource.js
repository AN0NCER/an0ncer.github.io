import { OAuth } from "../../core/main.core.js";
import { ACard } from "../../modules/AnimeCard.js";
import { Sleep } from "../../modules/functions.js";
import { Animes, GraphQl, UserRates } from "../../modules/api.shiki.js";
import { TCache } from "../../modules/tun.cache.js";
import { $ID } from "../watch.js";
import { tChronology, tReload } from "./mod.chronology.js";
import { LTransition } from "./mod_transition.js";
import { UserRate } from "./mod_urate.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const _onCache = $PARAMETERS.anime.anicaching;
const _live = parseInt($PARAMETERS.anime.anicachlive) * 24 * 60 * 60 * 1000;

export let tAnime = null;

/**
 * Загружает аниме данные
 * @param {Function} e - событие после загрузки аниме
 * @param {{logged:?boolean,isset:?boolean}} data 
 * @returns {Promise<string>}
 */
export function tLoad(e = () => { }, { logged = false } = {}) {

    const cache = new TCache();
    const process = [];
    const start = Date.now();

    LTransition.Progress.steps = 4;
    cache.cleanup("metadata");

    return new Promise(async (resolve, reason) => {
        try {
            if (_onCache) {
                const cached = await cache.get("metadata", `anime-${$ID}`);
                tAnime = cached || await load($ID);
            } else {
                tAnime = await load($ID);
            }

            LTransition.Progress.NewStep();

            process.push(new Promise(async (resolve) => {
                const a = await user();
                UserRate().init(a, logged);
                resolve();
            }));

            process.push(new Promise(async (resolve) => {
                const img = $(".preview-wrapper > .main");
                img.addEventListener('load', (e) => {
                    $(".bg-wrapper > .bg").setAttribute('src', e.currentTarget.getAttribute('src'));
                    resolve(true);
                });
                img.setAttribute('src', tAnime["poster"]["originalUrl"]);
            }));

            Chronology(tAnime["chronology"]);

            process.push(new Promise(resolve => {
                SetTitle(tAnime);
                Genres(tAnime["genres"]);
                Duration(tAnime);
                Status(tAnime);
                NextEpisode(tAnime);
                Gallery(tAnime["screenshots"]);
                Description(tAnime);
                Studio(tAnime["studios"]);
                PageTitle(tAnime);
                if (!$PARAMETERS.anime.hidehero)
                    Heroes(tAnime["characterRoles"]);
                // PageMetaTags(tAnime);
                resolve(true);
            }));

            Similiar($ID);

            for (let i = 0; i < process.length; i++) {
                await process[i];
                LTransition.Progress.NewStep();
            }

            e(tAnime);
            resolve(tAnime);
            console.log(`[mod.res] - load: ${Date.now() - start}ms`);

            UserRate().Events.OnUpdate(async () => {
                const data = await chronology();
                tAnime = { ...tAnime, ...data };

                if (_onCache) tReload(tAnime["chronology"]);
            });
        } catch (err) {
            console.log(err);
            reason(err);
        }
    });

    async function load(id) {
        return new Promise((resolve, reason) => {
            const body = ["id", "russian", "name", "score", "status", "episodesAired", "episodes", "duration", "rating", "nextEpisodeAt", "descriptionHtml", "kind", { "characterRoles": ["rolesEn", { "character": ["russian", "url", { "poster": ["previewUrl"] }] }] }, { "chronology": ["id", "russian", "name", "kind", "status", "score", { "airedOn": ["year"] }, { userRate: ["status"] }] }, { "poster": ["originalUrl"] }, { "genres": ["id", "name", "russian", "kind"] }, { "studios": ["id", "name"] }, { "screenshots": ["x332Url", "originalUrl"] }];

            GraphQl.animes({ ids: `"${id}"`, limit: 1 }, async (response) => {
                if (response.failed) {
                    if (response.status === 429) {
                        await Sleep(1000);
                        return resolve(load(id));
                    }
                    return reason(new Error(`mod.resource.e.${response.status}`));
                }

                const { data: { animes } } = response;

                if (animes.length <= 0) {
                    return reason(new Error(`mod.resource.e.${404}`));
                }

                if (_onCache)
                    cache.put("metadata", `anime-${id}`, animes[0], _live);
                resolve(animes[0]);
            }).POST(body, logged)
        });
    }

    async function chronology() {

        return new Promise((resolve) => {
            const body = [{ "chronology": ["id", "russian", "name", "kind", "status", "score", { "airedOn": ["year"] }, { userRate: ["status"] }] }];

            GraphQl.animes({ ids: `"${$ID}"`, limit: 1 }, async (response) => {
                if (response.failed) {
                    if (response.status === 429) {
                        await Sleep(1000);
                        return resolve(chronology());
                    }
                    return;
                }

                const { data: { animes } } = response;

                if (animes.length <= 0) {
                    return;
                }

                // cache.put("metadata", `chronology-${$ID}`, animes[0], 1 * 24 * 60 * 60 * 1000);

                resolve(animes[0]);
            }).POST(body, logged)
        });
    }

    async function user() {
        if (!logged) {
            return null;
        }
        const response = await UserRates.list({ "user_id": OAuth.user.id, "target_id": $ID, limit: 1, "target_type": "Anime" }).GET(logged);
        if (response.failed) {
            if (response.status == 429) {
                await Sleep(1000);
                return user();
            }
            return;
        }

        return response[0];
    }
}

/**
     * Загрузка похожих аниме
     */
async function Similiar(id) {
    const cache = new TCache();
    let ids = null;

    if (_onCache) {
        const cached = await cache.get("metadata", `similiar-${id}`);
        ids = cached || await loadLits();
    } else {
        ids = await loadLits();
    }

    if (ids === null) return;

    return Complete(ids);

    async function loadLits() {
        const response = await Animes.similar(id).GET();
        if (response.failed) {
            if (response.status == 429) {
                await Sleep(1000);
                return loadLits();
            }
            return null;
        }

        const ids = response.map(x => x.id);

        if (_onCache)
            cache.put("metadata", `similiar-${id}`, ids, _live);

        return ids;
    }

    async function Complete(ids) {
        if (ids.length <= 0) return;

        let page = 1;
        const limit = 12;
        const animes = await load();

        if (animes.length <= 0) return;

        const element = $('.similiar-anime > .view-wrapper');

        $(".similiar-count").textContent = ids.length;
        $$(".similiar-title , .similiar-anime").forEach(el => el.style.display = '');


        for (let i = 0; i < animes.length; i++) {
            element.insertAdjacentHTML('beforeend', ACard.GenV2({ type: "a", anime: animes[i] }));
        }

        if (animes.length >= limit) {
            page++;

            const observer = new IntersectionObserver(([entry], obs) => {
                if (entry.isIntersecting === true) {
                    obs.disconnect();
                    load().then(animes => {
                        for (let i = 0; i < animes.length; i++) {
                            element.insertAdjacentHTML('beforeend', ACard.GenV2({ type: "a", anime: animes[i] }));
                        }

                        if (animes.length >= limit) {
                            page++;
                            observer.observe($('.view-wrapper > .sentinel'));
                        }
                    });
                }
            }, { rootMargin: '0px' });

            observer.observe($('.view-wrapper > .sentinel'));
        }

        async function load(c = true) {
            let animes = null;

            if (c && _onCache)
                animes = await cache.get("metadata", `sim-${$ID}-${ids.length}-${page}`);

            if (animes) return animes;

            return new Promise((resolve) => {
                GraphQl.animes({ ids: `"${ids.toString()}"`, limit, order: 'popularity', page }, async (response) => {
                    if (response.failed) {
                        if (response.status === 429) {
                            await Sleep(1000);
                            return resolve(load(false));
                        }
                        return resolve([]);
                    }

                    const { data: { animes } } = response;

                    if (_onCache)
                        cache.put("metadata", `sim-${$ID}-${ids.length}-${page}`, animes);

                    resolve(animes);
                }).POST(["id", { poster: ["mainUrl"] }, "russian", { airedOn: ["year"] }, "score"]);
            });
        }
    }
}

function Chronology(data) {
    // const { dubanime } = $PARAMETERS.watch;

    if (!data || data.length == 0) return;

    tChronology(data);

    const container = document.querySelector('.list-franchise');
    container.addEventListener('click', (e) => {
        const link = e.target.closest('a');

        if (link && container.contains(link)) {
            return window.location.href = `watch.html?id=${link.dataset.id}`;
        }
    });

    // if (dubanime) {
    //     data.forEach(({ id }) => {
    //         const voice = JSON.parse(localStorage.getItem(`save-translations-${id}`));
    //         if (voice && id != $ID) {
    //             voice.forEach((el) => {
    //                 $(`.translations--list--element--count-save--save[data-id="${el}"] > svg`).style.fill = "yellow";
    //             });
    //         }
    //     })
    // }
}

/**
* Устанавливает главных героев аниме
*/
function Heroes(data) {
    data = data.filter(x => x.rolesEn.includes('Main'));
    if (data.length <= 0) return;
    $$('.hero-anime, .hero-anime-title').forEach(el => el.style.display = '');
    for (let i = 0; i < data.length; i++) {
        const { character: { url, poster: { previewUrl }, russian } } = data[i];
        $('.hero-anime > .val').insertAdjacentHTML('beforeend', `<a href="${url}" target="_blank"><img src="${previewUrl}"/><div class="hero"><div class="name">${russian}</div></div></a>`);
    }
}

/**
* Устанавливает галерею
*/
function Gallery(data) {
    if (data.length <= 0) {
        return $(".content > .title").style.display = "none";
    }

    const screenshots = new IScreenshots();
    screenshots.Init(data);

    for (let i = 0; i < data.length; i++) {
        const { x332Url } = data[i];
        if (i < 3) {
            screenshots.add({ type: "beforeend", id: i, url: x332Url });
        } else {
            screenshots.add({ type: "beforeend", id: i });
        }

    }
}

/**
* Устанавливает загаловки аниме
* @param {Object} data - обьект аниме
*/
function SetTitle(data) {
    $(".title-with-raiting > .title > .russian").textContent = data.russian;
    $(".title-with-raiting > .title > .name").textContent = data.name;
    $(".title-with-raiting > .raiting > span").textContent = data.score;
}

/**
* Устанавливает жанры аниме
* @param {Object} data - обьект аниме
*/
function Genres(data) {
    const ru = {
        "genre": "жанр",
        "theme": "тема",
        "demographic": "аудитория"
    };

    for (let i = 0; i < data.length; i++) {
        const { id, name, russian, kind } = data[i];
        const title = russian || name;
        $(".genres").insertAdjacentHTML("beforeend", `<a href="search.html?g=${id}&v=${title}">${title}<div class="type">${ru[kind]}</div></a>`);
    }
}

/**
     * Устанавливает продолжительность аниме
     * @param {Object} data - обьект аниме
     */
function Duration(data) {
    const { episodesAired, episodes, duration, status } = data;
    let contb = `<div class="content-b">${episodesAired} | <span class="ep">${episodes}</span> EP</div>`;
    let conta = `Время: ${getTimeFromMins(episodesAired * duration)}`;
    if (status == "released") {
        contb = `<div class="content-b">${episodes} EP</div>`;
        conta = `Время: ${getTimeFromMins(episodes * duration)}`;
    }
    $(`#epdetails > .content-b`).insertAdjacentHTML("beforeend", contb);
    $(`#epdetails > .content-a > .text`).textContent = conta;

    // //https://ru.stackoverflow.com/questions/646511/Сконвертировать-минуты-в-часыминуты-при-помощи-momentjs
    function getTimeFromMins(mins) {
        let hours = Math.trunc(mins / 60);
        let minutes = mins % 60;
        return hours + "ч. " + minutes + "мин.";
    }
}

/**
     * Устанавливает статус аниме
     * @param {Object} data - обьект аниме
     */
function Status(data) {
    const setup = {
        rating: {
            "g": "G",
            "pg": "PG",
            "pg_13": "PG-13",
            "r": "R-17",
            "r_plus": "R+",
            "rx": "Rx"
        },
        status: {
            "anons": "Анонс",
            "ongoing": "Онгоинг",
            "released": "Вышел"
        }
    }
    const { status, rating } = data;
    $("#statdetails > .content-a > .text").textContent = `Статус: ${setup.status[status] || `Онгоинг`}`;
    $("#statdetails > .content-b > .pg").textContent = setup.rating[rating] || 0;
}

/**
 * Устанавливает значение следуюзего эпизода аниме
 * @param {Object} data - обьект аниме
 */
function NextEpisode(data) {
    const { nextEpisodeAt, episodesAired } = data;
    if (!nextEpisodeAt) return;

    $("#nextepdetails").style.display = "";
    $("#nextepdetails > .content-a > .text").textContent = `Эпизод: ${episodesAired + 1}`;
    const date = new Date(nextEpisodeAt);
    const day = ("0" + date.getDate()).slice(-2); // Получаем день с двузначным значением
    const month = ("0" + (date.getMonth() + 1)).slice(-2); // Получаем месяц с двузначным значением
    const year = date.getFullYear().toString().slice(-2); // Получаем последние две цифры года
    $("#nextepdetails > .content-b").textContent = `${day}.${month}.${year}`;
}

/**
* Устанавливает описание аниме
* @param {Object} data - обьект аниме
*/
function Description(data) {
    const descriptions = [
        `Аниме "${tAnime.russian || tAnime.name}" ещё не получило описания. Оно скрывается за завесой тайны... Видимо, даже авторы пока не уверены, о чём оно.`,
        `Аниме "${tAnime.russian || tAnime.name}" ещё не получило описания. Зато интриги — хоть отбавляй!`,
        `Аниме "${tAnime.russian || tAnime.name}" ещё не получило описания. Оно решило остаться загадкой для настоящих ценителей.`,
        `Аниме "${tAnime.russian || tAnime.name}" ещё не получило описания. Мы бы написали что-то, но... описание сбежало.`,
        `Аниме "${tAnime.russian || tAnime.name}" ещё не получило описания. Похоже, сценарий пишется в реальном времени.`,
        `Аниме "${tAnime.russian || tAnime.name}" ещё не получило описания. Возможно, это философский ход — придумай его сам.`,
        `Аниме "${tAnime.russian || tAnime.name}" ещё не получило описания. Легенды гласят, что однажды оно появится.`,
        `Аниме "${tAnime.russian || tAnime.name}" ещё не получило описания. Возможно, это гениальный маркетинговый ход.`,
        `Аниме "${tAnime.russian || tAnime.name}" ещё не получило описания. Может, оно и не нуждается в нём?`,
        `Аниме "${tAnime.russian || tAnime.name}" ещё не получило описания. Но вы держитесь, хорошего настроения и приятного просмотра!`,
    ];
    const { descriptionHtml } = data;

    if (/<div[^>]*>\s*<\/div>/.test(descriptionHtml)) {
        return $(".description").textContent = descriptions[Math.floor(Math.random() * descriptions.length)];
    }
    $(".description").insertAdjacentHTML("beforeend", addTargetBlankToLinks(descriptionHtml));

    function addTargetBlankToLinks(text) {
        // Создаем элемент div, чтобы безопасно работать с HTML-контентом
        const div = document.createElement('div');
        div.innerHTML = text;

        // Находим все ссылки внутри этого элемента
        const links = div.querySelectorAll('a[href]');

        // Проходим по всем найденным ссылкам и добавляем атрибут target="_blank"
        links.forEach(link => {
            link.setAttribute('target', '_blank');
        });

        // Возвращаем измененный HTML-контент
        return div.innerHTML;
    }
}

function Studio(data) {
    if (data.length > 0) {
        $(".studio > .title").textContent = data[0].name;
        $(".studio-link").setAttribute('href', `search.html?s=${data[0].id}`);
    }
}

/**
     * Устанавливает название аниме на сайте
     * @param {Object} data - обьект аниме
     */
function PageTitle(data) {
    const { russian, name } = data;
    document.title = `${russian || name} - Tun`;
}

/**
 * Генерирует теги Open Graph на страницу для индексаций страницы
 * @param {Object} data - response Shikimori
 */
function PageMetaTags(data) {
    const head = document.head;
    const { russian, kind } = data;

    // Вспомогательная функция для создания и добавления <meta> в <head>
    const createMeta = (property, content) => {
        const meta = document.createElement("meta");
        meta.setAttribute("property", property);
        meta.setAttribute("content", content);
        head.appendChild(meta);
    };

    createMeta("og:title", `TUN - ${russian}`);
    createMeta("og:type", kind === "movie" ? "video.movie" : "video.tv_show");
    createMeta("og:image", data.poster.originalUrl);
    createMeta("og:rating", data.score + "/10");
}

export class IScreenshots {
    /**@type {IScreenshots} */
    static instance = null;

    #callbacks = { init: [] }

    /**@type {[{originalUrl:string, x332Url:string}]} */
    list = [];
    init = false;

    constructor() {
        if (IScreenshots.instance) return IScreenshots.instance;
        IScreenshots.instance = this;
    }

    /**
     * Инициализация ресурсов
     * @param {[string]} res 
     */
    Init(res) {
        this.list = res;
        this.#dispatch("init", this);
        this.init = true;
    }

    /**
     * Добавляет превью слайд в скриншоты
     * @param {{type: "afterbegin" | "beforeend"}} data 
     */
    add({ type = "afterbegin", id = 0, url } = {}) {
        $(".galery-slider").insertAdjacentHTML(type, `<div class="slide" data-id="${id}">${url ? `<img src="${url}" loading="lazy">` : ``}</div>`);
    }

    /**
     * Загружает из ресурсов слайд
     * @param {{id:number}} data 
     */
    load({ id = 0 }) {
        if (this.list.length - 1 < id) return;

        const { x332Url } = this.list[id];
        if (!x332Url) return;
        $(`.galery-slider > .slide[data-id="${id}"]`).insertAdjacentHTML("beforeend", `<img src="${x332Url}">`);
    }

    /**
     * Выбрать слайд превью ("Продолжить просмотр")
     * @param {{id: number}} data 
     */
    select({ id = 0 }) {
        $(`.galery-slider > .slide > .selected`)?.remove();
        $(`.galery-slider > .slide[data-id="${id}"]`).insertAdjacentHTML("beforeend", `<div class="selected"><span class="sel-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6h96 32H424c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"/></svg></span></div>`);
    }

    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
    }

    #dispatch(event, data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(data));
    }
}