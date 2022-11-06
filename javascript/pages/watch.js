const visual = {
    setHeader: function (response) {
        $('.bg-paralax-img').css('background-image', 'url(https://kawai.shikimori.one' + response.image.original + ')');
    },
    setMain: function (response) {
        $(document).attr("title", response.russian);
        $('.title > .russian').text(response.russian);
        $('.title > .name').text(response.name);
        $('.raiting > span').text(response.score);
    },
    setGenres: function (response) {
        for (let index = 0; index < response.genres.length; index++) {
            const element = response.genres[index];
            $('.genres').append(`<a href="#">${element.russian}</a>`)
        }
    },
    setTime: function (response) {
        $('.text-witch-pg > .episodes_aired').text(`${response.episodes_aired}EP`);
        $('.duration > .content > b').text(`${getTimeFromMins(response.episodes_aired * response.duration)}`);
    },
    setStatus: function (response) {
        $('.status > .content > b').text(response.status == 'anons' ? "Анонс" : response.status == 'ongoing' ? "Онгоинг" : "Вышел");
        $('.pg-rating').text(response.rating)
    },
    setGallery: function (id) {
        shikimoriApi.Animes.screenshots(id, (r) => {
            //console.log(r);
            for (let index = 0; index < r.length; index++) {
                const element = r[index];
                $('.galery-slider').append(`<div class="slide"><img src="https://shikimori.one${element.preview}"></div>`);
            }
        });
    },
    setDescription: function (response) {
        $('.description').append(response.description_html);
    },
    setHeroes: function (id) {
        shikimoriApi.Animes.roles(id, async (r) => {
            if (r.failed && r.status == 429) {
                await sleep(1000);
                this.setHeroes(id);
                return;
            }
            for (let index = 0; index < r.length; index++) {
                const element = r[index];
                if (element.roles.includes('Main')) {
                    //console.log(element);
                    $('.heroes').append(`<div class="persone"><div class="img"><img src="https://nyaa.shikimori.one${element.character.image.original}">
                    </div>
                    <div class="name">
                    ${element.character.russian}
                    </div>
                </div>`)
                }
            }
        })
    },
    setSimilar: function (id) {
        shikimoriApi.Animes.similar(id, async (r) => {
            if (r.failed && r.status == 429) {
                await sleep(1000);
                this.setSimilar(id);
                return;
            }
            //console.log(r);
            for (let index = 0; index < r.length; index++) {
                const element = r[index];
                let html = `<a href="/watch.html?id=${element.id}"><div class="anime-card"><div class="anime-image">
                        <img src="https://nyaa.shikimori.one${element.image.original}" alt="${element.russian}"><div class="play-btn"><div class="btn"><svg viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.70312 0.551381C4.54688 -0.159557 3.09375 -0.182995 1.91406 0.481068C0.734375 1.14513 0 2.39513 0 3.75451V31.2545C0 32.6139 0.734375 33.8639 1.91406 34.5279C3.09375 35.192 4.54688 35.1608 5.70312 34.4576L28.2031 20.7076C29.3203 20.0279 30 18.817 30 17.5045C30 16.192 29.3203 14.9889 28.2031 14.3014L5.70312 0.551381Z" fill="white" /></svg></div></div></div>
                    <div class="anime-title">
                        ${element.russian}
                    </div>
                </div>
            </a>`;
                $('.similiar > .similiar-slider').append(html);
            }
        })
    },
    setStudio: function (response) {
        $('.studio > .title').text(response.studios[0].filtered_name);
    },
    init: function (id, response) {
        this.watchFunction();
        this.setHeader(response);
        this.setMain(response);
        this.setGenres(response);
        this.setTime(response);
        this.setStatus(response);
        this.setGallery(id);
        this.setDescription(response);
        this.setHeroes(id);
        this.setSimilar(id);
        this.setStudio(response);
    },
    watchFunction: function () {
        $('.btn_back').click(() => {
            window.location.href = '/index.html';
        })
    }
}

const storage = {
    get: function (key) {
        return JSON.parse(localStorage.getItem(key));
    },
    set: function (key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    }
}

const shikimoriID = new URLSearchParams(window.location.search).get('id');

let logged = false;
let is_anime = true;
let url = '';

let dataLocal = {
    kodik_seasson: 1,
    kodik_episode: 1,
    kodik_dub: ''
}

if (storage.get(shikimoriID)) {
    dataLocal = storage.get(shikimoriID);
}

Main(async (e) => {
    logged = e;
    shikimoriApi.Animes.id(shikimoriID, (r) => {
        //console.log(r);
        if (r.kind != 'tv') {
            is_anime = false;
        }
        visual.init(shikimoriID, r);
    }, logged);
});

kodikApi.search({ shikimori_id: shikimoriID }, (r) => {
    console.log(r);
    for (let index = 0; index < r.results.length; index++) {
        let translation = r.results[index].translation;
        //console.log(translation);
        $('.dubbing > select').append(`<option data-id="${translation.id}" data-episodes="${r.results[index].episodes_count}" data-last="${r.results[index].last_episode}" data-link="${r.results[index].link}" value="${translation.id}">${translation.title}</option>`);
    }
    SetDubbing();
});

episodes.events.onchangeselect((i) => {
    if (dataLocal.kodik_episode != i) {
        dataLocal.kodik_episode = i;
        storage.set(shikimoriID, dataLocal);
        SetPlayer();
    }
});

$('.dubbing > select').change(() => {
    dataLocal.kodik_dub = $('.dubbing > select > option:selected').data('id');
    url = $('.dubbing > select > option:selected').data('link');
    SetPlayer();
})

function SetDubbing() {
    if (dataLocal.kodik_dub) {
        $('.dubbing > select').val(dataLocal.kodik_dub);
        url = $('.dubbing > select > option:selected').data('link');
    } else {
        dataLocal.kodik_dub = $('.dubbing > select > option:selected').data('id');
        url = $('.dubbing > select > option:selected').data('link');
    }
    SetPlayer();
    ShowEpisodes();
    SelectEpisode();
}

function ShowEpisodes() {
    for (let i = 1; i <= $('.dubbing > select > option:selected').data('last'); i++) {
        episodes.add(i);
    }
}

function SelectEpisode() {
    const width = document.body.clientWidth;
    episodes.select(dataLocal.kodik_episode, () => { }, (anim) => {
        $('.episodes').scrollLeft(parseInt(anim.animations[0].currentValue) + 132 - width);
    });
}

function SetPlayer() {
    $('#kodik-player').attr('src', url + '?hide_selectors=true&season=' + dataLocal.kodik_seasson + '&episode=' + dataLocal.kodik_episode);
}

//https://ru.stackoverflow.com/questions/646511/Сконвертировать-минуты-в-часыминуты-при-помощи-momentjs
function getTimeFromMins(mins) {
    let hours = Math.trunc(mins / 60);
    let minutes = mins % 60;
    return hours + 'ч. ' + minutes + 'мин.';
};

//https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep/39914235#39914235
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}