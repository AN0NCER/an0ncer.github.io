import { Main } from "../core/main.core.js";
import { createTimeline } from "../library/anime.esm.min.js";
import { Page } from "./login/mod.page.js";
import { Hub } from "../core/hub.core.js";

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

const dom = {
    login: document.querySelector('.btn-login'),
    slogan: document.querySelector('.slogan'),
    $text_wrapper: $('.text-wrapper'),
    $app_auth: $('.app-auth')
}

Main(async (e) => {
    //Если пользователь авторизирован редирект на страничку с пользователем
    if (e) return window.location.href = "/user.html";

    Animate();
    Events();
}, {
    beforeInit: Hub.onInit(() => {
        dom.login.classList.remove('-off');
    })
});


(() => {
    if (Page.uCode) {
        dom.$app_auth.removeClass('-hide');
        Page.login(Page.uCode, () => {
            dom.$app_auth.addClass('-hide');
        }, (msg) => {
            dom.$text_wrapper.addClass('-err').append(`<span class="error">${String(msg)}</span>`);
        });
    }

    if (Page.uAnim) {
        HideAnimate();
    }
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

function HideAnimate() {
    $('.loading').css('display', 'none');
}

function Events() {
    dom.slogan.textContent = RandomSlogan();

    dom.login.addEventListener('click', async () => {
        if (Page.isBlocked) return;
        Page.isBlocked = true;

        if (Page.isDev) {
            localStorage.removeItem('application_event');
            let code = prompt("Ключ авторизации:");
            if (code) {
                window.location.href = `/login.html?code=${code}&anim`;
            }
        }

        $('.app-auth').removeClass('-hide');

        Page.genLink((url) => {
            if (Page.isDev)
                window.open(url, '_blank').focus();
            else
                window.location.href = url;

            $('.app-auth').addClass('-hide');
        }, (msg) => {
            dom.$text_wrapper.addClass('-err').append(`<span class="error">${String(msg)}</span>`);
            $('.app-auth').addClass('-hide');
        });
    });

    $('.btn-back, .btn-skip').on('click', async () => {
        if (Page.isBlocked) return;
        window.location.href = "/index.html";
    });

    $('.btn-settings').on('click', async () => {
        if (Page.isBlocked) return;
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