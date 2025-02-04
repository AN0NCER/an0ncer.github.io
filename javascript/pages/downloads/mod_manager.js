import { DBControls } from "../../modules/TDatabase.js";
import { TDAnime, TDLState, TDownload } from "../../modules/TDownload.js";
import { PullToClose, WindowManagement } from "../../modules/Windows.js";
import { CardUpdate } from "../downloads.js";
import { VideoUpdate } from "./mod_player.js";
import { formatBytes, parseVID } from "./mod_utils.js";

/// <reference path="/javascript/types/t_db_downloader.js" />

/**
 * TODO: Сделать проверку отображения окна если только есть доступ к серверу
 */

const UI = {
    'empty-wrapper': (text, add) => {
        return `<div class="empty-wrapper"><div class="text">${text}</div><div class="add">${add}</div></div>`;
    },

    'history': (obj) => {
        return `<div class="history" data-id="${obj.animeId}"><div class="task-wrapper"><div class="name">${obj.name}</div><div class="info-wrapper"><div class="ep">${obj.episodeId} Episode</div><div class="dub">${obj.voice}</div></div></div><div class="history-wrapper"><div class="date">20.01.2025</div><div class="size">${formatBytes(obj.size)}</div></div></div>`;
    },

    'task': (obj) => {
        return `<div class="task" data-vid="${obj.vId}"><div class="task-wrapper"><div class="name">${obj.anime.anime.name}</div><div class="info-wrapper"><div class="ep">${obj.episode} Episode</div><div class="dub">${obj.anime.voice.name}</div></div></div><div class="btn remove"><div class="ticon i-trash"></div></div></div>`
    }
}

/**@this {Manager} */
const functionTask = function (events = { sel: "click.task-sel", del: "click.task-del" }) {
    $('.list.tasks > .task').off(events.sel);

    let selectedVID = undefined;

    const onVIDselect = () => {
        if (this.selected === undefined && selectedVID !== undefined) {
            $('.control-buttons > .btn.continue').removeClass('disable');

            $('.control-buttons > .btn.continue').removeClass(['state-1', 'state-2']).addClass('state-0');
        }

        if (selectedVID === undefined) {
            $('.control-buttons > .btn.toup, .control-buttons > .btn.todown').addClass('disable');
        } else {
            $('.control-buttons > .btn.toup, .control-buttons > .btn.todown').removeClass('disable');
        }
    }

    (() => {

        const onSelect = (el) => {
            $('.task.select').removeClass('select');
            el.addClass('select');
        }

        const hideElement = (vId) => {
            $(`.task[data-vid="${vId}"]`).addClass('hide');
            if (selectedVID === vId) selectedVID = undefined;
        }

        /** @param {LTask} queue */
        const setDownload = (queue) => {
            $('.download-anime > .wrapper-info >.name').text(queue.anime.anime.name);
            $('.download-anime > .wrapper-info > .wrapper-data > .ep').text(`${queue.episode} Episode`);
            $('.download-anime > .wrapper-info > .wrapper-data > .dub').text(queue.anime.voice.name);
            $('.wrapper-progress > .progress').text(0);
            $('.wrapper-progress > svg').css({ '--progress': 0 });
            $('#download-speed > .content-a > .text > .value').text(0);
            $('#download-speed > .content-b > .time').text('0:00');
            $('#file-size > .content-a > .text > .value').text(formatBytes(0));
            $('#file-size > .content-b > .count').text(0);
            $('#file-size > .content-b > .downloaded').text(0);
        }

        //Нажатие на елемент (Task)
        $('.list.tasks > .task').on(events.sel, (e) => {
            if ($(e.target).hasClass('remove'))
                return;
            const vId = $(e.currentTarget).attr('data-vid');
            selectedVID = vId;
            onSelect($(e.currentTarget));
            onVIDselect();
        });

        $()

        //Кнопка загрузить
        this.events.on("download", ({ }) => {
            if (selectedVID === undefined)
                return;

            this.download(selectedVID);
            selectedVID = undefined;
        });

        this.events.on("start", (vId) => {
            hideElement(vId);
            setDownload(this.selected);
            onVIDselect();
        });

        this.events.on("end", () => {
            onVIDselect();
        });

        onVIDselect();
    })();

    (() => {
        const deleteTask = async (vId) => {
            (await TDownload.Manager()).RemoveTask(parseVID(vId), vId).then((val) => {
                if (!val)
                    return;

                $(`.task[data-vid="${vId}"]`).remove();
                if (selectedVID === vId) {
                    selectedVID = undefined;
                    onVIDselect();
                }
            });
        }
        //Удаление задачи (Task)
        let onDelete = false;
        let element = undefined;

        const disable = () => {
            if (!element)
                return;

            element.rmstep = 0;
            $(element).removeClass("state-1");
            onDelete = false;
            element = undefined;
        }

        const enable = () => {
            if (!element)
                return;

            element.rmstep = 1;
            $(element).addClass("state-1");
            onDelete = true;
        }

        $(".task > .btn.remove").on("click", function (e) {
            this.rmstep = this.rmstep || 0;

            if (element && element !== this) {
                disable();
            } else if (element && element === this) {
                const vId = $(this).parent('.task').attr('data-vid');
                deleteTask(vId);
            }

            element = this;

            enable();
        });

        $(window).on("click", function (e) {
            const target = e.target;

            if (target === element || !onDelete)
                return;

            disable();
        });
    })();

    (() => {
        const moveUp = (array, index) => {
            if (index > 0 && index < array.length) {
                [array[index - 1], array[index]] = [array[index], array[index - 1]];
            }
            return array;
        }

        const moveDown = (array, index) => {
            if (index >= 0 && index < array.length - 1) {
                [array[index], array[index + 1]] = [array[index + 1], array[index]];
            }
            return array;
        }

        const toUp = (vId) => {
            let $element = $(`.task[data-vid="${vId}"]`);
            $element.prev('.task').before($element);
        }

        const toDown = (vId) => {
            let $element = $(`.task[data-vid="${vId}"]`);
            $element.next('.task').after($element);
        }

        this.events.on("toup", () => {
            if (selectedVID === undefined)
                return;

            const index = this.queue.findIndex(x => x.vId === selectedVID);
            if (index <= 0)
                return;

            this.queue = moveUp(this.queue, index);
            toUp(selectedVID);
        });

        this.events.on("todown", () => {
            if (selectedVID === undefined)
                return;

            const index = this.queue.findIndex(x => x.vId === selectedVID);
            if (index >= 0 && index === this.queue.length - 1)
                return;

            this.queue = moveDown(this.queue, index);
            toDown(selectedVID);
        });
    })();
}

