import { ACard } from "../../modules/AnimeCard.js";
import { SHIKIURL } from "../../modules/Settings.js";
import { Animes, GraphQl } from "../../modules/ShikiAPI.js";
import { Sleep } from "../../modules/functions.js";
import { $ID } from "../watch.js";
import { UserRate } from "./mod_urate.js";
import { LoadScreen } from "./mod_load.js";
import { History } from "./mod_history.js";
import { InitFranchises } from "./mod_franchise.js";

/**@type {IScreenshots} */
let _screenshots = undefined;

class IScreenshots {
    #callbacks = {
        init: []
    }

    constructor() {
        this.list = [];
        this.init = false;
    }

    Init(resource) {
        this.list = resource;
        this.#Dispatch("init", this);
        this.init = true;
    }

    /**
     * Добавляет превью слайд в скриншоты
     * @param {{type: "prepend" || "append"}} data 
     */
    Add({ type = "prepend", id = 0, url, shikiurl = true } = {}) {
        let html = `<div class="slide" data-id="${id}">`;
        if (url) {
            if (shikiurl) {
                url = `${SHIKIURL.url}${url}`;
            }
            html += `<img src="${url}" loading="lazy">`;
        }
        html += `</div>`

        if (type === "prepend") {
            $(".galery-slider").prepend(html);
        } else {
            $(".galery-slider").append(html);
        }
    }

    Load({ id = 0 }) {
        if (this.list.length - 1 < id) {
            return;
        }
        $(`.galery-slider > .slide[data-id="${id}"]`).append(
            `<img src="${SHIKIURL.url}${this.list[id].preview}">`
        );
    }

    Select({ id = 0 }) {
        $(`.galery-slider > .slide > .selected`).remove();
        $(`.galery-slider > .slide[data-id="${id}"]`).append(`<div class="selected">
                    <span class="sel-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6h96 32H424c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"/></svg>
                    </span>
                </div>`);
    }

    static Init() {
        if (typeof _screenshots === 'undefined') {
            _screenshots = new Screenshots();
        }
        return _screenshots;
    }

    /**
     * Подписка на событие
     * @param {"init"} event - Название события (ключ из player_callbacks)
     * @param {*} callback - Функция-обработчик для события
     * @returns {void}
     */
    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
    }

    /**
     * Вызов события
     * @param {"init"} event - Название события (ключ из player_callbacks)
     * @param {object} data - Данные обратного вызова
     * @returns {void}
     */
    #Dispatch(event, data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(data));
    }
}

export const Screenshots = IScreenshots;
export let Anime = undefined;

/**
 * Загружает аниме на сайт
 * @param {Function} e Событие после загрузки аниме
 * @param {boolean} isLogged Авотризован ли пользователь
 */
