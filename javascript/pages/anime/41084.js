import { History } from "../watch/mod_history.js";
import { IScreenshots } from "../watch/mod.resource.js";
import { LTransition } from "../watch/mod_transition.js";

let animatedBG = false;
let imageAnimation;

const url = "https://image.tmdb.org/t/p/original/3mcuhxMVQdDJifXwnQklR3Db68Y.jpg";
const bg = "https://image.tmdb.org/t/p/original/9u7l9e66evlo9XM9LYkYkJNUUT5.jpg";

LTransition.Loading.Parameters([
    { name: "image-size", value: `cover` },
    { name: "image-postion", value: `center top` },
    { name: "animation-display", value: `block` },
    { name: "animation-background", value: `linear-gradient(180deg, rgba(1, 1, 1, 0.85) 50 %, transparent)` }
]);

if (screen.width <= 400 && screen.orientation.angle == 0) {
    LTransition.Loading.Parameters("image-size", "auto 230%");
}

screen.orientation.addEventListener("change", (event) => {
    if (event.target.angle !== 0) {
        LTransition.Loading.Parameters("image-size", "cover");
    } else if (screen.width <= 400) {
        LTransition.Loading.Parameters("image-size", "auto 230%");
    }
});

LTransition.Image.Load(`https://i.imgur.com/XiBOM9W.jpg`, (url) => {
    LTransition.Loading.Parameters([
        { name: "image", value: `url(${url})` },
        { name: "progress-color", value: `#19140e` },
        { name: "background", value: `rgba(0, 0, 0, 0)` }
    ]);

    imageAnimation = anime({
        targets: '.page-loading > .background > .image',
        backgroundPosition: ['50% 0%', '50% 100%'], // Начальная и конечная позиции
        easing: 'linear', // Линейная анимация для плавного движения
        duration: 35000, // Длительность анимации в миллисекундах
        // loop: true // Зацикливание анимации
        complete: () => {
            animatedBG = true;
        }
    });
});

const animation = (resolve) => {
    try {
        imageAnimation.pause();
        if (!animatedBG) {
            const target = {
                translateY: 0 // Начальное значение translateY
            };

            const tl = anime.timeline({
                easing: 'easeInOutCubic',
                duration: 1000,
                complete: () => {
                    return resolve(true);
                },
            });

            tl.add({
                targets: '.page-loading > .background > .image',
                backgroundPosition: [$('.page-loading > .background > .image').css('backgroundPosition'), '50% 100%'],
                duration: 800,
            });

            tl.add({
                targets: '.page-loading > .background',
                top: ['0%', '-100%'],
                duration: 500,
            }, 400);

            tl.add({
                targets: target,
                translateY: -100,
                update: function (anim) {
                    const currentTranslateY = target.translateY + 'dvh';
                    $('.page-loading > .load-content > .loader').css({ transform: `translateY(${currentTranslateY})` });
                    $('.page-loading > .load-content > .wrapper').css({ transform: `translateY(${currentTranslateY})` });
                },
                duration: 850,
            }, 0);

            tl.add({
                targets: '.page-loading > .load-content > .wrapper',
                opacity: 0,
                duration: 850,
            }, 0);

            tl.add({
                targets: '.page-loading > .animation',
                translateY: ['50%', '-100%'],
                duration: 500,
                begin: () => {
                    LTransition.Loading.Parameters("point-events", `none`);
                    $("body").removeClass("loading");
                }
            }, 500);
        } else {
            anime({
                targets: '.page-loading',
                opacity: 0,
                easing: 'linear',
                duration: 500,
                complete: () => {
                    return resolve(true);
                }
            });
        }
    } catch {
        return resolve(true);
    }
}

const callback = (screenshots) => {
    try {
        screenshots.add({ type: 'afterbegin', url, id: screenshots.list.length, shikiurl: false });
        screenshots.list.push({ originalUrl: url });
        const have = History().custom.have
        if (!have) {
            History().custom.init(screenshots.list.length - 1);
        } else {
            History().custom.click(screenshots.list.length - 1);
        }
    } catch {
        console.log('Error complete script');
    }

};

export default {
    on: {
        load: () => {
            const screenshots = new IScreenshots();
            screenshots.on("init", callback);
            if (screenshots.init) {
                callback(screenshots);
            }

            $('img.main').attr('src', bg);
            $('img.bg').attr('src', bg);
        }
    },
    animation
}