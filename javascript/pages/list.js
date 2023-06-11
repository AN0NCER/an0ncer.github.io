let response_user_rates = null;

//Правила филтрации елементов
let current_status = $('.btn-filter.btn-selected').data('filtr').split(',');
let current_type = $('.btn-filter.btn-selected').data('type').split(',');

//Список задач
let task_loading = [];

//Начало программы
(() => {
    //Добавим таймер, если авторизация будет проходить долго то мы покажем пользователю анимацию
    //где мы будем писать текущий статус обработки страницы
    let timer;

    timer = setInterval(() => { AnimateShow(); clearInterval(timer); }, 400); //Таймер на 400мс
    Main(async (e) => {
        clearInterval(timer); // Удаляем таймер, страница загружена

        //Проверяем авторизацию
        if (!e) {
            //Переадресация на страницу авторизации
            window.location.href = "login.html";
            return;
        }
        // Скрыаем загрузку если она есть
        AnimateHide();

        //Получаем аниме пользователя
        response_user_rates = await LoadUserRates();
        //Создаем список задач
        AddToLoadTask(response_user_rates);
        //Запускаем на выполнение список задач
        LoadingAnimeFromTask(task_loading);
    });

    //Добавляем функционал к кнопкам сортировки
    AddFunctionalButton();
    //Добавляем функционал к input сортировки по названию
    AddFunctionalInput();
})();

/**
 * Добавляет функционал к input сортировке по названию
 */
function AddFunctionalInput() {
    //Прикрепляем функционал
    let dom = '.search-filter';

    $(dom).on('change keyup paste', (e) => {
        //Value очищаем и обрезаем лишнии пробелы
        let value = $(dom).val().trim();

        if (value.length > 0) {
            //Есть значение
            let res = GetCardAnimeByName(value); //Поиск аниме карточек по имени

            //Скрываем елементы которые показаны но нет в найденных поиске
            for (let i = 0; i < res.notcontains.length; i++) {
                const element = res.notcontains[i];
                $(element).addClass('hide-search');
            }
        }

        if (value.length <= 0) {
            //Нет значения
            ClearSearchFilter();
        }
    });
}

/**
 * Очищает фильтр поиска
 */
function ClearSearchFilter() {
    let elements = $('.hide-search');
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        $(element).removeClass('hide-search');
    }
}

/**
 * Делает поиск аниме по имени которые показаны на экране пользователя
 * @param {String} name название аниме
 * @returns Object c найдеными и не найдеными аниме
 */
function GetCardAnimeByName(name) {
    return {
        contains: $(`.title > span:contains('${name}')`).parent().parent().parent("a.show-anime"),
        notcontains: $(`.title > span:not(:contains('${name}'))`).parent().parent().parent("a.show-anime")
    };
}

/**
 * Добавляет функционал к кнопкам фильтра
 */
function AddFunctionalButton() {
    $('.btn-filter').click((e) => {
        let target = $(e.currentTarget)
        //Если нажали на выбранную кнопку то пропускаем действие
        if (target.hasClass('btn-selected')) {
            return;
        }

        //Очищаем фильтр по поиску
        $('.search-filter').val('');
        ClearSearchFilter();

        //Удаляем класс старой кнопки
        $('.btn-filter.btn-selected').removeClass('btn-selected');
        //Добавляем класс к нажатой кнопке
        $(target).addClass('btn-selected');

        //Парсим правила фильтрации (статус, тип)
        current_status = $('.btn-filter.btn-selected').data('filtr').split(',');
        current_type = $('.btn-filter.btn-selected').data('type').split(',');

        //Отфильтровуем елементы по правилам фильтрации
        FiltredElements();
        //Добавляем новую задачу для ajax запросов
        AddToTaskShowed();
        //Отправляем список задачи на выполнение ajax запросов
        LoadingAnimeFromTask(task_loading);
    });
}

/**
 * Дает задачу загрузки аниме (загружаются послеовательно)
 * @param {Array} task - список задач аниме
 */
