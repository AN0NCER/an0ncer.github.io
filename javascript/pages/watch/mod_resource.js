import { ACard } from "../../modules/AnimeCard.js";
import { SHIKIURL } from "../../modules/Settings.js";
import { Animes, GraphQl } from "../../modules/ShikiAPI.js";
import { Sleep } from "../../modules/funcitons.js";
import { $ID } from "../watch.js";
import { UserRate } from "./mod_urate.js";
import { LoadScreen } from "./mod_load.js";

export let Screenshots = undefined;

export function LoadImageById(id) {
    if (Screenshots.length - 1 < id) {
        return;
    }
    $(`.galery-slider > .slide[data-id="${id}"]`).append(
        `<img src="${SHIKIURL.url}${Screenshots[id].preview}">`
    );
}

/**
 * Проверка на существование ID в бд Shikimori
 * @param {string} id 
 * @returns 
 */
export function CheckID(id) {
    return new Promise((resolve) => {
        GraphQl.animes({ ids: `"${id}"`, limit: 1 }, async (response) => {
            if (response.failed) {
                if (response.status == 429) {
                    await Sleep(1000);
                    return resolve(CheckID(id));
                }
            }
            if (response.errors) {
                console.log(`[GraphQl] Error`);
                console.log(response.errors);
            }
            return resolve(response.data.animes);
        }).POST(["id"]);
    });
}

/**
 * Загружает аниме на сайт
 * @param {Function} e Событие после загрузки аниме
 * @param {boolean} isLogged Авотризован ли пользователь
 */
