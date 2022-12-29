//Search
let genres = [];
let kind = '';
$('.search').keyup(() => {
    let value = $('.search').val();
    Search(value);
});

//Функция поиска
function Search(value) {
    shikimoriApi.Animes.animes({
        search: value,
        limit: 16,
        censored: parametrs.censored,
        genres: genres,
        kind: kind
    }, (response) => {
        if (response) {
            $('.results').empty();
            for (let index = 0; index < response.length; index++) {
                const element = response[index];
                AddAnime(element, '.results');
            }
        }
    });
}

//Проверяем есть ли запрос из вне
let searchParams = new URLSearchParams(window.location.search).get('val');
if(searchParams){
    Search(searchParams);
}

//Загрузка kind
$('.search-menu > div').click((t) => {
    kind = ChangeKind(t);
    console.log(kind);
    $('.search-menu > .select').removeClass('select');
    $(t.currentTarget).addClass('select');
})

//Загрузка жанров
shikimoriApi.Genres.genres((response) => {
    for (let index = 0; index < response.length; index++) {
        const element = response[index];
        if (element.kind == 'anime') {
            $('.genres > .list').append(`<div data-id="${element.id}">${element.russian}</div>`);
            $(`.genres > .list > div[data-id="${element.id}"]`).click((t) => ChangeGenres(t));
        }
    }
});

//Список похожих аниме
let ids = {
    'animes': []
};

//Список исключений
let ignores = [];

//Список для хранения
let saveSimiliar = [];

if (localStorage.getItem('save-similar')) {
    saveSimiliar = JSON.parse(localStorage.getItem('save-similar'));
}

Main((e) => {
    if (e) {
        shikimoriApi.User_rates.user_rates({
            user_id: usr.Storage.Get(usr.Storage.keys.whoami).id,
            target_type: 'Anime'
        }, async (response) => {
            if (!response.failed) {
                if (saveSimiliar) {
                    $('.recomandation > .list').empty();
                    saveSimiliar.forEach((id) => {
                        $(`.recomandation > .list`).append(`<a href="/watch.html?id=${id}" data-id="${id}"></a>`);
                        LoadAnime(id);
                    });
                    AnylizeSimiliar(response, () => { SaveSimiliarList() });
                } else {
                    AnylizeSimiliar(response, () => {
                        $('.recomandation > .list').empty();
                        ids.animes.forEach((element) => {
                            element = element.content;
                            AddAnime(element, '.recomandation > .list');
                        });
                        //Save similiar
                        SaveSimiliarList();
                    });
                }
            }
        }).GET();
    }
});

function getSimmiliar(id) {
    return new Promise((resolve) => {
        shikimoriApi.Animes.similar(id, async (r) => {
            if (r.failed) {
                await sleep(1000);
                resolve(getSimmiliar(id));
            }
            resolve(r);
        });
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function AnylizeSimiliar(response, e) {
    //Adding ignores anime if watching
    for (let index = 0; index < response.length; index++) {
        const element = response[index];
        ignores.push(element.target_id);
    }

    //Get all simmiliars
    for (let index = 0; index < response.length; index++) {
        const element = response[index];
        let d = await getSimmiliar(element.target_id);
        d.forEach(element => {
            if (!ignores.find(x => x == element.id)) {
                let index = ids.animes.findIndex(x => x.id == element.id);
                if (index != -1)
                    ids.animes[index].value += 1;
                else
                    ids.animes.push({ id: element.id, value: 1, content: element });
            }
        });
    }
    // console.log(ids.animes);
    //Sorting
    ids.animes.sort((a, b) => { return b.value - a.value });
    //Cleaning
    ids.animes = ids.animes.slice(0, 10);
    e();
}

function SaveSimiliarList() {
    let s = [];
    for (let index = 0; index < ids.animes.length; index++) {
        const element = ids.animes[index];
        s.push(element.id);
    }
    if (JSON.stringify(s) != JSON.stringify(saveSimiliar)) {
        saveSimiliar = s;
        localStorage.setItem('save-similar', JSON.stringify(saveSimiliar));
    }
}

function AddAnime(element, dom) {
    let html = `<a href="/watch.html?id=${element.id}"><div class="anime-card"><div class="anime-image"><img src="https://nyaa.shikimori.one${element.image.original}" alt="${element.russian}"><div class="play-btn"><div class="btn"><svg viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.70312 0.551381C4.54688 -0.159557 3.09375 -0.182995 1.91406 0.481068C0.734375 1.14513 0 2.39513 0 3.75451V31.2545C0 32.6139 0.734375 33.8639 1.91406 34.5279C3.09375 35.192 4.54688 35.1608 5.70312 34.4576L28.2031 20.7076C29.3203 20.0279 30 18.817 30 17.5045C30 16.192 29.3203 14.9889 28.2031 14.3014L5.70312 0.551381Z" fill="white" /></svg></div></div></div><div class="anime-title">${element.russian}</div></div></a>`;
    $(dom).append(html);
}

function LoadAnime(id) {
    shikimoriApi.Animes.id(id, async (r) => {
        if (r.failed) {
            await sleep(1000);
            LoadAnime(id);
            return;
        }
        $(`a[data-id="${id}"]`).append(`<div class="anime-card"><div class="anime-image"><img src="https://nyaa.shikimori.one${r.image.original}" alt="${r.russian}"><div class="play-btn"><div class="btn"><svg viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.70312 0.551381C4.54688 -0.159557 3.09375 -0.182995 1.91406 0.481068C0.734375 1.14513 0 2.39513 0 3.75451V31.2545C0 32.6139 0.734375 33.8639 1.91406 34.5279C3.09375 35.192 4.54688 35.1608 5.70312 34.4576L28.2031 20.7076C29.3203 20.0279 30 18.817 30 17.5045C30 16.192 29.3203 14.9889 28.2031 14.3014L5.70312 0.551381Z" fill="white" /></svg></div></div></div><div class="anime-title">${r.russian}</div></div>`);
    });
}

function ChangeGenres(target) {
    let id = $(target.currentTarget).data('id');
    let find = genres.findIndex(x => x == id);
    if (find == -1) {
        genres.push(id);
        $(target.currentTarget).addClass('sel');
    } else {
        genres.splice(find, 1);
        $(target.currentTarget).removeClass('sel');
    }
}


function ChangeKind(target) {
    let kind = $(target.currentTarget).data('kind');
    if (kind == 'clear') {
        return '';
    }
    return kind;
}