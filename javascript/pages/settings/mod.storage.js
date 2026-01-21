import { TWindow } from "../../core/window.core.js";
import { animate } from "../../library/anime.esm.min.js";
import { DBControls, TDatabase } from "../../modules/TDatabase.js";
import { TDownload } from "../../modules/TDownload.js";
import { TCache } from "../../modules/tun.cache.js";
import { TVerify } from "../../modules/tun.verify.js";
import { WindowIntercator } from "../../modules/win.module.js";

const exception = ['tunime-id', 'application_installed'];
const database = [
    { name: "Загруженное", key: "downloader" },
    { name: "Кэширование", key: "tun-cache" }
];

const sLocal = [];
const sSession = [];
const sDatab = [];

const byteSize = str => new Blob([str]).size;

const WindowStorage = {
    loaded: false,
    oninit: function () {
        $('.storage-bar > .window-close').on('click', () => {
            _windowStorage.hide();
        });
        $('.btn.reset').on('click', () => {
            TVerify({
                title: 'Сбросить приложение',
                warning: 'Внимание! Все коллекции, выбор озвучек, параметры и другие данные пользователя будут удалены.'
            }).then(async (val) => {
                for (let i = 0; i < database.length; i++) {
                    const { key } = database[i];
                    await TDatabase.Delete(key).catch((msg) => {
                        console.log(msg);
                    });
                }
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
        });

        $('.storage-wrapper').on('click', '.btn', function () {
            const $wrapper = $(this).closest('.closset');
            const $list = $wrapper.find('> .collapse-block');
            const fullHeight = $list[0].scrollHeight;

            let opacity = 1;
            let height = fullHeight;
            let onComplete = function () { $list.css('height', 'auto'); };
            let onBegin = function () { $list.css('overflow', 'hidden'); $wrapper.removeClass('-hide'); }

            if (!$wrapper.hasClass('-hide')) {
                $list.css('height', fullHeight + 'px');
                $list[0].offsetHeight;
                height = 0;
                opacity = 0;
                onComplete = function () { };
                onBegin = function () { $list.css('overflow', 'hidden'); $wrapper.addClass('-hide'); }
            }

            return animate($list[0], {
                height,
                opacity,
                duration: 300,
                easing: 'cubicBezier(0.29, -0.81, 0.42, 1.68)',
                onComplete,
                onBegin
            });
        });

        navigator.storage.estimate().then(({ usage, quota }) => {
            const $el = $('.estimate');
            $el.find('.app').text(`Используется: ${formatBytes(usage)} из ${formatBytes(quota)}`);
            $el.find('.storage-state').css({ '--progress': `${Math.round(usage / quota * 100)}%` })
            $el.find('.free-space').text(formatBytes(quota - usage));
        }).catch((err) => {
            console.error(err);
        })
    },
    onshow: function () {
        if (this.loaded) return;
        this.loaded = true;

        const gen = (storage, title) => {
            let dom = '';
            let value = 0;

            setTimeout(() => {
                $('.storage-wrapper').append(`<div class="closset"><div class="btn"><div class="title-block"><div class="icon"><div class="ticon i-caret-right"></div></div><div class="title">${title}</div></div><span class="size">${formatBytes(value)}</span></div><div class="collapse-block"><div class="collapse-wrapper">${dom}</div></div></div>`);
            }, 0)

            for (let i = 0; i < storage.length; i++) {
                const { key, size } = storage[i];
                value += size;
                dom += `<div class="value"><div class="key">${key}</div><div class="size">${formatBytes(size)}</div></div>`;
            }
        }

        gen(sLocal, 'Локальное хранилище');
        gen(sSession, 'Сессионное хранилище');
        gen(sDatab, 'Кеш приложения и файлы');

        $()
    }
}

const _windowStorage = new TWindow(WindowStorage, '.window-app-size');
_windowStorage.module.add(WindowIntercator);

function formatBytes(x) {
    const units = ['б', 'Кб', 'Мб', 'Гб'];

    let l = 0, n = parseInt(x, 10) || 0;

    while (n >= 1024 && ++l) {
        n = n / 1024;
    }

    return (n.toFixed(n < 5 && l > 0 ? 2 : 0) + ' ' + units[l]);
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
        TVerify({
            title: 'Импорт данных',
            warning: 'Внимание! Текущие данные будут перезаписаны содержимым этого файла параметров.'
        }).then(() => {
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

export async function SizeValue() {
    let total = 0;

    const local = () => {
        for (const key in localStorage) {
            if (!localStorage.hasOwnProperty(key)) {
                continue;
            }

            const size = byteSize(localStorage[key]);
            sLocal.push({ key, size })
            total += size;
        }
    }

    const session = () => {
        for (const key in sessionStorage) {
            if (!sessionStorage.hasOwnProperty(key)) {
                continue;
            }

            const size = byteSize(sessionStorage[key]);
            sSession.push({ key, size });
            total += size;
        }
    }

    const downloader = async () => {
        let value = 0;
        const db = (await TDownload.Manager()).db;
        const list = await db.getAll("anime");
        db.Close();

        for (let i = 0; i < list.length; i++) {
            const { size } = list[i];
            value += size;
        }

        sDatab.push({ key: 'Загрузчик', size: value });
        total += value;
    }

    const cache = async () => {
        let value = 0;
        const db = new TCache().db;
        await db.Open();
        const controls = new DBControls(db);

        for (let i = 0; i < db.initStorages.length; i++) {
            const { name } = db.initStorages[i];
            const list = await controls.getAll(name);
            for (let index = 0; index < list.length; index++) {
                const element = JSON.stringify(list[index]);
                value += byteSize(element);
            }
        }

        sDatab.push({ key: 'Аниме кэш', size: value });
        total += value;
        controls.Close();
    }

    local();
    session();
    await downloader();
    await cache();

    return formatBytes(total);
}

export function ShowStorage() {
    _windowStorage.show();
}