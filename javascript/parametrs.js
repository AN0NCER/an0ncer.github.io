const $PARAMETERS = {
    censored: true,
    autologin: false,
    watch: {
        dubanime: false,
        dubanimefrc: false,
        episrevers: 'left'
    }
};

(() => {
    const key = 'parametrs';
    let saved = JSON.parse(localStorage.getItem(key));

    //Если у пользователя есть параметры то сверяем их
    if (saved) {
        //Убираем не определенные обьекты
        saved = cleanObject(saved, $PARAMETERS);
        //Перезаписуем saved
        localStorage.setItem(key, JSON.stringify(saved));

        //Обьеденяем два обьекта, они будут достуны в $PARAMETERS
        mergeObjects(saved, $PARAMETERS);
    }

    /**
     * Удаляет свойства объекта, которые не определены в другом объекте.
     * @param {*} objectToClean - Объект, из которого нужно удалить свойства.
     * @param {*} referenceObject - Объект, на основе которого происходит проверка свойств.
     * @returns {Object} - Измененный объект objectToClean.
     */
    function cleanObject(objectToClean, referenceObject) {
        for (const key in objectToClean) {
            if (typeof objectToClean[key] === "object") {
                if (referenceObject[key] === undefined) {
                    delete objectToClean[key];
                    continue;
                }
                cleanObject(objectToClean[key], referenceObject[key]);
                if (Object.keys(objectToClean[key]).length === 0) {
                    delete objectToClean[key];
                }
            } else if (referenceObject[key] === undefined) {
                delete objectToClean[key];
            }
        }
        return objectToClean;
    }

    /**
     * Объединяет два объекта, присваивая значения referenceObject из objectToClean.
     * @param {*} objectToClean - Объект, из которого нужно взять значения для referenceObject.
     * @param {*} referenceObject - Объект, в который нужно присвоить значения.
     * @returns {Object} - Измененный объект referenceObject.
     */
    function mergeObjects(objectToClean, referenceObject) {
        for (const key in referenceObject) {
            if (typeof referenceObject[key] === "object") {
                if (objectToClean[key]) {
                    mergeObjects(objectToClean[key], referenceObject[key]);
                }
                if (Object.keys(referenceObject[key]).length === 0) {
                    delete referenceObject[key];
                }
            } else {
                if (objectToClean[key] !== undefined) {
                    referenceObject[key] = objectToClean[key];
                }
            }
        }
        return referenceObject;
    }
})();

// let parametrs = {
//     censored: true, //Делать цензуру на 18+ hentay
//     dub_anime: false, //Сохранять переводы для каждого аниме отдельно
//     dub_anime_franchise: false, //Запаминать переводы по франшизам
//     auto_login: false, //Автоматический вход в приложение
//     dub_reverse: false, //При горизонтальном режиме эпизоды с права
// }

// //Метод загрузки параметров
// let synchparam = () => {
//     let ls = JSON.parse(localStorage.getItem(keysParametrs));
//     if (ls) {
//         for (key in ls) {
//             parametrs[key] = ls[key];
//         }
//     } else {
//         localStorage.setItem(keysParametrs, JSON.stringify(parametrs));
//     }
// };

// //Метод сохранения параметров
// let saveparametrs = () => {
//     localStorage.setItem(keysParametrs, JSON.stringify(parametrs));
// }

// //Загружаем параметры
// synchparam();

// let param = {
//     keys: {
//         default: 'NAN',
//         censored: 'censored',
//         dub_anime: 'dub_anime',
//         dub_anime_franchise: 'dub_anime_franchise',
//         auto_login: 'auto_login',
//         dub_reverse: 'dub_reverse',
//     },
//     register: function (i, k) {
//         return {
//             boolean: function () {
//                 i.change(function () {
//                     parametrs[k] = this.checked;
//                     saveparametrs();
//                 });
//             }
//         }
//     }
// }

// let loadparampage = () => {
//     for (const key in param.keys) {
//         if (param.keys[key] != param.keys.default) {
//             let input = $(`input[data-param="${param.keys[key]}"]`);
//             if (input.length > 0) {
//                 let reg = param.register(input, key);
//                 if (typeof (parametrs[key]) == 'boolean') {
//                     reg.boolean();
//                     input.prop("checked", parametrs[key]);
//                 }
//             }
//         }
//     }
// };

// loadparampage();