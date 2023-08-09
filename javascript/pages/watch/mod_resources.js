import { Animes } from "../../modules/ShikiAPI.js";
import { ScrollElementWithMouse, Sleep } from "../../modules/funcitons.js";
import { $ID } from "./mod_main.js";

const ShikimoriUrl = "https://shikimori.me";

let _shikimoriData = undefined;
let _shikimoriScreenshots = undefined;

let _loaded = false;

const handlers = {
    load: [],
}

export const Events = {
    onload: (e) => {
        if (typeof e != "function")
            return;
        if (_loaded)
            e();
        handlers.load.push(e);
    }
}

/**
 * Делает загрузку аниме данных с shikimori а также загружает картинку аниме в высоком разрешении
 * @param {Event} event функция вызывается после загрузки аниме
 * @param {Boolean} logged авторизирован пользователь
 */
export async function LoadAnime(event = () => { }, logged = false) {
    _shikimoriData = await _loadShikimoriData($ID);

    let localurlimage = await _loadImageJikan($ID);
    localurlimage = await _showImageFromUrl(localurlimage);

    _setImageAndTitle(localurlimage, _shikimoriData);
    _setGenres(_shikimoriData);
    _setDuration(_shikimoriData);
    _setStatus(_shikimoriData);
    _setDescription(_shikimoriData);
    _setStudio(_shikimoriData);

    _setPageTitle(_shikimoriData);
    _setPageMetaTags(_shikimoriData);

    await _loadGallery($ID);
    await _loadHeroes($ID);
    await _loadFranchise($ID);
    await _loadSimiliar($ID);

    _loaded = true;

    event();
    ScrollingElements();
    CallEvent("load");

    function _loadShikimoriData(id) {
        return new Promise((resolve) => {
            Animes.show(id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(_loadShikimoriData(id));
                }
                if (response.failed) {
                    alert("Error Load Anime (check console)");
                    console.log(response);
                    return;
                }
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
        return new Promise((resolve) => {
            fetch(`https://api.jikan.moe/v4/anime/${id}/full`).then(async (response) => {
                if (response.status != 200) {
                    return resolve(ShikimoriUrl + _shikimoriData.image.original);
                }
                let data = await response.json();
                resolve(data.data.images.webp.large_image_url);
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
        return new Promise((resolve) => {
            Animes.franchise(id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(SetFranchise(id));
                }

                if (response.failed) {
                    alert("Error Load Anime (check console)");
                    console.log(response);
                    return;
                }

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
                    $PARAMETERS.watch.dubanimefrc &&
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
        return new Promise((resolve) => {
            Animes.screenshots(id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(_loadGallery(id));
                }

                if (response.failed) {
                    alert("Error Load Anime (check console)");
                    console.log(response);
                    return;
                }

                if (response.length == 0) {
                    $(".title-gallery").css("display", "none");
                }

                _shikimoriScreenshots = response;

                for (let index = 0; index < response.length; index++) {
                    const element = response[index];
                    $(".galery-slider").append(
                        `<div class="slide" data-id="${index}"><img src="https://shikimori.me${element.preview}"></div>`
                    );
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
            Animes.roles(id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(SetHeroes(id));
                }

                if (response.failed) {
                    alert("Error Load Anime (check console)");
                    console.log(response);
                    return;
                }

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
        return new Promise((resolve) => {
            Animes.similar(id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(SetSimiliar(id));
                }

                if (response.failed) {
                    alert("Error Load Anime (check console)");
                    console.log(response);
                    return;
                }

                $(".with-count > .similiar-count").text(response.length);
                if (response.length > 0) {
                    $(".similiar-title , .similiar-anime").css("display", "");
                }
                for (let i = 0; i < response.length; i++) {
                    const element = response[i];
                    $(".similiar-anime").append(__createElementAnime(element));
                }
                return resolve(true);
            }).GET();
        });

        //Функция создание елемента anime-card
        function __createElementAnime(data) {
            return `<a href="/watch.html?id=${data.id}"  class="card-anime" data-id="${data.id}">
          <div class="card-content"><img src="https://moe.shikimori.me/${data.image.original}"><div class="title"><span>${data.russian}</span></div></div><div class="card-information"><div class="year">${new Date(data.aired_on).getFullYear()}</div><div class="score"><svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.73196 0.745728C4.65834 0.595337 4.50279 0.499634 4.33196 0.499634C4.16112 0.499634 4.00696 0.595337 3.93196 0.745728L3.0389 2.55452L1.04446 2.84436C0.877789 2.86897 0.7389 2.98381 0.687511 3.14104C0.636122 3.29827 0.677789 3.4719 0.797233 3.58811L2.24446 4.99768L1.90279 6.98967C1.87501 7.15374 1.94446 7.32053 2.08196 7.4176C2.21946 7.51467 2.4014 7.52698 2.5514 7.44905L4.33334 6.51252L6.11529 7.44905C6.26529 7.52698 6.44723 7.51604 6.58473 7.4176C6.72223 7.31917 6.79168 7.15374 6.7639 6.98967L6.42084 4.99768L7.86807 3.58811C7.98751 3.4719 8.03057 3.29827 7.97779 3.14104C7.92501 2.98381 7.78751 2.86897 7.62084 2.84436L5.62501 2.55452L4.73196 0.745728Z" fill="#FFE600"/></svg>${data.score}</div></div>
          </a>`;
        }
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

function ScrollingElements() {
    ScrollElementWithMouse('.similiar-anime');
    ScrollElementWithMouse('.hero-anime');
    ScrollElementWithMouse('.galery-slider');
    ScrollElementWithMouse('#episodes');
    ScrollElementWithMouse('.genres.scroll-none');
}

function CallEvent(name) {
    handlers[name].forEach(event => {
        event();
    });
}