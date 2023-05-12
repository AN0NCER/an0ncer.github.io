const t_dom = '.swiper-treilers > .swiper-wrapper';

//Статус воспроизведения видео
const t_status = ['await', 'loading', 'ready', 'play', 'pause', 'ended'];
let t_play = false; //Воспризводится ли видео
let c_status = t_status[0]; //Текущий статус

// Данные аниме трейлеров
let t_data = null;
const t_data_url = 'https://raw.githubusercontent.com/AN0NCER/anime-data/main/data.json';

//Текущий id воспроизведения
let t_id = null;

//Загружаем данные с сервера
fetch(t_data_url).then(async (response) => {
    t_data = await response.json();
    TLoad();
});

//Функция после загрузки данных
function TLoad() {
    for (const key in t_data) {
        if (Object.hasOwnProperty.call(t_data, key)) {
            const element = t_data[key];
            $(t_dom).append(TConstruct(element, key));
        }
    }
}

function TConstruct(data, key) {
    return `
    <div class="swiper-slide" data-id="${key}">
        <div class="player hide">
            <video type="video/mp4" playsinline></video>
            <audio type="audio/mp4" playsinline></audio>
        </div>
        <div class="image-player">
            <div class="btn" onclick="TPlay('${key}')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>
            </div>
            <img src="${data.img}" alt="${data.anime.name}">
            <div class="loading hide">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M304 48c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zm0 416c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM48 304c26.5 0 48-21.5 48-48s-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48zm464-48c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM142.9 437c18.7-18.7 18.7-49.1 0-67.9s-49.1-18.7-67.9 0s-18.7 49.1 0 67.9s49.1 18.7 67.9 0zm0-294.2c18.7-18.7 18.7-49.1 0-67.9S93.7 56.2 75 75s-18.7 49.1 0 67.9s49.1 18.7 67.9 0zM369.1 437c18.7 18.7 49.1 18.7 67.9 0s18.7-49.1 0-67.9s-49.1-18.7-67.9 0s-18.7 49.1 0 67.9z"/></svg>
            </div>
        </div>
        <div class="data-content">
            <div class="name">${data.anime.name}</div>
            <div class="raiting"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path></svg>${data.anime.raiting}</div>
        </div>
    </div>
    `
}

//Функция вызывается при нажатии на кнопку 'Play'
function TPlay(id) {
    t_id = id;
    let player = TVideoAudio(id);
    TStatus(t_status[1]);

    //Присваеваем ссылки на ресурсы
    player.video.src = t_data[id].video;
    player.audio.src = t_data[id].audio;

    //Прогружаем аудио и видео
    player.video.load();
    player.audio.load();

    //Записуемся на события
    TFunction(player);
}

//Функция получуние текущего плеера и аудио дорожки
//Возвращает в виде объекта
function TVideoAudio(id = t_id) {
    let audio = null;
    let video = null;

    audio = $('.swiper-slide[data-id="' + id + '"]>.player>audio')[0];
    video = $('.swiper-slide[data-id="' + id + '"]>.player>video')[0]

    return { audio: audio, video: video };
}

//Функция изменение визуала с изменением статуса
async function TStatus(status, id = t_id) {
    c_status = status;
    if (c_status == t_status[0]) {
        //Статус 'await'
        $('.swiper-slide[data-id="' + id + '"] > .image-player > .loading').addClass('hide');
        $('.swiper-slide[data-id="' + id + '"] > .player').addClass('hide');
        $('.swiper-slide[data-id="' + id + '"] > .image-player > .btn').removeClass('hide');
        t_id = null;
    }
    if (c_status == t_status[1]) {
        //Статус 'loading'
        $('.swiper-slide[data-id="' + id + '"] > .image-player > .loading').removeClass('hide');
        $('.swiper-slide[data-id="' + id + '"] > .image-player > .btn').addClass('hide');
    }
    if (c_status == t_status[2]) {
        //Статус 'ready'
        $('.swiper-slide[data-id="' + id + '"] > .image-player > .loading').addClass('hide');
        $('.swiper-slide[data-id="' + id + '"] > .player').removeClass('hide');
    }
}

//Функция присвоение событий объектам
function TFunction(player = TVideoAudio()) {
    player.video.addEventListener('error', (e) => {
        if (player.video.src == window.location.href || player.audio.src == window.location.href) {
            return;
        }
        console.log(player.video.src);
        //Ошибка воспроизведения
        TSparePlayer();
    });
    player.video.addEventListener('canplaythrough', (e) => {
        TStatus(t_status[2]);
        //Видео готово к воспроизведению
        if (player.audio.readyState >= 2) {
            player.audio.play();
            player.video.play();
            t_play = true;
        }
    });
    player.video.addEventListener('ended', (e) => {
        //Конец видео
        if (t_play) {
            TPlayerStop();
        }
        TStatus(t_status[0]);
    });
    player.video.addEventListener('click', (e) => {
        //Нажатие на видео
        if (player.video.paused) {
            player.audio.play();
            player.video.play();
        } else {
            player.audio.pause();
            player.video.pause();
        }
    });
    player.video.addEventListener('pause', (e) => {
        //Пауза видео
        player.audio.pause();
    });
    player.video.addEventListener('play', (e) => {
        //Воспроизведеине видео
        player.audio.play();
    });
    player.audio.addEventListener('canplaythrough', (e) => {
        //Аудио готово к воспроизведению
        if (player.video.readyState >= 2) {
            player.audio.play();
            player.video.play();
            t_play = true;
        }
    });
}

//Дополнительный плеер если вышла ошибка
function TSparePlayer(id = t_id, player = TVideoAudio()) {
    //Останавливаем загрузку одну из дорожек если она работает
    TPlayerAbort();

    //Добавляем область для дополнительного плеера
    $('.swiper-slide[data-id="' + id + '"] > .player').append(`<div id="ytplayer"></div>`);

    //Добавляем плеер
    player = new YT.Player('ytplayer', {
        width: '100%',
        height: 'auto',
        videoId: id,
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
    window.player = player;
}

//Функция остановки основного плеера
function TPlayerStop(player = TVideoAudio()) {
    player.audio.pause();
    player.video.pause();
}

//Функция прерывания загрузки
function TPlayerAbort(player = TVideoAudio()) {
    player.audio.src = '';
    player.video.src = '';
}

//Функция когда дополнительный плеер готов
function YTPlayerReady(e) {
    TStatus(t_status[2]);
    e.target.playVideo();
}

//Изменения событий 
function YTPlayerStateChange(e) {
    if (e.data == YT.PlayerState.ENDED) {
        $('#ytplayer').remove();
        TStatus(t_status[0]);
    }
}

//Создаем слайдер
const t_swiper = new Swiper('.swiper-treilers', {
    // Parametrs
    spaceBetween: 10,
    pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
    },
});

//Событие изменения слайда
t_swiper.on('slideChange', function () {
    //Проверяем состояние плеера, если плеера нет то ничего не делаем
    if (c_status == t_status[0]) {
        return;
    }

    //Если стату является 'loading'
    if (c_status == t_status[1]) {
        //Нужно остановить загрузку плеера
        TPlayerAbort();
    }

    console.log('change slide');
    //Если у нас есть плеер то надо:
    //Завершить если это основной плеер
    if (t_play) {
        TPlayerStop();
    }
    //Удалить если это запасной плеер
    if ($('#ytplayer')) {
        $('#ytplayer').remove();
    }

    //Изменяем статус на изначальный
    TStatus(t_status[0]);
})