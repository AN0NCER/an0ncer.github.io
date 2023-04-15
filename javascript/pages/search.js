//Поле ввода поиска
const InputSearch = $('.input-search > input');

//Кнопка очищение ввода
const BtnBack = $('.search > .btn-back');

//scroll до конца елемента
let scrollingEnd = true;
//Текущая страница результатов
let scrollPage = 1;
//Пауза для рекомендации, загрузки и обновления онформации
let pasuse = false;

//Статусы поиска
const states = [
    { id: "common", class: 'state_common' },
    { id: "focus", class: 'state_focus' },
    { id: "filter", class: 'state_filter' },
    { id: "search", class: 'state_search' },
    { id: "result", class: 'state_result' }
];

//Начало программы, авторизация
Main((e) => {
    //Получаем рекомендации пользователя
    Recomendation(e);

    //Отображаем историю
    ShowHistory();

    //Добавляем в историю назад кнопку
    localStorage.setItem('history-back', '/search.html');
});

//Отображаем доступные жанры
ShowGenres();
//Отображаем доступные озвучки
ShowVoice();

scrollElementWithMouse('.recomend > .content');
scrollElementWithMouse('.genres > .content');
scrollElementWithMouse('.voice > .content');
scrollElementWithMouse('.history > .content');

//Cобытия [input] поиска
SearchEvent();

//Работа со статусами поисков
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

//Проверяем есть ли запрос из вне
let searchParams = new URLSearchParams(window.location.search).get('val');
if (searchParams) {
    InputSearch.val(searchParams);
    if (InputSearch.val().length > 0) {
        //Изменяем на статус загрузки
        search.ChangeState(3);
        //Производится поиск
        searchAPI(InputSearch.val());
    }
}


//Object работы с историей поиска аниме
let s_history = {
    key: 'search-history',
    data: [],

    loadHistory: function (event) {
        let data = localStorage.getItem(this.key);
        if (data)
            this.data = JSON.parse(data);
        event(this.data);
    },

    addHistory: function (id) {
        if (this.data == []) {
            this.data = localStorage.getItem(this.key) ? JSON.parse(localStorage.getItem(this.key)) : [];
        }
        // Check if the id already exists in the history
        let index = this.data.indexOf(id);
        if (index !== -1) {
            // If it does, move it to the first position
            this.data.splice(index, 1);
            this.data.unshift(id);
        } else {
            // If it doesn't, add it to the first position
            this.data.unshift(id);
            // And check if we have reached the maximum history length
            if (this.data.length > 10) {
                this.data.pop();
            }
        }
        localStorage.setItem(this.key, JSON.stringify(this.data));
    },

    clearHistory: function () {
        this.data = [];
        localStorage.setItem(this.key, JSON.stringify(this.data));
    }
}

//Функция отслеживания событий поиска
function SearchEvent() {
    let typingTimeout;

    //Фокус поиска
    InputSearch.focus(() => {
        //Изменяем состояние поиска
        if ($('.response-anime').length <= 0) {
            search.ChangeState(1);
        }
    })

    //Поиск вне фокуса
    InputSearch.blur(() => {
        //Изменяем состояние поиска
        if (InputSearch.val().length == 0) {
            search.ChangeState(0);

        }
    });

    //Нужно определить статус ввода текста
    InputSearch.keydown(() => {
        clearInterval(typingTimeout);
    });

    InputSearch.keyup(() => {
        if (InputSearch.val().length > 0 && search.state != states[3]) {
            $('.result > .content').empty();
            search.ChangeState(3);
        } else if (InputSearch.val().length == 0) {
            search.ChangeState(1);
        }
        clearInterval(typingTimeout);
        typingTimeout = setTimeout(() => {
            if (InputSearch.val().length > 0) {
                //Производится поиск
                searchAPI(InputSearch.val());
            }
        }, 1500);
    });
}

//функция запроса поиска
function searchAPI(val, page = 1) {
    pasuse = true;
    shikimoriApi.Animes.animes({ search: val, limit: 16, censored: $PARAMETERS.censored, page: page }, async (response) => {
        if (response.failed) {
            await sleep(1000);
            return searchAPI(val, page);
        }

        pasuse = false;

        search.ChangeState(4);

        if (response.length != 0) {
            scrollingEnd = false;
            scrollPage = page;
        }

        //Добаляем затычки для аниме в раземере ответа
        for (let i = 0; i < response.length; i++) {
            $('.result > .content').append(ElementResponse(response[i]));
        }


        //Определяем загруженых ихображенй их пропорции
        $(".response-anime > .preview > img").on("load", function () {
            var width = $(this).width();
            var height = $(this).height();
            if (width > height) {
                $(this).closest('.preview').addClass('hor');
            } else {
                $(this).closest('.preview').addClass('ver');
            }
        });

        //Добавляем событие нажатие на елемент
        $(".response-anime").unbind('click').on('click', (e) => {
            let target = $(e.currentTarget);
            const id = target.data('id');
            s_history.addHistory(id);

            //Если это уже есть в списке перенести на первое место
            if ($(`.history > .content > a[data-id="${id}"]`).length > 0) {
                $(`.history > .content > a[data-id="${id}"]`).detach().prependTo($('.history > .content'));
            } else {
                if ($(`.history > .content > a`).length >= 10) {
                    $(`.history > .content > a:last`).remove();
                }

                $(`.history > .content`).prepend(`<a href="/watch.html?id=${id}" data-id="${id}">
                <div class="card-anime" data-anime="${id}"><div class="content-img"><div class="saved"></div>
                <div class="title">${$(`.result > .content > .response-anime[data-id="${id}"] > .preview > .title`).text()}</div>
                <img src="${$(`.result > .content > .response-anime[data-id="${id}"] > .preview > img`).attr('src')}" alt="${$(`.result > .content > .response-anime[data-id="${id}"] > .preview > .title`).text()}">
                </div><div class="content-inf"><div class="inf-year">${$(`.result > .content > .response-anime[data-id="${id}"] > .info > .year`).text()}</div><div class="inf-rtng"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path></svg>${$(`.result > .content > .response-anime[data-id="${id}"] > .info > .score`).text()}</div></div></div></a>`);
            }

            window.location.href = "/watch.html?id=" + id;
        });
    });
}

