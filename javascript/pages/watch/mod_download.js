import { ApiTunime } from "../../modules/TunimeApi.js";
import { WindowManagement } from "../../modules/Windows.js";
import { ScrollElementWithMouse } from "../../modules/funcitons.js";
import { Player } from "./mod_player.js";

let loaded = false; // Загружены ли эпизоды
let selected = 1; // Выбранный эпизод
let elementSelected = undefined; //Последний выбранный елемент

let downloadLink = undefined; // Локальная ссылка для загрузки  файла

let startTime, endTime;

const _data = {
    link: undefined,
    name: "Anime",
    translation: undefined,
}

let totalFiles = 0;
let downloadedFiles = 0;

/**
 * Создает эпизоды в окне загрузке
 * @returns ? ничего не возвращяет
 */
function LoadingEpisodes() {
    if (loaded) {
        return;
    }
    loaded = true;
    const e = Player().episodes.episodes_count;
    for (let i = 0; i < e; i++) {
        const count = i + 1;
        $('.window-body-fs > .download-episode > .down-value').append(`<span class="down-episode" data-index="${count}">${count}<span class="ep-name">EP</span><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M256 0a256 256 0 1 0 0 512A256 256 0 1 0 256 0zM376.9 294.6L269.8 394.5c-3.8 3.5-8.7 5.5-13.8 5.5s-10.1-2-13.8-5.5L135.1 294.6c-4.5-4.2-7.1-10.1-7.1-16.3c0-12.3 10-22.3 22.3-22.3l57.7 0 0-96c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32l0 96 57.7 0c12.3 0 22.3 10 22.3 22.3c0 6.2-2.6 12.1-7.1 16.3z"/></svg></span>`);
    }

    $('.window-body-fs > .download-episode > .down-value > .down-episode').on('click', function (e) {
        const element = $(e.currentTarget);
        const index = element.attr('data-index');
        SelectEpisode(index, true);
    });
}

/**
 * Выбирает эпизод
 * @param {number} val - выбранный эпизод
 * @param {boolean} user - пользователь вызвал
 * @returns ? ничего
 */
function SelectEpisode(val, user = false) {
    if (!val && selected == val) {
        return;
    }
    selected = val;
    const element = $(".download-episode > .down-value > .down-episode")[val - 1];
    if (elementSelected != undefined) {
        anime({
            targets: elementSelected,
            color: "#555657",
            easing: "easeOutElastic(1, 1)",
        })
    }
    elementSelected = element;
    const left = $(element).position().left;

    anime({
        targets: ".sel-down",
        left: left,
        easing: "easeOutElastic(1, 1)",
        complete: function () {
            if (!user) {
                AutoScrollToEpisode();
            }
        },
    });
    anime({
        targets: element,
        color: "#020202",
        easing: "easeOutElastic(1, 1)",
    });

}

/**
 * Скроллит к выбранному эпизоду
 * @returns ? ничего
 */
function AutoScrollToEpisode() {
    let SelPos = $('.down-value > .sel-down').position();
    const WidthEpisodes = $('.download-episode').width();
    const sizeEpisode = (55 + 3);
    if ((WidthEpisodes / 2) > SelPos.left) {
        return;
    }
    anime({
        targets: '.download-episode',
        scrollLeft: (SelPos.left - (WidthEpisodes / 2) + sizeEpisode),
        duration: 500,
        easing: 'easeInOutQuad'
    });
}

function SetButtonStatus(status) {
    const btn = $(`.window-futter > #btn-download`);
    if (status == "loading") {
        btn.attr('data-status', status)
        btn.text("Загрузка...");
        btn.addClass("disabled");
    }
    if (status == "ready") {
        btn.attr('data-status', status);
        btn.text("Загрузить");
        btn.removeClass("disabled");
    }
    if (status == "candown") {
        btn.attr('data-status', status);
        btn.text("Сохранить");
        btn.removeClass("disabled");
    }
}

function _downloadAnime(e) {
    if ($(e).attr('data-status') == "loading") {
        return;
    }
    if ($(e).attr('data-status') == "candown") {
        DownloadLocalVideo();
        return;
    }
    if ($(e).attr('data-status') == "ready") {
        SetButtonStatus("loading");
        downloadedFiles = 0;
        totalFiles = 0;
        $('.progress-download > .value').css({ width: `${0}%` }); // Обновляем индикатор загрузки
        GetM3U8Links();
        return;
    }
}

async function GetM3U8Links() {
    let link = `${_data.link}?episode=${selected}`;
    if (!link.includes("http")) {
        link = `https:${link}`;
    }
    const data = await ApiTunime.stream(link);
    if (data) {
        _localDownload(data);
    }
}

function GetQualityDownload(data) {
    let allowQuality = ['720', '480', '360'];
    let currentQuality = $PARAMETERS.download.dquality;

    //Записываем только досутпные разрешения
    for (let i = 0; i < allowQuality.length; i++) {
        const e = allowQuality[i];
        if (data[e].length == 0) {
            allowQuality.splice(i, 1);
        }
    }

    let idQuality = allowQuality.findIndex(x => x == currentQuality);

    if (idQuality == -1) {
        if (allowQuality.length != 0) {
            currentQuality = allowQuality[0];
        } else {
            return -1;
        }
    }

    return currentQuality;
}

