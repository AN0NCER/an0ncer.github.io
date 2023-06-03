//Жанр для вывода новых аниме
let genres = '';

//Авторизация пользователя true / false
//Метод Main вызывается файлом shikimori.js
Main((e) => {
    WindowManagment.init(e);
    if (e) {
        CountNotification();
        ShowUser();
    } else {
        AutoLogin();
    }
    //Функция отображение пользователя
    async function ShowUser() {
        let data = usr.Storage.Get(usr.Storage.keys.whoami);
        // console.log(data);

        $('.image-profile > img').attr('src', data.avatar);
        $('.name > b').text(data.nickname);
        $('.name > span').text('С возврашением,')
    }

    //Подсчитывает количество уведомлений на аккаунте в shikimori
    async function CountNotification(id = usr.Storage.Get(usr.Storage.keys.whoami).id) {
        shikimoriApi.Users.unread_messages(id, async (response) => {
            if (response.failed && response.status == 429) {
                await sleep(1000);
                CountNotification(id);
                return;
            }

            //Смотрим только на количество notifications
            let count = /*response.messages + response.news +*/ response.notifications;

            if (count > 0) {
                $('.notification > .dot').removeClass('hide');
            }
        });
    }

    //Добавляем в историю назад кнопку
    localStorage.setItem('history-back', '/index.html');
});

//Загрузка данных
GetAnimeShikimori();
GetUpdatetAnime();
GitHubRelease();
GetUserPosition();

//Установка возможность компьютерам пролистывать с помощью мышки
scrollElementWithMouse('.section-genres');
scrollElementWithMouse('.section-anime');
scrollElementWithMouse('.section-update');

//Загружаем историю последних просмотров пользователя
GetHistoryWatch();

//https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep/39914235#39914235
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//Функция для прокручивания елемента с помощью мышки
function scrollElementWithMouse(dom) {
    const element = $(dom)[0];

    let isDragging = false;
    let currentX;
    let initialMouseX;
    let scrollLeft;

    element.addEventListener('mousedown', (e) => {
        initialMouseX = e.clientX;
        scrollLeft = element.scrollLeft;
        isDragging = true;
    });

    element.addEventListener('mousemove', (e) => {
        if (isDragging) {
            currentX = e.clientX - initialMouseX;
            element.scrollLeft = scrollLeft - currentX;
        }
    });

    element.addEventListener('mouseup', () => {
        isDragging = false;
    });

    element.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    element.addEventListener('wheel', (e) => {
        // Проверить, достигнут ли конец элемента
        if (Math.abs(element.scrollLeft - (element.scrollWidth - element.clientWidth)) <= 2 && e.deltaY > 0) {
            return;
        }
        //Проверить если число явсляется отрицательным и мы на начале элемента то прокручивать на врех дальше
        if (e.deltaY < 0 && element.scrollLeft == 0) {
            return;
        }
        e.preventDefault();
        element.scrollLeft += e.deltaY;
    });
}

//Фукция запроса новых аниме с shikimori
function GetAnimeShikimori() {
    shikimoriApi.Animes.animes({ kind: 'tv', order: 'ranked', status: 'ongoing', limit: 8, genre: genres, season: `${new Date().getFullYear() - 1}_${new Date().getFullYear()}` }, async (response) => {
        if (response.failed && response.status == 429) {
            await sleep(1000);
            GetAnimeShikimori();
            return;
        }

        const element = $('.section-anime');
        //Очищение елемента
        element.empty();

        for (let i = 0; i < response.length; i++) {
            const html = CreateElementAnime(response[i]);
            element.append(html);
        }
    });
}

