//Начало программы, авторизация
Main((e) => {
    //Получаем рекомендации пользователя
    Recomendation(e);
});

//Отображаем доступные жанры
ShowGenres();
//Отображаем доступные озвучки
ShowVoice();

scrollElementWithMouse('.recomend > .content');
scrollElementWithMouse('.genres > .content');
scrollElementWithMouse('.voice > .content');

//Статусы поиска
const states = [
    { id: "common", class: 'state_common' },
    { id: "focus", class: 'state_focus' },
    { id: "filter", class: 'state_filter' },
    { id: "search", class: 'state_search' },
    { id: "result", class: 'state_result' }
];

let search = {
    //Текущий статус поиска
    state: states[0],
    //Елементы где надо менять класс jq
    elements: ['body', '.search', 'main'],

    //Функция изменения статуса
    ChangeState: function (num = 0, event = (s, f) => { console.log(s, f) }) {
        //Получаем все елементы со старого состояния
        let el = $('.' + this.state.class);

        //Запоминает старый статус
        let second = this.state;

        //Удаляем старый статус с елементов
        for (let i = 0; i < el.length; i++) {
            const element = $(el[i]);
            element.removeClass(this.state.class);
        }

        //Присваемваем новый статус объекту
        this.state = states[num];

        //Присваемваем класс елементам со списка
        for (let i = 0; i < this.elements.length; i++) {
            const element = this.elements[i];
            $(element).addClass(this.state.class);
        }

        event(second, this.state);
    }
}

// search.ChangeState(1);

//Отслеживаем события поиска
SearchEvent();

//Функция отслеживания событий поиска
function SearchEvent() {
    const element = $('.input-search > input');

    let typingTimeout;

    //Фокус поиска
    element.focus(() => {
        //Изменяем состояние поиска
        search.ChangeState(1);
    })

    //Поиск вне фокуса
    element.blur(() => {
        //Изменяем состояние поиска
        if (element.val().length == 0) {
            search.ChangeState(0);

        }
    });

    //Нужно определить статус ввода текста


}

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
if (searchParams) {
    Search(searchParams);
}

//Загрузка kind
$('.search-menu > div').click((t) => {
    kind = ChangeKind(t);
    console.log(kind);
    $('.search-menu > .select').removeClass('select');
    $(t.currentTarget).addClass('select');
})