function _localDownload(data) {
    const quality = GetQualityDownload(data);

    if (quality == -1) {
        //Недоступно не одного видео для скачивания
        return;
    }

    const url = data[quality][0].src.indexOf("http") != -1 ? data[quality][0].src : "https:" + data[quality][0].src;
    // Строка, которую нужно удалить
    const searchString = `${quality}.mp4:hls:manifest.m3u8`;
    // Удалите подстроку из URL
    const urlkodik = url.substring(0, url.indexOf(searchString));

    fetch(url)
        .then(response => response.text())
        .then(async (m3u8Content) => {
            // data содержит текст манифеста M3U8
            const tsUrls = m3u8Content.split('\n').filter(line => line.trim().endsWith('.ts'));

            // Сохраняем время начала загрузки
            startTime = new Date().getTime();

            if ($PARAMETERS.download.dasync) {
                AsyncDownloadVideo(tsUrls, urlkodik);
            } else {
                DownloadVideo(tsUrls, urlkodik);
            }
        }).catch(error => {
            console.error('Ошибка при загрузке M3U8: ', error);
        });
}

async function AsyncDownloadVideo(tsUrls, urlkodik) {
    const downloadPromises = [];
    totalFiles = tsUrls.length;

    for (let i = 0; i < tsUrls.length; i++) {
        try {
            const tsUrl = tsUrls[i];
            downloadPromises.push(downloadTsFile(urlkodik + tsUrl));
        } catch (error) {
            console.error(`Failed to fetch ${tsUrl[i]}: ${error.message}`);
        }
    }

    try {
        const tsBlobs = await Promise.all(downloadPromises);

        // Завершаем загрузку (это симуляция, на самом деле должно быть событие окончания загрузки файла)
        endTime = new Date().getTime();

        // Вычисляем время загрузки
        const uploadTime = (endTime - startTime) / 1000; // в секундах
        console.log(uploadTime);

        if (tsBlobs.length === 0) {
            console.log('Не удалось загрузить ни один файл .ts!');
            return;
        }

        const mergedBlob = new Blob(tsBlobs, { type: 'video/mp2t' });
        downloadLink = URL.createObjectURL(mergedBlob);

        DownloadCompleated();
    } catch (error) {
        console.error('Ошибка при загрузке M3U8: ', error);
    }
}

async function DownloadVideo(tsUrls, urlkodik) {
    let tsBlobs = [];
    for (let i = 0; i < tsUrls.length; i++) {
        try {
            const tsUrl = tsUrls[i];
            const tsResponse = await fetchWithRetry(urlkodik + tsUrl);
            const tsBlob = await tsResponse.blob();
            tsBlobs.push(tsBlob);
            const progress = ((i + 1) / tsUrls.length) * 100;
            $('.progress-download > .value').css({ width: `${progress}%` });
        } catch (error) {
            console.error(`Failed to fetch ${tsUrls[i]}: ${error.message}`);
        }
    }

    // Завершаем загрузку (это симуляция, на самом деле должно быть событие окончания загрузки файла)
    endTime = new Date().getTime();

    // Вычисляем время загрузки
    const uploadTime = (endTime - startTime) / 1000; // в секундах
    console.log(uploadTime);

    if (tsBlobs.length === 0) {
        console.log('Не удалось загрузить ни один файл .ts!');
        return;
    }

    const mergedBlob = new Blob(tsBlobs, { type: 'video/mp2t' });
    downloadLink = URL.createObjectURL(mergedBlob);

    DownloadCompleated();
}

function DownloadCompleated() {
    SetButtonStatus("candown");
    if ($PARAMETERS.download.dautosave) {
        DownloadLocalVideo();
    }
}

function DownloadLocalVideo() {
    const translation = `-${_data.translation}`;
    // Создаем ссылку для скачивания
    const dL = document.createElement('a');
    dL.href = downloadLink;
    dL.download = `${_data.name}-${selected}${translation}.ts`;
    // Автоматически нажимаем на ссылку для скачивания
    dL.click();
    // Очищаем ссылку и удаляем ее из DOM
    URL.revokeObjectURL(dL.href);
    SetButtonStatus("ready");
}

async function updateProgress() {
    const progress = (downloadedFiles / totalFiles) * 100;
    $('.progress-download > .value').css({ width: `${progress}%` }); // Обновляем индикатор загрузки
}

async function downloadTsFile(tsUrl) {
    const tsResponse = await fetchWithRetry(tsUrl);
    const tsBlob = await tsResponse.blob();
    downloadedFiles++;
    updateProgress();
    return tsBlob;
}

async function fetchWithRetry(url, retryCount = 25) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        return response;
    } catch (error) {
        console.error(`Error fetching ${url}: ${error.message}`);
        if (retryCount > 0) {
            console.log(`Retrying in 1 second... (${retryCount} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(url, retryCount - 1);
        } else {
            throw new Error(`Failed to fetch ${url} after multiple attempts`);
        }
    }
}

const WindowDownload = {
    init: function () {
        ScrollElementWithMouse('.download-episode');
        $('.window-futter > #btn-download').on('click', function (e) {
            _downloadAnime(e.currentTarget);
        });

        $('.bar-download > .window-close').on('click', function () {
            WindowDownload.hide();
        });
    },

    show: function () {
        LoadingEpisodes();
        const id = Player().data.findIndex(x => x.id == Player().data_id);
        const data = Player().data[id];
        $('.download-info > .voice').text(data.translation.title);
        $('.download-info > .quality').text($PARAMETERS.download.dquality);
        _data.name = data.title_orig;
        _data.link = data.link;
        _data.translation = data.translation.title;
        $("body").addClass("loading");
    },

    hide: function () {
        _windowDownload.hide();
        $("body").removeClass("loading");
    },

    verif: function () {
        return Player().loaded;
    },

    anim: {
        showed: function () {
            SelectEpisode(Player().episodes.selected_episode);
        }
    }
}

const _windowDownload = new WindowManagement(WindowDownload, '.window-download');

export const ShowDwonloadWindow = () => { _windowDownload.click(); }