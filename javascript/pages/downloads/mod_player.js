import { CreateVerify } from "../../modules/ActionVerify.js";
import { DBControls } from "../../modules/TDatabase.js";
import { TDownload } from "../../modules/TDownload.js";
import { WindowManagement } from "../../modules/Windows.js"
import { formatDuration, formatBytes, countVideo } from "./mod_utils.js";
import { SelectVoice } from "./mod_voice.js";

/**
 * TODO: Изменить систему прогрузки новый подгруженных эпизодов
 */

/**
 * 
 * @param {*} episode
 * @this Player 
 */
const _REpisode = async function (episode) {
    //Проверить если удаляеться выбранный эпизод то нужно выбрать другой первый доступный
    //иначе просто удалить данный видеоролик
    //Если это единственный эпизод данного аниме то нужно проверить есьб ли незаконченные загрузки аниме, то просто удаляем эпизод и закрываем аниме и удаялем его со страницы
    //Если это единственное аниме и нет его в списке задач загрузок, то удаляем его полностью все видноролики, аниме и истории
    //при удалении видеороликов надо проверять нет ли эпизода в истории и там его тоже удалять
    //Если в аниме доступно несколько озвучек, то при удаление полностью одной озвчки нужно будет перебросить пользователя на другую озвучку

    const _uiEpisodeDelete = (vId) => {
        $(`.episode[data-vId="${vId}"]`).remove();
    }

    const _uiCardUpdate = () => {
        $(`.card-anime[data-id="${this.anime.id}"] > .card-information > .score > .val`).text(countVideo(this.anime.video));
        $(`.card-anime[data-id="${this.anime.id}"] > .card-information > .year`).text(formatBytes(this.anime.size));
    }

    const deleteByHistory = async (vId) => {
        const name = "history";
        const history = await this.db.getAll(name);
        const id = history.find(e => e.vId === vId)?.id;
        if (id) {
            await this.db.delete(name, { id });
        }
    }

    const deleteByVideo = async (vId) => {
        const name = "video";
        await this.db.delete(name, { id: vId });
    }

    const deleteByAnime = async (id, dub, episode) => {
        const name = "anime";
        const anime = await this.db.get(name, { id });
        const index = anime.video[dub].episodes.findIndex(x => x.episode === episode);
        if (index !== -1) {
            const size = anime.video[dub].episodes[index].size || 0;
            anime.video[dub].episodes.splice(index, 1);
            anime.size -= size;
            await this.db.set(name, { id }, anime);
            this.anime = anime;
        }
    }

    const clearVideoAnime = async (id, dub, episode) => {
        const name = "anime";
        const name1 = "task";

        const anime = await this.db.get(name, { id });
        const task = await this.db.getAll(name1);

        const index = task.findIndex(x => x.vId.startsWith(id) && x.vId.endsWith(dub));

        const size = anime.video[dub].episodes.find(x => x.episode === episode)?.size || 0;
        anime.size -= size;

        if (index === -1) {
            //Нет задач загрузок
            delete anime.video[dub];
        } else {
            //есть незавершенная загрузка аниме
            anime.video[dub].episodes = [];
        }

        await this.db.set(name, { id }, anime);
        this.anime = anime;
    }

    const selectVoice = () => {
        const keys = Object.keys(this.anime.video);
        const voice = this.anime.video[keys.find(x => this.anime.video[x].episodes.length > 0)].id;
        return voice;
    }

    const voiceAvailble = () => {
        const keys = Object.keys(this.anime.video);
        let count = 0;
        keys.forEach(key => {
            if (this.anime.video[key].episodes.length >= 1) {
                count++;
            }
        });
        if (count > 1) {
            return true;
        }
        return false;
    }

    //Доступность других озвучек
    const dubAvaible = voiceAvailble();
    //Являеться ли эпизод выбранным
    const epSelected = (this.episode === episode);
    //Доступность других эпизодов
    const epAvaible = this.anime.video[this.voice].episodes.length > 1 ? true : false;
    //Видео индентификатор удаляемого видео
    const vId = this.anime.video[this.voice].episodes.find(e => e.episode === episode).vId;

    console.log(`[player] - remove Episode\ndubAvaible: ${dubAvaible}\nepSelected: ${epSelected}\nepAvaible: ${epAvaible}\nvId: ${vId}\nepisode: ${episode}`);

    //Если доступны другие эпизоды то просто удаляем видео с БД(anime, history, video)
    if (epAvaible) {
        await deleteByVideo(vId);
        await deleteByHistory(vId);
        await deleteByAnime(this.anime.id, this.voice, episode);

        _uiEpisodeDelete(vId);

        if (epSelected) {
            const e = this.anime.video[this.voice].episodes[0].vId;
            $(`.episode[data-vId="${e}"]`).trigger("click");
        }

        //Обновить размер аниме в списке
        _uiCardUpdate();
    } else {
        await deleteByVideo(vId);
        await deleteByHistory(vId);
        await clearVideoAnime(this.anime.id, this.voice, episode);

        _uiEpisodeDelete(vId);
        //Если доступна другая озвучка то просто нужно переключиться
        if (dubAvaible) {
            //Выбираем другую озвучку где есть видео
            this.voice = selectVoice();
            _SEpisodes();
            //Обновить размер аниме в списке
            _uiCardUpdate();
        } else {
            this.hide();
            //Загрыть окно и удалить аниме со списков
            $(`.card-anime[data-id="${this.anime.id}"]`).remove();
        }
    }
}

