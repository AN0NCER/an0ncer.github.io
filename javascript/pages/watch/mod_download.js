import { ScrollElementWithMouse, Sleep } from "../../modules/functions.js";
import { Tunime } from "../../modules/TunimeApi.js";
import { WindowManagement } from "../../modules/Windows.js";
import { Player } from "../watch.js";
import { Anime } from "./mod_resource.js";
import { UserRate } from "./mod_urate.js";

let AutoSave = $PARAMETERS.download.dautosave;

class Automation {
    constructor(downl) {
        this.downl = downl;
        this.key = "download-a";
        this.Data = JSON.parse(localStorage.getItem(this.key)) || [];
        this.Date = new Date().toJSON();
        this.Autoset = $PARAMETERS.download.dautoset;
    }

    Show() {
        /**@type {[{id:number, episode: [number]}]} */
        let localData = JSON.parse(sessionStorage.getItem(this.key)) || [];
        const ur = UserRate().Get();
        const index = localData.findIndex(x => x.id == ur.id);

        if (index === -1) {
            return;
        }

        for (let i = 0; i < localData[index].episode.length; i++) {
            const ep = localData[index].episode[i];
            if ($(`.d-episode[data-e="${ep}"] > .downloaded`).length === 0) {
                $(`.d-episode[data-e="${ep}"]`).append(`<span class="downloaded"></span>`);
            }
        }
    }

    Set(ep) {
        const duration = Anime.duration;
        const ur = UserRate().Get();

        if (ur !== null && ur.episodes < ep && this.Autoset) {
            let downlData = { id_ur: undefined, episodes: undefined, downloaded: [], duration: duration };
            let index = this.Data.findIndex(x => x.id_ur === ur.id);

            if (index !== -1) {
                downlData = this.Data[index];
                this.Data.splice(index, 1);
            }

            downlData.id_ur = ur.id;
            downlData.episodes = ur.episodes;

            index = downlData.downloaded.findIndex(x => x.episode === ep);

            if (index === -1) {
                downlData.downloaded.push({ episode: ep, date: this.Date });
            }

            this.Data.push(downlData);
            localStorage.setItem(this.key, JSON.stringify(this.Data));
        }

        /**@type {[{id:number, episode: [number]}]} */
        let localData = JSON.parse(sessionStorage.getItem(this.key)) || [];
        const index = localData.findIndex(x => x.id == ur.id);
        let data = { id: ur.id, episode: [] };

        if (index !== -1) {
            data = localData[index];
            localData.splice(index, 1)
        }

        data.episode.push(ep);
        localData.push(data);

        if ($(`.d-episode[data-e="${ep}"] > .downloaded`).length === 0) {
            $(`.d-episode[data-e="${ep}"]`).append(`<span class="downloaded"></span>`);
        }

        sessionStorage.setItem(this.key, JSON.stringify(localData));
    }
}

class DownloadAnime {
    #abortet = false;
    constructor(index, data, downl) {
        this.index = index;
        this.data = data;
        this.downl = downl;

        this.eProgress = $('.progress-download > .value');
        this.eCount = $('.progress-download > .value > .percent');

        const count = `${0}%`

        this.eProgress.css({ width: count });
        this.eCount.text(count);

        this.Stats = {
            total: 0,
            downloaded: 0
        };

        this.startTime = 0;
        this.endTime = 0;
        this.typeDownload = $PARAMETERS.download.dasync;
        this.downloadLink = undefined;
    }

    Abort() {
        this.#abortet = true;
    }

    async Download() {
        this.#OnLoading.forEach(event => event());

        let link = `${this.data.link}?episode=${this.index}`;

        if (!link.includes("http")) {
            link = `https:${link}`;
        }

        if (this.#abortet) {
            this.#OnAbbortet.forEach(event => event());
            this.#OnAbbortet = [];
            return;
        }

        const data = await Tunime.Source(link);

        if (data) {
            this.#LocalDownload(data);
        } else {
            this.#OnError.forEach((event) => { event('critical', 'Ошибка получение данных Tunime.') });
        }
    }

    DownloadBlob() {
        const translation = `-${this.data.translation}`;
        // Создаем ссылку для скачивания
        const dL = document.createElement('a');
        dL.href = this.downloadLink;
        dL.download = `${this.data.name}-${this.index}${translation}.ts`;
        // Автоматически нажимаем на ссылку для скачивания
        dL.click();
        // Очищаем ссылку и удаляем ее из DOM
        URL.revokeObjectURL(dL.href);
        this.#OnCompleted.forEach(event => event(this.index));
    }

