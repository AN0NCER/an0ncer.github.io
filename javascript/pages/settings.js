import { InitMenu, Menu } from "../menu.js";
import { Users } from "../modules/ShikiAPI.js";
import { Main, User } from "../modules/ShikiUSR.js";
import { ShowMoreSelect, ShowSelect } from "./settings/mod_select.js";
import { ShowStorage, Storage } from "./settings/mod_storage.js";

const Parameters = [
    {
        name: 'Основные',
        parameters: [
            {
                type: 'boolean',
                param: 'censored',
                name: 'Цензура',
                description: 'Пользователи могут включать или выключать фильтрацию нежелательного контента.'
            },
            {
                type: 'boolean',
                param: 'autologin',
                name: 'Автоматический вход',
                description: 'Моментальная авторизация пользователей.'
            },
            {
                type: 'app-size',
                name: 'Хранилище',
                description: 'Возможность управлять данными приложения. Экспортировать, импортировать и сбросить данные.'
            }
        ]
    },
    {
        name: 'Меню',
        parameters: [
            {
                type: 'sel-one',
                param: 'menustyle',
                default: 'mode-0',
                variation: [
                    { key: 'mode-0', val: 'Стандартное' },
                    { key: 'mode-1', val: 'Стиль 1' },
                    { key: 'mode-2', val: 'Стиль 2' },
                ],
                name: 'Стиль меню',
                description: 'Визуальное оформление для персонализированного внешнего вида Меню.',
                event: () => {
                    switch ($PARAMETERS.menu.menustyle) {
                        case 'mode-1':
                            Menu().setMode.mode_1();
                            break;
                        case 'mode-2':
                            Menu().setMode.mode_2();
                            break;
                        default:
                            Menu().setMode.mode_0();
                            break;
                    }
                }
            },
            {
                type: 'boolean',
                param: 'menuver',
                name: 'Автоповорот',
                description: 'Автоматически вращать меню в горизонтальном режиме.'
            },
            {
                type: 'boolean',
                param: 'menureverse',
                name: 'Горизонт. отражение',
                description: 'Возможность инвертировать меню горизонтально для изменения его расположения.'
            }
        ]
    },
    {
        name: 'Аниме',
        parameters: [
            {
                type: 'sel-mehre',
                param: 'typefrc',
                variation: [
                    { key: "TV Сериал", val: "TV Сериал" },
                    { key: "TV Спецвыпуск", val: "TV Спецвыпуск" },
                    { key: "Спецвыпуск", val: "Спецвыпуск" },
                    { key: "Фильм", val: "Фильм" },
                    { key: "ONA", val: "ONA" },
                    { key: "OVA", val: "OVA" }
                ],
                name: 'Франшизы',
                description: 'Правило для отобора отображение франшизов аниме.'
            },
            {
                type: 'boolean',
                param: 'hidehero',
                name: 'Скрыть героев',
                description: 'Позволяет пользователю убирать изображения персонажей для более нейтрального просмотра сайта.'
            },
            {
                type: 'boolean',
                param: 'customstyle',
                name: 'Кастомизация',
                description: 'Включить кастомные стили для некоторых аниме.'
            },
            // {
            //     type: 'boolean',
            //     param: '',
            //     name: 'Защита 18+',
            //     description: 'Ограниченный доступ к контенту для пользователей старше 18 лет, обеспечивая соответствие возрастным ограничениям.'
            // },
            {
                type: 'boolean',
                param: 'syncdata',
                name: 'Синхронизация',
                description: 'Синхронизация по озвучке и текущему эпизоде по разным приложениям в Tunime'
            }
        ]
    },
    {
        name: 'Страница просмотра',
        parameters: [
            {
                type: 'sel-one',
                param: 'episrevers',
                default: 'left',
                variation: [
                    { key: 'left', val: 'Сбоку' },
                    { key: 'top', val: 'Сверху' }
                ],
                name: 'Эпизоды',
                description: 'Визуальное отображение для эпизодов.'
            },
            {
                type: 'boolean',
                param: 'dubanime',
                name: 'Озвучки по франшизе',
                description: 'Отдельный список избранных озвучек по франшизе аниме.'
            },
            {
                type: 'boolean',
                param: 'previewbs',
                name: 'Информация воспроизведения',
                description: 'Отображает текущее аниме на экране блокировке.'
            }
        ]
    },
    {
        name: 'Плеер',
        parameters: [
            {
                type: 'boolean',
                param: 'standart',
                name: 'Tunime Player',
                description: 'Основным плеером будет Tunime.'
            },
            {
                type: 'boolean',
                param: 'full',
                name: 'Auto Fullscreen',
                description: 'Автоматически включает видео на весь экран в плеере Tunime.'
            },
            {
                type: 'sel-one',
                param: 'quality',
                default: '720',
                variation: [
                    { key: '720', val: '720p' },
                    { key: '480', val: '480p' },
                    { key: '360', val: '360p' },
                ],
                name: 'Качество',
                description: 'Качествр воспроизведение видео в плеере Tunime.'
            },
            {
                type: 'boolean',
                param: 'autonekst',
                name: 'Автопереключение',
                description: 'При просмотре аниме в плеере Tunime будет происходить автопереключение эпизодов при их окончание просмотра.'
            },
            {
                type: 'boolean',
                param: 'saveinfo',
                name: 'Записывать озвучку',
                description: 'Записывать озвучку аниме которую оценил в заметки.'
            },
            {
                type: 'boolean',
                param: 'standart_controls',
                name: 'Стандартный контроллер',
                description: 'Стандартное управление Tunime плеера от браузера.'
            },
            {
                type: 'boolean',
                param: 'autoquality',
                name: 'Авто качество',
                description: 'Подгоняет качество под интернет, всегда будет пытаться воспроизводить на выбранном качестве. Рекомендуеться включить.'
            },
            {
                type: 'boolean',
                param: 'alternative_full',
                name: 'Альтернативный fulsscreen',
                description: 'Делает плеер на весь экран не переходя в fullscreen mode и оставляя контроллер Tunime. Больше подходит для IOS девайсов'
            }
        ]
    },
    {
        name: 'Загрузка',
        parameters: [
            {
                type: 'sel-one',
                param: 'dquality',
                default: '720',
                variation: [
                    { key: '720', val: '720p' },
                    { key: '480', val: '480p' },
                    { key: '360', val: '360p' },
                ],
                name: 'Качество',
                description: 'Качествр воспроизведение видео в плеере Tunime.'
            },
            {
                type: 'boolean',
                param: 'dasync',
                name: 'Асинхроная загрузка',
                description: 'Позволяет приложению подгружать контент независимо от основного процесса, улучшая скорость загрузки.'
            },
            {
                type: 'boolean',
                param: 'dautosave',
                name: 'Автосохранение',
                description: 'После загрузки автоматически сохраняет файл.'
            },
            {
                type: 'boolean',
                param: 'dautoset',
                name: 'Автоотметки',
                description: 'Отмечать загруженые аниме через 12 часов + продолжительность аниме.'
            }
        ]
    }
];

