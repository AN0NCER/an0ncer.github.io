import { Main, OAuth } from "../core/main.core.js";
import { ClearParams } from "../modules/functions.js";
import { createTimeline } from "../library/anime.esm.min.js";

//Слоганы страницы авторизации
const slogans = [
    "Открой для себя новые миры с Tunime - лучшим сайтом для просмотра аниме!",
    "Tunime - твой путеводитель в мир аниме!",
    "Погрузись в увлекательный мир аниме вместе с Tunime!",
    "Tunime - здесь твои любимые аниме всегда под рукой!",
    "Оставь реальность позади и окунись в мир Tunime!",
    "Смотри аниме легко и удобно с Tunime - твоим надежным партнером в аниме-мире!",
    "Tunime - твоя входная дверь в аниме-мир!",
    "С Tunime ты всегда на шаг впереди в мире аниме!",
    "В Tunime ты найдешь аниме для любого настроения и вкуса!",
    "Наслаждайся аниме без ограничений с Tunime!",
    "Tunime ведёт вперёд — где фантазия живёт и ждёт."
];

const code = new URLSearchParams(window.location.search).get('code');

ClearParams(['code']);

(async () => {
    //Проверяем если это сработал автологин то делаем редирект на главную страницу т.к. может только от нее сработать AutoLogin
    if (code && OAuth.mode !== 'test') {
        $('.app-auth').removeClass('-hide');
        const { login } = await import("../utils/auth.login.js");
        await login(code);
        $('.app-auth').addClass('-hide');
    }

    Main(async (e) => {
        //Если пользователь авторизирован редирект на страничку с пользователем
        if (e) return window.location.href = "/user.html";

        Events();
        Animate();
    });
})();

function Animate() {
    createTimeline({
        defaults: {
            loop: false,
        }
    }).add('.animation .letter', {
        x: 0,
        opacity: 1,
        scale: 1,
        duration: 800,
        ease: 'inOutQuart',
        delay: (el, i) => 500 + 30 * i,
        onComplete: () => { $('.loading').css({ 'pointer-events': 'none' }) }
    }).add('.loading', {
        opacity: 0,
        duration: 1000,
        delay: 800,
        ease: 'inOutQuart',
        onComplete: () => { $('.loading').remove() }
    });
}

function Events() {
    //Блокировка действий после нажатия на авторизацию
    let isBlocked = false;

    $('.slogan').text(RandomSlogan());

    $('.btn-login').on('click', async () => {
        if (isBlocked) return;

        $('.app-auth').removeClass('-hide');
        if (OAuth.mode === 'test') {
            try {
                isBlocked = true;
                //Если тестовый режим то запрашиваем код от пользователя
                let code = prompt("Тестовый режим авторизации:");
                if (code) {
                    const { login } = await import("../utils/auth.login.js");
                    //Проверяем авторизацию и переходим на станицу пользователя
                    await login(code);
                } else {
                    window.open(OAuth.events.genLink(), '_blank').focus();
                }
            } finally {
                isBlocked = false;
            }
            localStorage.removeItem('application_event');
        } else {
            window.location.href = OAuth.events.genLink();
        }
        $('.app-auth').addClass('-hide');
    });

    $('.btn-back, .btn-skip').on('click', async () => {
        if (isBlocked) return;
        window.location.href = "/index.html";
    });

    $('.btn-settings').on('click', async () => {
        if (isBlocked) return;
        window.location.href = "/settings.html";
    });
}

/**
 * Получить случайный слоган из списка
 * @returns {String} - возвращает случайный слоган для Tunime
 */
function RandomSlogan() {
    return slogans[Math.floor(Math.random() * slogans.length)];
}