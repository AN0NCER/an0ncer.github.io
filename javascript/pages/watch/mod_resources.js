import { ACard } from "../../modules/AnimeCard.js";
import { Animes } from "../../modules/ShikiAPI.js";
import { ApiTunime } from "../../modules/TunimeApi.js";
import { ScrollElementWithMouse, Sleep } from "../../modules/funcitons.js";
import { $ID } from "../watch.js";
import { LoadPage, LoadPageLogs } from "./mod_loadingpage.js";
import { SynchLocalData } from "./mod_synch.js";

const ShikimoriUrl = "https://shikimori.me";

let _shikimoriData = undefined;
let _shikimoriScreenshots = undefined;

let _loaded = false;

const handlers = {
    load: [],
}

export const ELA = {
    onload: (e) => {
        if (typeof e != "function")
            return;
        if (_loaded)
            e();
        handlers.load.push(e);
    }
}

export const GetShikiData = () => { return _shikimoriData; };
export const GetShikiScreenshots = () => { return _shikimoriScreenshots; };

/**
 * Делает загрузку аниме данных с shikimori а также загружает картинку аниме в высоком разрешении
 * @param {Event} event функция вызывается после загрузки аниме
 * @param {Boolean} logged авторизирован пользователь
 */
export async function LoadAnime(event = () => { }, logged = false) {
    const logs = new LoadPageLogs(9);
    logs.add.request('shikidata');
    _shikimoriData = await _loadShikimoriData($ID);

    logs.add.synch('userrate');
    SynchLocalData(_shikimoriData.user_rate);
    logs.end.synch('userrate');


    logs.add.request('imagejikan');
    let localurlimage = await _loadImageJikan($ID);
    logs.add.imageload('imageposter');
    localurlimage = await _showImageFromUrl(localurlimage);

    logs.add.data('shikidata');
    _setImageAndTitle(localurlimage, _shikimoriData);
    _setGenres(_shikimoriData);
    _setDuration(_shikimoriData);
    _setStatus(_shikimoriData);
    _setDescription(_shikimoriData);
    _setStudio(_shikimoriData);

    _setPageTitle(_shikimoriData);
    _setPageMetaTags(_shikimoriData);
    logs.end.data('shikidata');

     logs.add.request('gallery');
    await _loadGallery($ID);
    //Отключить загрузку если в параметрах отключено
    logs.add.request('heroes');
    if (!$PARAMETERS.anime.hidehero)
        await _loadHeroes($ID);

    logs.add.request('franchise');
    await _loadFranchise($ID);
    logs.add.request('similiar');
    await _loadSimiliar($ID);

    logs.complete();
    _loaded = true;

    event();
    ScrollingElements();
    CallEvent("load");

    ApiTunime.anime($ID);

    function _loadShikimoriData(id) {
        logs.update.request('shikidata');
        return new Promise((resolve) => {
            Animes.show(id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(_loadShikimoriData(id));
                }
                if (response.failed) {
                    LoadPage().error('loadshikidata');
                    logs.error.request('shikidata')
                    alert("Error Load Anime (check console)");
                    console.log(response);
                    return;
                }
                logs.end.request('shikidata');
                resolve(response);
            }).GET(logged)
        });
    }

    /**
    * Получает ссылку на изображение из ресурса api.jikan.moe
    * @param {int} id - shikimori
    * @returns Ссылку на изображение
    */
    function _loadImageJikan(id) {
        logs.update.request('imagejikan');
        return new Promise((resolve) => {
            fetch(`https://api.jikan.moe/v4/anime/${id}/full`).then(async (response) => {
                if (response.status != 200) {
                    return resolve(ShikimoriUrl + _shikimoriData.image.original);
                }
                let data = await response.json();
                resolve(data.data.images.webp.large_image_url);
                logs.end.request('imagejikan');
            }
            );
        });
    }

    /**
    * Загружает изображение в ресурсы сайта
    * @param {String} src ссылка на ресурс
    * @returns String src - ссылка до ресура
    */
    function _showImageFromUrl(url) {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
                logs.end.imageload('imageposter');
                return resolve(url);
            }
            image.onerror = (e) => {
                console.log(e);
                return resolve(ShikimoriUrl + _shikimoriData.image.original);
            }
            image.src = url;
        });
    }

    /**
     * Устанавливает изображение аниме и данные(название, рейтинг)
     * @param {Object} data - обьект аниме
     * @param {String} img - ссылка на изображение постера
     */
    function _setImageAndTitle(img, data) {
        $(".bg-paralax-img > img").attr("src", img);
        $(".title-with-raiting > .title > .russian").text(data.russian);
        $(".title-with-raiting > .title > .name").text(data.name);
        $(".title-with-raiting > .raiting > span").text(data.score);
    }

    /**
    * Устанавливает жанры аниме
    * @param {Object} data - обьект аниме
    */
    function _setGenres(data) {
        for (let index = 0; index < data.genres.length; index++) {
            const element = data.genres[index];
            $(".genres").append(`<a href="#">${element.russian}</a>`);
        }
    }

    /**
     * Устанавливает продолжительность аниме
     * @param {Object} data - обьект аниме
     */
    function _setDuration(data) {
        if (data.episodes_aired == 0 && data.status == "released") {
            $(".text-witch-pg > .episodes_aired").text(`${data.episodes}EP`);
            $(".duration > .content > b").text(
                `${getTimeFromMins(data.episodes * data.duration)}`
            );
        } else {
            $(".text-witch-pg > .episodes_aired").text(`${data.episodes_aired}EP`);
            $(".duration > .content > b").text(
                `${getTimeFromMins(data.episodes_aired * data.duration)}`
            );
        }

        //https://ru.stackoverflow.com/questions/646511/Сконвертировать-минуты-в-часыминуты-при-помощи-momentjs
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
    function _setStatus(data) {
        $(".status > .content > b").text(
            data.status == "anons"
                ? "Анонс"
                : data.status == "ongoing"
                    ? "Онгоинг"
                    : "Вышел"
        );
        let rating = data.rating == 'none' || data.rating == 'g'
            ? '0'
            : data.rating == 'pg'
                ? '7'
                : data.rating == 'pg_13'
                    ? '13'
                    : data.rating == 'r'
                        ? '17'
                        : '18';
        $(".pg-rating").text(`${rating}+`);
    }

    /**
     * Устанавливает описание аниме
     * @param {Object} data - обьект аниме
     */
    function _setDescription(data) {
        if (!data.description) {
            $(".description").append(data.english[0]);
            return;
        }
        $(".description").append(data.description_html);
    }

    function _setStudio(data) {
        if (data.studios.length > 0) {
            $(".studio > .title").text(data.studios[0].filtered_name);
        }
    }

    async function _loadFranchise(id) {
        logs.update.request('franchise');
        return new Promise((resolve) => {
            Animes.franchise(id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(_loadFranchise(id));
                }

                if (response.failed) {
                    LoadPage().error('loadfranchise');
                    logs.error.request('franchise');
                    alert("Error Load Anime (check console)");
                    console.log(response);
                    return;
                }

                logs.end.request('franchise');

                //Проверяем если есть у нас фрашиза
                if (response.nodes) {
                    //Отоброжаем блок с франшизой
                    for (let i = 0; i < response.nodes.length; i++) {
                        const element = response.nodes[i]; // Обьект с франшизой

                        //Изначально франшизы скрыты, но после добавления отображаются

                        //Отбираем франшизы по правилам пользователя
                        if ($PARAMETERS.watch.typefrc.indexOf(element.kind) == -1) {
                            continue;
                        }

                        //Создаем елемент
                        const html = `<a data-id="${element.id}" class="${$ID == element.id ? "selected" : ""
                            }"><div class="franchise"><div class="title">${element.name
                            }</div><div class="type">${element.kind
                            }</div></div><div class="year">${element.year}</div></a>`;

                        //Добавляем елемент
                        $(".franchisa-anime").append(html);
                        //Отображаем франщизы
                        $(".franchise-title, .franchisa-anime").css("display", "");
                    }

                    //Событие нажатие
                    $(".franchisa-anime > a").click((e) => {
                        //Перенаправляем пользователя без истории
                        window.location.replace(
                            "watch.html?id=" + $(e.currentTarget).data("id")
                        );
                    });
                }

                if (
                    $PARAMETERS.watch.dubanime &&
                    response.nodes &&
                    response.nodes.length > 0
                ) {
                    response.nodes.forEach((element) => {
                        let data = JSON.parse(
                            localStorage.getItem("save-translations-" + element.id)
                        );
                        if (data && element.id != $ID) {
                            data.forEach((element) => {
                                $(
                                    `.translations--list--element--count-save--save[data-id="${element}"] > svg`
                                ).css("fill", "yellow");
                            });
                        }
                    });
                }

                return resolve(true);
            }).GET();
        });
    }

    /**
    * Устанавливает галерею
    */
    function _loadGallery(id) {
        logs.update.request('gallery');
        return new Promise((resolve) => {
            Animes.screenshots(id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(_loadGallery(id));
                }

                if (response.failed) {
                    LoadPage().error('loadgallery');
                    logs.error.request('gallery')
                    alert("Error Load Anime (check console)");
                    console.log(response);
                    return resolve(false);
                }
                logs.end.request('gallery');
                if (response.length == 0) {
                    $(".title-gallery").css("display", "none");
                }

                /**@type {[{original:string, preview:string}]} */
                _shikimoriScreenshots = response;

                for (let i = 0; i < response.length; i++) {
                    const img = response[i];
                    if (i < 3) {
                        $(".galery-slider").append(
                            `<div class="slide" data-id="${i}"><img src="https://shikimori.me${img.preview}" loading="lazy"></div>`
                        );
                    } else {
                        $(".galery-slider").append(
                            `<div class="slide" data-id="${i}"></div>`
                        );
                    }
                }

                return resolve(true);
            }).GET();
        });
    }

    /**
     *  Устанавливает главных героев аниме
     */
    function _loadHeroes(id) {
        return new Promise((resolve) => {
            logs.update.request('heroes');
            Animes.roles(id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(_loadHeroes(id));
                }

                if (response.failed) {
                    LoadPage().error('loadheroes');
                    logs.error.request('heroes');
                    alert("Error Load Anime (check console)");
                    console.log(response);
                    return;
                }

                logs.end.request('heroes');

                for (let i = 0; i < response.length; i++) {
                    const element = response[i];
                    if (element.roles.includes('Main')) {
                        $('.hero-anime, .hero-anime-title').css('display', '');
                        $('.hero-anime > .val').append(`<a href="https://shikimori.me${element.character.url}"><img src="https://nyaa.shikimori.me${element.character.image.original}"/><div class="hero"><div class="name">${element.character.russian}</div></div></a>`);
                    }
                }
                return resolve(true);
            }).GET();
        });
    }

    /**
     * Загрузка похожих аниме
     */
    function _loadSimiliar(id) {
        logs.update.request('similiar');
        return new Promise((resolve) => {
            Animes.similar(id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(_loadSimiliar(id));
                }

                if (response.failed) {
                    LoadPage().error('similiar');
                    logs.error.request('similiar');
                    alert("Error Load Anime (check console)");
                    console.log(response);
                    return;
                }

                logs.end.request('similiar');

                $(".with-count > .similiar-count").text(response.length);
                if (response.length > 0) {
                    $(".similiar-title , .similiar-anime").css("display", "");
                }
                for (let i = 0; i < response.length; i++) {
                    const element = response[i];
                    $(".similiar-anime").append(ACard.Gen({ link: true, id: element.id, response: element }));
                }
                return resolve(true);
            }).GET();
        });
    }

    /**
     * Устанавливает название аниме на сайте
     * @param {Object} data - обьект аниме
     */
    function _setPageTitle(data) {
        $(document).attr("title", "TUN - " + data.russian);
    }

    /**
     * Генерирует теги Open Graph на страницу для индексаций страницы
     * @param {Object} data - response Shikimori
     */
    function _setPageMetaTags(data) {
        // Создаем мета-тег Open Graph для заголовка страницы
        var ogTitle = $("<meta/>", {
            "property": "og:title",
            "content": `TUN - ${data.russian}`
        });

        var ogType = $("<meta/>", {
            "property": "og:type",
            "content": `${data.kind == "movie" ? "video.movie" : "video.tv_show"}`
        });

        var ogImage = $("<meta/>", {
            "property": "og:image",
            "content": `https://moe.shikimori.me${data.image.original}`
        });

        var ogDescription = $("<meta/>", {
            "property": "og:description",
            "content": `${data?.description?.substr(0, 100)}... Смотрите на Tunime`
        });

        var ogRelease = $("<meta/>", {
            "property": "og:release_date",
            "content": `${data.aired_on}`
        });

        var ogRating = $("<meta/>", {
            "property": "og:rating",
            "content": data.score + "/10"
        });

        // Добавляем мета-тег Open Graph в раздел head нашего HTML документа
        $("head").append(ogTitle, ogType, ogImage, ogDescription, ogRelease, ogRating);
    }
}

export function LoadImageById(id) {
    if (_shikimoriScreenshots.length - 1 < id) {
        return;
    }
    $(`.galery-slider > .slide[data-id="${id}"]`).append(
        `<img src="https://shikimori.me${_shikimoriScreenshots[id].preview}">`
    );
}

function ScrollingElements() {
    ScrollElementWithMouse('.similiar-anime');
    ScrollElementWithMouse('.hero-anime');
    ScrollElementWithMouse('.galery-slider');
    ScrollElementWithMouse('#episodes');
    ScrollElementWithMouse('.genres.scroll-none');
    ScrollElementWithMouse('.franchisa-anime');
}

function CallEvent(name) {
    handlers[name].forEach(event => {
        event();
    });
}