//Отслеживаем прокрутку до конца елемнета
trackElementReachEnd('.scroll-end-func', () => {
    if (document.querySelector('.scroll-end-func').getBoundingClientRect().height != 0 && !scrollingEnd) {
        scrollingEnd = true;
        searchAPI(InputSearch.val(), scrollPage + 1);
    }
});

//Нажатие на кнопку back or clear
BtnBack.click(() => {
    InputSearch.val('');
    $('.result > .content').empty();
    scrollingEnd = true;
    search.ChangeState(0);
});

//Возвращает готовый елемент результат поиска
function ElementResponse(response) {
    const url = "https://nyaa.shikimori.me/";
    return `<div class="response-anime" data-id="${response.id}">
                <div class="preview">
                    <img src="${url}${response.image.original}" alt="Сага о Винланде 2">
                    <div class="title">${response.russian}</div>
                </div><div class="info"><span class="year">${new Date(response.aired_on).getFullYear()}</span><span class="score"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path></svg>${response.score}</span></div></div>`;
}

//Получаем доступные озвуки аниме
function ShowVoice() {
    kodikApi.translations({ types: 'anime-serial', translation_type: 'voice', sort: 'count' }, (response) => {
        let i = 1;

        for (let index = 0; index < response.results.length; index++) {
            const element = response.results[index];
            if (element.count >= 10) {
                $('.voice > .content > .block--' + i).append('<div>' + element.title + '<div>' + element.count + '</div></div>');
                i == 1 ? i = 2 : i == 2 ? i = 3 : i = 1;
            }
        }
    })
}

//Получаем жанры аниме
function ShowGenres() {
    shikimoriApi.Genres.genres(async (response) => {
        if (response.failed) {
            await sleep(1000);
            return ShowGenres();
        }

        //Разбиваем на 3 строки
        let i = 1;

        for (let index = 0; index < response.length; index++) {
            const element = response[index];
            if (element.kind == 'anime') {
                $('.genres > .content > .block--' + i).append('<div>' + element.russian + '</div>');
                i == 1 ? i = 2 : i == 2 ? i = 3 : i = 1;
            }
        }
    });
}

//Получаем историю просмотров
function ShowHistory() {
    s_history.loadHistory((data) => {
        if (data && data.length > 0) {
            //есть данные            
            for (let i = 0; i < data.length; i++) {
                $('.history > .content').append(`<a href="/watch.html?id=${data[i]}" data-id="${data[i]}"></a>`);
                loadHistory(data[i]);
            }
        } else {
            //Истории нет, нужно скрыть вкладку истории
            $('.history').css('display', 'none');
        }
    });

    async function loadHistory(id) {
        shikimoriApi.Animes.id(id, async (data) => {
            if (data.failed) {
                await sleep(1000);
                return loadHistory(id);
            }
            $(`.history > .content > a[data-id="${id}"]`).append(`
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
            </div>`);
        });
    }
}

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
    //Дата проверки recomendation
    let saveSimiliarDate = localStorage.getItem('save-similar-date');
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

    //Проверяем что сегодня уже данные обновлены
    if (saveSimiliarDate) {
        if (saveSimiliarDate == new Date().toJSON().slice(0, 10)) {
            Status("Загружено");
            return;
        }
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

    saveSimiliarDate = new Date().toJSON().slice(0, 10);
    localStorage.setItem('save-similar-date', saveSimiliarDate);

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
                    <img src="https://nyaa.shikimori.me${data.image.original}" alt="${data.russian}">
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

function trackElementReachEnd(className, callback) {
    window.addEventListener('scroll', () => {
        const target = document.querySelector(className);
        const targetHeight = target.offsetHeight;
        const scrollPosition = window.pageYOffset;
        const viewportHeight = window.innerHeight;
        if (scrollPosition + viewportHeight >= targetHeight) {
            callback();
        }
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}