    #LocalDownload(data) {
        const quality = GetQualityDownload(data, this.downl.Quality);

        if (quality == -1) {
            return this.#OnError.forEach((event) => { event('critical', 'Ошибка выбора качества видео.') });
        }

        const url = data[quality][0].src.indexOf("http") != -1 ? data[quality][0].src : "https:" + data[quality][0].src;
        // Строка, которую нужно удалить
        let searchString = `${quality}.mp4:hls:manifest.m3u8`;

        if (this.#abortet) {
            this.#OnAbbortet.forEach(event => event());
            this.#OnAbbortet = [];
            return;
        }

        fetch(url).then(response => {
            // Регулярное выражение для извлечения части ссылки с качеством
            const pattern = /[^\/]+\.[^\/]+:hls:manifest\.m3u8/;
            
            // Извлечение части ссылки
            const match = response.url.match(pattern);
            
            // Проверка и вывод результата
            if (match) {
                searchString = match[0];
            } else {
                return this.#OnError.forEach((event) => { event('critical', 'Не удалось преобразовать ссылку.') });
            }
            
            // Удалить подстроку из URL
            const urlkodik = response.url.substring(0, response.url.indexOf(searchString));

            response.text().then(async (m3u8Content) => {
                // data содержит текст манифеста M3U8
                const tsUrls = m3u8Content.split('\n').filter(line => line.trim().endsWith('.ts'));

                // Сохраняем время начала загрузки
                this.startTime = new Date().getTime();

                if (this.typeDownload) {
                    this.#AsyncDownload(tsUrls, urlkodik)
                } else {
                    this.#SyncDonwload(tsUrls, urlkodik);
                }

            }).catch(error => {
                return this.#OnError.forEach((event) => { event('critical', 'Ошибка загрузки m3u8 файла.') });
            });
        });

        function GetQualityDownload(data, currentQuality) {
            let allowQuality = ['720', '480', '360'];

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
    }

    async #AsyncDownload(tsUrls, urlkodik) {
        if (this.#abortet) {
            this.#OnAbbortet.forEach(event => event());
            this.#OnAbbortet = [];
            return;
        }
        const downloadPromises = [];
        this.Stats.total = tsUrls.length;

        for (let i = 0; i < tsUrls.length; i++) {
            try {
                const tsUrl = tsUrls[i];
                downloadPromises.push(this.#DownloadTsFile(urlkodik + tsUrl))
            } catch (error) {
                this.#OnError.forEach((event) => { event('warning', `Ошибка загрузки фрагмента ${i}.`) });
                console.error(`Failed to fetch ${tsUrls[i]}: ${error.message}`);
            }
        }

        try {
            const tsBlobs = await Promise.all(downloadPromises);
            if (this.#abortet) {
                this.#OnAbbortet.forEach(event => event());
                this.#OnAbbortet = [];
                return;
            }
            // Завершаем загрузку
            this.endTime = new Date().getTime();
            // Вычисляем время загрузки
            const uploadTime = (this.endTime - this.startTime) / 1000; // в секундах
            console.log(uploadTime);

            if (tsBlobs.length === 0) {
                return this.#OnError.forEach((event) => { event('critical', `Не удалось загрузить ни один фрагмент.`) });
            }

            const mergedBlob = new Blob(tsBlobs, { type: 'video/mp2t' });
            this.downloadLink = URL.createObjectURL(mergedBlob);

            this.#OnCanDownload.forEach((event) => event());

        } catch (error) {
            console.error('Ошибка при загрузке M3U8: ', error);
            return this.#OnError.forEach((event) => { event('critical', `Ошибка при загрузке M3U8.`) });
        }
    }

    async UpdateProgress() {
        const progress = (this.Stats.downloaded / this.Stats.total) * 100;
        this.eProgress.css({ width: `${progress}%` }); // Обновляем индикатор загрузки
        this.eCount.text(`${progress.toFixed(0)}%`);
    }

