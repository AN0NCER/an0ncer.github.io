import { UserRates, Animes } from "../../modules/ShikiAPI.js";
import { User } from "../../modules/ShikiUSR.js";
import { Sleep, sha256 } from "../../modules/funcitons.js";

const key = "tunime-recomendation";
const keyDB = "recomendation-database";

let dataSave = {
    sha: "",
    date: "",
    list: [],
}

let dataBase = {
}

let ProgressBar = {
    dom: '.content-progress-load',
    showProgress: function(){
        $(this.dom).removeClass('hidden');
    },

    setProgress: function (prc) {
        $(this.dom + ' > .progress').css({width: prc});
        $(this.dom + ' > .progress').text(prc);
    }
}

export async function Recomendation() {
    dataSave = LoadFromJSON(key, dataSave);
    dataBase = LoadFromJSON(keyDB, dataBase);

    //Список исключений аниме
    let ignores = [];

    //Список похожих аниме
    let ids = {
        'animes': []
    };

    //Проверяем авторизирован ли пользователь
    if (!User.authorized) return;
    $('.recomendation-none').hide();

    LoadSaveAnime();

    //Очищаем БД от старых данных
    removeExpiredItems(dataBase);
    //Получаем список аниме пользователя
    const userRates = await GetUserAnime();
    //Анализируем аниме получаем список предложения для аниме

    //Добавляем в игнор список те аниме которые есть у пользователя в списке
    for (let i = 0; i < userRates.length; i++) {
        const e = userRates[i];
        ignores.push(e.target_id);
    }

    //Сравниваем SHA Ignores c dataSave.sha
    if (dataSave.sha == sha256(ignores.toString())) return;
    dataSave.sha = sha256(ignores.toString());

    ProgressBar.showProgress();

    await AnylizeSimiliar(userRates);
    //Сохраняем список
    SaveRecomendation(ids);

    LoadSaveAnime();


    function GetUserAnime() {
        return new Promise(async (resolve) => {
            UserRates.list({ user_id: User.Storage.Get(User.Storage.keys.whoami).id, target_type: 'Anime' }, async (response) => {
                if (response.failed) {
                    await Sleep(1000);
                    resolve(GetUserAnime());
                }
                resolve(response);
            }).GET();
        });
    }

    async function AnylizeSimiliar(response) {
        //Проходимся по списку аниме пользователя
        //Получаем похожие аниме с аниме списка
        for (let i = 0; i < response.length; i++) {
            const e = response[i];
            let d = await getSimmiliar(e.target_id);
            SaveJson(keyDB, dataBase);

            ProgressBar.setProgress(Math.floor(calculatePercentage(i + 1, response.length)) + '%');

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

        //Функция возвращает похожие аниме с аниме
        function getSimmiliar(id) {
            return new Promise((resolve) => {
                if (dataBase[id]) return resolve(dataBase[id].data);
                Animes.similar(id, async (response) => {
                    if (response.failed) {
                        await Sleep(1000);
                        resolve(getSimmiliar(id));
                    }
                    dataBase[id] = {
                        data: response,
                        expirationDate: new Date().toJSON().slice(0, 10)
                    }
                    resolve(response);
                }).GET();
            });
        }
    }

    //Функция сохранения списка
    function SaveRecomendation(ids) {
        let s = []; //Массив для сохранения
        //Переносим обьекты в массив
        for (let index = 0; index < ids.animes.length; index++) {
            const element = ids.animes[index];
            s.push(element.id);
        }

        dataSave.date = new Date().toJSON().slice(0, 10);
        dataSave.list = s;
        SaveJson(key, dataSave);
    }

    //Загружаем аниме которое уже было
    function LoadSaveAnime() {
        if (dataSave.list.length <= 0) return;
        LoadAnimes(dataSave.list);
        console.log(dataSave.list);

        function LoadAnimes(ids) {
            Animes.list({ ids: ids.toString(), limit: ids.length }, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return LoadAnimes(ids);
                }

                for (let i = 0; i < response.length; i++) {
                    const element = response[i];
                    $('.content-recomendation').append(GenerateCardAnime(element));
                }
            }).GET();
        }
    }
}

//Функция для бд будет проверять елементы которые уже устарели и будет их удалять
function removeExpiredItems(database) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 5); // Вычитаем 5 дней из текущей даты

    const expiredItemKeys = [];

    for (const key in database) {
        const expirationDate = new Date(database[key].expirationDate);

        // Сравниваем даты, удаляем устаревшие элементы
        if (expirationDate < currentDate) {
            expiredItemKeys.push(key);
        }
    }

    // Удаляем устаревшие элементы из базы данных
    expiredItemKeys.forEach((key) => {
        delete database[key];
    });

    return expiredItemKeys.length; // Возвращаем количество удаленных элементов
}

/**
 * Загружает данные из локального хранилища по указанному ключу.
 * @param {string} key - Ключ для поиска данных в локальном хранилище.
 * @param {*} standartVal - Значение по умолчанию, которое будет возвращено, если данные не найдены.
 * @returns {*} Загруженные данные из локального хранилища или значение по умолчанию, если данных нет.
 */
function LoadFromJSON(key, standartVal) {
    let data = JSON.parse(localStorage.getItem(key));
    if (data)
        return data;
    else
        return standartVal;
}

function SaveJson(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}

function GenerateCardAnime(data) {
    return `<a href="/watch.html?id=${data.id}" class="card-anime" data-id="${data.id}"><div class="card-content"><img src="https://moe.shikimori.me/${data.image.original}"><div class="title"><span>${data.russian}</span></div></div><div class="card-information"><div class="year">${new Date(data.aired_on).getFullYear()}</div><div class="score"><svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.73196 0.745728C4.65834 0.595337 4.50279 0.499634 4.33196 0.499634C4.16112 0.499634 4.00696 0.595337 3.93196 0.745728L3.0389 2.55452L1.04446 2.84436C0.877789 2.86897 0.7389 2.98381 0.687511 3.14104C0.636122 3.29827 0.677789 3.4719 0.797233 3.58811L2.24446 4.99768L1.90279 6.98967C1.87501 7.15374 1.94446 7.32053 2.08196 7.4176C2.21946 7.51467 2.4014 7.52698 2.5514 7.44905L4.33334 6.51252L6.11529 7.44905C6.26529 7.52698 6.44723 7.51604 6.58473 7.4176C6.72223 7.31917 6.79168 7.15374 6.7639 6.98967L6.42084 4.99768L7.86807 3.58811C7.98751 3.4719 8.03057 3.29827 7.97779 3.14104C7.92501 2.98381 7.78751 2.86897 7.62084 2.84436L5.62501 2.55452L4.73196 0.745728Z" fill="#FFE600"/></svg>${data.score}</div></div></a>`;
}

function calculatePercentage(currentElement, totalElements) {
    return (currentElement / totalElements) * 100;
}