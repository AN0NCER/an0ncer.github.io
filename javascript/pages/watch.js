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
        if (response.episodes_aired == 0 && response.status == 'released') {
            $('.text-witch-pg > .episodes_aired').text(`${response.episodes}EP`);
            $('.duration > .content > b').text(`${getTimeFromMins(response.episodes * response.duration)}`);
        } else {
            $('.text-witch-pg > .episodes_aired').text(`${response.episodes_aired}EP`);
            $('.duration > .content > b').text(`${getTimeFromMins(response.episodes_aired * response.duration)}`);
        }
    },
    setStatus: function (response) {
        $('.status > .content > b').text(response.status == 'anons' ? "Анонс" : response.status == 'ongoing' ? "Онгоинг" : "Вышел");
        $('.pg-rating').text(response.rating)
    },
    setGallery: function (id) {
        shikimoriApi.Animes.screenshots(id, async (r) => {
            if (r.failed && r.status == 429) {
                await sleep(1000);
                this.setGallery(id);
                return;
            }
            if (r.length == 0) {
                $('.title-gallery').css('display', 'none');
            }
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
            let append = false;
            for (let index = 0; index < r.length; index++) {
                const element = r[index];
                if (element.roles.includes('Main')) {
                    //console.log(element);
                    append = true;
                    $('.heroes').append(`<div class="persone"><div class="img"><img src="https://nyaa.shikimori.one${element.character.image.original}">
                    </div>
                    <div class="name">
                    ${element.character.russian}
                    </div>
                </div>`)
                }
            }
            if (append == false) {
                $('.title-hero').css('display', 'none');
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
            if (r.length == 0) {
                $('.title-similiar').css('display', 'none');
            }
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
        $('.btn_play').click(() => {
            document.getElementById('kodik-player').scrollIntoView({ behavior: "smooth", block: "center" });
        });
    },
    hidePlayer: function () {
        $('.episodes').css('display', 'none');
        $('.dubbing').css('display', 'none');
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
AsyncPlayer();

const shikimoriID = new URLSearchParams(window.location.search).get('id');
const kodikIframe = document.getElementById("kodik-player").contentWindow;

let play_time = 0;
let play_duration = 0;

let logged = false;
let is_anime = true;
let url = '';

let dataLocal = {
    kodik_seasson: 1,
    kodik_episode: 1,
    kodik_dub: ''
}
let dataLast = null;
let user_rates = null;

let shikiResponse = null;
let kodikResponse = null;

if (storage.get(shikimoriID)) {
    dataLocal = storage.get(shikimoriID);
}
try {
    if (shikimoriID == usr.Storage.Get('last-watch').id) {
        dataLast = usr.Storage.Get('last-watch');
        dataLocal.kodik_episode = dataLast.episode;
        console.log(dataLast);
    }
} catch {

}

Main(async (e) => {
    logged = e;
    shikimoriApi.Animes.id(shikimoriID, (r) => {
        console.log(r);
        shikiResponse = r;
        if (r.kind != 'tv') {
            is_anime = false;
        }
        if (r.kind === 'movie') {
            $('.episodes').css('display', 'none');
        }
        visual.init(shikimoriID, r);
        if (e) {
            UserLogged(r.user_rate);
        }
        Loaded();
    }, logged);
});

kodikApi.search({ shikimori_id: shikimoriID }, (r) => {
    console.log(r);
    kodikResponse = r;
    if (r.total == 0) {
        visual.hidePlayer();
        url = "/404.html";
        SetPlayer();
        return;
    }
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
        SetLastAnime();
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

function UserLogged(ur) {
    user_rates = ur;
    if (user_rates) {
        if (ur.status == 'planned' || ur.status == 'watching' || ur.status == 'rewatching') {
            $('.btn_save > .btn_glass_abs > svg').remove();
            $('.btn_save > .btn_glass_abs').append(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z"/></svg>`);
            $('.btn_save > .btn_glass_abs').addClass('saved');
        }
    }

    $('.btn_save').click(async () => {
        console.log(user_rates);
        if (user_rates) {
            shikimoriApi.User_rates.id(user_rates.id, (response) => {

            }).DELETE();
            //remove
            $('.btn_save > .btn_glass_abs > svg').remove();
            $('.btn_save > .btn_glass_abs').append(`<svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.84479 0H1.4064C0.629656 0 0 0.629656 0 1.4064V14.0611C0 14.7848 0.784946 15.2354 1.40991 14.8709L5.62559 12.4115L9.84186 14.8706C10.4659 15.2096 11.2512 14.7848 11.2512 14.0611V1.4064C11.2512 0.629656 10.6212 0 9.84479 0ZM9.84479 13.2436L5.62559 10.7824L1.4064 13.2436V1.5822C1.4064 1.48346 1.48346 1.4064 1.55583 1.4064H9.64262C9.76861 1.4064 9.84479 1.48346 9.84479 1.5822V13.2436Z" fill="white" /></svg>`);
            $('.btn_save > .btn_glass_abs').removeClass('saved');
            user_rates = null;
        } else {
            //add
            shikimoriApi.User_rates.user_rates({}, (response) => {
                if (response.failed) {
                    return;
                }
                user_rates = response;
                $('.btn_save > .btn_glass_abs > svg').remove();
                $('.btn_save > .btn_glass_abs').append(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z"/></svg>`);
                $('.btn_save > .btn_glass_abs').addClass('saved');
            }, { "user_rate": { "status": "planned", "target_id": shikimoriID, "target_type": "Anime", "user_id": usr.Storage.Get('access_whoami').id } }).POST();
        }
    });

    episodes.events.onchangeselect((i) => {
        if (user_rates) {
            shikimoriApi.User_rates.id(user_rates.id, (response) => {
                console.log(response);
                if (response.failed) {
                    return;
                }
                user_rates = response;
            }).PATCH({ "user_rate": { "episodes": i, "status": "watching" } });
        }
    });

    //Set episode if not dataLocal
    //Episodes get if logged user and isset user_rates
    if (!storage.get(shikimoriID)) {
        if (user_rates) {
            if (user_rates.episodes != 0) {
                episodes.select(user_rates.episodes);
            }
        }
    }

    //console.log(user_rates);
}

function SetLastAnime(cnt = false, drt = 0, i = 0) {
    let key = 'last-watch';
    let data = {
        id: shikimoriID,
        continue: cnt,
        duration: drt,
        episode: cnt ? dataLocal.kodik_episode + i : dataLocal.kodik_episode + i,
        name: shikiResponse.russian,
        year: new Date(shikiResponse.aired_on).getFullYear(),
        image: 'https://nyaa.shikimori.one/' + shikiResponse.screenshots[0].original
    };
    storage.set(key, data);
}

function Loaded() {
    $(document).ready(() => {
        let query = new URLSearchParams(window.location.search);
        //Перемотка к плееру
        if (query.get('player')) {
            document.getElementById('kodik-player').scrollIntoView({ behavior: "smooth", block: "center" });
        }

        if (dataLast) {
            //Продолжение просмотра
            if (dataLast.continue) {
                AsyncPlayer(() => {
                    kodikIframe.postMessage({
                        key: "kodik_player_api", value: { method: "play" }
                    }, '*');
                });
            }
        }
    });
}

//Function await loaded player
async function AsyncPlayer(e = () => { }) {
    try {
        if (!document.getElementById("kodik-player").contentWindow.document) {
            e();
        } else {
            let i = setInterval(() => {
                try {
                    if (!document.getElementById("kodik-player").contentWindow.document) {
                        console.log(true);
                    } else {
                        console.log(false);
                    }
                } catch (error) {
                    clearInterval(i);
                    e();
                }
            }, 1000);
        }
    } catch (error) {
        e();
    }
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

//https://stackoverflow.com/questions/5915096/get-a-random-item-from-a-javascript-array
Array.prototype.random = function () {
    return this[Math.floor((Math.random() * this.length))];
}

//Управление плеером
function kodikMessageListener(message) {
    //Продолжительность
    if (message.data.key == 'kodik_player_duration_update') {
        play_duration = message.data.value;
    }

    //Пауза
    if (message.data.key == 'kodik_player_pause') {
        let prc = 5;
        if (play_duration - play_time <= (play_duration / 100 * prc)) {
            SetLastAnime(false, play_time, 1);
        } else {
            SetLastAnime(true, play_time)
        }
    }

    //Воспроизведение
    if (message.data.key == 'kodik_player_play') {
        console.log('play');
        let query = new URLSearchParams(window.location.search);
        if (query.get('player') && dataLast && dataLast.continue) {
            kodikIframe.postMessage({
                key: "kodik_player_api", value: { method: "seek", seconds: dataLast.duration }
            }, '*');
            dataLast = null;
        }
    }

    //Текущее время
    if (message.data.key == 'kodik_player_time_update') {
        play_time = message.data.value;
    }
}

if (window.addEventListener) {
    window.addEventListener('message', kodikMessageListener);
} else {
    window.attachEvent('onmessage', kodikMessageListener);
}