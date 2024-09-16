import { ShowInfo } from "../../modules/Popup.js";
import { UserRates } from "../../modules/ShikiAPI.js";
import { User } from "../../modules/ShikiUSR.js";
import { Sleep } from "../../modules/functions.js";
import { AnimeHidePreview, AnimeLoadingPlayer, AnimePausePlayer, AnimePlayPlayer, AnimeShowPreview } from "./mod_trailers_animation.js";

const TrailersUrl = 'https://raw.githubusercontent.com/AN0NCER/anime-data/main/data-v2.json';

const TrilersSwiper = new Swiper('.swiper-treilers', {
    // Parametrs
    spaceBetween: 10,
    pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
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
    }
});

let TrailersData = undefined;
//Список загруженных плееров если было воспроизведение
let _loadedTrailers = [];
let _selectedTrailers = [];

let TypePlayer = 'local';

export const GetLoadedTrailers = () => { return _loadedTrailers };

//Начало скрипта
(() => {
    Main(); // <- Происходит запрос трейлеров
    ChangeSlider(); // <- Событие перелистывание слайда\
})();

function ChangeSlider() {
    TrilersSwiper.on('slideChange', () => {
        for (let i = 0; i < _loadedTrailers.length; i++) {
            const e = _loadedTrailers[i];
            const player = GetPlayer(e);
            player.video.pause();
            AnimeShowPreview(e);
            AnimePlayPlayer(e);
        }

        //Удалить если это запасной плеер
        if ($('#ytplayer')) {
            AnimeShowPreview($('#ytplayer').attr("data-key"));
            AnimePlayPlayer($('#ytplayer').attr("data-key"));
            _loadedTrailers.splice(_loadedTrailers.findIndex(x => x == $('#ytplayer').attr("data-key")), 1);
            $('#ytplayer').remove();
        }
    });
}

function Main() {
    //Получаем трейлеры с сервера github
    fetch(TrailersUrl).then(async (response) => {
        if (response.status != 200) {
            //Добавляем слайд с ошибкой
            TrilersSwiper.appendSlide(GenErrorSlide());
            //Удаляем загрузачный слайд
            TrilersSwiper.removeSlide(0);
            return;
        }
        // return;
        TrailersData = await response.json();
        for (let i = 0; i < TrailersData.length; i++) {
            const element = TrailersData[i];
            TrilersSwiper.appendSlide(GenSlide(element, element.id));
        }
        //Удаляем загрузачный слайд
        TrilersSwiper.removeSlide(0);
        PlayPLayer();
        UserControl();
    })
}

export function SetUserRate(data) {
    for (let i = 0; i < data.length; i++) {
        const target = data[i];
        const btn = $(`.btn-list[data-id="${target.target_id}"]`);
        if (btn.length > 0) {
            btn.addClass('selected');
            _selectedTrailers.push({ target_id: target.target_id, id: target.id, user_id: target.user_id });
        }
    }
}

function UserControl() {
    $('.btn-list').on('click', (e) => {
        if (User.authorized) {
            const btn = $(e.currentTarget);
            const target = btn.attr('data-id');
            if (_selectedTrailers.findIndex(x => x.target_id == target) != -1) {
                //Нашел аниме и можем удалить его из списка для просмотра
                _lRemUserRate(target);
            } else {
                _lSetUserRate(target);
            }
        } else {
            ShowInfo("Вы должны авторизоваться!", "auth");
        }
    });

    function _lSetUserRate(id) {
        UserRates.list({}, async (res) => {
            if (res.failed) {
                if (res.status == 429) {
                    await Sleep(1000);
                    return _lSetUserRate(id);
                }
                ShowInfo(`Произошла ошибка! (${res.status})`, "auth");
                return;
            }
            $(`.btn-list[data-id="${id}"]`).addClass('selected');
            _selectedTrailers.push({ target_id: res.target_id, id: res.id, user_id: res.user_id });
        }).POST({ "user_rate": { "status": "planned", "target_id": id, "target_type": "Anime", "user_id": User.Storage.Get('access_whoami').id } });
    }

    function _lRemUserRate(id) {
        const indexRate = _selectedTrailers.findIndex(x => x.target_id == id);
        if (indexRate == -1) {
            return;
        }
        const rate_id = _selectedTrailers[indexRate].id;
        UserRates.show(rate_id, async (res) => {
            if (res.failed) {
                if (res.status == 429) {
                    await Sleep(1000);
                    return _lRemUserRate(id);
                }
                ShowInfo(`Произошла ошибка! (${res.status})`, "auth");
                return;
            }
            $(`.btn-list[data-id="${id}"]`).removeClass('selected');
            _selectedTrailers.splice(indexRate, 1);
        }).DELETE();
    }
}

