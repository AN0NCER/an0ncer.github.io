import { Sleep } from "../../modules/functions.js";
import { UserRates } from "../../modules/ShikiAPI.js";
import { User } from "../../modules/ShikiUSR.js";

class URControls {
    constructor() {
        this.userId = User.Storage.Get('access_whoami').id;
    }

    add(id) {
        return new Promise((resolve) => {
            UserRates.list({}, async (response) => {
                if (response.failed) {
                    if (response.status == 429) {
                        await Sleep(1000);
                        return this.add(id);
                    }
                    console.log(response);
                    return;
                }
                return resolve({
                    "status": response.status,
                    "id": response.id
                })
            }).POST({
                "user_rate": {
                    "status": "planned",
                    "target_id": id,
                    "target_type": "Anime",
                    "user_id": this.userId
                }
            });
        });
    }

    delete(id) {
        return new Promise((resolve) => {
            UserRates.show(id, async (response) => {
                if (response.failed) {
                    if (response.status == 429) {
                        await Sleep(1000);
                        return this.delete(id);
                    }
                    console.log(response);
                    return;
                }
                return resolve({
                    "status": undefined,
                    "id": undefined
                });
            }).DELETE();
        });
    }
}

class Parser {
    constructor() {
        this.pluralRules = new Intl.PluralRules("ru-RU");
    }

    getValueByPath(obj, path) {
        return path.split('.').reduce((acc, key) => acc && acc[key], obj);
    }

    parseKind(kind) {
        kind = kind?.toLowerCase();
        const kinds = {
            "tv": "TV",
            "movie": "Фильм",
            "ova": "OVA",
            "ona": "ONA",
            "special": "Спешл",
            "tv_special": "TV Спешл",
            "music": "Клип",
            "pv": "Промо",
            "cm": "Реклама"
        }

        return kinds[kind] || kind;
    }

    parseSeason(seasonString) {
        const seasons = {
            "winter": "Зима",
            "spring": "Весна",
            "summer": "Лето",
            "fall": "Осень"
        };

        if (seasonString === null)
            return null;
        const [season, year] = seasonString.split('_');
        return seasons[season] ? `${seasons[season]} ${year}` : seasonString;
    }

    getEpisodeText(count) {
        const forms = {
            one: "Эпизод",
            few: "Эпизода",
            many: "Эпизодов"
        };

        return `${count} ${forms[this.pluralRules.select(count)]}`;
    }

    parseStatus(status) {
        status = status.toLowerCase()
        const statuses = {
            "anons": "Анонс",
            "ongoing": "Онгоинг",
            "released": "Вышло"
        }

        return statuses[status] || status;
    }

    formatNumberWithDots(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
}

export class ACardH {
    static instance = null;

    constructor({ isLogged = false } = {}) {
        if (ACardH.instance)
            return ACardH.instance;

        this.parser = new Parser();
        this.isLogged = isLogged;

        ACardH.instance = this;
        if (this.isLogged)
            this.controls = new URControls();

        document.addEventListener("click", (event) => {
            const button = event.target.closest(".btn-status"); // Ищем ближайшую кнопку

            if (button) {
                event.preventDefault();  // Отменяет переход по ссылке
                event.stopPropagation(); // Останавливает всплытие события

                let animeId = parseInt(button.getAttribute("data-id")) || undefined; // Получаем ID аниме

                if (button.classList.contains("state-undefined") || button.classList.contains("state-planned")) {
                    let func = this?.controls.delete;

                    button.classList.remove("state-undefined");
                    button.classList.remove("state-planned");
                    button.classList.add("loading");
                    if (animeId === undefined) {
                        func = this?.controls.add;
                        animeId = parseInt(button.offsetParent.getAttribute("data-id"));
                    }


                    func.bind(this.controls)(animeId).then((response) => {
                        button.classList.remove("loading");
                        button.classList.add(`state-${response.status}`);
                        button.setAttribute("data-id", response.id);
                    });
                }
            }
        });
    }

    gen({ anime, redirects = {}, mal = null } = {}, type = "a", pars = "shiki") {
        for (const key in redirects) {
            redirects[key] = this.parser.getValueByPath(anime, redirects[key]);
        }

        anime = { ...anime, ...redirects };
        const { image, russian, name, kind, airedOn, status, episodes, episodesAired, score } = anime;
        const title = russian || name;
        const img = image || "/images/noanime.png";
        const season = this.parser.parseSeason(anime.season) || airedOn?.year || null;
        const episodeCount = status === "released" ? this.parser.getEpisodeText(episodes) : this.parser.getEpisodeText(episodesAired)

        return `<${type} class="card-anime-h" ${typograf()}><div class="img-wrapper"><img src="${img}"></div><div class="anime-wrapper"><div class="info-wrapper"><div class="title">${title}</div><div class="season-type">${kind ? `<div class="type">${this.parser.parseKind(kind)}</div>` : ``}${season ? `<span class="pin"></span><div class="seas">${season}</div>` : ``}</div><div class="video-info"><div class="episodes"><span>${episodeCount || 0}</span></div><div class="status">${this.parser.parseStatus(status)}</div></div></div><div class="more-wrapper"><div class="in-list"><span class="val">${this.parser.formatNumberWithDots(anime?.personen || 0)}</span><div class="ticon i-user"></div></div><div class="anime-score"><div class="shikimori"><span>${score}</span><div class="ticon i-shikimori"></div></div>${mal !== null ? `<div class="mal"><span>${mal.score || 0}</span><div class="ticon i-mal"></div></div>` : ``}</div></div></div><div class="${['btn', 'btn-status', `state-${anime?.userRate?.status}`, `on-${this.isLogged}`].join(' ')}" data-id="${anime?.userRate?.id}"><div class="wrapper"><div class="ticon i-check"></div><div class="ticon i-bookmark-1"></div><div class="ticon i-bookmark-2"></div><div class="ticon i-play"></div><div class="ticon i-box-archive"></div><div class="ticon i-circle-notch"></div></div></div></${type}>`;

        function typograf() {
            let parameters = ""
            if (type === "a") {
                parameters += `href="/watch.html?id=${anime.id}${pars === `shiki` ? `&iss=true` : ``}"`
            }
            parameters += `data-id="${anime.id}"`
            return parameters;
        }
    }
}