import { Main, OAuth, sUrl } from "../core/main.core.js";
import { InitMenu, Menu } from "../menu.js";
import { ClearParams } from "../modules/functions.js";
import { Engine } from "./settings/mod.engine.js";
import { ClearDB, Logout } from "./settings/mod.func.js";
import { Search } from "./settings/mod.search.js";
import { WindowSelector } from "./settings/mod.selector.js";
import { ShowStorage, SizeValue } from "./settings/mod.storage.js";

const t = new URLSearchParams(window.location.search).get('t');

const setup = [
    {
        name: 'Основные',
        params: [
            {
                param: 'censored',
                type: 'checkbox.tip',
                title: 'Цензура',
                description: 'Включает или выключает фильтрацию нежелательного контента.'
            },
            {
                param: 'autologin',
                type: 'checkbox.tip',
                title: 'Авто-Вход',
                description: 'После истечения срока действия ключа приложение автоматически перейдёт к авторизации через Shikimori.'
            },
            {
                enable: () => true,
                value: SizeValue,
                click: ShowStorage,
                type: 'button.event',
                title: 'Хранилище',
                icon: 'database',
                description: 'Управление данными приложения: экспорт, импорт и сброс.'
            },
            {
                enable: () => { return OAuth.auth },
                value: () => { return OAuth.user?.nickname || "User" },
                click: Logout,
                type: 'button.event',
                title: 'Выйти',
                icon: 'right-from-bracket',
                description: 'Завершить сеанс и выйти из аккаунта Shikimori.',
                styles: [
                    { key: '--color', val: '#F13B23' }
                ]
            }
        ]
    },
    {
        name: 'Меню',
        params: [
            {
                click: SwitchMenu,
                param: 'menustyle',
                type: 'img.select',
                title: 'Стиль',
                description: 'Визуальное оформление для персонализированного внешнего вида Меню.',
                variation: [
                    {
                        key: 'mode-0',
                        val: 'Стандарт',
                        img: 'set.menu.0.png'
                    },
                    {
                        key: 'mode-2',
                        val: 'Стиль 1',
                        img: 'set.menu.1.png'
                    },
                    {
                        key: 'mode-1',
                        val: 'Стиль 2',
                        img: 'set.menu.2.png'
                    }
                ],
            },
            {
                param: 'menuver',
                type: 'checkbox.tip',
                title: 'Авто-Поворот',
                description: 'Автоматически переключать меню в горизонтальный режим при изменении ориентации экрана.'
            },
            {
                param: 'menureverse',
                type: 'checkbox.tip',
                title: 'Отразить',
                description: 'Инвертировать расположение элементов меню по горизонтали.',
                dependsOn: { param: 'menuver', value: true }
            }
        ]
    },
    {
        name: 'Аниме',
        params: [
            {
                click: WindowSelector,
                mode: 'multiple',
                param: 'typefrc',
                type: 'btn.tip',
                title: 'Франшизы',
                description: 'Правила отображения франшиз аниме.',
                variation: [
                    { key: "TV Сериал", val: "TV Сериал" },
                    { key: "TV Спецвыпуск", val: "TV Спецвыпуск" },
                    { key: "Спецвыпуск", val: "Спецвыпуск" },
                    { key: "Фильм", val: "Фильм" },
                    { key: "ONA", val: "ONA" },
                    { key: "OVA", val: "OVA" }
                ]
            },
            {
                param: 'hidehero',
                type: 'checkbox.tip',
                title: 'Скрыть героев',
                description: 'Скрывает изображения персонажей для более нейтрального восприятия сайта.'
            },
            {
                param: 'customstyle',
                type: 'checkbox.tip',
                title: 'Кастомизация',
                description: 'Включает пользовательские стили (моды) для некоторых аниме.'
            },
            {
                param: 'syncdata',
                type: 'checkbox.tip',
                title: 'Синхронизация',
                description: 'Синхронизация озвучки и текущего эпизода между разными приложениями Tunime.'
            }
        ]
    },
    {
        name: 'Аниме-Кэш',
        params: [
            {
                param: 'anicaching',
                type: 'checkbox.tip',
                title: 'Кэширование',
                description: `Сохраняет аниме на устройство для быстрой загрузки. Кэш имеет ограниченный срок хранения.`
            },
            {
                click: WindowSelector,
                mode: 'single',
                param: 'anicachlive',
                type: 'sel.one',
                icon: 'box-open',
                title: 'Хранение кэша',
                description: 'Определяет, как долго будет храниться кэш аниме на устройстве.',
                variation: [
                    { key: '1', val: '1 День' },
                    { key: '2', val: '2 Дня' },
                    { key: '3', val: '3 Дня' },
                ]
            },
            {
                click: () => {
                    ClearDB('tun-cache', 'Сбросить кэш', 'При сбросе кэша страниц просмотра также будет сброшен кэш страницы поиска.');
                },
                type: 'btn',
                icon: 'trash',
                title: 'Сбросить кэш',
                description: 'Удаляет кэш аниме для страниц просмотра и поиска.'
            }
        ]

    },
    {
        name: 'Просмотр',
        params: [
            {
                click: WindowSelector,
                mode: 'single',
                param: 'episrevers',
                type: 'btn.tip',
                title: 'Эпизоды',
                description: 'Выберите расположение списка эпизодов в горизонтальной ориентации.',
                variation: [
                    { key: "left", val: "Сбоку" },
                    { key: "top", val: "Сверху" },
                ]
            },
            {
                param: 'dubanime',
                type: 'checkbox.tip',
                title: 'Озвучки по франшизам',
                description: `Позволяет сохранять избранные озвучки отдельно для каждой франшизы аниме.`
            },
            {
                param: 'previewbs',
                type: 'checkbox.tip',
                title: 'Экран блокировки',
                description: `Информация о воспроизведении на экране блокировки.`
            },
            {
                param: 'saveinfo',
                type: 'checkbox.tip',
                title: 'Сохранять озвучку',
                description: `Сохраняет озвучку в заметки после оценивания аниме.`
            }
        ]
    },
    {
        name: 'Плеер',
        params: [
            {
                param: 'standart',
                type: 'checkbox.tip',
                title: 'Плеер Tunime',
                description: `Установить Tunime как основной плеер для видео.`
            },
            {
                param: 'full',
                type: 'checkbox.tip',
                title: 'Авто-Полноэкранный режим',
                description: `Автоматически включает полноэкранный режим при начале воспроизведения.`,
            },
            {
                param: 'quality',
                type: 'img.select',
                title: 'Качество видео',
                description: 'Выберите качество воспроизведения в плеере Tunime.',
                variation: [
                    {
                        key: '720',
                        val: '720p',
                        img: 'set.quality.720.png'
                    },
                    {
                        key: '480',
                        val: '480p',
                        img: 'set.quality.480.png'
                    },
                    {
                        key: '360',
                        val: '360p',
                        img: 'set.quality.360.png'
                    }
                ],
                classes: ['-mode-1'],
                styles: [
                    { key: '--inset', val: '10px' }
                ],
            },
            {
                param: 'autonekst',
                type: 'checkbox.tip',
                title: 'Авто-Переключение',
                description: `После окончания эпизода автоматически включается следующий.`,
            },
            {
                param: 'standart_controls',
                type: 'checkbox.tip',
                title: 'Стандартный контроллер',
                description: `Использовать встроенные элементы управления браузера в плеере Tunime.`,
            },
            {
                param: 'autoquality',
                type: 'checkbox.tip',
                title: 'Авто-Качество',
                description: `Выбирает качество на основе скорости интернета. Рекомендуется включить.`,
            },
            {
                param: 'alternative_full',
                type: 'checkbox.tip',
                title: 'Альтернативный полноэкран',
                description: `Разворачивает плеер без перехода в системный fullscreen. Подходит для iOS.`,
            }
        ]
    },
    {
        name: 'Загузчик',
        params: [
            {
                param: 'dquality',
                type: 'img.select',
                title: 'Качество видео',
                description: 'Выберите качество для загружаемого аниме.',
                variation: [
                    {
                        key: '720',
                        val: '720p',
                        img: 'set.quality.720.png'
                    },
                    {
                        key: '480',
                        val: '480p',
                        img: 'set.quality.480.png'
                    },
                    {
                        key: '360',
                        val: '360p',
                        img: 'set.quality.360.png'
                    }
                ],
                classes: ['-mode-1'],
                styles: [
                    { key: '--inset', val: '10px' }
                ]
            },
            {
                param: 'dautosave',
                type: 'checkbox.tip',
                title: 'Авто-Сохранение',
                description: `Автоматически сохраняет файл после загрузки.`
            },
            {
                click: () => {
                    ClearDB('downloader', 'Сбросить загрузчик', 'Удалит все загруженные файлы и сбросит все текущие загрузки.');
                },
                type: 'btn',
                icon: 'trash',
                title: 'Сбросить загрузчик',
                description: 'Удаляет все файлы и данные аниме.'
            }
        ]
    }
];

ClearParams(['t']);

Main(async (e) => {
    InitMenu();

    if (e) User();

    Settings(e);
    Engine(setup);
    Search();
    Go(t);
});

function Go(param) {
    if (!param) return;

    const $item = $(`[data-param="${param}"]`);

    if (!$item.length) return;

    const $param = $item.find('[param]');

    $param[0]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest"
    });

    $param.addClass('-search -current');

    setTimeout(() => {
        $param.removeClass('-search -current');
    }, 5000);
}

function Settings(e) {
    let href = `${sUrl}/users/sign_in`;

    if (e) {
        href = `${OAuth.user.url}/edit/account`
    }

    $('.settup').attr('href', href);
    $('.settup').attr('target', '_blank');
}

async function User() {
    let user = OAuth.user;
    if (!user) user = await OAuth.requests.getWhoami();

    $('.profile > img').attr('src', user.image['x160']);
    $('.profile > .content > .name').text(user.nickname);
    $('.profile > .content > span').text('Аккаунт');
    $('.profile-link').attr('href', 'user.html');
}

function SwitchMenu() {
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