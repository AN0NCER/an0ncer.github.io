import { Sleep } from "../../modules/functions.js";
import { Users } from "../../modules/ShikiAPI.js";
import { User } from "../../modules/ShikiUSR.js";
import { $USER, OnUser } from "../user.js";

export function History() {
    OnUser(data => {
        if ($USER != (JSON.parse(localStorage.getItem(User.Storage.keys.whoami))?.id || undefined))
            return;
        LoadHistory(data.id);
        $(`[id="history"]`).removeClass('hide');
    });
}

function LoadHistory(id, page = 1) {
    Users.history(id, { target_type: "Anime", limit: 9, page }, async (response) => {
        if (response.failed) {
            if (response.status == 429) {
                await Sleep(1000);
                return LoadHistory(id, page);
            }
            return;
        }

        //Генерируем свой Object для истории
        const history = GenObjectHistory(response);

        if (response.length == 0) {
            return;
        }

        //Отображаем историю
        HistoryShow(history);

        trackScroll('scrollHistory', 200, (() => {
            LoadHistory(id, page + 1);
        }));
    }).GET();
}

/**
 * Переделывает Object с историей в массив данных
 * @param {Object} resource - история пользователя
 * @returns Возвращает измененый Object в Array с историей
 */
function GenObjectHistory(resource) {
    // console.log(resource);
    const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    const daysOfWeek = ['Вск', 'Пнд', 'Втр', 'Срд', 'Чтв', 'Птн', 'Сбт'];

    var data = [];

    for (let i = 0; i < resource.length; i++) {
        const element = resource[i];
        const date = new Date(element.created_at);

        let id = `${date.getMonth()}.${date.getFullYear()}`;
        let mounthIndex = data.findIndex((x) => x.id == id);

        //Месяц
        if (mounthIndex === -1) {
            data.push({ id: id, month: months[date.getMonth()], year: date.getFullYear(), data: [] });
            mounthIndex = data.length - 1;
        }

        let dayIndex = data[mounthIndex].data.findIndex((x) => x.day == date.getDate());

        //Дни
        if (dayIndex === -1) {
            data[mounthIndex].data.push({ day: date.getDate(), week: daysOfWeek[date.getDay()], list: [] });
            dayIndex = data[mounthIndex].data.length - 1;
        }

        //Событие
        data[mounthIndex].data[dayIndex].list.push({ id: element.target.id, russian: element.target.russian, description: element.description, evid: element.id });

        // console.log('Generate', data[mounthIndex].data[dayIndex]);
    }

    // console.log(data);
    return data;
}

/**
 * Отображает историю на сайте
 * @param {Array} data Данные с историей
 */
function HistoryShow(data) {
    for (let i = 0; i < data.length; i++) {
        // Месяц
        const month = data[i];
        if (!$(`.mounth[data-id="${month.id}"]`).length) {
            AddMonth(month.month, month.year, month.id);
        }

        for (let j = 0; j < month.data.length; j++) {
            // Дни
            const day = month.data[j];
            let isset_day = false;
            let htmlHistory = "";

            if (!$(`.block-date-data[data-id="${month.id}"][data-day="${day.day}"]`).length) {
                htmlHistory = GenHtmlHistory(day.day, day.week, month.id);
            } else {
                isset_day = true;
            }

            for (let k = 0; k < day.list.length; k++) {
                // События
                const event = day.list[k];
                if (!$(`a[data-evid="${event.evid}"]`).length) {
                    htmlHistory += GenEvent(event.id, event.russian, event.description, event.evid);
                }
            }

            if (!isset_day) {
                htmlHistory += EndGenHtmlHistory();
            }

            if (!isset_day) {
                $('.block-history').append(htmlHistory);
            } else {
                $($(`.block-date-data[data-id="${month.id}"][data-day="${day.day}"] > .history-data`)[0]).append(htmlHistory);
            }
        }
    }

    /**
     * Добавляет на сайт название месяца
     * @param {String} name название месяца
     */
    function AddMonth(name, year, id) {
        $('.block-history').append(`<div class="mounth" data-id="${id}">${name}<span>${year}</span></div>`);
    }

    /**
     * Генерирует html историю для сайта (закончить EndGenHtmlHistory)
     * @param {Int} day День
     * @param {String} week День Недели
     * @returns html c началом истории
     */
    function GenHtmlHistory(day, week, month_id) {
        return `<div class="block-date-data" data-id="${month_id}" data-day="${day}">
                <div class="history-date">
                  <span class="mon">${week}</span>
                  <span class="day">${day}</span>
                </div>
              <div class="history-data">
      `
    }

    /**
     * Генерация html событие для истории вызывать после (GenHtmlHistory)
     * @param {Int} id аниме
     * @param {String} title Название аниме
     * @param {String} event Событие связаное с аниме
     * @returns Возвразает html с событие
     */
    function GenEvent(id, title, event, evid) {
        return `<a href="/watch.html?id=${id}" data-evid="${evid}">
                <div class="block">
                  <span class="anime-title">${title}</span>
                  <span class="anime-event">${event}</span>
                </div>
              </a>`;
    }

    /**
     * Заглушка закрвыающие теги вызвать после (EndGenHtmlHistory)
     * @returns Html
     */
    function EndGenHtmlHistory() {
        return `</div></div>`;
    }
}

/**
 * Отслеживает, когда пользователь почти прокручивает до конца определенного элемента,
 * вызывает заданную функцию и удаляет отслеживание.
 *
 * @param {string} elementId - Идентификатор элемента, до которого нужно прокрутить.
 * @param {number} threshold - Пороговое значение, по которому определяется, что пользователь почти прокрутил до конца.
 * @param {function} callback - Функция обратного вызова, которую нужно вызвать, когда пользователь почти прокрутил до конца.
 */
function trackScroll(elementId, threshold, callback) {
    const $element = $('#' + elementId);

    function handleScroll() {
        const scrollTop = $(window).scrollTop();
        const elementHeight = $element.outerHeight();
        const windowHeight = $(window).height();

        const scrollableDistance = elementHeight - windowHeight;
        const scrolledDistance = scrollTop - $element.offset().top;

        if (scrolledDistance >= scrollableDistance - threshold) {
            // Вызываем заданную функцию
            callback();

            // Удаляем отслеживание прокрутки
            $(window).off('scroll', handleScroll);
        }
    }

    // Начинаем отслеживать прокрутку
    $(window).on('scroll', handleScroll);
}