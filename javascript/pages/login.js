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
    "Tunime - где аниме становится частью твоей жизни!"
];


//Начало программы
(() => {
    $('.slogan').text(RandomSlogan());
    Animate();
    Main(async (e) => {
        if (e) {
            //Если пользователь авторизирован редирект на страничку с пользователем
            window.location.href = "/user.html"
        } else {
            if (!usr.isteste) {
                const urlParams = new URLSearchParams(window.location.search);
                let code = urlParams.get("code");
                if (code) {
                    //Проверяем если это сработал автологин то делаем редирект на главную страницу т.к. может только от нее сработать AutoLogin
                    let application_event = localStorage.getItem('application_event');
                    await usr.Authorizate(code);
                    localStorage.removeItem('application_event');
                    if (application_event == "autologin") {
                        //После авторизации переходим на главную страницу
                        window.location.href = "/index.html";
                        return;
                    }
                    //После авторизации переходим на страницу пользователся
                    window.location.href = "/user.html"
                    //Если авторизация была неудачна, то нас выкинет обратно на страницу авторизации
                }
            }
        }
        VisualFunctional();
    });
})();

/**
 * Анимация загрузки приложения
 */
function Animate() {
    //Разбиваем текст на буквы для анимации
    var textWrapper = document.querySelector('.animation');
    textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
    //Аниммируем сначало появление текста а после прячим span.loading
    anime.timeline({ loop: false, complete: () => { $('.loading').css('display', 'none'); } })
        .add({
            targets: '.animation .letter',
            translateX: [40, 0],
            translateZ: 0,
            opacity: [0, 1],
            easing: "easeOutExpo",
            duration: 1500,
            delay: (el, i) => 500 + 30 * i,

        })
        .add({
            targets: '.loading',
            opacity: 0,
            easing: 'easeInOutQuad',
            duration: 1000
        });
}

/**
 * Получить случайный слоган из списка
 * @returns {String} - возвращает случайный слоган для Tunime
 */
function RandomSlogan() {
    return slogans[Math.floor(Math.random() * slogans.length)];
}

function VisualFunctional() {
    //Кнопка авторизации
    $('.btn-login').click(async () => {
        if (usr.isteste) {
            localStorage.removeItem('application_event');
            //Если тестовый режим то запрашиваем код от пользователя
            let code = prompt("Тестовый режим авторизации:");
            if (code) {
                //Проверяем авторизацию и переходим на станицу пользователя
                await usr.Authorizate(code);
                window.location.href = "/user.html"
            } else {
                window.open(usr.Oauth.GetUrl(), '_blank').focus();
            }
        } else {
            window.location.href = usr.Oauth.GetUrl();
        }
    });

    //Кнопка настроек
    $('.btn.mute').click(async () => {
        window.location.href = "/settings.html";
    });

    //Кнопка возврата на главную страницу
    $('.btn.back').click(async () => {
        window.location.href = "/index.html";
    });

    //Checkbox автоматической авторизации
    $('input[type="checkbox"]').change(function(){
        setParameter('autologin', this.checked);
    });

    //Устанавливаем checkbox по параметру
    $('input[type="checkbox"]').prop('checked', $PARAMETERS.autologin);
}