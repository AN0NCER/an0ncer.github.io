import { GraphQl } from "../../modules/ShikiAPI.js";

const data = [
    { id: 52991, img: "https://image.tmdb.org/t/p/original/c0y8ScAJnSs5xMZ9b1lm2k9gSwz.jpg" },
    { id: 54492, img: "https://image.tmdb.org/t/p/original/yUEEqQrbHioO4ziBkr54Nrr0OtJ.jpg" },
    { id: 52299, img: "https://image.tmdb.org/t/p/original/xMNH87maNLt9n2bMDYeI6db5VFm.jpg" }
];

const CountdownSwiper = new Swiper('.swiper-countdown', {
    // Parametrs
    spaceBetween: 10,
    breakpoints: {
        740: {
            slidesPerView: 2
        },
        940: {
            slidesPerView: 1
        }
    }
});

export function InitCountdown() {
    let animes = [];
    for (let i = 0; i < data.length; i++) {
        const element = data[i];
        animes.push(element.id);
    }

    GraphQl.animes({ ids: animes, limit: animes.length }, (response) => {
        if (response?.data?.animes.length == 0) {
            return;
        }
        const animes = response.data.animes;
        for (let i = 0; i < animes.length; i++) {
            const anime = animes[i];
            if (anime.status == 'ongoing') {
                $('.swiper-countdown > .swiper-wrapper').append(GEN(anime));
            }
        }
    }).POST(["id", "russian", "name", "nextEpisodeAt", "kind", "status", "rating"]);
}

function GEN(anime) {
    const { id, russian, nextEpisodeAt } = anime;
    let { name, kind, status, rating } = anime;
    name = russian ? russian : name;
    rating = RatingToString(rating);
    kind = KindToString(kind);
    status = StatusToString(status);
    const image = FindImageById(id);
    const date = new Date(new Date(nextEpisodeAt) - Date.now());
    setInterval(() => {
        const date = new Date(new Date(nextEpisodeAt) - Date.now());
        $(`.timer[data-id="${id}"] > .d`).text(`${date.getDate()} Д`);
        $(`.timer[data-id="${id}"] > .h`).text(`${date.getHours()} Ч`);
        $(`.timer[data-id="${id}"] > .m`).text(`${date.getMinutes()} М`);
        $(`.timer[data-id="${id}"] > .s`).text(`${date.getSeconds()} C`);
    }, 1000);
    return `<a href="watch.html?id=${id}" class="swiper-slide">
    <img src="${image}" alt="">
    <span class="schape"></span>
    <div class="content">
        <div class="title">${name}</div>
        <div class="tags">
            <div class="tag">${status}</div>
            <div class="tag">${kind}</div>
            <div class="tag pg">${rating}</div>
        </div>
        <div class="text">${GenerateTextByKid(kind)}</div>
        <div class="timer" data-id="${id}">
            <div class="d">${date.getDate()} Д</div>
            <div class="h">${date.getHours()} Ч</div>
            <div class="m">${date.getMinutes()} М</div>
            <div class="s">${date.getSeconds()} С</div>
        </div>
    </div>
</a>`;
}

function FindImageById(id) {
    const index = data.findIndex(x => x.id == id);
    if (index == -1) {
        return undefined;
    }
    return data[index].img;
}

function GenerateTextByKid(kind) {
    if (kind == "movie" || kind == "Фильм") {
        return "Фильм выйдет через";
    }
    return "Следующий эпизод через";
}

function StatusToString(status) {
    switch (status) {
        case "anons":
            return "Анонс";
        case "ongoing":
            return "Онгоинг";
        case "released":
            return "Релиз";
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

function KindToString(kind) {
    switch (kind) {
        case "tv":
            return "Сериал";
        case "movie":
            return "Фильм";
        case "ova":
            return "OVA";
        case "ona":
            return "ONA";
        case "special":
            return "Спецвыпуск";
        case "tv_special":
            return "Спецвыпуск";
        case "music":
            return "Музыка";
        case "pv":
            return "Промо";
        case "cm":
            return "Реклама";
        default:
            return "Сериал";
    }
}