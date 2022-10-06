let loadItem = `<div class="res_anim loading"><a href="#"><div class="anime_info"><div class="anime_main"><div class="anime_img"></div><div class="anime_cnt"><h3>Мастер муси</h3><span>Mushishi</span><p>Муси — простейшая форма жизни в мире. Муси существуют повсюду и безо всякой цели. </p></div></div><div class="anime_div"><div class="a_time"><img src="img/clock.png" alt=""><span><b>2009</b> год</span></div><div class="a_episodes"><img src="img/play-button.png" alt=""><span><b>30</b> серий</span></div><div class="a_score"><img src="img/star.png" alt=""><span><b>8,97</b> рейтинг</span></div></div></div></a></div>`;

$(document).ready(() => {
    var typingTimer;                //timer identifier
    var doneTypingInterval = 2000;
    var $input = $('#search');

    //on keyup, start the countdown
    $input.on('keyup', function () {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    });

    //on keydown, clear the countdown 
    $input.on('keydown', function () {
        clearTimeout(typingTimer);
    });

    //user is "finished typing," do something
    async function doneTyping() {
        if ($input.val().length > 0) {
            $(`.results`).empty();
            let res = await SearchAnime($input.val());
            if (!res.status && res.length > 0) {
                for (let index = 0; index < res.length; index++) {
                    const element = res[index];
                    $('.results').append(loadItem);
                }
                let $loadRes = $('.res_anim');
                for (let index = 0; index < res.length; index++) {
                    const element = res[index];
                    let anime = await GetAnaime(element.id);
                    console.log(anime);
                    if (!anime.failed) {
                        let searchItem = `<div class="res_anim"><a href="watch.html?id=${anime.id}"><div class="anime_info"><div class="anime_main"><div class="anime_img"><img src="https://shikimori.one${anime.image.original}" alt=""></div><div class="anime_cnt"><h3>${anime.russian}</h3><span>${anime.name}</span><p>${anime.description != null? anime.description.replace(/\[.+\]/,''):"Нет описания"}</p></div></div><div class="anime_div"><div class="a_time"><img src="img/clock.png" alt=""><span><b>${new Date(anime.released_on).getFullYear()}</b> год</span></div><div class="a_episodes"><img src="img/play-button.png" alt=""><span><b>${anime.episodes}</b> сери(й)я</span></div><div class="a_score"><img src="img/star.png" alt=""><span><b>${anime.score}</b> рейтинг</span></div></div></div></a></div>`;
                        $(searchItem).insertAfter($loadRes[index]);
                        $loadRes[index].remove()
                    } else {
                        $loadRes[index].remove()
                    }
                    await sleep(500);
                }
            }
        } else {

        }
    }
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function SearchAnime(name) {
    return new Promise((resolve) => {
        fetch('https://shikimori.one/api/animes?limit=3&search=' + name, {
            method: 'GET',
            headers: {
                'User-Agent': 'Tunime'
            }
        }).then((response) => {
            if (!response.ok) {
                resolve({ failed: true, status: response.status });
            }
            resolve(response.json());
        });
    });
}

async function GetAnaime(id) {
    return new Promise((resolve) => {
        fetch('https://shikimori.one/api/animes/' + id, {
            method: 'GET',
            headers: {
                'User-Agent': 'Tunime'
            }
        }).then((response) => {
            if (!response.ok) {
                resolve({ failed: true, status: response.status });
            }
            resolve(response.json());
        });
    });
}