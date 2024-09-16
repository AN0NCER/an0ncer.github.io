import { CreateVerify } from "../../modules/ActionVerify.js";
import { WindowManagement } from "../../modules/Windows.js";

const exception = ['tunime-id', 'application_installed'];

const WindowStorage = {
    init: function () {
        $('.window-bar > .window-close').on('click', () => {
            _windowStorage.hide();
        });
        $('.button-clear-app').on('click', () => {
            CreateVerify().then((val) => {
                for (const key in localStorage) {
                    if (exception.includes(key)) {
                        continue;
                    }
                    localStorage.removeItem(key);
                }
                for (const key in sessionStorage) {
                    if (exception.includes(key)) {
                        continue;
                    }
                    sessionStorage.removeItem(key);
                }
                if (localStorage.getItem('application_installed')) {
                    const data = JSON.parse(localStorage.getItem('application_installed'));
                    if (data.installed) {
                        document.location.replace('/?mode=standalone');
                    }
                }
                document.location.replace('/');
            }).catch((reason) => {

            });
        });
        $('.btn#export-data').on('click', function () {
            exportLocalStorageToJson('etun.json');
        });
        $('.btn#import-data').on('click', function () {
            importJsonToLocalStorage()
        })
    },
    show: () => {
    },
    anim: {
        showed: () => {

        },
        hided: () => {
            $('.list-local-storage').empty();
            $('.list-session-storage').empty();
        }
    },
    hide: () => { },
    verif: () => { return true; }
}

const _windowStorage = new WindowManagement(WindowStorage, '.window-app-size');

export function ShowStorage(title = "Хранилище") {
    $('.select-bar > .window-title').text(title);
    let d = 'KB', s = Storage.Local.size();
    if (s > 1000) {
        d = 'MB';
        s = (s / 1000).toFixed(2);
    }
    $("#locdata > span").text(`${s} ${d}`);
    d = 'KB', s = Storage.Session.size();
    if (s > 1000) {
        d = 'MB';
        s = (s / 1000).toFixed(2);
    }
    $("#sesdata > span").text(`${Storage.Session.size()} KB`);

    let _xLen, _x;
    for (_x in localStorage) {
        if (!localStorage.hasOwnProperty(_x)) {
            continue;
        }
        let d = 'KB';
        _xLen = (((localStorage[_x].length + _x.length) * 2) / 1024).toFixed(2);
        if (_xLen > 1000) {
            d = 'MB';
            _xLen = (_xLen / 1000).toFixed(2);
        }
        $('.list-local-storage').append(`<div class="storage-element"><div>${_x}</div><span>${_xLen} ${d}</span></div>`);
    }
    for (_x in sessionStorage) {
        if (!sessionStorage.hasOwnProperty(_x)) {
            continue;
        }
        let d = 'KB';
        _xLen = (((sessionStorage[_x].length + _x.length) * 2) / 1024).toFixed(2);
        if (_xLen > 1000) {
            d = 'MB';
            _xLen = (_xLen / 1000).toFixed(2);
        }
        $('.list-session-storage').append(`<div class="storage-element"><div>${_x}</div><span>${_xLen} ${d}</span></div>`);
    }
    _windowStorage.click();
}

export const Storage = {
    Local: {
        size: function () {
            var _lsTotal = 0,
                _xLen, _x;
            for (_x in localStorage) {
                if (!localStorage.hasOwnProperty(_x)) {
                    continue;
                }
                _xLen = ((localStorage[_x].length + _x.length) * 2);
                _lsTotal += _xLen;
            };
            return (_lsTotal / 1024).toFixed(2);
        }
    },
    Session: {
        size: function () {
            var _lsTotal = 0,
                _xLen, _x;
            for (_x in sessionStorage) {
                if (!sessionStorage.hasOwnProperty(_x)) {
                    continue;
                }
                _xLen = ((sessionStorage[_x].length + _x.length) * 2);
                _lsTotal += _xLen;
            };
            return (_lsTotal / 1024).toFixed(2);
        }
    },

    size: function () {
        var _lsTotal = 0,
            _xLen, _x;
        for (_x in localStorage) {
            if (!localStorage.hasOwnProperty(_x)) {
                continue;
            }
            _xLen = ((localStorage[_x].length + _x.length) * 2);
            _lsTotal += _xLen;
        };
        for (_x in sessionStorage) {
            if (!sessionStorage.hasOwnProperty(_x)) {
                continue;
            }
            _xLen = ((sessionStorage[_x].length + _x.length) * 2);
            _lsTotal += _xLen;
        };
        return (_lsTotal / 1024).toFixed(2);
    }
}

function exportLocalStorageToJson(filename) {
    // Получаем данные из localStorage
    const localStorageData = { ...localStorage };
    const exception = ["recomendation-database", "tunime-recomendation", "access_token", "shadow-api", "tunime-id", "access_whoami", "history-back", "events_handler_list", "application_event"];

    // Создаем объект для данных, которые будут экспортированы
    const exportData = {};

    // Проходим по каждому элементу в localStorage
    for (let key in localStorageData) {
        if (localStorageData.hasOwnProperty(key)) {
            if (exception.includes(key))
                continue;
            // Добавляем данные в объект для экспорта
            try {
                exportData[key] = JSON.parse(localStorage.getItem(key));
            } catch (error) {
                exportData[key] = localStorage.getItem(key);
            }
        }
    }

    // Конвертируем объект в JSON
    const jsonData = JSON.stringify(exportData, null, 2);

    // Создаем ссылку для скачивания файла
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Создаем ссылку для загрузки файла
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Добавляем ссылку на страницу и эмулируем клик для загрузки файла
    document.body.appendChild(link);
    link.click();

    // Удаляем ссылку после завершения загрузки
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importJsonToLocalStorage() {
    // Создаем input элемент для выбора файла
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    // Устанавливаем обработчик события изменения файла
    input.addEventListener('change', function (event) {
        CreateVerify("Внимание! Вы точно хотите заменить текущие данные из файла?").then(() => {
            const file = input.files[0];
            const reader = new FileReader();

            // Обработчик события загрузки файла
            reader.onload = function (event) {
                try {
                    const jsonData = JSON.parse(event.target.result);

                    // Переводим значения из файла JSON в текст и сохраняем в localStorage
                    for (const key in jsonData) {
                        if (jsonData.hasOwnProperty(key)) {
                            localStorage.setItem(key, JSON.stringify(jsonData[key]));
                        }
                    }

                    // Оповещаем пользователя об успешном импорте
                    window.location.reload();
                } catch (error) {
                    // Обрабатываем возможные ошибки при парсинге JSON
                    alert('Произошла ошибка при импорте данных: ' + error.message);
                }
            };

            // Читаем содержимое выбранного файла как текст
            reader.readAsText(file);
        });
    });

    // Триггерим событие клика на input элементе для выбора файла
    input.click();
}