/**
 * @typedef {Object} LTask
 * @property {string} vId - индентификатор видео
 * @property {number} episode - эпизод
 * @property {TDAnime} anime - аниме данные
 * @property {string} kodikLink - ссылка на Kodik плеер
 * @property {string} quality - качество загружаемого видео
 * @property {number} id - индентификатор задания
 */
class Events {
    #callbacks = {
        "download": [],
        "click.continue": [],
        "start": [],
        "end": [],
        "toup": [],
        "todown": [],
        "delete": []
    }

    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
    }

    off(event, callback) {
        if (this.#callbacks[event] === undefined) return;
        const index = this.#callbacks[event].findIndex(x => x == callback);
        if (index === -1) return;
        this.#callbacks[event].splice(index, 1);
    }

    trigger(event, data = {}) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(data));
    }
}

class Manager {
    constructor() {
        /**
         * Загружены ли задачи
         * @type {boolean}
         */
        this.loaded = false;
        /**
         * Загружать ли все задачи
         * @type {boolean}
         */
        this.allDownload = false;
        /**
         * Управление базой данных
         * @type {DBControls}
         */
        this.db = undefined;
        /**
         * Список всех задач
         * @type {[LTask]}
         */
        this.queue = [];
        /**
         * Выбранный елемент задачи.
         * @type {LTask | undefined}
         */
        this.selected = undefined;

        this.events = new Events();
        this.history = [];
    }

    async init() {
        //Начало кода
        PullToClose('.content-manager', this.hide); // Потянуть и закрыть

        /**
         * Слушатели событий нажатие на кнопки
         */
        (() => {
            $('.control-buttons > .btn.continue').on('click', (e) => {
                if (this.selected === undefined)
                    return this.events.trigger("download");
                this.events.trigger("click.continue");
            });

            $('.control-buttons > .btn.toup').on('click', () => {
                this.events.trigger("toup");
            });

            $('.control-buttons > .btn.todown').on('click', () => {
                this.events.trigger("todown");
            });

            $('.control-buttons > .btn.remove').on("click", () => {
                this.events.trigger("delete");
            });

            $('.bar-manager > .window-close').on('click', () => {
                this.hide();
            })
        })();

        /**
         * Собтие нажаится checkbox (Автоматическая загрузка) устанавливает заничение allDownload
         */
        (() => {
            $('#save-all').prop('checked', this.allDownload).on('change', (event) => {
                const isChecked = $(event.currentTarget).prop('checked');
                this.allDownload = isChecked;
            });
        })();
    }

    async show() {
        //Открытие окна
        $("body").addClass("loading");
        if (this.loaded)
            return;
        this.loaded = true;

        /**@type {[AnimeTable]} */
        const animeList = await this.db.getAll("anime"); // <- Получание всех аниме

        Promise.all([(async (t) => {
            /**@type {[TaskTable]} */
            const list = await this.db.getAll(t); // <- Получение всех задач

            if (list.length <= 0)
                return $('.list.tasks').append(UI["empty-wrapper"]('Нет очереди!', 'Перейдите в аниме и поставьте на загрузку.'));

            for (let i = 0; i < list.length; i++) {
                const { vId, src, quality } = list[i];
                const { animeId, episodeId, voiceId } = parseVID(vId);
                const { video, id, name } = animeList.find(x => x.id === animeId);

                const anime = new TDAnime({ anime: { id, name }, voice: { id: video[voiceId].id, name: video[voiceId].name } })

                /**@type {LTask} */
                const obj = { id: list[i].id, vId, anime, kodikLink: src, quality, episode: episodeId };

                this.queue.push(obj);

                $('.list.tasks').append(UI["task"](obj));
            }
        })("task"), (async (t) => {
            /**@type {[HistoryTable]} */
            const list = await this.db.getAll(t);

            if (list.length <= 0)
                return $('.list.historys').append(UI["empty-wrapper"]('История отсутсвет', 'Чтобы появилась история сначало загрузите аниме.'))

            for (let i = 0; i < list.length; i++) {
                const { vId, date, size, id } = list[i];
                const { animeId, episodeId, voiceId } = parseVID(vId);
                const { name, video } = animeList.find(x => x.id === animeId);

                const obj = { id, animeId, episodeId, name, size, date, voice: video[voiceId].name }

                this.history.push(obj);

                $('.list.historys').append(UI['history'](obj));
            }

        })("history")]).then((value) => {
            if (this.queue.length > 0)
                functionTask.bind(this)();
        });

    }

