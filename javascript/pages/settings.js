//Обьект управлением select-wraper input type="radio"
const SelectWraper = {
    dom: '.select-wraper',

    /**
     * Показывает окно выбора елемент radio
     * @param {String} title - название раздела
     * @param {Array} data - данные массива сосотоящие из обьектов {key:"", value:""}
     * @param {String} tooltip - подсказка
     * @param {String} selected - выбранный елемент
     * @param {Event} event - событие при выборе radio
     */
    show: function (title = "", data = [], tooltip = "", selected = "", event = (object) => { }) {
        if (data.length <= 0) {
            return;
        }

        $(`${this.dom} > .select-control > .title`).text(title);
        $(`${this.dom} > .wraper > .parameters-container`).empty();

        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            let s = false;
            if (e.key == selected) {
                s = true;
            }
            $(`${this.dom} > .wraper > .parameters-container`).append(this.gen(e, s, i, data.length));
        }

        $(`${this.dom} > .wraper > .parameters-container`).append(`<span class="tips">${tooltip}</span>`);

        $(this.dom).removeClass('hiden');

        $('input[type=radio][name=answer]').bind('change', function () {
            event($(this).data('value'));
        });

        $('.btn-back').click(() => {
            $('input[type=radio][name=answer]').unbind('change');
            $('.select-wraper').addClass('hiden');
        });
    },

    /**
     * Генерирует radiobox по обьекту
     * @param {Object} data - обьект {key:"", value:""}
     * @param {Boolean} selected - выбран ли обьект
     */
    gen: function (data, selected = false, i = 0, lenght = 0) {
        return `<label class="${i == 0 ? "border-top" : i == (lenght - 1) ? "border-bottom" : ""}"><div class="title">${data.value}</div><div class="radio">
            <input type="radio" data-value='${JSON.stringify(data)}' name="answer" value="${data.key}" ${selected ? 'checked' : ''}>
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_548_1002)"><path d="M15.6695 3.70547C16.109 4.14493 16.109 4.8586 15.6695 5.29805L6.66954 14.2981C6.23009 14.7375 5.51642 14.7375 5.07697 14.2981L0.576965 9.79805C0.137512 9.3586 0.137512 8.64493 0.576965 8.20547C1.01642 7.76602 1.73009 7.76602 2.16954 8.20547L5.87501 11.9074L14.0805 3.70547C14.5199 3.26602 15.2336 3.26602 15.6731 3.70547H15.6695Z" fill="#008AFB" /></g></svg></div></label>`;
    }
};

const SelectCheckWrapr = {
    dom: '.select-checkbox-wraper',

    show: function (title = "", data = [], tooltip = "", key = "", event = () => { }) {
        if (data.length <= 0) {
            return;
        }

        $(`${this.dom} > .select-control > .title`).text(title);
        $(`${this.dom} > .wraper > .parameters-container`).empty();

        const local_param = getParametrByKey($PARAMETERS, key);

        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            $(`${this.dom} > .wraper > .parameters-container`).append(this.gen(e, e.key, i, data.length, (local_param.indexOf(e.key) != -1)));
        }

        $(`${this.dom} > .wraper > .parameters-container`).append(`<span class="tips">${tooltip}</span>`);

        $(this.dom).removeClass('hiden');

        $('input[type=checkbox][name=multi-answer]').bind('change', function () {
            event(this.checked, $(this).data('key'));
        });

        $('.btn-back').click(() => {
            $(this.dom).addClass('hiden');
        });
    },

    gen: function (data, key, i, lenght = 0, checked = false) {
        const border = i == 0 ? "border-top" : i == (lenght - 1) ? "border-bottom" : "";
        const chk = checked ? "checked" : "";
        return `<label class="${border}">
        <div class="title">${data.value}</div>
        <div class="checkbox">
            <input type="checkbox" name="multi-answer" data-key="${key}" ${chk}>
            <div class="switch-check"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 576 512"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z" fill="#008AFB"/></svg></div>
        </div>
    </label>`;
    }
};

