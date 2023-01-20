let status = ['planned', 'watching', 'rewatching'];
let anime = {
    showids: [],
    ids: [],
    user_rates: {},
    animes: {}
}

Main((e) => {
    if (e) {
        GetUserRates();
    } else {
        window.location.href = "index.html";
    }

    //Добавляем в историю назад кнопку
    localStorage.setItem('history-back', '/list.html');
});

function ShowAnime(element) {
    for (let index = 0; index < anime.showids.length; index++) {
        const id = anime.showids[index];
        $('.content').append(`<a href="/watch.html?id=${id}" data-id="${id}"></a>`);
        let i = setInterval(()=>{
            console.log('await');
            if(anime.animes[id]){
                const element = anime.animes[id];
                let html = `<div class="anime-card"><div class="anime-image"><img src="https://nyaa.shikimori.one${element.image.original}" alt="${element.russian}"><div class="play-btn"><div class="btn"><svg viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.70312 0.551381C4.54688 -0.159557 3.09375 -0.182995 1.91406 0.481068C0.734375 1.14513 0 2.39513 0 3.75451V31.2545C0 32.6139 0.734375 33.8639 1.91406 34.5279C3.09375 35.192 4.54688 35.1608 5.70312 34.4576L28.2031 20.7076C29.3203 20.0279 30 18.817 30 17.5045C30 16.192 29.3203 14.9889 28.2031 14.3014L5.70312 0.551381Z" fill="white" /></svg></div></div></div><div class="anime-title">${element.russian}</div></div>`;
                $('.content > a[data-id="'+id+'"]').append(html);
                clearInterval(i);
            }
        },1000);
    }
    console.log(anime);
}

async function AddAnime(id) {
    await shikimoriApi.Animes.id(id, async (response) => {
        if (response.failed && response.status == 429) {
            await sleep(1000);
            AddAnime(id);
            return;
        }
        anime.animes[id] = response;
        console.log(anime);
    }, true);
}

function GetAnimes(response) {
    for (let index = 0; index < response.length; index++) {
        const element = response[index];
        anime.ids.push(element.target_id);
        anime.user_rates[element.target_id] = element;
        if (status.includes(element.status)) {
            anime.showids.push(element.target_id);
            AddAnime(element.target_id);
        }
    }
    ShowAnime();
    console.log(anime);
}

function GetUserRates() {
    shikimoriApi.User_rates.user_rates({
        user_id: usr.Storage.Get(usr.Storage.keys.whoami).id,
        target_type: 'Anime'
    }, async (response) => {
        if (response.failed) {
            await sleep(1000);
            GetUserRates();
            return;
        }
        SortByUpdate(response);
        GetAnimes(response);
    }).GET();
}

function SortByUpdate(response){
    response.sort((a,b)=> new Date(a.updated_at) < new Date(b.updated_at)?1:-1);
}

//https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep/39914235#39914235
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}