//функция создания елемента истории просмотра
function CreateElementHistory(data) {
    const time = Math.floor(data.duration / 60) + ':' + (data.duration % 60).toString().padEnd(2, '0');
    const ost = Math.floor((data.fullduration - data.duration) / 60) + ':' + Math.floor(((data.fullduration - data.duration) % 60)).toString().padEnd(2, '0');
    const link = `watch.html?id=${data.id}&player=true&continue=${data.continue}`;
    const image = data.image.includes("https://nyaa.shikimori.me/") ? data.image.replace('https://nyaa.shikimori.me/', '') : data.image.replace('https://nyaa.shikimori.one/', '') ? data.image.replace('https://nyaa.shikimori.one/', '') : data.image;
    const name = data.name ? data.name : "Аниме";
    const episode = data.episode ? data.episode : "?";
    const type = data.type ? data.type : "Аниме";
    const dub = data.dub ? data.dub : "???";
    return `<div class="swiper-slide">
    <a href="${link}">
        <div class="wrapp-content">
            <div class="continue-content">
                <div class="wrap-content">
                    <div class="continue-info">
                        <span>${dub}</span>
                        <span class="ellipse"></span>
                        <span>${type}</span>
                    </div>
                    <span class="title">${name}</span>
                    <div class="continue-episode">
                        <span class="icon"><svg width="9" height="10" viewBox="0 0 9 10" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_628_986)">
                                    <path
                                        d="M3.91465 1.06425C4.00254 1.36132 3.83379 1.67597 3.53672 1.76386C2.14102 2.18046 1.125 3.47245 1.125 4.99999C1.125 6.86327 2.63672 8.37499 4.5 8.37499C6.36328 8.37499 7.875 6.86327 7.875 4.99999C7.875 3.47245 6.85898 2.18046 5.46504 1.76386C5.16797 1.67597 4.99746 1.36132 5.08711 1.06425C5.17676 0.767176 5.48965 0.596669 5.78672 0.686317C7.64473 1.24003 9 2.96093 9 4.99999C9 7.48554 6.98555 9.49999 4.5 9.49999C2.01445 9.49999 0 7.48554 0 4.99999C0 2.96093 1.35527 1.24003 3.21504 0.686317C3.51211 0.598426 3.82676 0.767176 3.91465 1.06425Z"
                                        fill="#2393F1" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_628_986">
                                        <rect width="9" height="9" fill="white"
                                            transform="translate(0 0.5)" />
                                    </clipPath>
                                </defs>
                            </svg>
                        </span>
                        <span>Эпизод: <b>${episode}</b></span>
                    </div>
                </div>
                <div class="wrap-continue">
                    <div class="button-continue">
                        <svg width="44" height="43" viewBox="0 0 44 43" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M19.4714 13.752C18.9703 13.4271 18.3406 13.4164 17.8294 13.7199C17.3182 14.0234 17 14.5947 17 15.216V27.7852C17 28.4066 17.3182 28.9779 17.8294 29.2814C18.3406 29.5849 18.9703 29.5706 19.4714 29.2493L29.2214 22.9647C29.7055 22.654 30 22.1005 30 21.5006C30 20.9008 29.7055 20.3508 29.2214 20.0366L19.4714 13.752Z"
                                fill="white" />
                        </svg>

                    </div>
                    <span>ОСТ <span>${ost}</span></span>
                </div>
            </div>
            <div class="continue-frame" style="background-image: url(https://nyaa.shikimori.me/${image});">
                <div class="continue-time">
                    <span>${time}</span>
                </div>
            </div>

        </div>
    </a>

</div>`;
}

//Функция создание елемента anime-card
function CreateElementAnime(data) {
    return `<a href="/watch.html?id=${data.id}"  class="card-anime" data-id="${data.id}">
    <div class="card-content"><img src="https://moe.shikimori.me/${data.image.original}"><div class="title"><span>${data.russian}</span></div></div><div class="card-information"><div class="year">${new Date(data.aired_on).getFullYear()}</div><div class="score"><svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.73196 0.745728C4.65834 0.595337 4.50279 0.499634 4.33196 0.499634C4.16112 0.499634 4.00696 0.595337 3.93196 0.745728L3.0389 2.55452L1.04446 2.84436C0.877789 2.86897 0.7389 2.98381 0.687511 3.14104C0.636122 3.29827 0.677789 3.4719 0.797233 3.58811L2.24446 4.99768L1.90279 6.98967C1.87501 7.15374 1.94446 7.32053 2.08196 7.4176C2.21946 7.51467 2.4014 7.52698 2.5514 7.44905L4.33334 6.51252L6.11529 7.44905C6.26529 7.52698 6.44723 7.51604 6.58473 7.4176C6.72223 7.31917 6.79168 7.15374 6.7639 6.98967L6.42084 4.99768L7.86807 3.58811C7.98751 3.4719 8.03057 3.29827 7.97779 3.14104C7.92501 2.98381 7.78751 2.86897 7.62084 2.84436L5.62501 2.55452L4.73196 0.745728Z" fill="#FFE600"/></svg>${data.score}</div></div>
    </a>`;
}

//Функция обновленных аниме с kodik player
async function GetUpdatetAnime() {
    let response = await kodikApi.list({ sort: 'updated_at', limit: 8, types: 'anime-serial' });
    if (response.failed) {
        await sleep(1000);
        GetUpdatetAnime();
        return;
    }
    let ids = [];
    for (let index = 0; index < response.results.length; index++) {
        ids.push(response.results[index].shikimori_id);
    }
    //Получаем данные с shikimori сервера
    ShikimoriAnime(ids);

    //Достает данные с shikimori cо взятых id из kodik сервера
    function ShikimoriAnime(ids) {
        shikimoriApi.Animes.animes({ ids: ids.toString(), limit: 8 }, async (response) => {
            if (response.failed && response.status == 429) {
                await sleep(1000);
                ShikimoriAnime(ids);
                return;
            }

            const element = $('.section-update');

            for (let i = 0; i < response.length; i++) {
                const html = CreateElementAnime(response[i]);
                element.append(html);
            }
        });
    }
}

