import { ScrollElementWithMouse } from "../../modules/functions.js";
import { ShowInfo } from "../../modules/Popup.js";
import { TDAnime, TDLState, TDownload } from "../../modules/TDownload.js";
import { WindowManagement } from "../../modules/Windows.js";
import { $ID, Player } from "../watch.js";
import { Anime } from "./mod_resource.js";

// TODO: Сделать отображение окна только если есть доступ к Tunime серверу

function formatBytes(x) {
    const units = ['б', 'Кб', 'Мб', 'Гб'];

    let l = 0, n = parseInt(x, 10) || 0;

    while (n >= 1024 && ++l) {
        n = n / 1024;
    }

    return (n.toFixed(n < 5 && l > 0 ? 1 : 0) + ' ' + units[l]);
}

class DOWLocal {
    #callbacks = {
        "check": []
    }
    /**
     * @param {Downloader} downloader 
     */
    constructor(downloader) {
        this.dow = downloader;

        this.$dom = $('input#save-as-file[type="checkbox"]');

        this.$dom.on('change', (event) => {
            const key = { v: this.dow.Data.voice.id, e: this.dow.Episodes.selected };
            const isChecked = $(event.currentTarget).prop('checked');
            this.#Dispatch("check", key, isChecked);
        });
    }

    set(value) {
        this.$dom.prop('checked', value);
    }

    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
    }

    #Dispatch(event, ...data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(...data));
    }
}

class DOWLogText {
    constructor(downloader) {
        this.dow = downloader;
        this.$dom = [
            $(`.content-wraper > .complete-message`),
            $(`.content-wraper > .complete-message`)
        ];
    }

    set(text, error = false) {
        let $el = this.$dom[0];

        if (error)
            $el = this.$dom[1];

        $el.removeClass('hide');
    }

    hide(all = true, error = false) {
        if (all) {
            this.$dom.forEach($el => {
                $el.addClass('hide');
            });
        } else {
            let $el = this.$dom[0];

            if (error)
                $el = this.$dom[1];

            $el.addClass('hide');
        }
    }
}

class DOWButtons {
    #callbacks = {
        "download": [],
        "abort": [],
        "delete": [],
        "alldown": [],
        "close": []
    }

    constructor(downloader) {
        this.dow = downloader;
        this.$dom = $(`.wrap-buttons > .list-buttons`);

        //Button: Загрузить
        $(`.group-availble > .btn`).on('click', () => {
            const key = { v: this.dow.Data.voice.id, e: this.dow.Episodes.selected };
            this.#Dispatch("download", key);
        });

        //Button: Остановить
        $(`.group-download > .btn`).on('click', () => {
            const key = { v: this.dow.Data.voice.id, e: this.dow.Episodes.selected };
            this.#Dispatch("abort", key);
        });

        //Button: Удалить
        $(`.group-completed > .ico-btn`).on('click', () => {
            const key = { v: this.dow.Data.voice.id, e: this.dow.Episodes.selected };
            this.#Dispatch("delete", key);
        });

        //Button: Удалить
        $(`.group-stoped > .ico-btn`).on('click', () => {
            const key = { v: this.dow.Data.voice.id, e: this.dow.Episodes.selected };
            this.#Dispatch("delete", key);
        });

        //Button: Продолжить
        $(`.group-stoped > .btn`).on('click', () => {
            const key = { v: this.dow.Data.voice.id, e: this.dow.Episodes.selected };
            this.#Dispatch("download", key);
        });

        $(`.btn.all-download`).on("click", () => {
            const key = { v: this.dow.Data.voice.id, e: this.dow.Episodes.selected };
            this.#Dispatch("alldown", key);
        });

        $(`.bar-download > .window-close`).on("click", () => {
            this.#Dispatch("close", {});
        })
    }

    /**
    * Устанавливает состояние кнопок
    * @param {TDLState} state 
    */
    set(state) {
        const list = TDLState.all();
        this.$dom.removeClass(list).addClass(state.name);
    }

    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
    }

    #Dispatch(event, ...data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(...data));
    }
}

class DOWUiStats {
    /**
     * @param {Downloader} dow 
     */
    constructor(dow) {
        this.dow = dow;
        this.$dom = {
            'speed': $('#download-speed > .content-a > .text > .value'),
            'time': $('#download-speed > .content-b > .time'),
            'size': $('#file-size > .content-a > .text > .value'),
            'progress': {
                'width': $('.progress-download > .value'),
                'value': $('.progress-download > .percent')
            },
            'parts': {
                'count': $('#file-size > .content-b > .count'),
                'downloaded': $('#file-size > .content-b > .downloaded'),
            }
        }
        ScrollElementWithMouse(".wrapper-episodes-d");
    }