    async download(vId) {
        const index = this.queue.findIndex(x => x.vId === vId);
        if (this.selected !== undefined || index === -1)
            return undefined;

        $(`.wrapper-progress`).removeClass('completed');

        this.selected = this.queue[index];

        const manager = await TDownload.Downloader(this.selected.anime, this.selected.episode, this.selected.kodikLink, this.selected.quality);

        const completed = () => {
            this.queue.splice(index, 1);
            this.selected = undefined;
            $(`.task[data-vid="${manager.vId}"]`).remove();
            this.events.off("click.continue", click);
            this.events.off("delete", remove);
            this.events.trigger("end", manager.vId);
            if (this.queue.length > 0) {
                if (this.allDownload) {
                    this.download(this.queue[0].vId);
                }
            } else {
                $('.list.tasks').append(UI["empty-wrapper"]('Нет очереди!', 'Перейдите в аниме и поставьте на загрузку.'));
            }
        }

        manager.on("state", (state) => {
            if (state === TDLState.completed) {
                const { id } = manager.data.anime;
                $(`.wrapper-progress`).addClass('completed');
                completed();
                CardUpdate(id);
                VideoUpdate(id);
            }
        });

        manager.on("state", ({ name, id }) => {
            //stoped
            if (id === 3) {
                $('.control-buttons > .btn.continue').addClass('state-1').removeClass(['state-0', 'state-2']);
            }

            //download
            if (id === 2) {
                $('.control-buttons > .btn.continue').addClass('state-2').removeClass(['state-0', 'state-1']);
            }

            if ([2, 4].includes(id)) {
                $('.control-buttons > .btn.remove').addClass('disable');
            } else {
                $('.control-buttons > .btn.remove').removeClass('disable');
            }
        });

        manager.on("error", (err) => {
            console.error(err);
        });

        await manager.Isset();

        const downloader = await manager.Setup();

        const click = () => {
            if (manager.state.id === 2) {
                downloader.Abort();
            } else if (manager.state.id == 3) {
                downloader.Download();
            }
        }

        const remove = () => {
            if (manager.state === TDLState.download)
                return;

            manager.Delete().then(() => {
                $('.download-anime > .wrapper-info >.name').text('Название');
                $('.download-anime > .wrapper-info > .wrapper-data > .ep').text(`0 Episode`);
                $('.download-anime > .wrapper-info > .wrapper-data > .dub').text('Озвучка');
                $('.wrapper-progress > .progress').text(0);
                $('.wrapper-progress > svg').css({ '--progress': 0 });
                $('#download-speed > .content-a > .text > .value').text(0);
                $('#download-speed > .content-b > .time').text('0:00');
                $('#file-size > .content-a > .text > .value').text(formatBytes(0));
                $('#file-size > .content-b > .count').text(0);
                $('#file-size > .content-b > .downloaded').text(0);
                completed();
            });
        }

        this.events.on("click.continue", click);

        this.events.on("delete", remove);

        downloader.on("stats", ({ speed, time, size }) => {
            $('#download-speed > .content-a > .text > .value').text(speed);
            // Рассчитываем минуты и секунды
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`; // Форматируем как M:SS
            $('#download-speed > .content-b > .time').text(formattedTime);
            $('#file-size > .content-a > .text > .value').text(formatBytes(size));
        });

        downloader.on("update", ({ progress, parts }) => {
            $('#file-size > .content-b > .downloaded').text(parts);
            $('.wrapper-progress > .progress').text(Math.floor(progress));
            $('.wrapper-progress > svg').css({ '--progress': progress.toFixed(2) });
        });

        downloader.on("parts", (count) => {
            $('#file-size > .content-b > .count').text(count);
        });

        downloader.on("error", (err) => {
            console.error(err);
        });

        this.events.trigger("start", vId);

        downloader.Download();
        return this.selected;
    }

    hide() {
        $("body").removeClass("loading");
        _window.hide();
    }
    verif() {
        return $SHADOW.state.isConnected && $SHADOW.state.hasApiAccess;
    }
}

const _window = new WindowManagement(new Manager(), '.window-manager');

export async function IManager() {
    if (_window.target.db === undefined)
        _window.target.db = (await TDownload.Manager()).db;
    _window.click("Сервер не загрузился.");
}