async function LoadingAnimeFromTask(task = task_loading) {
    //Локальный список задачи; Он нужен чтобы можно было сверить не был ли изменен один из списка задач
    let local_task = task;


    //Проверяем что в списке нет ничего не нужного
    //(То есть загруженных аниме)
    for (let i = 0; i < local_task.length; i++) {
        const id = local_task[i];
        const elem = document.querySelector(`a[data-id="${id}"]`);
        if (elem.childNodes.length != 0)
            local_task.slice(i, 1);
    }

    await LoadAnimes(local_task);

    /**
     * Ставит аниме на очерель загрузки
     * @param {Array} list - список для загрзки аниме
     * @returns Boolean - выполнено
     */
    async function LoadAnimes(list) {
        return new Promise((resolve) => {
            for (let i = 0; i < list.length; i++) {
                const id = list[i];

                //Указываем что загрузка пошла. Эту загрузку никак отменить нельзя
                let target = $(`a[data-id="${id}"]`);
                //Ставим чтобы можно было понять была ли запущена загрузка или нет
                target.attr('data-loaded', true);
            }

            shikimoriApi.Animes.animes({ ids: list.toString(), limit: list.length }, async (response) => {
                if (response.failed && response.status == 429) {
                    await sleep(1000);
                    resolve(await LoadAnimes(list));
                    return;
                }

                for (let i = 0; i < response.length; i++) {
                    const element = response[i];
                    AddAnime(element)
                }
                resolve(true);
            })
        });
    }

    /**
     * Добавляет структуру елемента в документ
     * @param {Object} response shikimori аниме ответ
     */
    async function AddAnime(response) {
        //Текущий елемнт который обрабатывался
        let target = $(`a[data-id="${response.id}"]`);

        //Устанавливем значения
        target.attr('data-type', response.kind)
        //Присваем стрктуру к елементу
        target.append(GenerateCardHtml(response, target.attr('data-score')));

        //Если после того как мы узнали что тип не соответсвует этому елемент, то надо скрыть елемент
        if (!current_type.includes(target.attr('data-type'))) {
            //Скрываем елемент
            target.removeClass('show-anime');
            target.addClass('hide-anime');
        }
    }

    /**
     * Генерирует html код с подготовленными данными об аниме
     * @param {Object} response shikimori ответ anime
     * @param {Int} score оценка пользователя
     * @returns Возваращет готовый html картки аниме
     */
    function GenerateCardHtml(response, score) {
        return `<div class="card-content"><img src="https://moe.shikimori.me/${response.image.original}"><div class="title"><span>${response.russian}</span></div>${score > 0 ? `<div class="my-score"><svg width="7" height="6" viewBox="0 0 7 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.19916 0.210914C4.13607 0.0820221 4.00275 0 3.85634 0C3.70993 0 3.5778 0.0820221 3.51352 0.210914L2.74813 1.76113L1.0388 2.00954C0.89596 2.03063 0.776925 2.12906 0.732883 2.26381C0.68884 2.39856 0.72455 2.54737 0.82692 2.64697L2.06726 3.85504L1.77443 5.56227C1.75063 5.70288 1.81014 5.84583 1.92799 5.92902C2.04583 6.01222 2.20177 6.02276 2.33032 5.95597L3.85753 5.15333L5.38474 5.95597C5.5133 6.02276 5.66923 6.01339 5.78708 5.92902C5.90492 5.84466 5.96444 5.70288 5.94063 5.56227L5.64662 3.85504L6.88696 2.64697C6.98933 2.54737 7.02623 2.39856 6.98099 2.26381C6.93576 2.12906 6.81792 2.03063 6.67507 2.00954L4.96455 1.76113L4.19916 0.210914Z" fill="white"/></svg>${score}</div>` : ""}</div><div class="card-information"><div class="year">${new Date(response.aired_on).getFullYear()}</div><div class="score"><svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.73196 0.745728C4.65834 0.595337 4.50279 0.499634 4.33196 0.499634C4.16112 0.499634 4.00696 0.595337 3.93196 0.745728L3.0389 2.55452L1.04446 2.84436C0.877789 2.86897 0.7389 2.98381 0.687511 3.14104C0.636122 3.29827 0.677789 3.4719 0.797233 3.58811L2.24446 4.99768L1.90279 6.98967C1.87501 7.15374 1.94446 7.32053 2.08196 7.4176C2.21946 7.51467 2.4014 7.52698 2.5514 7.44905L4.33334 6.51252L6.11529 7.44905C6.26529 7.52698 6.44723 7.51604 6.58473 7.4176C6.72223 7.31917 6.79168 7.15374 6.7639 6.98967L6.42084 4.99768L7.86807 3.58811C7.98751 3.4719 8.03057 3.29827 7.97779 3.14104C7.92501 2.98381 7.78751 2.86897 7.62084 2.84436L5.62501 2.55452L4.73196 0.745728Z" fill="#FFE600"/></svg>${response.score}</div></div>`;
    }
}