//Отображаем параметры
_ShowParametrs();

Main((e) => {
    InitMenu();
    if (e) {
        GetWhoami();
        let whoami = User.Storage.Get(User.Storage.keys.whoami);
        if (whoami) {
            $('.profile-info > img').attr('src', whoami.image['x160']);
            $('.profile-name').text(whoami.nickname);
            $('.profile-link').attr('href', whoami.url + '/edit/account');
            $('.profile-link').attr('target', '_blank');
        }
    }

    function GetWhoami() {
        Users.whoami(async (response) => {
            if (response.failed && response.status == 429) {
                await sleep(1000);
                return GetWhoami(id);
            }
            User.Storage.Set(response, User.Storage.keys.whoami);
            if ($('.profile-info > img').attr('src') != response.image['x160']) {
                $('.profile-info > img').attr('src', response.image['x160']);
            }
            $('.profile-name').text(response.nickname);
            $('.profile-link').attr('href', response.url + '/edit/account');
            $('.profile-link').attr('target', '_blank');
        }).GET();
    }

    //Присваевам функцию к кнопке выхода
    $('.btn-logout').click(function () {
        User.Storage.Clear();
        setParameter('autologin', false);
        window.location.replace("/login.html");
    });

    $('.search-filter').on('change keyup paste', function () {
        if (this.value.length <= 0) {
            $('label').removeClass('founded');
            return;
        }

        const labels = $('label');
        let erste = undefined;

        for (let i = 0; i < labels.length; i++) {
            const el = $(labels[i]).find('.title');
            const title = el.text().trim().toUpperCase();
            if (title.indexOf(this.value.toUpperCase()) != -1) {
                $(labels[i]).addClass('founded');
                if (!erste)
                    erste = labels[i];
            } else {
                $(labels[i]).removeClass('founded');
            }
        }

        if (erste) {
            erste.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
            });
        }
    });
});