//Начало программы
(() => {
    //Присваеваем значения к параметрам
    printObject($PARAMETERS);
    //Проверяем зависимотсии
    checkAddiction();

    //Подписываемся на изменение всех checkbox
    $(`input[type="checkbox"]`).change(function () {
        setParameter($(this).data('param'), this.checked);
        checkAddiction(this);
    });

    //Присваеваем изменение выбора из списка
    $('label[data-type="select"]').click(function (e) {
        SelectWraper.show("Эпизоды", $(this).data('variation'), $(this).data('tooltip'), $(this).attr('data-val'), (k) => {
            const key = $(this).data('param');
            $(this).attr('data-val', k.key);
            $(this).find('.select').text(k.value);
            setParameter(key, k.key)
        });
    });

    $('label[data-type="select-more"]').click(function (e) {
        SelectCheckWrapr.show("Франшизы", $(this).data('variation'), $(this).data('tooltip'), $(this).data('param'), (checked, key) => {
            const lkey = $(this).data('param');
            const lval = getParametrByKey($PARAMETERS, lkey);
            if (checked) {
                lval.push(key);
            }
            else {
                lval.splice(lval.indexOf(key),1);
            }

            setParameter(lkey, lval);
            $(this).find('.select').text($PARAMETERS.watch.typefrc.length);
        });
    });

    //Делаем привязку завиcящих друг от друга елементов
    function checkAddiction(el) {
        const addiction = {
            "dubanime": "dubanimefrc",
        }

        if (!el) {
            for (const key in addiction) {
                checkAddiction(document.querySelector(`input[data-param="${key}"]`));
            }
            return;
        }

        const element = $(el);

        if (!addiction[element.data('param')]) {
            return;
        }

        const target = $(`input[data-param="${addiction[element.data('param')]}"]`);
        target.prop("disabled", !el.checked);
        if (el.checked) {
            target.parent().parent().removeClass('disable');
        } else {
            target.parent().parent().addClass('disable');
        }
    }

    //Присваевам функцию к кнопке выхода
    $('.btn-logout').click(function () {
        usr.Storage.Clear();
        setParameter('autologin', false);
        window.location.replace("/login.html");
    });

    //Фильтр по поиску
    $('.search-filter').on('change keyup paste', function () {
        if (this.value.length <= 0) {
            //Очищаем фильтр
            $('[data-search]').removeClass('notfounded');
            return;
        }
        let containers = $('[data-search]');
        for (let i = 0; i < containers.length; i++) {
            const element = $(containers[i]);
            if (element.data('search')?.toUpperCase().indexOf(this.value.toUpperCase()) != -1) {
                element.removeClass('notfounded');
            } else {
                element.addClass('notfounded');
            }
        }
    });
})();

Main((e) => {
    if (e) {
        GetWhoami();
        let whoami = usr.Storage.Get(usr.Storage.keys.whoami);
        if (whoami) {
            $('.profile-info > img').attr('src', whoami.image['x160']);
            $('.profile-name').text(whoami.nickname);
            $('.profile-link').attr('href', whoami.url + '/edit/account');
            $('.profile-link').attr('target', '_blank');
        }
    }

    function GetWhoami() {
        shikimoriApi.Users.whoami(async (response) => {
            if (response.failed && response.status == 429) {
                await sleep(1000);
                return GetWhoami(id);
            }

            usr.Storage.Set(response, usr.Storage.keys.whoami);

            if ($('.profile-info > img').attr('src') != response.image['x160']) {
                $('.profile-info > img').attr('src', response.image['x160']);
            }

            $('.profile-name').text(response.nickname);
            $('.profile-link').attr('href', response.url + '/edit/account');
            $('.profile-link').attr('target', '_blank');
        });
    }
});

/**
 * Рекурсивно выводит в консоль все ключи и значения объекта, кроме вложенных объектов.
 * 
 * @param {*} obj - объект для вывода.
 * @returns {undefined} - функция ничего не возвращает.
 */
function printObject(obj) {
    // проверяем, что переданный аргумент является объектом
    if (typeof obj !== 'object' || obj === null) {
        return;
    }

    // проходим по всем свойствам объекта
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            // проверяем, что значение свойства не является объектом
            if (typeof obj[key] !== 'object' || obj[key] === null) {
                if (typeof (obj[key]) == 'boolean') {
                    $(`input[data-param="${key}"]`).prop("checked", obj[key]);
                } else if (typeof (obj[key]) == 'string') {
                    let input = $(`[data-param="${key}"]`);
                    if (input.data('type') == 'select') {
                        let data = input.data('variation');
                        for (let index = 0; index < data.length; index++) {
                            const element = data[index];
                            if (element.key === obj[key]) {
                                input.find('.select').text(element.value);
                                input.attr('data-val', obj[key]);
                            }
                        }
                    };
                }
            } else {
                if (Array.isArray(obj[key])) {
                    let input = $(`label[data-param="${key}"]`);
                    if (!input) {
                        continue;
                    }
                    input.find('.select').text(obj[key].length);
                    continue;
                }
                // рекурсивно вызываем функцию для свойства, если оно является объектом
                printObject(obj[key]);
            }
        }
    }
}

/**
 * Рекурсивно ищет значение по ключу в объекте, включая вложенные объекты и массивы.
 * @param {*} obj  - Объект, в котором осуществляется поиск.
 * @param {*} lkey - Ключ, значение которого нужно найти.
 * @returns  - Найденное значение или undefined, если значение не найдено.
 */
function getParametrByKey(obj, lkey) {
    for (let key in obj) {
        if (typeof obj[key] !== 'object' || obj[key] === null) {
            if (key == lkey) {
                return obj[key];
            }
        } else {
            if (Array.isArray(obj[key])) {
                if (key == lkey) {
                    return obj[key];
                }
            }
            return getParametrByKey(obj[key], lkey);
        }
    }
}