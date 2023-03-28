/**
 * В этом файле будут обрабатываться внутренние события программы
 * такие как первый запуск программы, первый раз зашел на страницу просмотра
 * и т.д.
 * Это должно облегчить путь пользователя по программу с ознакомлением функция
 */
//Этот Файл желательно вставлятьб после файла server.js

//Текущая страница от которых будет происодить проверки событий
const app_current_page = $($(`head meta[name="page"]`)[0]).attr('content');

//ключ к доступу к события localhost
const key_events_handler_list = 'events_handler_list';
const key_application_installed = 'application_installed';
//Список событий прогрымм
let events_handler_list = {
    onStart: {
        completed: false,
        target: 'index'
    },
    version: '0.1'
};
//Установленно ли приложение на девайс
let app_installed_device = {
    installed: false,
    date: '',
};

//Начало программы
(() => {
    //Для начало нужно определить является ли это приложение или нет
    LoadInstalledApplication();
    LoadEventsHandlerList();

    //Если приложение является установленным
    if (app_installed_device.installed) {
        for (const key in events_handler_list) {
            if (key == 'version')
                continue;

            if(events_handler_list[key].completed == false && events_handler_list[key].target == app_current_page){
                CallEventHandler(key);
            }
        }
    }
})();

/**
 * Возвращает информацию об установленом приложение
 * @returns {Object} - обьект об информации установки
 */
function GetAppInstalled() {
    return JSON.parse(localStorage.getItem(key_application_installed));
}

/**
 * Возвращаем информацибю об внутренних событий программы
 * @returns {Object} - обьект об информации внутренних событий
 */
function GetEventsHandler() {
    return JSON.parse(localStorage.getItem(key_events_handler_list));
}

/**
 * Слхранение обьекта в localStorage устройства
 * @param {Object} item - записуемый обьект
 * @param {String} key - ключ для сохранения елемента 
 */
function SetItemLocalStorage(item, key) {
    localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Загружаем данные об установке приложения
 */
function LoadInstalledApplication() {
    //Проверяем сохранненые данные если они есть
    let install_data = GetAppInstalled();
    if (install_data != null && install_data?.installed != false) {
        //Приложение установлено на девайс
        app_installed_device = install_data;
    } else {
        //Прилодение не установлена на устройство пользователя
        //Проверяем установлен ли приложение
        if (window.location.href.match('/?mode=standalone')) {
            const dateObj = new Date();
            app_installed_device.installed = true;
            app_installed_device.date = dateObj.getUTCFullYear() + "/" + (dateObj.getUTCMonth() + 1) + "/" + dateObj.getUTCDate();
        }
        SetItemLocalStorage(app_installed_device, key_application_installed);
    }
}

/**
 * Загружает данные об внутренних событий программы
 */
function LoadEventsHandlerList() {
    //Проверяем  данные если они есть
    let events_handler_data = GetEventsHandler();
    if (events_handler_data == null) {
        SetItemLocalStorage(events_handler_list, key_events_handler_list);
    } else {
        events_handler_list = events_handler_data;
    }
}

/**
 * Вызывает событие из списка и устанавливает его выполненым
 * @param {String} params - ключ к параметру
 */
function CallEventHandler(params) {
    const events = {
        onStart: function (){
            window.location.href = "login.html";
        }
    }

    events_handler_list[params].completed = true
    SetItemLocalStorage(events_handler_list, key_events_handler_list);
    events[params]();
}