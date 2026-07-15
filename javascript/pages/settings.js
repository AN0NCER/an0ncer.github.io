import { Hub } from "../core/hub.core.js";
import { Main, OAuth, sUrl } from "../core/main.core.js";
import { TMenu } from "../core/menu.core.js";
import { Tunime } from "../modules/api.tunime.js";
import { ClearParams } from "../modules/functions.js";
import { TNotifi } from "../modules/tun.notification.js";
import { Engine } from "./settings/mod.engine.js";
import { ClearDB, Logout } from "./settings/mod.func.js";
import { THeader } from "./settings/mod.header.js";
import { Search } from "./settings/mod.search.js";
import { WindowSelector } from "./settings/mod.selector.js";
import { ShowStorage, SizeValue } from "./settings/mod.storage.js";

import sUpdate from "./settings/setup.update.js";

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
                value: () => {
                    return '→'
                },
                click: async () => {
                    const SetupNotificationWindow = (await import("../windows/settings/win.notification.setup.js")).default;
                    SetupNotificationWindow();
                },
                type: 'button.event',
                title: 'Уведомления',
                classes: ['-new-icon'],
                icon: 'bell',
                description: 'Настройки уведомления на сайте.'
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
                enable: () => {
                    return Hub.snapshot.state.permissions.includes('acc')
                },
                value: async () => {
                    const response = await Tunime.api.device.name().GET();
                    if (response.status === 200) {
                        return response.value.data;
                    }
                    return 'undefined';
                },
                type: 'button.event',
                title: 'Устройство',
                icon: 'mobile-button',
                description: 'Индентификатор устройства Tunime.'
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
                        key: 'default',
                        val: 'Стандарт',
                        img: 'set.menu.default.png'
                    },
                    // {
                    //     key: 'mode-2',
                    //     val: 'Стиль 1',
                    //     img: 'set.menu.1.png'
                    // },
                    // {
                    //     key: 'mode-1',
                    //     val: 'Стиль 2',
                    //     img: 'set.menu.2.png'
                    // }
                    // {
                    //     key: 'mode-3',
                    //     val: 'IOS 26',
                    //     img: 'set.menu.3.png'
                    // }
                ],
            },
            // {
            //     param: 'menuopacity',
            //     type: 'checkbox.tip',
            //     title: 'Прозрачность',
            //     description: 'Добавляет прозрачность и размытие в меню.',
            //     click: () => SwitchMenu()
            // },
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
                    { key: "left", val: "Слева (Стандарт)" },
                    { key: "right", val: "Справа" },
                    { key: "top", val: "Сверху" }
                ]
            },
            {
                param: 'epismenu',
                type: 'checkbox.tip',
                title: 'Меню эпизодов',
                description: 'Добавляет кнопку меню для удобного управления списком эпизодов, если их больше 40.'
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
        name: 'Совместный просмотр',
        params: [
            {
                param: 'roomsenable',
                type: 'checkbox.tip',
                title: 'Совместный просмотр',
                description: `Добавляет на сайте функции совместного просмотра: создание комнат и подключение к ним.`
            },
            {
                param: 'roomssave',
                type: 'checkbox.tip',
                title: 'Сохранять просмотр',
                description: `Сохраняет эпизод и озвучку, с которыми аниме смотрели в комнате. Если отключено - после закрытия комнаты состояние просмотра вернётся к тому, что было до входа в комнату.`,
                dependsOn: { param: 'roomsenable', value: true }
            },
            {
                param: 'roomsautopause',
                type: 'checkbox.tip',
                title: 'Совместные паузы',
                description: `Любой гость может поставить видео на паузу для всех. Возобновить воспроизведение может только владелец комнаты.`,
                dependsOn: { param: 'roomsenable', value: true }
            },
            {
                param: 'roomsindexpage',
                type: 'checkbox.tip',
                title: 'Приглашения в комнаты (бэта)',
                description: `Показывает на главной странице комнаты, в которые вы приглашены.`,
                dependsOn: { param: 'roomsenable', value: true }
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
                param: 'player_color',
                type: 'img.select',
                title: 'Цвет акцента',
                description: 'Выберите цвет акцента для элементов плеера.',
                variation: [
                    { key: 'default', val: 'Стандартный', img: 'set.default.plr.png' },
                    { key: 'blue', val: 'Синий', img: 'set.blue.plr.png' },
                ]
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
                param: 'autoquality',
                type: 'checkbox.tip',
                title: 'Авто-Качество',
                description: `Выбирает качество на основе скорости интернета. Рекомендуется включить.`,
            },
            {
                param: 'full',
                type: 'checkbox.tip',
                title: 'Авто-Полноэкранный режим',
                description: `Автоматически включает полноэкранный режим при начале воспроизведения.`,
            },
            {
                param: 'skipmoments',
                type: 'checkbox.tip',
                title: 'Кнопка пропустить',
                description: `Добавляет кнопку "Пропустить" для перемотки Опенингов и Ендингов в некоторых аниме.`
            },
            {
                param: 'skipmomentsseek',
                type: 'checkbox.tip',
                title: 'Пропускать перемоткой',
                description: `Добавляет возможность пропустить Опенинг и Ендинг через перемотку`,
                dependsOn: { param: 'skipmoments', value: true }
            },
            {
                param: 'autonekst',
                type: 'checkbox.tip',
                title: 'Авто-Переключение',
                description: `После окончания эпизода автоматически включается следующий.`,
            },
            {
                param: 'previewseek',
                type: 'checkbox.tip',
                title: 'Превью при перемотке',
                description: `Будет отображаться кадр момента куда перемотать в плеере если доступно в аниме.`,
            },
            {
                param: 'standart_controls',
                type: 'checkbox.tip',
                title: 'Стандартный контроллер',
                description: `Использовать встроенные элементы управления браузера в плеере Tunime.`,
            },
            {
                param: 'videoupscale',
                type: 'checkbox.tip',
                title: 'Upscale [beta]',
                description: 'Апскейлинг видео в реальном времени через WebGPU с помощью нейросетей Anime4K. Улучшает чёткость линий, убирает артефакты сжатия и размытие. Требует браузер с поддержкой WebGPU (Chrome / Edge). При слабом GPU возможны просадки FPS — в этом случае выберите более лёгкую модель.'
            },
            {
                param: 'typeupscale',
                type: 'btn.tip',
                click: WindowSelector,
                mode: 'single',
                title: 'Upscale mode [beta]',
                description: 'Модель обработки изображения. Пресеты (Mode A/B/C) подбираются под тип исходника, одиночные модели CNN/GAN позволяют собрать свой пайплайн. Чем крупнее вариант (M → VL → UL), тем выше качество и больше нагрузка на GPU.\n\nПресеты — готовые пайплайны под конкретный тип исходника:\nMode A — для размытого или старого аниме с сильными артефактами сжатия. Агрессивное восстановление линий.\nMode B — для 720p и даунскейл-аниме с алиасингом и звоном. Мягкое восстановление без перешарпа.\nMode C — для чистой картинки без деградации: обои, Pixiv, 1080p→480p. Максимальный PSNR, минимум артефактов.\nMode A+A — удвоенный пайплайн Mode A. Наивысшее перцептивное качество для размытого аниме, но вдвое медленнее.\nMode B+B — удвоенный пайплайн Mode B. Высокое качество для 720p, вдвое медленнее.\nMode C+A — комбинация C и A: сначала чистый апскейл, затем восстановление. Баланс PSNR и резкости.\n\nОдиночные модели — для ручной настройки:\nCNN стабильнее и предсказуемее, GAN резче, но может добавлять галлюцинации. Чем крупнее вариант (M → VL → UL), тем выше качество и больше нагрузка на GPU.',
                variation: [
                    // ── Upscale ───────────────────────────────────────────────────
                    { key: "CNNx2UL", val: "CNN x2 Ultra Light" },
                    { key: "CNNx2M", val: "CNN x2 Medium" },
                    { key: "CNNx2VL", val: "CNN x2 Very Large" },
                    { key: "DenoiseCNNx2VL", val: "CNN x2 VL + Denoise" },
                    { key: "GANx3L", val: "GAN x3 Large" },
                    { key: "GANx4UUL", val: "GAN x4 Ultra Light" },

                    // ── Restore ───────────────────────────────────────────────────
                    { key: "CNNUL", val: "Restore CNN UL" },
                    { key: "CNNM", val: "Restore CNN M" },
                    { key: "CNNVL", val: "Restore CNN VL" },
                    { key: "CNNSoftM", val: "Restore Soft CNN M" },
                    { key: "CNNSoftVL", val: "Restore Soft CNN VL" },
                    { key: "GANUUL", val: "Restore GAN UUL" },

                    // ── Denoise / Deblur ──────────────────────────────────────────
                    { key: "BilateralMean", val: "Denoise Bilateral" },
                    { key: "DoG", val: "Deblur DoG" },

                    // ── Presets ───────────────────────────────────────────────────
                    { key: "ModeA", val: "Mode A" },
                    { key: "ModeB", val: "Mode B" },
                    { key: "ModeC", val: "Mode C" },
                    { key: "ModeAA", val: "Mode A+A" },
                    { key: "ModeBB", val: "Mode B+B" },
                    { key: "ModeCA", val: "Mode C+A" },
                ]
            }
            // {
            //     param: 'alternative_full',
            //     type: 'checkbox.tip',
            //     title: 'Альтернативный полноэкран',
            //     description: `Разворачивает плеер без перехода в системный fullscreen. Подходит для iOS.`,
            // }
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
    },
    {
        name: "Обновления",
        params: sUpdate
    }
];

ClearParams(['t']);

TMenu.init();
THeader.init({
    events: {
        onprofil: () => {
            let location = "login.html";
            if (OAuth.auth)
                location = "user.html";

            window.location.href = location;
        },
        onbutton: () => {
            let href = `${sUrl}/users/sign_in`;

            if (OAuth.auth && OAuth.user) {
                href = `${OAuth.user.url}/edit/account`
            } else {
                return window.location.href = "login.html";
            }

            window.open(href, '_blank').focus();
        },
        ...Search()
    }
})

Main(async (e) => {
    if (e) User();

    Settings(e);
    Engine.render(setup);

    if (t) {
        Go(t);
    }
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

    $('.profile > .ava-wrapper').css('--p-ava-img', `url('${user.image['x160']}')`);
    $('.profile > .profile-content > .username').text(user.nickname);
}

function SwitchMenu(value = { key: $PARAMETERS.menu.menustyle }) {
    TMenu.setStyle(value.key);
}