//Функция получения данных с GitHub
async function GitHubRelease() {
    fetch("https://api.github.com/repos/AN0NCER/an0ncer.github.io/releases").then(async (response) => {
        if (response.ok) {
            let data = await response.json();
            let date = new Date(data[0].published_at);
            $('.github > .version > span').text(data[0].tag_name);
            $('.github > .date').text(`${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`);

            //Если версия гита отличается от версии сохраненной, то показывем диалоговое окно
            // console.log(localStorage.getItem('github-version'));

            let saved_git_verrsion = JSON.parse(localStorage.getItem('github-version'));
            if (saved_git_verrsion == null || saved_git_verrsion.tag != data[0].tag_name) {
                //Если у пользователя нет ключа обновления то он первый раз
                if (localStorage.getItem(UpdateWindow.key) == null) {
                    localStorage.setItem(UpdateWindow.key, true);
                }
                //Если было обновление то показываем диалоговое окно
                if (localStorage.getItem(UpdateWindow.key) == "true") {
                    UpdateWindow.data = data;
                    WindowManagment.click(UpdateWindow);
                }
            }
        } else {
            //Если ответа от Githuba не будет то изменяем на сохранненый тег
            let saved_git_verrsion = JSON.parse(localStorage.getItem('github-version'));
            if (saved_git_verrsion == null) {
                return;
            }
            let date = new Date(saved_git_verrsion.published_at);
            $('.github > .version > span').text(saved_git_verrsion.tag);
            $('.github > .date').text(`${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`);
        }
    });
}

//Функция для загрузки истории просмотра пользователя
function GetHistoryWatch() {
    let last_watch = usr.Storage.Get('last-watch');

    //Для старых версий проверям тип обьекта
    if (Object.prototype.toString.call(last_watch) == '[object Object]') {
        last_watch = [last_watch];
    }

    if (last_watch) {
        const element = $('.swiper-continue > .swiper-wrapper');
        for (let i = 0; i < last_watch.length; i++) {
            const html = CreateElementHistory(last_watch[i]);
            element.append(html);
        }
    }
}

//Функция просчета процента от числа
function calculatePercentage(part, whole) {
    return (part / whole) * 100;
}

//Получаем положение пользователя по ipа
function GetUserPosition() {
    fetch('https://api.sypexgeo.net/json/').then(async (response) => {
        const data = await response.json();
        // console.log(data);

        $('.position > span').text(data.country.name_en + ', ' + data.city.name_en);
    });
}

//Слайдер для блока продолжение просмотра
new Swiper('.swiper-continue', {
    // Parametrs
    slidesPerView: 1,
    spaceBetween: 10,
    breakpoints: {
        740: {
            slidesPerView: 2
        }
    },
    pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true,
        dynamicBullets: true,
        bulletActiveClass: 'swiper-pagination-bullet-active',
        bulletClass: 'swiper-pagination-bullet',
        bulletSize: '10px',
        bulletStyle: 'circle',
        bulletElement: 'span',
        hideOnClick: false,
        watchOverflow: true,
    },
});

//Событие нажатие на жанр
$('.genres').click((e) => {
    const target = $(e.currentTarget);
    if (target.hasClass('selected')) {
        return;
    }

    //Снимаем выдиление с другого елемента и перезначаем его
    $('.section-genres > .selected').removeClass('selected');
    target.addClass('selected');
    genres = target.data('id');
    console.log(genres);
    GetAnimeShikimori()
})

//Событие нажатие поиска аниме
$('.search > .btn').click((e) => {
    //Получение значения посика
    let value = $(e.currentTarget.parentNode)[0].firstElementChild.value;

    window.location.href = '/search.html?val=' + value;
});

//Событие Enter unput search
$('.search > input').on('keypress', function (e) {
    if (e.which == 13) {
        let value = this.value;
        if (value.length <= 0) {
            return;
        }
        window.location.href = '/search.html?val=' + value;
    }
});

/**
 * Автоматическая авторизация
 */
function AutoLogin() {
    //Проверяем если пользователь не авторизирован, и то что у пользователя включена автоматический вход

    if (!usr.authorized && $PARAMETERS.autologin && localStorage.getItem('application_event') != "autologin") {
        //Нужно будет создать в localStorage ячейку c указанием текущим событием программы
        localStorage.setItem('application_event', "autologin");

        //Для тестового режима своя страничка авторизации
        if (usr.isteste) {
            return window.location.href = "/login.html";
        }

        //Пробуем авторизоваться
        return window.location.href = usr.Oauth.GetUrl();
    }
}