    set voice(val) {
        //Указываем озвучку и качество установленное в параметрах
        $(`.download-info > .quality`).text(`${this.dow.Properties.quality}p`);
        $(`.download-info > .voice`).text(val);
    }

    set speed(val) {
        this.$dom.speed.text(val);
    }

    set time(time) {
        // Рассчитываем минуты и секунды
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`; // Форматируем как M:SS
        this.$dom.time.text(formattedTime);
    }

    set size(size) {
        this.$dom.size.text(formatBytes(size));
    }

    set progress(val) {
        this.$dom.progress.width.css({ width: `${val.toFixed(2)}%` });
        this.$dom.progress.value.text(`${val.toFixed(2)}%`);
    }

    set partscount(val) {
        this.$dom.parts.count.text(val);
    }

    set partsdownload(val) {
        this.$dom.parts.downloaded.text(val);
    }
}

class DOWEpisodes {
    #loaded = false;
    #callbacks = {
        "selected": []
    }

    /**
     * Инициализация эпизода контроллера
     */
    constructor() {
        this.count = 0;
        this.selected = 0;
        this.voice = 0;
    }

    Init() {
        const on = () => {
            $('.episodes-download > .d-episode').on('click', (e) => {
                const element = $(e.currentTarget);
                const index = element.attr('data-e');
                if (element.hasClass('selected'))
                    return;
                this.Select(index);
            });
        };

        const { count, selected } = Player.CEpisodes;
        this.voice = Player.CTranslation.id;

        if (this.count !== count) {
            if (count > 1)
                $('.wrapper-episodes-d').removeClass('hide');
            else
                $('.wrapper-episodes-d').addClass('hide');

            $('.wrapper-episodes-d > .episodes-download').empty();

            for (let i = 0; i < count; i++) {
                const number = (i + 1);
                $('.wrapper-episodes-d > .episodes-download').append(`<div class="d-episode" data-e="${number}">${number}<span>ep</span></div>`);
            }

            on();
            this.count = count;
            this.Select(selected);
        }
    }

    Select(episode) {
        $('.d-episode.selected').removeClass('selected');
        $(`.d-episode[data-e="${episode}"]`).addClass('selected');
        this.selected = parseInt(episode);
        this.#Dispatch("selected", this.selected);
    }

    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
    }

    #Dispatch(event, data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(data));
    }
}

class DOWCache {
    /**
     * @typedef {Object} Task
     * @property {string} vId
     * @property {Object | undefined} manag
     * @property {boolean} local
     * @property {boolean} isTask
     */

    /**
     * @typedef {Object} oEV
     * @property {number} v - voice
     * @property {number} e - episode
     */

    constructor() {
        /**
         * @type {Object.<number, Object.<number, Task>>}
         * The first number represents the voice ID, and the second number represents the episode ID.
        */
        this.list = {};
        /**@type {[oEV]} */
        this.history = [];
        this.limit = 5;
    }
    /**
     * Установка кэша задач
     * @param {Task} t 
     * @param {oEV} param 
     */
    set(t, { v, e } = {}) {
        if (!this.list[v]) {
            this.list[v] = {};
        }

        if (this.history.length > this.limit) {
            for (let i = this.history.length - this.limit - 1; i >= 0; i--) {
                const { e, v } = this.history[i];
                if (!this.list[v][e].isTask && this.list[v][e].manag.state !== TDLState.download) {
                    this.history.splice(i, 1);
                    delete this.list[v][e];
                }
            }
        }

        const index = this.history.findIndex(x => x.e == e && x.v == v);
        if (index !== -1) {
            this.history.splice(index, 1);
        }

        this.history.push({ e, v });

        this.list[v][e] = t;
    }

    /**
     * Получение кэш задания
     * @param {oEV} param
     * @returns {undefined | Task}
     */
    get({ v, e } = {}) {
        if (this.list[v] && this.list[v][e]) {
            return this.list[v][e];
        }
        return undefined;
    }
}

class Downloader {
    constructor() {
        this.Properties = {
            quality: $PARAMETERS.download.dquality,
            autosave: $PARAMETERS.download.dautosave
        }

        this.Episodes = new DOWEpisodes();
        this.Cache = new DOWCache();
        this.Data = new TDAnime({ anime: { id: $ID, name: Anime.russian } });
        this.Controls = {
            'ui': new DOWUiStats(this),
            'btns': new DOWButtons(this),
            'logs': new DOWLogText(this),
            'local': new DOWLocal(this),
        }

        this.VIDs = {
            open: undefined,
            download: undefined
        }

        /**@type {[{v:number,e:number}]} */
        this.Task = [];
    }

    Completed() {
        if (this.Task.length === 0)
            return;

        this.Download(this.Task.shift());
    }

    async Download(key = { v: 0, e: 0 }) {
        if (this.VIDs.open === this.VIDs.download)
            return ShowInfo('Уже загружаеться', 'dow-info', 999);

        if (this.VIDs.download === undefined) {
            // Ничего не загружаеться
            const cache = this.Cache.get(key);
            this.VIDs.download = cache.vId;

            //Создаем новую загрузку
            if (this.VIDs.download === this.VIDs.open) {
                this.Controls['btns'].set(TDLState.loading);
            }

            let control = await cache.manag.Setup();

            (() => {
                cache.manag.on("state.dow", (state) => {
                    if ([TDLState.stoped, TDLState.completed].includes(state)) {
                        cache.manag.off("state.dow");
                        control = undefined;
                    }
                });
            })();

            (() => {
                const { ui } = this.Controls;
                const end = () => {
                    this.VIDs.download = undefined;
                    // control = undefined;
                    cache.isTask = false;
                    this.Cache.set(cache, key);
                }

                control.on("stats", ({ speed, time, size } = {}) => {
                    ui.speed = speed;
                    ui.time = time;
                    ui.size = size;
                });

                control.on("update", ({ progress, parts }) => {
                    ui.progress = progress;
                    ui.partsdownload = parts;
                    $(`.episodes-download > .d-episode[data-e="${key.e}"]`).css({ '--i-progress': `${progress.toFixed()}%` });
                });

                control.on("parts", (count) => {
                    ui.partscount = count;
                });

                control.on("completed", () => {
                    end();
                    this.Completed();
                });

                control.on("error", (err) => {
                    this.Controls['logs'].set(err, true);
                });

                control.on("abortet", () => {
                    end();
                });

                control.on("link", async (href) => {
                    //Надо открыть эту ссылку в новой вкладке
                    const dL = document.createElement('a');
                    dL.href = href;
                    dL.download = `${(Anime.name).toLocaleLowerCase()}-${e}-${(Player.CTranslation.name).toLocaleLowerCase()}.ts`;
                    if (this.Properties.autosave) {
                        dL.click();
                        URL.revokeObjectURL(dL.href);
                        control.tDr.state = TDLState.completed;
                        await control.tDr.Isset();
                        end()
                    } else {
                        $(`.group-save > .btn`).on("click", async () => {
                            dL.click();
                            URL.revokeObjectURL(dL.href);
                            control.tDr.state = TDLState.completed;
                            await control.tDr.Isset();
                            end();
                        });
                    }
                });
            })();

            (() => {
                const { btns } = this.Controls;
                btns.on("abort", (key1) => {
                    if (key.e !== key1.e || key.v !== key1.v)
                        return;

                    if (control)
                        control.Abort();
                })
            })();

            if (!cache.local) {
                control.Download();
            } else {
                control.LocalDownload();
            }
        } else {
            // Добавить задачу т.к. идет уже загрузка
            if (this.Task.findIndex(x => x === key) !== -1)
                return this.Controls['logs'].set('Находиться в очереди');

            const cache = this.Cache.get(key);
            Object.assign(cache, { isTask: true });
            await cache.manag.Setup();
            this.Cache.set(cache, key);
            this.Task.push(key);

            return this.Controls['logs'].set('Добавлено в очередь');
        }
    }

    async Super() {
        if (this.Data.voice.id === 0)
            return ShowInfo('Ошибка с озвучками', 'dow-error', 999);

        const key = {
            v: this.Data.voice.id,
            e: this.Episodes.selected
        }

        let cache = this.Cache.get(key);

        if (cache) {
            this.VIDs.open = undefined;
            if (cache.manag) {
                this.VIDs.open = cache.vId;
                return cache.manag.Isset();
            }
        }

        let manag = await (async (a, v) => {
            const { link } = Player.selected;
            const anime = new TDAnime({ anime: a, voice: v });
            const episode = this.Episodes.selected;

            return TDownload.Downloader(anime, episode, link, this.Properties.quality);
        })(this.Data.anime, this.Data.voice);

        this.VIDs.open = manag.vId;

        cache = {
            isTask: false,
            local: false,
            manag: manag,
            vId: manag.vId
        }

        this.Cache.set(cache, key);

        (() => {
            const check = () => {
                return cache.manag.vId === this.VIDs.open;
            }
            //Управление статусами аниме
            cache.manag.on("state", (state) => {
                if (!check())
                    return;

                this.Controls['btns'].check =
                    this.Controls['btns'].set(state);
                this.Controls['local'].set(this.Cache.get(key)?.local || false);
            });

            cache.manag.on("error", (err) => {
                if (!check())
                    return;

                this.Controls['logs'].set(err, true);
            });

            cache.manag.Isset();
        })()
    }

    async CreateTask(key = { v: 0, e: 0 }) {
        if (key.v == 0 || key.e == 0)
            return ShowInfo('Ошибка запуска задачи', 'dow-download', 999);

        let cache = this.Cache.get(key);

        if (cache) {
            cache.isTask = true;
            await cache.manag.Isset();
            this.Cache.set(cache, key);
            if (this.Task.findIndex(x => x.e === key.e && x.v === key.v) === -1) {
                this.Task.push(key);
            }
            return;
        }

        let manag = await (async (a, v) => {
            const { link } = Player.selected;
            const anime = new TDAnime({ anime: a, voice: v });
            const episode = key.e;

            return TDownload.Downloader(anime, episode, link, this.Properties.quality);
        })(this.Data.anime, this.Data.voice);

        cache = {
            isTask: true,
            local: false,
            manag: manag,
            vId: manag.vId
        }

        this.Cache.set(cache, key);

        (() => {
            const check = () => {
                return cache.manag.vId === this.VIDs.open;
            }
            //Управление статусами аниме
            cache.manag.on("state", (state) => {
                if (!check())
                    return;

                this.Controls['btns'].set(state);
                this.Controls['local'].set(this.Cache.get(key)?.local || false);
            });

            cache.manag.on("error", (err) => {
                if (!check())
                    return;

                this.Controls['logs'].set(err, true);
            });

        })();

        await cache.manag.Isset()
        this.Task.push(key);
    }

    async All() {
        const anime = new TDAnime({ anime: this.Data.anime, voice: this.Data.voice });
        const { link } = Player.selected;
        let manager = await TDownload.Downloader(anime, 0, link, this.Properties.quality);

        for (let e = 1; e <= this.Episodes.count; e++) {
            manager.episode = e;
            manager.kodikLink = link;
            const state = await manager.Isset();
            if (state === TDLState.availble || state === TDLState.stoped) {
                await manager.Setup();
                await this.CreateTask({ v: anime.voice.id, e });
            }
        }

        this.Completed();
    }

    init() {
        const { btns, local } = this.Controls;
        //Выбор эпизода
        this.Episodes.on("selected", () => {
            this.Controls['logs'].hide(true);
            this.Super();
        });

        btns.on("download", (key) => {
            this.Download(key);
        });

        btns.on("delete", (key) => {
            const cache = this.Cache.get(key);
            if (cache === undefined)
                return;

            cache.manag.Delete().then(() => {
                $(`.btn.all-download`).removeClass('disable');
                $(`.d-episode[data-e="${key.e}"]`).css({ '--i-progress': '' });
            });
        });

        btns.on("alldown", () => {
            $(`.btn.all-download`).addClass('disable');
            this.All();
        });

        btns.on("close", () => {
            this.hide();
        });

        local.on("check", (key, val) => {
            const cache = this.Cache.get(key);
            cache.local = val;
            this.Cache.set(cache, key);
        });
    }

    show() {
        const setVoice = () => {
            const { id, name } = Player.CTranslation;
            if (this.Data.voice.id === id)
                return this.Data.voice;
            return { id: id, name: name };
        }

        const setEpisodes = async (css = { '--i-progress': '' }) => {
            $(`.d-episode`).css(css);
            css["--i-progress"] = '100%';
            const episodes = await (await TDownload.Manager(this.Data)).getEpisodes();

            if (episodes.length === this.Episodes.count) {
                $(`.btn.all-download`).addClass('disable');
            } else {
                $(`.btn.all-download`).removeClass('disable');
            }

            episodes.forEach(({ episode } = {}) => {
                $(`.d-episode[data-e="${episode}"]`).css(css);
            });
        }

        $('body').addClass('loading');
        this.Data.voice = setVoice();
        this.Episodes.Init();

        setEpisodes().then(() => {
            this.Controls['ui'].voice = this.Data.voice.name;
        });

        this.Super();
    }

    hide() {
        $('body').removeClass('loading');
        _window.hide();
    }

    verif() {
        return $SHADOW.state.isConnected && $SHADOW.state.hasApiAccess;
    }
}

const _window = new WindowManagement(new Downloader(), '.window-download');

export function WDManager() {
    _window.click("Сервер не загрузился.");
}