/**
 * Фльтрация елементов по правилам
 */
function FiltredElements() {
    //Получаем все наши елменты
    let elements = $(`.content > a`);
    for (let i = 0; i < elements.length; i++) {
        const element = $(elements[i]);

        //Проверяем проходят ли они проверку фильтрации
        if (current_status.includes(element.attr('data-status')) && current_type.includes(element.attr('data-type'))) {
            //Отображаем
            element.removeClass('hide-anime');
            element.addClass('show-anime');
        } else {
            //Скрываем
            element.removeClass('show-anime');
            element.addClass('hide-anime');
        }
    }
}

/**
 * Создание нового списка задач. Отбирает елементы котрые отображены но не загружены
 */
function AddToTaskShowed() {
    //Очищаем список задач
    task_loading = [];

    //Получаем елементы которыем отображены (.show-anime) но не загружены ([data-loaded="false"])
    let elements = $(`a.show-anime[data-loaded="false"]`);

    for (let i = 0; i < elements.length; i++) {
        const element = $(elements[i]);
        const id = element.data('id');
        //Добавляем в список задач
        task_loading.push(id);
    }
}

/**
 * Добавляет список в очередь загрузки аниме
 * @param {Array} response - данные shikimori user_rates
 */
function AddToLoadTask(response = response_user_rates) {
    task_loading = []; // Очищаем список
    for (let index = 0; index < response.length; index++) {
        const element = response[index];
        //Со
        $('.content').append(`<a href="/watch.html?id=${element.target_id}"  class="${!current_status.includes(element.status) ? "hide-anime" : "show-anime"} card-anime" data-score="${element.score}" data-id="${element.target_id}" data-status="${element.status}" data-type="all" data-loaded="false"></a>`);

        if (current_status.includes(element.status) && current_type.includes("all")) {
            task_loading.push(element.target_id);
        }
    }
}

/**
 * Получить список аниме пользователя
 * @param {Integet} user_id - индентификатор пользователя
 * @returns Возвращает массив о просмотрах пользователя сортированым по дате
 */
function LoadUserRates(user_id = usr.Storage.Get(usr.Storage.keys.whoami).id) {
    return new Promise((resolve) => {
        shikimoriApi.User_rates.user_rates({
            user_id: user_id,
            target_type: 'Anime'
        }, async (response) => {
            if (response.failed) {
                await sleep(1000);
                return await LoadUserRates(user_id);
            }
            //Сортируем массив по дате изменения
            response.sort((a, b) => new Date(a.updated_at) < new Date(b.updated_at) ? 1 : -1);
            //Возвращаем отсортированный массив
            resolve(response);
        }).GET();
    });
}

/**
 * Анимация загрузки приложения
 */
function AnimateShow() {
    $('.loading').css({ display: 'flex' });
    anime.timeline({ loop: false })
        .add({
            targets: '.loading',
            opacity: [0, 1],
            easing: "easeOutExpo",
            duration: 1000,
        })
}

/**
 * Скрывает загрузку приложение
 */
function AnimateHide() {
    anime.timeline({ loop: false, complete: () => { $('.loading').css('display', 'none'); } }).add({
        targets: '.loading',
        opacity: 0,
        easing: 'easeInOutQuad',
        duration: 1000
    });
}