export async function LoadAnime(e = () => { }, isLogged = false) {
    const start = Date.now(),
        loadScreen = new LoadScreen(9),
        process = [];
    let posterLink = undefined,
        jikanLoaded = false;

    try {
        loadScreen.progress.Step();
        process.push(new Promise(async (resolve) => {
            Anime = await FetchAnime($ID);
            loadScreen.progress.Step();
            UserRate().init(Anime.user_rate, isLogged);
            if (posterLink === undefined) {
                posterLink = `${SHIKIURL.url}/${Anime.image.original}`;
                if (jikanLoaded) {
                    process.push(LoadPoster(posterLink));
                }
            }

            SetTitle(Anime);
            Genres(Anime);
            Duration(Anime);
            Status(Anime);
            NextEpisode(Anime);
            Description(Anime);
            Studio(Anime);
            PageTitle(Anime);
            PageMetaTags(Anime);

            resolve(true);
        }));

        process.push(new Promise(async (resolve) => {
            const poster = await ImageJikan($ID);
            if (poster) {
                process.push(LoadPoster(poster));
            }
            jikanLoaded = true;
            loadScreen.progress.Step();

            resolve(true);
        }));

        process.push(Gallery($ID));

        if (!$PARAMETERS.anime.hidehero)
            process.push(Heroes($ID));

        process.push(Franchise($ID));
        process.push(Similiar($ID));

        for (let i = 0; i < process.length; i++) {
            await process[i];
            loadScreen.progress.Step();
        }

        e(Anime);
    } catch (error) {
        console.log(error);
    }
    console.log(`Loaded: ${Date.now() - start}ms`);

    /**
     * Загрузка изобюражения
     */
    function LoadPoster(url) {
        return new Promise((resolve) => {
            const mainImg = $(".preview-wrapper > .main");
            const bgImg = $(".bg-wrapper > .bg");
            mainImg.on('load', function (e) {
                bgImg.attr("src", $(e.currentTarget).attr("src"));
                resolve(true);
            });
            mainImg.attr("src", url);
        });
    }

    /**
     * Загрузка похожих аниме
     */
    function Similiar(id) {
        let response = Cache.Get({ id, type: 'similiar' });

        if (response) {
            return Complete(response);
        }

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

                Cache.Set({ id, type: 'similiar', value: response });
                return resolve(Complete(response));
            }).GET();
        });

        function Complete(response) {
            $(".similiar-count").text(response.length);
            if (response.length > 0) {
                $(".similiar-title , .similiar-anime").css("display", "");
            }
            for (let i = 0; i < response.length; i++) {
                const element = response[i];
                $(".similiar-anime").append(ACard.Gen({ link: true, id: element.id, response: element }));
            }
            return true;
        }
    }

    async function Franchise(id) {
        let response = Cache.Get({ id, type: 'franchise' });

        if (response) {
            return Complete(response);
        }

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

                Cache.Set({ id, type: 'franchise', value: response });

                return resolve(Complete(response));
            }).GET();
        });

        function Complete(response) {
            //Проверяем если есть у нас фрашиза
            if (response.nodes) {
                //Отоброжаем блок с франшизой
                InitFranchises(response);

                //Событие нажатие
                $(".list-franchise > a").click((e) => {
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

            return true;
        }
    }

    /**
     *  Устанавливает главных героев аниме
     */
    function Heroes(id) {
        let response = Cache.Get({ id, type: 'heroes' });

        if (response) {
            return Complete(response);
        }

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

                Cache.Set({ id, type: 'heroes', value: response });
                return resolve(Complete(response));
            }).GET();
        });

        function Complete(response) {
            for (let i = 0; i < response.length; i++) {
                const element = response[i];
                if (element.roles.includes('Main')) {
                    $('.hero-anime, .hero-anime-title').css('display', '');
                    $('.hero-anime > .val').append(`<a href="${SHIKIURL.url}${element.character.url}" target="_blank"><img src="${SHIKIURL.suburl('nyaa')}${element.character.image.original}"/><div class="hero"><div class="name">${element.character.russian}</div></div></a>`);
                }
            }
            return true;
        }
    }

    /**
    * Устанавливает галерею
    */
    function Gallery(id) {
        let response = Cache.Get({ id, type: 'gallery' });

        if (response) {
            return Complete(response);
        }

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

                Cache.Set({ id, type: 'gallery', value: response });
                return resolve(Complete(response));
            }).GET();
        });

        function Complete(response) {
            if (response.length == 0) {
                $(".title-gallery").css("display", "none");
            }

            const screenshots = Screenshots.Init();

            /**@type {[{original:string, preview:string}]} */
            screenshots.Init(response);

            for (let i = 0; i < response.length; i++) {
                const img = response[i];
                if (i < 3) {
                    screenshots.Add({ type: "append", id: i, url: img.preview });
                } else {
                    screenshots.Add({ type: "append", id: i });
                }
            }
            return true;
        }
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
        $(".description").append(addTargetBlankToLinks(data.description_html));

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
        if (data.status == "released") {
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


    function SetTitle(data) {
        $(".title-with-raiting > .title > .russian").text(data.russian);
        $(".title-with-raiting > .title > .name").text(data.name);
        $(".title-with-raiting > .raiting > span").text(data.score);
    }

    function ImageJikan(id) {
        return new Promise((resolve) => {
            fetch(`https://api.jikan.moe/v4/anime/${id}/full`).then(async (response) => {
                if (response.status != 200)
                    return resolve(posterLink);

                let data = await response.json();
                posterLink = data.data.images.webp.large_image_url;
                return resolve(posterLink);
            }).catch(async (reason) => {
                return resolve(posterLink)
            });
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

/**
 * Проверка на существование ID в бд Shikimori
 * @param {string} id 
 * @returns {boolean}
 */
export function CheckID(id) {
    if (Cache.Get({ id, type: 'isset' })) {
        return true;
    }
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
            if (response.data.animes.length !== 0) {
                Cache.Set({ id: id, type: 'isset', value: true });
                return resolve(true);
            }
            return resolve(false);
        }).POST(["id"]);
    });
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

class Cache {
    static #loaded = false;
    static #sessionData = null;
    static #length = 10;
    static #key = 'cache-ae';

    /**
     * Получает определнный кэш страницы
     * @param {{id: string, type: 'isset' | 'similiar' | 'franchise' | 'heroes' | 'gallery'}} param0 
     * @returns {null | object}
     */
    static Get({ id, type } = {}) {
        if (this.#sessionData === null && this.#loaded)
            return null;

        if (!this.#loaded) {
            /**
             * @type {null | [{id: string}]}
             */
            let data = JSON.parse(sessionStorage.getItem(this.#key)) || [];
            const index = data.findIndex(x => x.id === id);
            this.#loaded = true;

            if (data.length === 0 || index === -1) {
                return null;
            }

            this.#sessionData = data[index];
        }

        if (!this.#sessionData[type])
            return null;
        return this.#sessionData[type];
    }

    /**
     * Устанавливает кэш страницы
     * @param {{id: string, type: 'isset' | 'similiar' | 'franchise' | 'heroes' | 'gallery', value: object}} param0 
     */
    static Set({ id, type, value } = {}) {
        /**
         * @type {null | [{id: string}]}
         */
        let list = JSON.parse(sessionStorage.getItem(this.#key)) || [];
        const index = list.findIndex(x => x.id === id);
        if (index === -1 && list.length >= this.#length) {
            list.splice(list.length - 1, 1);
        }

        let data = {
            id: id
        };

        if (index !== -1) {
            data = list[index];
            list.splice(index, 1);
        }

        data[type] = value;
        list.unshift(data);

        sessionStorage.setItem(this.#key, JSON.stringify(list));
    }

}