    async #DownloadTsFile(tsUrl) {
        const tsResponse = await this.#fetchWithRetry(tsUrl);
        if (this.#abortet) {
            this.#OnAbbortet.forEach(event => event());
            this.#OnAbbortet = [];
            return;
        }
        const tsBlob = await tsResponse.blob();
        this.Stats.downloaded++;
        this.UpdateProgress();
        return tsBlob;
    }

    async #fetchWithRetry(url, retryCount = 25) {
        try {
            if (this.#abortet) {
                this.#OnAbbortet.forEach(event => event());
                this.#OnAbbortet = [];
                return;
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            return response;
        } catch (error) {
            console.error(`Error fetching ${url}: ${error.message}`);
            if (retryCount > 0) {
                console.log(`Retrying in 1 second... (${retryCount} attempts left)`);
                await Sleep(1000);
                return this.#fetchWithRetry(url, retryCount - 1);
            } else {
                throw new Error(`Failed to fetch ${url} after multiple attempts`);
            }
        }
    }

    async #SyncDonwload() {
        if (this.#abortet) {
            this.#OnAbbortet.forEach(event => event());
            this.#OnAbbortet = [];
            return;
        }
        let tsBlobs = [];
        this.Stats.total = tsUrls.length;
        for (let i = 0; i < tsUrls.length; i++) {
            if (this.#abortet) {
                this.#OnAbbortet.forEach(event => event());
                this.#OnAbbortet = [];
                return;
            }
            try {
                const tsUrl = tsUrls[i];
                const tsResponse = await this.#fetchWithRetry(urlkodik + tsUrl);
                const tsBlob = await tsResponse.blob();
                tsBlobs.push(tsBlob);
                this.Stats.downloaded++;
                this.UpdateProgress();
            } catch (error) {
                this.#OnError.forEach((event) => { event('warning', `Ошибка загрузки фрагмента ${i}.`) });
            }
        }

        // Завершаем загрузку
        this.endTime = new Date().getTime();
        // Вычисляем время загрузки
        const uploadTime = (this.endTime - this.startTime) / 1000; // в секундах
        console.log(uploadTime);

        if (tsBlobs.length === 0) {
            return this.#OnError.forEach((event) => { event('critical', `Не удалось загрузить ни один фрагмент.`) });
        }

        const mergedBlob = new Blob(tsBlobs, { type: 'video/mp2t' });
        this.downloadLink = URL.createObjectURL(mergedBlob);

        this.#OnCanDownload.forEach((event) => event());
    }

    Deprecate() {
        this.#OnAbbortet.forEach(event => event());
        this.#OnAbbortet = [];
        return;
    }

    #OnLoading = [];
    #OnCanDownload = [];
    #OnCompleted = [];
    #OnError = [];
    #OnAbbortet = [];

    /**
     * 
     * @param {'loading' | 'candownload' | 'completed' | 'error' | 'abbortet'} name 
     * @param {function} event 
     */
    On(name, event = () => { }) {
        if (name === 'loading') {
            this.#OnLoading.push(event);
        } else if (name === 'candownload') {
            this.#OnCanDownload.push(event);
        } else if (name === 'completed') {
            this.#OnCompleted.push(event);
        } else if (name === 'error') {
            this.#OnError.push(event);
        } else if (name === 'abbortet') {
            this.#OnAbbortet.push(event);
        }
    }
}

class Loading {
    #loaded = false;

    constructor(downl) {
        /**
         * @type {Download}
         */
        this.Download = downl;
    }

    get IsLoaded() {
        return this.#loaded;
    }

    Load() {
        if (this.#loaded)
            return;
        this.#loaded = true;

        const e = Player.CEpisodes.count;
        if (e !== undefined && e > 1)
            $('.wrapper-episodes-d').removeClass('hide');

        $('.wrapper-episodes-d > .episodes-download').empty();

        for (let i = 0; i < e; i++) {
            const c = i + 1;
            $('.wrapper-episodes-d > .episodes-download').append(`<div class="d-episode" data-e="${c}">${c}<span>ep</span></div>`);
        }

        this.Download.events.OnSelect.bind(this.Download)();
        this.Download.functions.Select(Player.CEpisodes.selected);
    }
}

class Download {
    #Data = {
        link: undefined,
        name: "Anime",
        translation: undefined,
    }
    /**@type {DownloadAnime} */
    #Download = undefined;

    constructor() {
        this.Selected = 0;
        this.Quality = $PARAMETERS.download.dquality;
        this.Loaded = new Loading(this);
        this.Automation = new Automation(this);
    }

    Download(index = this.Selected) {

        if (this.#Download !== undefined && this.#Download.downloadLink !== undefined) {
            this.#Download.DownloadBlob();
            return;
        }

        if (index <= 0 || this.#Download !== undefined || this.#Data.link === undefined)
            return;

        this.#Download = new DownloadAnime(index, this.#Data, this);

        this.#Download.On('loading', () => {
            $(`#btn-download`).addClass('disable');
            $(`#btn-stop`).removeClass('disable');
        });

