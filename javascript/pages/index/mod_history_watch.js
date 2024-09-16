import { SHIKIURL } from "../../modules/Settings.js";
import { User } from "../../modules/ShikiUSR.js";

//Слайдер для блока продолжение просмотра
new Swiper('.swiper-continue', {
    // Parametrs
    slidesPerView: 1,
    spaceBetween: 10,
    breakpoints: {
        740: {
            slidesPerView: 2
        }
    },
    pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true,
        dynamicBullets: true,
        bulletActiveClass: 'swiper-pagination-bullet-active',
        bulletClass: 'swiper-pagination-bullet',
        bulletSize: '10px',
        bulletStyle: 'circle',
        bulletElement: 'span',
        hideOnClick: false,
        watchOverflow: true,
    },
});

//Функция для загрузки истории просмотра пользователя
export function GetHistoryWatch() {
    let last_watch = User.Storage.Get('last-watch');

    //Для старых версий проверям тип обьекта
    if (Object.prototype.toString.call(last_watch) == '[object Object]') {
        last_watch = [last_watch];
    }

    if (last_watch) {
        const element = $('.swiper-continue > .swiper-wrapper');
        for (let i = 0; i < last_watch.length; i++) {
            const html = CreateElementHistory(last_watch[i]);
            element.append(html);
        }
    }
}

//функция создания елемента истории просмотра
function CreateElementHistory(data) {
    const time = Math.floor(data.duration / 60) + ':' + (data.duration % 60).toString().padEnd(2, '0');
    const ost = Math.floor((data.fullduration - data.duration) / 60) + ':' + Math.floor(((data.fullduration - data.duration) % 60)).toString().padEnd(2, '0');
    const link = `watch.html?id=${data.id}&player=true&continue=${data.continue}`;
    let image = data.image.includes("https://nyaa.shikimori.me/") ? data.image.replace('https://nyaa.shikimori.me/', '') : data.image.replace('https://nyaa.shikimori.one/', '') ? data.image.replace('https://nyaa.shikimori.one/', '') : data.image;
    if(!image.includes('https://'))
        image = `${SHIKIURL.suburl('nyaa')}/${image}`;
    const name = data.name ? data.name : "Аниме";
    const episode = data.episode ? data.episode : "?";
    const type = data.type ? data.type : "Аниме";
    const dub = data.dub ? data.dub : "???";
    return `<div class="swiper-slide">
    <a href="${link}">
        <div class="wrapp-content">
            <div class="continue-content">
                <div class="wrap-content">
                    <div class="continue-info">
                        <span>${dub}</span>
                        <span class="ellipse"></span>
                        <span>${type}</span>
                    </div>
                    <span class="title">${name}</span>
                    <div class="continue-episode">
                        <span class="icon"><svg width="9" height="10" viewBox="0 0 9 10" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_628_986)">
                                    <path
                                        d="M3.91465 1.06425C4.00254 1.36132 3.83379 1.67597 3.53672 1.76386C2.14102 2.18046 1.125 3.47245 1.125 4.99999C1.125 6.86327 2.63672 8.37499 4.5 8.37499C6.36328 8.37499 7.875 6.86327 7.875 4.99999C7.875 3.47245 6.85898 2.18046 5.46504 1.76386C5.16797 1.67597 4.99746 1.36132 5.08711 1.06425C5.17676 0.767176 5.48965 0.596669 5.78672 0.686317C7.64473 1.24003 9 2.96093 9 4.99999C9 7.48554 6.98555 9.49999 4.5 9.49999C2.01445 9.49999 0 7.48554 0 4.99999C0 2.96093 1.35527 1.24003 3.21504 0.686317C3.51211 0.598426 3.82676 0.767176 3.91465 1.06425Z"
                                        fill="#2393F1" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_628_986">
                                        <rect width="9" height="9" fill="white"
                                            transform="translate(0 0.5)" />
                                    </clipPath>
                                </defs>
                            </svg>
                        </span>
                        <span>Эпизод: <b>${episode}</b></span>
                    </div>
                </div>
                <div class="wrap-continue">
                    <div class="button-continue">
                        <svg width="44" height="43" viewBox="0 0 44 43" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M19.4714 13.752C18.9703 13.4271 18.3406 13.4164 17.8294 13.7199C17.3182 14.0234 17 14.5947 17 15.216V27.7852C17 28.4066 17.3182 28.9779 17.8294 29.2814C18.3406 29.5849 18.9703 29.5706 19.4714 29.2493L29.2214 22.9647C29.7055 22.654 30 22.1005 30 21.5006C30 20.9008 29.7055 20.3508 29.2214 20.0366L19.4714 13.752Z"
                                fill="white" />
                        </svg>

                    </div>
                    <span>ОСТ <span>${ost}</span></span>
                </div>
            </div>
            <div class="continue-frame" style="background-image: url(${image});">
                <div class="continue-time">
                    <span>${time}</span>
                </div>
            </div>

        </div>
    </a>

</div>`;
}