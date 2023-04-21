//Жанр для вывода новых аниме
let genres = '';

//Авторизация пользователя true / false
//Метод Main вызывается файлом shikimori.js
Main((e) => {
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
    //Для старых версий
    const prcnt = data.fullduration ? calculatePercentage(data.duration, data.fullduration) : calculatePercentage(data.duration, data.duration);
    const time = Math.floor(data.duration / 60) + ':' + (data.duration % 60).toString().padEnd(2, '0');
    const link = `watch.html?id=${data.id}&player=true&continue=${data.continue}`;
    const image = data.image.includes("https://nyaa.shikimori.me/")?data.image.replace('https://nyaa.shikimori.me/', ''):data.image.replace('https://nyaa.shikimori.one/', '')?data.image.replace('https://nyaa.shikimori.one/', ''):data.image;
    return `<div class="swiper-slide"><div class="frame-info"><div class="frame-status">
            <div class="status">Эпизод: <b>${data.episode}</b> [${time}]</div>
            <div class="name">${data.name}</div>
        </div>
        <a href="${link}">
            <div class="btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" /></svg>Продолжить</div></a></div><div class="frame-anime">
        <div class="progress-watch" style="width: ${prcnt}%;"></div>
        <img src="https://nyaa.shikimori.me/${image}"
            alt="${data.name}">
        <a href="${link}">
            <div class="btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" /></svg></div></a></div></div>`;
}

//Функция создание елемента anime-card
function CreateElementAnime(data) {
    return `<a href="/watch.html?id=${data.id}">
    <div class="card-anime" data-anime="${data.id}">
        <div class="content-img">
            <div class="saved"></div>
            <div class="title">${data.russian}</div>
            <img src="https://nyaa.shikimori.me${data.image.original}" alt="${data.russian}">
        </div>
        <div class="content-inf">
            <div class="inf-year">${new Date(data.aired_on).getFullYear()}</div>
            <div class="inf-rtng"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path></svg>${data.score}</div>
        </div>
    </div>
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
                //Если у пользователя нет ключа оюновления то он первый раз
                if (localStorage.getItem(dialog.key) == null) {
                    localStorage.setItem(dialog.key, true);
                }
                //Елси было обновление то показываем диалоговое окно
                if (localStorage.getItem(dialog.key) == "true") {
                    dialog.show(() => {
                        localStorage.setItem(dialog.key, false);
                        //Сохраняем новые данные с github
                        localStorage.setItem('github-version', JSON.stringify({ tag: data[0].tag_name, published_at: data[0].published_at }));
                    }, data);
                }
            }
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