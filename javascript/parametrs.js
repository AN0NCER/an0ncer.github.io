const $PARAMETERS = {
    censored: true,
    autologin: false,
    develop: false,
    watch: {
        dubanime: false,
        dubanimefrc: false,
        episrevers: 'left',
        typefrc: ["TV Сериал", "Фильм", "ONA", "OVA"],
    },
    experement: false,
};

(() => {
    const key = 'parametrs';
    console.log('[prmtrs] - Load parametrs {localStorage}')
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

    console.log('[prmtrs] - Loaded completed to {$PARAMETERS}');

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
                if (Array.isArray(objectToClean[key])) {
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
                    if (Array.isArray(referenceObject[key])) {
                        referenceObject[key] = objectToClean[key];
                        continue;
                    }
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

/**
 * Функция для установки нового значения ключа в объекте $PARAMETERS.
 * Рекурсивно проходит по всем ключам объекта obj и проверяет, соответствует ли ключ key текущему ключу.
 * Если соответствует, то функция проверяет, соответствует ли тип значения объекта типу нового значения value.
 * Если соответствует, то функция присваивает новое значение value ключу key и возвращает управление.
 * Если не соответствует, то функция выводит сообщение об ошибке и возвращает управление.
 * Если функция не находит ключ key в объекте obj, то она выводит сообщение об ошибке.
 * Если значение текущего ключа не является объектом, то функция также выводит сообщение об ошибке и возвращает управление.
 * 
 * @param {string} key - ключ, который нужно изменить.
 * @param {*} value - новое значение ключа.
 * @param {object} [obj=$PARAMETERS] - объект, в котором нужно искать ключ.
 * @returns {undefined} - функция не возвращает ничего.
 */
function setParameter(key, value, obj = $PARAMETERS) {
    if (typeof obj !== 'object') {
        $DEV.log(`[prmtrs] - Failed to set ${key} to ${value} - ${obj} is not an object`);
        return;
    }

    const keys = Object.keys(obj);

    for (const k of keys) {
        if (k === key) {
            if (typeof obj[k] === typeof value) {
                obj[k] = value;
                localStorage.setItem('parametrs', JSON.stringify($PARAMETERS));
                $DEV.log(`[prmtrs] - Set ${k} = ${value}`);
                return;
            } else {
                return;
            }
        } else if (typeof obj[k] === 'object') {
            if (Array.isArray(obj[k])) {
                if (k === key && Array.isArray(value)) {
                    obj[k] = value;
                    localStorage.setItem('parametrs', JSON.stringify($PARAMETERS));
                    $DEV.log(`[prmtrs] - Set ${k} = ${value}`);
                    return;
                }
                continue;
            }
            setParameter(key, value, obj[k]);
        }
    }
}

const $DEV = {
    log: function () {
        if (!$PARAMETERS.develop) {
            return;
        }
        const args = Array.from(arguments);
        console.log(...args);
    },

    error: function () {
        if (!$PARAMETERS.develop) {
            return;
        }
        const args = Array.from(arguments);
        console.error(...args);
    },

    warn: function () {
        if (!$PARAMETERS.develop) {
            return;
        }
        const args = Array.from(arguments);
        console.warn(...args);
    },

    time: function () {
        if (!$PARAMETERS.develop) {
            return;
        }
        const args = Array.from(arguments);
        console.time(...args);
    },

    timeEnd: function () {
        if (!$PARAMETERS.develop) {
            return;
        }
        const args = Array.from(arguments);
        console.timeEnd(...args);
    }
};