function PlayPLayer() {
    //Нажатие на кнопку Play трейлера (Загрузка ресурсов)
    $('.wrapper-block-info > .btn-play').on('click', (e) => {
        //Ключ обьекта трейлера
        const key = $(e.currentTarget).attr('data-key');
        if (_loadedTrailers.findIndex(x => x == key) != -1) {
            return;
        }
        const player = GetPlayer(key);
        //Анимация загрузки плеера
        AnimeLoadingPlayer(key);
        //Присваеваем значения audio и video
        const i = TrailersData.findIndex(x => x.id === key);
        player.video.src = TrailersData[i].youtube.video;
        //Подписываемся на события
        PlayerFunctions(player, key);
        //Прогружаем audio & video
        player.video.load();
    });
    //Нажатие на кнопку Play трейлера
    $('.wrapper-block-info > .btn-play').on('click', (e) => {
        //Ключ обьекта трейлера
        const key = $(e.currentTarget).attr('data-key');
        if (_loadedTrailers.findIndex(x => x == key) == -1) {
            return;
        }

        const player = GetPlayer(key);
        if (!player.video.paused) {
            if (TypePlayer != 'local')
                return;
            //Анимация кнопки паузы
            AnimePlayPlayer(key);
            //Пауза видео
            player.video.pause();
        } else {
            if (TypePlayer != 'local')
                return;
            //Скрываем превью трейлера
            AnimeHidePreview(key);
            //Анимация кнопки воспроизведения
            AnimePausePlayer(key);
            //Воспроизводим видео
            player.video.play();
        }
    });
}

function PlayerFunctions(player, key) {
    let videoAlready = true;


    player.video.addEventListener('error', _error);

    function _error() {
        console.log(`Player (${key}) Not Loaded Resources`);
        LoadYTPlayer(key);
        player.video.removeEventListener('error', _error);

    }

    //Видео готова
    player.video.addEventListener('canplaythrough', () => {
        videoAlready = true;
        LoadedResources();
    });

    function LoadedResources() {
        _loadedTrailers.push(key);
        console.log(`Player (${key}) Resources Loaded`);

        let index_currentSlide = TrilersSwiper.realIndex;
        let currentSlide = TrilersSwiper.slides[index_currentSlide];
        //Слад был перелистан
        if ($(currentSlide).attr('data-key') != key) {
            return;
        }
        //Скрываем превью
        AnimeHidePreview(key);
        //Воспроизводим видео
        player.video.play();
        //Анимация кнопки на воспроизведение
        TypePlayer = 'local';
    }
}

function GetPlayer(key) {
    let video = null;

    video = $(`.player[data-key="${key}"] > video`)[0];

    return { video: video };
}

function LoadYTPlayer(key) {
    $(`.player[data-key="${key}"]`).append(`<div id="ytplayer" data-key="${key}"></div>`);
    const i = TrailersData.findIndex(x => x.id === key);

    //Добавляем плеер
    const YTPlayer = new YT.Player('ytplayer', {
        width: '100%',
        height: 'auto',
        videoId: YouTubeGetID(TrailersData[i].youtube.link),
        playerVars: {
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            autoplay: 1,
        },
        events: {
            'onReady': YTPlayerReady,
            'onStateChange': YTPlayerStateChange
        }
    });

    //Подключение стилей к сайту
    window.player = YTPlayer;

    //Статус youtube player
    let ytstatus = 0;
    //Изменения событий 
    function YTPlayerStateChange(e) {
        if (e.data == YT.PlayerState.ENDED) {
            AnimeShowPreview(key);
            $('#ytplayer').remove();
        } else if (e.data == YT.PlayerState.PLAYING) {
            AnimePausePlayer(key);
        } else if (e.data == YT.PlayerState.PAUSED) {
            AnimePlayPlayer(key);
        }
        ytstatus = e.data;
    }

    //Функция когда дополнительный плеер готов
    function YTPlayerReady(e) {
        //Скрываем превью трейлера
        AnimeHidePreview(key);
        e.target.playVideo();
        _loadedTrailers.push(key);
        TypePlayer = 'youtube';
        $('.wrapper-block-info > .btn-play').on('click', function (e) {
            if (ytstatus == YT.PlayerState.PLAYING) {
                YTPlayer.pauseVideo();
            } else {
                YTPlayer.playVideo();
            }
        });
    }
}