/**
 * Удаляет полностью аниме из БД
 * @this Player
 */
const _RAnime = async function () {
    //Чтобы удалить полностью аниме, мы должны знать есть ли незаконченные загрузки для того чтобы удалить озвучки и полностью аниме
    //Также нужно будет высчитвать новый размер файла аниме если есть незавершенные загрузки
    //Не забыть очистить историю от данных аниме

    const hasTasks = async (id, keys) => {
        const name = "task";
        const task = await this.db.getAll(name);

        let dubs = [];
        let isTask = false;

        for (let i = 0; i < task.length; i++) {
            const { vId } = task[i];
            const isID = vId.startsWith(id);

            if (isID) {
                isTask = true;

                keys.forEach(key => {
                    if (vId.endsWith(key) && !dubs.includes(key)) {
                        dubs.push(key);
                    }
                });
            }

        }

        return { isTask, dubs };
    }

    const getVIds = (anime) => {
        const keys = Object.keys(anime.video);
        let vIds = [];
        let size = 0;
        keys.forEach(key => {
            anime.video[key].episodes.forEach(episode => {
                size += episode.size || 0;
                vIds.push(episode.vId);
            });
        });
        return { vIds, size };
    }

    const clearHistory = async (vIds = []) => {
        const name = "history";
        const history = await this.db.getAll(name);

        const ids = [];

        for (let i = (history.length - 1); i >= 0; i--) {
            const h = history[i];
            if (vIds.includes(h.vId)) {
                ids.push(h.id);
            }
        }

        await this.db.delete(name, { ids });
    }

    const clearVideo = async (vIds = []) => {
        const name = "video";
        for (let i = 0; i < vIds.length; i++) {
            const vId = vIds[i];
            await this.db.delete(name, { id: vId });
        }
    }

    const clearAnime = async (anime, dubs) => {
        const name = "anime";
        const keys = Object.keys(anime.video);

        for (let i = 0; i < keys.length; i++) {
            const { id } = anime.video[keys[i]];
            if (dubs.includes(`${id}`)) {
                anime.video[keys[i]].episodes = [];
            } else {
                delete anime.video[keys[i]];
            }
        }

        await this.db.set(name, { id: anime.id }, anime);
    }

    const id = this.anime.id;
    const anime = await this.db.get("anime", { id });
    const { isTask, dubs } = await hasTasks(id, Object.keys(anime.video));
    const { vIds, size } = getVIds(anime);

    console.log(`[player] - remove Anime\nid: ${id}\nhasTask: ${isTask}\nvIds: ${vIds.toString()}\nsize: ${size}\ndubs: ${dubs.toString()}`);

    await clearHistory(vIds);
    await clearVideo(vIds);

    if (isTask) {
        //Если есть не завершенные загрзки
        anime.size -= size;
        await clearAnime(anime, dubs)
    } else {
        await this.db.delete("anime", { id: this.anime.id });
    }

    //Загрыть окно и удалить аниме со списков
    $(`.card-anime[data-id="${this.anime.id}"]`).remove();
    this.hide();
}