        this.#Download.On('candownload', () => {
            $(`#btn-download`).removeClass('disable');
            $(`#btn-download`).text('Сохранить файл');
            $(`#btn-stop`).addClass('disable');
            if (AutoSave) {
                this.#Download.DownloadBlob();
            }
        });

        this.#Download.On('completed', (episode) => {
            $(`#btn-download`).removeClass('disable');
            $(`#btn-download`).text('Загрузить');
            $(`#btn-stop`).addClass('disable');

            this.#Download = undefined;
            this.Automation.Set(episode);
        });

        this.#Download.On('abbortet', () => {
            $(`#btn-download`).removeClass('disable');
            $(`#btn-stop`).addClass('disable');

            this.#Download = undefined;
        });

        this.#Download.On('error', (type, msg) => {
            console.log(msg, type);
            if (type == "critical") {
                $(`.error-message`).text(msg);
                $(`.error-message`).removeClass('hide');
                this.#Download.Deprecate();
            }
        });

        this.#Download.Download();
    }

    Stop() {
        if (this.#Download !== undefined)
            this.#Download.Abort();
    }

    SetData(data) {
        if (data) {
            this.#Data.name = data.title_orig;
            this.#Data.link = data.link;
            this.#Data.translation = data.translation.title;

            $('.download-info > .voice').text(this.#Data.translation);
            $('.download-info > .quality').text(`${this.Quality}p`);
        } else {
            console.log('Ошибка в данных', data);
            Structure.hide();
        }
    }

    events = {
        OnSelect: function () {
            $('.episodes-download > .d-episode').on('click', (e) => {
                const element = $(e.currentTarget);
                const index = element.attr('data-e');
                this.functions.Select(index);
            });
        }
    }

    functions = {
        Select: (index) => {
            const element = $(`.d-episode[data-e="${index}"]`);
            if (element.hasClass('selected'))
                return;
            $('.d-episode.selected').removeClass('selected');
            element.addClass('selected');
            this.Selected = index;
        }
    }
}

const Structure = {
    download: new Download(),
    init: function () {
        $('.bar-download > .window-close').on('click', function () {
            Structure.hide();
        });

        //Переключение парамерта дубляжи избранное по франшизе
        $('.autosave-param').on('click', (e) => {
            if (e.target.checked != undefined) {
                //Переключаем парамерт
                setParameter('dautosave', e.target.checked);
                AutoSave = $PARAMETERS.download.dautosave;
            }
        });

        $('#btn-download').on('click', (e) => {
            $(`.error-message`).removeClass('hide');
            this.download.Download();
        });

        $(`#btn-stop`).on('click', (e) => {
            this.download.Stop();
        });

        $(`#help-download`).on('click', (e) => {
            window.open("https://github.com/AN0NCER/an0ncer.github.io/wiki/%D0%9A%D0%B0%D0%BA-%D1%81%D0%BA%D0%B0%D1%87%D0%B0%D1%82%D1%8C-%D0%B0%D0%BD%D0%B8%D0%BC%D0%B5%3F", "_blank")
        })

        ScrollElementWithMouse('.wrapper-episodes-d');
        $('.autosave-param > .checkbox > input').prop('checked', AutoSave);
    },

    show: function () {
        $("body").addClass("loading");
        this.download.Loaded.Load();
        const data = Player.selected;
        this.download.SetData(data);
        this.download.Automation.Show();
    },

    hide: function () {
        Window.hide();
        $("body").removeClass("loading");
    },

    verif: function () {
        return Player.loaded;
    },

    anim: {
        showed: function () {
            let SelPos = $('.d-episode.selected').position();
            if(SelPos == undefined)
                return;
            const WidthEpisodes = $('.wrapper-episodes-d').width();
            const sizeEpisode = (55 + 3);
            if ((WidthEpisodes / 2) > SelPos.left) {
                return;
            }
            anime({
                targets: '.wrapper-episodes-d',
                scrollLeft: (SelPos.left - (WidthEpisodes / 2) + sizeEpisode),
                duration: 500,
                easing: 'easeInOutQuad'
            });
        }
    }
}

const Window = new WindowManagement(Structure, '.window-download');

export const ShowDwonloadWindow = () => { Window.click("Не доступно!"); };