function _ShowParametrs() {
    for (let i = 0; i < Parameters.length; i++) {
        const element = Parameters[i];
        $('main').append(`<div class="parametr-wrapper"><div class="parameters-title">${element.name}</div><div class="parameters-container">${__loadParametrs(element.parameters)}</div></div>`);
    }

    printObject($PARAMETERS);
    eventBoolean();
    eventSelectOne();
    eventSelectMore();
    eventAppStorage();

    function __loadParametrs(parametrs) {
        let html = "";
        for (let i = 0; i < parametrs.length; i++) {
            const element = parametrs[i];

            switch (element.type) {
                case "boolean":
                    html += `<label class="${i == 0 ? 'border-top' : ''} ${i + 1 == parametrs.length ? 'border-bottom' : ''}">
                                <div class="title">${element.name}</div>
                                <div class="checkbox">
                                    <input type="checkbox" data-param="${element.param}">
                                    <div class="switch-slider"></div>
                                </div>
                            </label>`;
                    break;
                case "sel-one":
                    const def = element.variation[0];
                    html += `<label class="${i == 0 ? 'border-top' : ''} ${i + 1 == parametrs.length ? 'border-bottom' : ''}" data-param="${element.param}" data-type="select-one" data-val="${def.key}" data-variation='${JSON.stringify(element.variation)}' ${element.event ? `data-event="${element.event}"` : ''} data-default="${element.default}" data-tooltip="${element.description}">
                                <div class="title">${element.name}</div>
                                <div class="select">${def.val}</div>
                            </label>`;
                    break;
                case "sel-mehre":
                    html += `<label class="${i == 0 ? 'border-top' : ''} ${i + 1 == parametrs.length ? 'border-bottom' : ''}" data-param="${element.param}" data-type="select-more" data-val="left" data-variation='${JSON.stringify(element.variation)}' data-tooltip="${element.description}">
                                <div class="title">${element.name}</div>
                                <div class="select">${element.variation.length}</div>
                            </label>`
                    break;
                case "app-size":
                    html += `<label class="${i == 0 ? 'border-top' : ''} ${i + 1 == parametrs.length ? 'border-bottom' : ''}" data-type="app-size" data-tooltip="${element.description}">
                                    <div class="title">${element.name}</div>
                                    <div class="select">0 KB</div>
                                </label>`;
                    (async () => {
                        let s = await Storage.size(), d = 'KB';
                        if (s > 1000) {
                            d = 'MB';
                            s = (s / 1000).toFixed(2);
                        }
                        $(`label[data-type="app-size"] > .select`).text(`${s} ${d}`);
                    })();
                    break;
                default:
                    break;
            }
        }
        return html;
    }
}

function eventBoolean() {
    $('input[type="checkbox"]').change(function () {
        let param = $(this).data('param');
        if (param) {
            setParameter(param, this.checked);
        }
    });
}

function eventSelectOne() {
    $('label[data-type="select-one"]').click(function () {
        const el = $(this);
        const title = el.find('.title').text().trim();
        const param = el.attr('data-param').trim();
        if (param) {
            const lval = getParametrByKey($PARAMETERS, param);
            const def = el.attr('data-default').trim();
            const parametrs = JSON.parse(el.attr('data-variation'));
            let event = el.data('event');
            if (event) {
                event = eval(event);
            }
            ShowSelect(title, param, def, parametrs, lval, event);
        }
    });
}

function eventSelectMore() {
    $('label[data-type="select-more"]').click(function () {
        const el = $(this);
        const title = el.find('.title').text().trim();
        const param = el.attr('data-param').trim();
        const description = el.attr('data-tooltip');
        if (param) {
            const lval = getParametrByKey($PARAMETERS, param);
            const parameters = JSON.parse(el.attr('data-variation'));
            ShowMoreSelect(title, param, parameters, lval, description);
        }
    });
}

function eventAppStorage() {
    $('label[data-type="app-size"]').click(function () {
        ShowStorage();
    });
}

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
                    if (input.data('type') == 'select-one') {
                        let data = input.data('variation');
                        for (let index = 0; index < data.length; index++) {
                            const element = data[index];
                            if (element.key === obj[key]) {
                                input.find('.select').text(element.val);
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
    let response = undefined;
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
            response = getParametrByKey(obj[key], lkey);
            if (response) {
                return response;
            }
        }
    }
    return response;
}