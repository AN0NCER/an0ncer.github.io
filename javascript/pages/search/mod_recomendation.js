import { ACard } from "../../modules/AnimeCard.js";
import { UserRates, Animes } from "../../modules/ShikiAPI.js";
import { User } from "../../modules/ShikiUSR.js";
import { Sleep, sha256 } from "../../modules/functions.js";

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
                if(dataBase[id]){
                    if (!Array.isArray(dataBase[id].data)) dataBase[id].data = [];
                    return resolve(dataBase[id].data);
                }
                Animes.similar(id, async (response) => {
                    if (response.failed) {
                        await Sleep(1000);
                        return resolve(getSimmiliar(id));
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

        function LoadAnimes(ids) {
            Animes.list({ ids: ids.toString(), limit: ids.length }, async (response) => {
                if (response.failed && response.status == 429) {
                    await Sleep(1000);
                    return LoadAnimes(ids);
                }

                for (let i = 0; i < response.length; i++) {
                    const element = response[i];
                    $('.content-recomendation').append(ACard.Gen({response: element}));
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

function calculatePercentage(currentElement, totalElements) {
    return (currentElement / totalElements) * 100;
}