const _SEpisodes = () => {
    const SelectEpisode = (ep) => {
        ep = parseInt(ep);
        if (ep === Player.episode)
            return;
        Player.episode = ep;
        $(`.episodes-list > .episode.select`).removeClass('select');
        $(`.episodes-list > .episode[data-e="${Player.episode}"]`).addClass('select');
        Player.vId = Player.anime.video[Player.voice].episodes.find(e => e.episode === ep).vId;
        _IPlayer(Player.vId);
    };

    //Устанавливаем текущуб озвучку
    $('.btn-voice').text(Player.anime.video[Player.voice].name);

    const el = $(".episodes-list").empty();
    let e = 0;
    Player.anime.video[Player.voice].episodes.forEach(({ episode, vId, duration, size }, index) => {
        if (index === 0) {
            e = episode;
            Player.vId = vId;
        }

        el.append(`<div class="episode" data-vId="${vId}" data-e="${episode}"><div class="episode-wrapper"><div class="nummer">${episode} Episode</div><div class="info-wrapper"><div class="duartion">${formatDuration(duration)}</div><div class="size">${formatBytes(size)}</div></div></div><div class="btn remove"><div class="ticon i-trash"></div></div></div>`);
    });

    SelectEpisode(e);

    (() => {
        //Удаление аниме
        let onDelete = false;
        let element = undefined;

        const disable = () => {
            if (!element)
                return;

            element.rmstep = 0;
            $(element).removeClass("state-1");
            onDelete = false;
        }

        const enable = () => {
            if (!element)
                return;

            element.rmstep = 1;
            $(element).addClass("state-1");
            onDelete = true;
        }

        $(".episode > .btn.remove").on("click", function (e) {
            this.rmstep = this.rmstep || 0;

            if (element && element !== this) {
                disable();
            } else if (element && element === this) {
                const episode = parseInt($(this).parent('.episode').attr('data-e'));
                _REpisode.bind(Player)(episode);
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

    $(".episodes-list > .episode").on("click", function (e) {
        if ($(e.target).hasClass('remove'))
            return;

        const episode = $(this).attr('data-e');
        SelectEpisode(episode);
    });
}

/**
 * Загружает выбранный эпизод файлом
 * @this Player
 */
const _DAnime = async function () {
    this.db.get("video", { id: this.vId }).then(value => {
        const blob = new Blob(value.blobs.map(x => x.b), { type: 'video/mp2t' });
        const link = URL.createObjectURL(blob);
        const dL = document.createElement('a');
        dL.href = link;
        dL.download = `${(this.anime.name).toLocaleLowerCase()}-${this.episode}-${(this.anime.video[this.voice].name).toLocaleLowerCase()}.ts`;
        dL.click();
        URL.revokeObjectURL(dL.href);
    });
}

let __source;

const _IPlayer = (vId) => {
    const genLink = (blobs = [], { sDuration, sSequence } = {}) => {
        let file = "#EXTM3U\n#EXT-X-TARGETDURATION:" + sDuration + "\n#EXT-X-ALLOW-CACHE:YES\n#EXT-X-PLAYLIST-TYPE:VOD\n#EXT-X-VERSION:3\n#EXT-X-MEDIA-SEQUENCE:" + sSequence;
        for (let i = 0; i < blobs.length; i++) {
            const { b, t } = blobs[i];
            file += `\n#EXTINF:${t},`;
            file += `\n${URL.createObjectURL(b)}`;
        }
        file += `\n#EXT-X-ENDLIST`;
        // Создаём Blob для m3u8-файла
        const m3u8Blob = new Blob([file], { type: "application/vnd.apple.mpegurl" });
        // Генерируем URL для m3u8
        const m3u8Url = URL.createObjectURL(m3u8Blob);
        return m3u8Url;
    };

    const playBlobs = (blobs = [], m3u8) => {
        const video = /**@type {HTMLVideoElement} */ ($("video")[0]);
        const link = genLink(blobs, m3u8);

        $(".btn.play").removeClass("state-play").addClass("state-pause");

        video.disableRemotePlayback = true;
        video.controls = false;

        if (!Hls.isSupported()) {
            if (!__source) {
                __source = document.createElement("source");
                __source.type = 'application/x-mpegURL';
                video.appendChild(__source);
            }
            __source.src = link

            video.load();
        } else {
            var hls = new Hls({
                "enableWorker": true,
                "lowLatencyMode": true,
                "autoStartLoad": true
            });
            hls.loadSource(link);
            hls.attachMedia(video);
        }
    };

    Player.db.get("video", { id: vId }).then(value => {
        console.log(`[player] - get Video: ${vId}`);
        playBlobs(value.blobs, value.m3u8)
    });
}

/** @constructor **/
const Player = {
    /**@type {{}} */
    anime: undefined, //Аниме данные
    voice: undefined, //Индентификатор озвучки
    /**@type {DBControls} */
    db: undefined,
    open: false, //Открытие нового аниме
    id: 0, // Индентификатор аниме
    vId: undefined, // Индентификатор видео
    episode: 0, // Выбранный эпизод

    hide: () => {
        ($("video")[0]).pause();
        _window.hide();
        $("body").removeClass("loading");
    },

    show: function () {
        $("body").addClass("loading");

        if (!this.open)
            return;
        this.open = false;

        //Устанавливаем название вкладки
        $("#player-name").text(this.anime.name);
        //Отображаем доступные эпизоды
        this.episode = 0;
        _SEpisodes();
    },

    init: function () {
        const video = /** @type {HTMLVideoElement} */ ($("video")[0]);
        video.on = video.addEventListener;

        const buttons = () => {
            $(".btn.close#player-close").on("click", () => {
                Player.hide();
            })

            $(".btn.play").on("click", () => {
                if (video.paused)
                    video.play();
                else
                    video.pause();
            });

            $(".btn.fullscreen").on("click", () => {
                const fullscreenApi = video.requestFullscreen
                    || video.webkitRequestFullScreen
                    || video.mozRequestFullScreen
                    || video.msRequestFullscreen;

                if (fullscreenApi == undefined) {
                    if (video.webkitEnterFullscreen) {
                        video.webkitEnterFullscreen();
                    } else if (Player.requestFullscreen) {
                        video.requestFullscreen();
                    }
                }
                if (!document.fullscreenElement) {
                    fullscreenApi.call(video);
                }
                else {
                    document.exitFullscreen();
                }
            });

            $(".btn.ldownload").on("click", () => {
                _DAnime.bind(this)();
            });

            $(".btn.volume").on("click", () => video.muted = !video.muted);

            $(".btn-voice, .btn.voice").on("click", () => {
                SelectVoice(this.anime, this.voice).then(val => {
                    if (val === undefined || val === this.voice)
                        return;
                    if (val === -1)
                        return this.hide();
                    this.voice = val;
                    this.episode = 0;
                    _SEpisodes();
                });
            });

            $(".footer > .btn.delete").on("click", () => {
                CreateVerify("Удалить полностью аниме?").then(val => {
                    if (val) {
                        _RAnime.bind(this)();
                    }
                });
            });
        };

        const videoFunctions = () => {
            video.on("volumechange", () => {
                const stats = ["state-0", "state-1", "state-2", "state-off"];
                const btn = $(`.btn.volume`).removeClass(stats);
                if (video.muted) {
                    return btn.addClass(stats[3]);
                }

                if (video.volume > 0.67) {
                    return btn.addClass(stats[2]);
                } else if (video.volume < 0.67 && video.volume > 0.34) {
                    return btn.addClass(stats[1]);
                }
                return btn.addClass(stats[0]);
            });
        };

        const onFunctions = () => {
            video.on("play", () => $(".btn.play").removeClass("state-pause").addClass("state-play"));
            video.on("pause", () => $(".btn.play").removeClass("state-play").addClass("state-pause"));
        };

        const onTimeline = () => {
            const hide = () => {
                $('.player-timeline').addClass('hide');
                return false;
            }

            const show = () => {
                $('.player-timeline').removeClass('hide');
                return true;
            }

            const prcntToTime = () => {
                const prcnt = ($('.curline').width() / $('.line').width()) * 100;
                const count = (prcnt / 100) * duration;
                $('.player-timeline > .time > .cur').text(formatDuration(count));
                return count;
            }

            let showed = show(); //Отображен ли timeline

            video.on("play", () => {
                showed = hide();
            });

            video.on("pause", () => {
                showed = show();
            });

            $('.video-wrapper').on("click", () => {
                if (!showed && !video.paused) {
                    showed = show();
                }
            });

            $('.video-wrapper').on('pointerleave mouseleave', (target) => {
                if (showed && !video.paused && target.relatedTarget !== null && $(target.relatedTarget).closest('.player-timeline').length == 0) {
                    showed = hide();
                }
            });

            $('.player-controls').on('click', () => {
                if (showed && !video.paused) {
                    showed = hide();
                }
            });

            let current = 0;
            let duration = 0;
            let progress = 0;

            video.on("durationchange", () => {
                duration = video.duration;
                $('.curline').width(0);
                $('.player-timeline > .time > .full').text(formatDuration(duration));
                $('.player-timeline > .time > .cur').text(formatDuration(0));
            });

            video.on("timeupdate", () => {
                current = video.currentTime;
                progress = (current / duration) * 100;
                $('.player-timeline > .time > .cur').text(formatDuration(current));
                $(`.line > .curline`).css({ width: `${progress.toFixed(2)}%` });
            });

            let onPlayed;
            let swipe = false;

            $(`.curline > .point`).on('touchstart mousedown', (event) => {
                let e = event.originalEvent;
                const startX = (e instanceof MouseEvent ? e.clientX : e instanceof TouchEvent ? e.touches[0].clientX : 0);
                const slide = $('.curline');
                const fullWidth = slide.width();

                onPlayed = video.paused;
                if (!onPlayed)
                    video.pause();

                $(window).on('touchmove.a mousemove.a', (event) => {
                    e = event.originalEvent;
                    const currentX = (e instanceof MouseEvent ? e.clientX : e instanceof TouchEvent ? e.touches[0].clientX : 0);
                    const swipeDistance = currentX - startX;
                    swipe = true;

                    if (fullWidth + swipeDistance <= 0)
                        return;

                    slide.width(fullWidth + swipeDistance);
                    prcntToTime();
                })

                $(window).on('touchend.a mouseup.a', (e) => {
                    video.currentTime = prcntToTime();

                    $(window).off('touchmove.a mousemove.a touchend.a mouseup.a');

                    if (!onPlayed)
                        video.play();
                })
            });

            $(`.line`).on('click', (e) => {
                if (e.target.className !== "line" || swipe)
                    return swipe = false;

                const startX = e.originalEvent.layerX;
                $('.curline').css({ width: startX });
                video.currentTime = prcntToTime();
            });

            $('.points-event > .center-event').on('click', () => {
                if (video.paused)
                    video.play();
                else if (!video.paused && showed)
                    video.pause();
            });

            $('.points-event > .right-event').on('dblclick', () => {
                video.currentTime += 10;
            });

            $('.points-event > .left-event').on('dblclick', () => {
                video.currentTime -= 10;
            });
        }

        buttons();
        videoFunctions();
        onFunctions();
        onTimeline();
    },

    verif: () => { return true; },

    super: async function (id) {
        if (this.db === undefined) {
            this.db = (await TDownload.Manager()).db;
        }

        if (this.id === id) {
            return;
        }

        this.id = id;

        this.anime = await this.db.get("anime", { id: this.id });
        let dub = this.anime.video[Object.keys(this.anime.video).find(x => this.anime.video[x].episodes.length > 0)].id;
        console.log(`[player] - set Dub: ${dub}`);

        const LDB = JSON.parse(localStorage.getItem('anime-db')) || [];

        const kodikDub = LDB[this.id]?.ldata?.kodik_dub;

        if (kodikDub) {
            if (kodikDub !== dub && this.anime.video[kodikDub] !== undefined && this.anime.video[kodikDub].episodes.length > 0) {
                dub = kodikDub;
            }
        }

        this.voice = dub;
        this.open = true;
    }
}

const _window = new WindowManagement(Player, ".window-player");

export async function LoadPlayer(id) {
    await Player.super(id);
    _window.click();
    return _window;
}

export function VideoUpdate(id) {
    Player.id = 0;
    _window.hide();
}