function YouTubeGetID(url){
    var ID = '';
    url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    if(url[2] !== undefined) {
      ID = url[2].split(/[^0-9a-z_\-]/i);
      ID = ID[0];
    }
    else {
      ID = url;
    }
      return ID;
  }

function GenSlide(res, key) {
    const type = res.anime.kind != "movie" ? "Сериал" : "Фильм";
    return `<div class="swiper-slide unselectable" data-key="${key}">
    <div class="preview-block">
        <a href="watch.html?id=${res.id}" data-key="${key}">
            <img src="${res.youtube.preview}" />
        </a>
        <div class="player" data-key="${key}">
            <video type="video/mp4" playsinline></video>
        </div>
    </div>
    <div class="controls">
        <div class="wrapper-block-info">
            <div class="btn-play" data-key="${key}">
                <svg class="play" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512">
                    <path
                        d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
                </svg>
                <svg class="load" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"/></svg>
                <svg class="pause" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512"><path d="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z"/></svg>
            </div>
            <div class="block-info">
                <div class="block-name">${res.anime.rus ? res.anime.rus : res.anime.eng}</div>
                <div class="wrapper-details">
                    <span class="kind">${type}</span>
                    <span class="ellipse"></span>
                    <span class="studio">${res.anime.studio}</span>
                </div>
            </div>
        </div>
        <div class="control-list">
            <div class="btn-list" data-id="${res.id}">
                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512">
                    <path
                        d="M0 48C0 21.5 21.5 0 48 0l0 48V441.4l130.1-92.9c8.3-6 19.6-6 27.9 0L336 441.4V48H48V0H336c26.5 0 48 21.5 48 48V488c0 9-5 17.2-13 21.3s-17.6 3.4-24.9-1.8L192 397.5 37.9 507.5c-7.3 5.2-16.9 5.9-24.9 1.8S0 497 0 488V48z" />
                </svg>
                <svg class="selected" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512"><path d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z"/></svg>
            </div>
        </div>
    </div>
</div>`
}

function GenErrorSlide() {
    return `<div class="swiper-slide error-slide">
    <div class="wrapper-error">
        <img src="./images/error-trailers.png" alt="Ошибка загрузки трейлеров">
        <div class="wrapper-content">
            <div class="content-info">
                <div class="title-error">
                    Ошибка загрузки<br />
                    трейлеров
                </div>
                <div class="info-error">
                    помоги нам решить проблему
                </div>
            </div>
            <div class="content-reload">
                <div class="btn-reolad">
                    <svg viewBox="0 0 56 56" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M50.6953 24.5H51.625C53.0797 24.5 54.25 23.3297 54.25 21.875V7.87501C54.25 6.81407 53.6156 5.85157 52.6312 5.44688C51.6469 5.04219 50.5203 5.26094 49.7656 6.01563L45.2156 10.5656C35.6344 1.10469 20.2016 1.13751 10.675 10.675C1.10469 20.2453 1.10469 35.7547 10.675 45.325C20.2453 54.8953 35.7547 54.8953 45.325 45.325C46.6922 43.9578 46.6922 41.7375 45.325 40.3703C43.9578 39.0031 41.7375 39.0031 40.3703 40.3703C33.5344 47.2063 22.4547 47.2063 15.6187 40.3703C8.78281 33.5344 8.78281 22.4547 15.6187 15.6188C22.4219 8.81563 33.4141 8.78282 40.2609 15.5094L35.7656 20.0156C35.0109 20.7703 34.7922 21.8969 35.1969 22.8813C35.6016 23.8656 36.5641 24.5 37.625 24.5H50.6953Z"
                            fill="white" />
                    </svg>
                </div>
            </div>
        </div>
    </div>
</div>`
}