export async function LoadAnime(e = () => { }, isLogged = false) {
    const start = Date.now();
    const progress = new LoadScreen(9);
    try {
        progress.Step();
        const anime = await FetchAnime($ID);
        UserRate().init(anime.user_rate, isLogged);

        let poster = await ImageJikan($ID);
        progress.Step();
        poster = await LoadImage(poster);
        progress.Step();
        SetPosterTR(poster, anime);
        Genres(anime);
        Duration(anime);
        Status(anime);
        NextEpisode(anime);
        Description(anime);
        Studio(anime);

        PageTitle(anime);
        PageMetaTags(anime);
        progress.Step();

        await Gallery($ID);
        progress.Step();

        if (!$PARAMETERS.anime.hidehero)
            await Heroes($ID);
        progress.Step();

        await Franchise($ID);
        progress.Step();
        await Similiar($ID);
        progress.Step();

        e(anime);
    } catch (error) {
        console.log(error);
    }
    console.log(`Loaded: ${Date.now() - start}ms`);

    /**
     * Загрузка похожих аниме
     */
    function Similiar(id) {
        return new Promise((resolve) => {
            Animes.similar(id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(Similiar(id));
                }

                if (response.failed) {
                    alert("Error Load Anime (check console)");
                    console.log(response);
                    return;
                }

                $(".similiar-count").text(response.length);
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

    async function Franchise(id) {
        return new Promise((resolve) => {
            Animes.franchise(id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(Franchise(id));
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
                    response.nodes &&
                    response.nodes.length > 0
                ) {
                    response.nodes.forEach((element) => {
                        let data = JSON.parse(
                            localStorage.getItem("save-translations-" + element.id)
                        );
                        if (data && element.id != $ID) {
                            data.forEach((element) => {
                                $(`.translations--list--element--count-save--save[data-id="${element}"] > svg`).css("fill", "yellow");
                            });
                        }
                    });
                }

                return resolve(true);
            }).GET();
        });
    }

    /**
     *  Устанавливает главных героев аниме
     */
    function Heroes(id) {
        return new Promise((resolve) => {
            Animes.roles(id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(Heroes(id));
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
                        $('.hero-anime > .val').append(`<a href="${SHIKIURL.url}${element.character.url}"><img src="${SHIKIURL.suburl('nyaa')}${element.character.image.original}"/><div class="hero"><div class="name">${element.character.russian}</div></div></a>`);
                    }
                }
                return resolve(true);
            }).GET();
        });
    }

    /**
    * Устанавливает галерею
    */
    function Gallery(id) {
        return new Promise((resolve) => {
            Animes.screenshots(id, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return resolve(Gallery(id));
                }

                if (response.failed) {
                    alert("Error Load Anime (check console)");
                    console.log(response);
                    return resolve(false);
                }
                if (response.length == 0) {
                    $(".title-gallery").css("display", "none");
                }

                /**@type {[{original:string, preview:string}]} */
                Screenshots = response;

                for (let i = 0; i < response.length; i++) {
                    const img = response[i];
                    if (i < 3) {
                        $(".galery-slider").append(
                            `<div class="slide" data-id="${i}"><img src="${SHIKIURL.url}${img.preview}" loading="lazy"></div>`
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
     * Генерирует теги Open Graph на страницу для индексаций страницы
     * @param {Object} data - response Shikimori
     */
    function PageMetaTags(data) {
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
            "content": `${SHIKIURL.protocol}://moe.${SHIKIURL.domain}${data.image.original}`
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

    /**
     * Устанавливает название аниме на сайте
     * @param {Object} data - обьект аниме
     */
    function PageTitle(data) {
        $(document).attr("title", "TUN - " + data.russian);
    }

    function Studio(data) {
        if (data.studios.length > 0) {
            $(".studio > .title").text(data.studios[0].name);
        }
    }

    /**
     * Устанавливает описание аниме
     * @param {Object} data - обьект аниме
     */
    function Description(data) {
        if (!data.description) {
            return;
        }
        $(".description").append(data.description_html);
    }

    /**
     * Устанавливает значение следуюзего эпизода аниме
     * @param {Object} data - обьект аниме
     */
    function NextEpisode(data) {
        if (data.next_episode_at != null) {
            $("#nextepdetails").css({ display: '' });
            $("#nextepdetails > .content-a > .text").text(`Эпизод: ${data.episodes_aired + 1}`);
            const date = new Date(data.next_episode_at);
            const day = ("0" + date.getDate()).slice(-2); // Получаем день с двузначным значением
            const month = ("0" + (date.getMonth() + 1)).slice(-2); // Получаем месяц с двузначным значением
            const year = date.getFullYear().toString().slice(-2); // Получаем последние две цифры года
            const formattedDate = `${day}.${month}.${year}`;
            $("#nextepdetails > .content-b").text(formattedDate);
        }
    }

    /**
     * Устанавливает статус аниме
     * @param {Object} data - обьект аниме
     */
    function Status(data) {
        $("#statdetails > .content-a > .text").text(`Статус: ${StatusToString(data.status)}`);
        $("#statdetails > .content-b > .pg").text(RatingToString(data.rating));
    }

    /**
     * Устанавливает продолжительность аниме
     * @param {Object} data - обьект аниме
     */
    function Duration(data) {
        let contb = `<div class="content-b">${data.episodes_aired} | <span class="ep">${data.episodes}</span> EP</div>`;
        let conta = `Время: ${getTimeFromMins(data.episodes_aired * data.duration)}`;
        if (data.episodes_aired == 0 && data.status == "released") {
            contb = `<div class="content-b">${data.episodes} EP</div>`;
            conta = `Время: ${getTimeFromMins(data.episodes * data.duration)}`;
        }
        $(`#epdetails > .content-b`).append(contb);
        $(`#epdetails > .content-a > .text`).text(conta);

        //https://ru.stackoverflow.com/questions/646511/Сконвертировать-минуты-в-часыминуты-при-помощи-momentjs
        function getTimeFromMins(mins) {
            let hours = Math.trunc(mins / 60);
            let minutes = mins % 60;
            return hours + "ч. " + minutes + "мин.";
        }
    }

    /**
    * Устанавливает жанры аниме
    * @param {Object} data - обьект аниме
    */
    function Genres(data) {
        for (let index = 0; index < data.genres.length; index++) {
            const element = data.genres[index];
            $(".genres").append(`<a href="#">${element.russian}</a>`);
        }
    }


    function SetPosterTR(url, data) {
        $(".bg-wrapper > .bg").attr("src", url);
        $(".preview-wrapper > .main").attr("src", url);
        $(".title-with-raiting > .title > .russian").text(data.russian);
        $(".title-with-raiting > .title > .name").text(data.name);
        $(".title-with-raiting > .raiting > span").text(data.score);
    }

    function ImageJikan(id) {
        return new Promise((resolve) => {
            fetch(`https://api.jikan.moe/v4/anime/${id}/full`).then(async (response) => {
                if (response.status != 200) {
                    return resolve(shikiData.poster.originalUrl);
                }
                let data = await response.json();
                resolve(data.data.images.webp.large_image_url);
            });
        });
    }

    function LoadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                return resolve(url);
            }
            img.onerror = (e) => {
                console.log(e);
                return resolve(shikiData.poster.originalUrl);
            }
            img.src = url;
        });
    }

    /**
     * Загружает данные аниме
     * @param {string} id индентификатор аниме
     */
    function FetchAnime(id) {
        return new Promise((resolve) => {
            Animes.show(id, async (response) => {
                if (response.failed) {
                    if (response.status == 429) {
                        await Sleep(1000);
                        return resolve(FetchAnime(id));
                    }
                    throw { response };
                }
                resolve(response);
            }).GET(isLogged);
        });
    }
}

function StatusToString(status) {
    switch (status) {
        case "anons":
            return "Анонс";
        case "ongoing":
            return "Онгоинг";
        case "released":
            return "Вышел";
        default:
            return "Онгоинг";
    }
}

function RatingToString(rating) {
    switch (rating) {
        case "g":
            return "G";
        case "pg":
            return "PG";
        case "pg_13":
            return "PG-13";
        case "r":
            return "R-17";
        case "r_plus":
            return "R+";
        case "rx":
            return "Rx";
        default:
            return "UNDF";
    }
}