function AddAnime(element, dom) {
    let html = `<a href="/watch.html?id=${element.id}"><div class="anime-card"><div class="anime-image"><img src="https://nyaa.shikimori.one${element.image.original}" alt="${element.russian}"><div class="play-btn"><div class="btn"><svg viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.70312 0.551381C4.54688 -0.159557 3.09375 -0.182995 1.91406 0.481068C0.734375 1.14513 0 2.39513 0 3.75451V31.2545C0 32.6139 0.734375 33.8639 1.91406 34.5279C3.09375 35.192 4.54688 35.1608 5.70312 34.4576L28.2031 20.7076C29.3203 20.0279 30 18.817 30 17.5045C30 16.192 29.3203 14.9889 28.2031 14.3014L5.70312 0.551381Z" fill="white" /></svg></div></div></div><div class="anime-title">${element.russian}</div></div></a>`;
    $(dom).append(html);
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
//Получаем доступные озвуки аниме
function ShowVoice(){
    kodikApi.translations({types: 'anime-serial', translation_type: 'voice', sort: 'count'}, (response)=>{
        console.log(response);

        let i = 1;

        for (let index = 0; index < response.results.length; index++) {
            const element = response.results[index];
            if(element.count >= 10){
                $('.voice > .content > .block--'+i).append('<div>'+element.title+'<div>'+element.count+'</div></div>');
                i==1?i=2:i==2?i=3:i=1;
            }
        }
    })
}

//Получаем жанры аниме
function ShowGenres() {
    shikimoriApi.Genres.genres(async (response) => {
        if(response.failed){
            await sleep(1000);
            return ShowGenres();
        }

        //Разбиваем на 3 строки
        let i = 1;

        for (let index = 0; index < response.length; index++) {
            const element = response[index];
            if (element.kind == 'anime') {
                $('.genres > .content > .block--'+i).append('<div>'+element.russian+'</div>');
                i==1?i=2:i==2?i=3:i=1;
            }
        }
    });
}

//Пауза для рекомендации, загрузки и обновления онформации
let pasuse = false;

//Функция подбора аниме для пользователя
async function Recomendation(logged) {
    //Путь к елементу для рекомендации
    const dom = '.recomend';

    //Список исключений аниме
    let ignores = [];

    //Список похожих аниме
    let ids = {
        'animes': []
    };

    //Можем сделать рекомендацию только для авторизованнх пользователей
    Status("Авторизация");
    if (!logged) {
        NoLogged();
        return;
    }

    //Получаем сохраненную рекомендацию
    let saveSimiliar = JSON.parse(localStorage.getItem('save-similar'));
    //Делаем проверку на наличие рекомендация, или делаем пустой массив
    saveSimiliar = saveSimiliar ? saveSimiliar : [];


    //Если есть список рекомендаций то нужно его отобразить а потом обновить этот список в фонофом режиме
    if (saveSimiliar.length > 0) {
        const element = $(dom + '> .content');
        element.empty();
        for (let i = 0; i < saveSimiliar.length; i++) {
            //Добавляем пустышку
            element.append(EmptyAnime(saveSimiliar[i]));
            //Делаем загрузку
            LazyLoadAnime(saveSimiliar[i]);
        }

        Status("");
    }

    Status("обновляем");
    //Получаем список аниме пользователя
    const userRates = await GetUserAnime();
    //Анализируем аниме получаем список преложения для аниме
    await AnylizeSimiliar(userRates);
    //Сохраняем список
    SaveRecomendation(ids);

    //Проходимся и обновляем список аниме рекомендации
    if (saveSimiliar.length > 0 && $(dom + '>.content>a').length == 0) {
        const element = $(dom + '> .content');
        element.empty();
        for (let i = 0; i < saveSimiliar.length; i++) {
            //Добавляем пустышку
            element.append(EmptyAnime(saveSimiliar[i]));
            //Делаем загрузку
            LazyLoadAnime(saveSimiliar[i]);
        }
    } else {
        for (let i = 0; i < saveSimiliar.length; i++) {
            const id = saveSimiliar[i];
            const a = $($(dom + '>.content>a')[i]);
            //Если елемент отличается, изменяем
            if (a) {
                if (id != a.data('id')) {
                    a.empty();
                    a.data('href', `/watch.html?id=${id}`);
                    a.data('id', id);
                    LazyLoadAnime(id);
                }
            } else {
                const element = $(dom + '> .content');
                element.append(EmptyAnime(id));
                LazyLoadAnime(id);
            }

        }
    }

    Status("обновлено");

    //Функция отображения для не авторизированых пользователей
    function NoLogged() {
        const element = $(dom + '> .content > .loading');
        element.empty();
        element.append('<h1>T</h1><h2>Чтобы получать рекомендации, нужно авторизоваться</h2>');
    }

    //Функция изменение статуса
    function Status(text) {
        const element = $(dom + ' > .title > .status');
        element.text(text);
    }

    //Функция загрузка аниме по id и вывод на экран
    async function LazyLoadAnime(id) {
        if (pasuse) {
            await sleep(2000);
            return LazyLoadAnime(id);
        }
        shikimoriApi.Animes.id(id, async (data) => {
            if (data.failed) {
                await sleep(1000);
                return LazyLoadAnime(id);
            }
            $(`a[data-id="${id}"]`).append(`
            <div class="card-anime" data-anime="${data.id}">
                <div class="content-img">
                    <div class="saved"></div>
                    <div class="title">${data.russian}</div>
                    <img src="https://nyaa.shikimori.one${data.image.original}" alt="${data.russian}">
                </div>
                <div class="content-inf">
                    <div class="inf-year">${new Date(data.aired_on).getFullYear()}</div>
                    <div class="inf-rtng"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path></svg>${data.score}</div>
                </div>
            </div>`);
        });
    }

    //Функция возвращает пустышку аниме для lazy-loading
    function EmptyAnime(id) {
        return `<a href="/watch.html?id=${id}" data-id="${id}"></a>`;
    }

    //Функция для получение список просмотренных аниме пользователя
    function GetUserAnime() {
        return new Promise(async (resolve) => {
            if (pasuse) {
                await sleep(2000);
                resolve(GetUserAnime());
            }
            shikimoriApi.User_rates.user_rates({
                user_id: usr.Storage.Get(usr.Storage.keys.whoami).id,
                target_type: 'Anime'
            }, async (data) => {
                if (data.failed) {
                    await sleep(1000);
                    resolve(GetUserAnime());
                }
                resolve(data);
            }).GET();
        })
    }

    //Функция анализирует просмотренные аниме пользователя и сторит список 
    async function AnylizeSimiliar(response) {
        //Добавляем с игнор список те аниме которые есть у пользователя в списке
        for (let i = 0; i < response.length; i++) {
            const e = response[i];
            ignores.push(e.target_id);
        }

        //Проходимся по списку аниме пользователя
        //Получаем похожие аниме с аниме списка
        for (let i = 0; i < response.length; i++) {
            const e = response[i];
            let d = await getSimmiliar(e.target_id);
            d.forEach(e => {
                //Проверяем не находится ли id в исключении 
                if (!ignores.find(x => x == e.id)) {
                    //Ищем елемент в похожих аниме
                    let i = ids.animes.findIndex(x => x.id == e.id);
                    if (i != -1)
                        ids.animes[i].value += 1; // Если елемент найден то добавляем к его значению +1
                    else
                        ids.animes.push({ id: e.id, value: 1, content: e }); //Если елемент не найден, то создаем его
                }
            });
        }

        //Полученный список похожих аниме сортируем по количеству предложений
        ids.animes.sort((a, b) => { return b.value - a.value });
        //Оставляем только 10 елементов, чистим список
        ids.animes = ids.animes.slice(0, 10);
        return;
    }

    //Функция возвращает похожие аниме с аниме
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

    //Функция сохранения списка
    function SaveRecomendation(ids) {
        let s = []; //Массив для сохранения
        //Переносим обьекты в массив
        for (let index = 0; index < ids.animes.length; index++) {
            const element = ids.animes[index];
            s.push(element.id);
        }
        //Сверяем если не одинаков, то сохраняем
        if (JSON.stringify(s) != JSON.stringify(saveSimiliar)) {
            saveSimiliar = s;
            localStorage.setItem('save-similar', JSON.stringify(saveSimiliar));
        }
    }
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}