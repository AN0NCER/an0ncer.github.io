import Hls from "../../library/hls.esm.js";
import { Component, Source } from "./utils/util.entity.js";
import { TEvents } from "./utils/util.event.js";
import { log, Logger, warn } from "./utils/util.log.js";

class Controls {
    /**
     * @param {Player} player 
     */
    constructor(player) {
        this.player = player;
        /**@type {Map<string, Component>} */
        this.list = new Map();
    }

    /**
     * @param {string} id 
     * @param {Component} component 
     * @param {Object} opts 
     */
    add(id, component, opts = {}) {
        const el = new component(this.player.video, this.player, id, opts);
        if (el instanceof Component) {
            this.list.set(el.id, el);
            try {
                el.setup(opts);
                el.init();
            } catch (e) {
                warn('Ошибка в обработке логике компонента', 'cntrl', { details: { id, opts } });
            }
        }
    }
}

class Listeners {
    /**
     * @param {Player} player 
     */
    constructor(player) {
        /// 1.Обычные события плеера
        this.bind(player.video, {
            'pause': Player.Events.PAUSE,
            'play': Player.Events.PLAY,
            'seeked': Player.Events.SEEKED,
            'seeking': Player.Events.SEEKING,
            'error': Player.Events.ERROR,
            'ended': Player.Events.ENDED,
            'ratechange': Player.Events.RATE_CHANGE,
            'enterpictureinpicture': Player.Events.ENTER_PIP,
            'leavepictureinpicture': Player.Events.EXIT_PIP,
            'loadedmetadata': Player.Events.LOAD_META_DATA,
            'progress': Player.Events.PROGRESS
        }, (dest, e) => { player.trigger(dest, e) });

        /// 2.iOS специфичные события
        this.bind(player.video, {
            'webkitbeginfullscreen': true,
            'webkitendfullscreen': false
        }, (isFull) => player.trigger(Player.Events.IOS_FULL_SCREEN_CHANGE, isFull));

        /// 3.Глобальный Fullscreen
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
            .forEach(name => document.addEventListener(name, () => {
                player.trigger(Player.Events.FULL_SCREEN_CHANGE, !!document.fullscreenElement);
            }));

        /// 4. События с дедупликацией по значению
        this.bindDeduped(player.video, {
            'durationchange': { event: Player.Events.DURATION_CHANGE, getValue: v => v.duration },
            'volumechange': { event: Player.Events.VOLUME_CHANGE, getValue: v => `${v.volume}:${v.muted}` },
            'timeupdate': { event: Player.Events.TIME_UPDATE, getValue: v => v.currentTime },
        }, (dest, e) => player.trigger(dest, e));
    }

    bind(target, eventMap, callback) {
        Object.entries(eventMap).forEach(([src, dest]) => {
            target.addEventListener(src, (e) => callback(dest, e));
        });
    }

    bindDeduped(target, eventMap, callback) {
        Object.entries(eventMap).forEach(([src, { event, getValue }]) => {
            let lastValue = undefined;
            target.addEventListener(src, (e) => {
                const value = getValue(target);
                if (value === lastValue) return;
                lastValue = value;
                callback(event, e);
            });
        });
    }
}

class Interface {

    #locks = new Set();
    /**
     * @param {Player} player 
     */
    constructor(player) {
        this.player = player;

        this.style = $PARAMETERS.player.player_color ?? 'default';
        /**@type {HTMLDivElement} */
        this.controls = this.player.root.querySelector('.video-controller');

        this.visible = true;
        this.#init();
    }

    #init() {
        if (this.player.opts.defaultUIControls) {
            this.player.video.setAttribute("controls", "controls");
            document.body.classList.add('-nocontrols');
            return; // Мы не добавляем больше события потому что стандратный контролер
        }

        //Установка цветового акцента плеера
        document.body.classList.add(`-${this.style}`);

        this.displayOrientation();

        this.player.on(Player.Events.PLAY, () => this.enableActivityListeners());
        this.player.on(Player.Events.PAUSE, () => this.disableActivityListeners());
        this.player.on(Player.Events.ENDED, () => this.forceShow());


        this.controls.addEventListener('pointerenter', () => {
            this.lock('controls');
        });

        this.controls.addEventListener('pointerleave', () => {
            this.unlock('controls');
        });
    }

    displayOrientation() {
        const body = document.body;

        let lastAngle = null;

        const update = () => {
            const angle = getAngle();
            if (angle === lastAngle) return;
            lastAngle = angle;

            body.setAttribute('angle', String(angle));
        };

        update();

        window.addEventListener('orientationchange', update, { passive: true });

        if (screen?.orientation?.addEventListener) {
            screen.orientation.addEventListener('change', update);
        }

        function getAngle() {
            let angle = screen?.orientation?.angle ?? window.orientation ?? 0;
            if (angle === -90) angle = 270;

            return angle;
        }
    }

    enableActivityListeners() {
        this.player.root.addEventListener(
            'pointermove',
            this.onActivity,
            { passive: true }
        );

        this.player.root.addEventListener(
            'touchstart',
            this.onActivity,
            { passive: true }
        );

        this.scheduleHide();
    }

    disableActivityListeners() {
        this.player.root.removeEventListener(
            'pointermove',
            this.onActivity
        );

        this.player.root.removeEventListener(
            'touchstart',
            this.onActivity
        );

        this.forceShow();
    }

    onActivity = () => {
        this.show();
        this.scheduleHide();
    }

    forceShow() {
        clearTimeout(this.hideTimer);

        this.show();
    }

    show() {
        if (this.visible)
            return;

        this.visible = true;

        document.body.classList.add('-focus');
    }

    scheduleHide() {
        clearTimeout(this.hideTimer);

        this.hideTimer = setTimeout(() => {
            this.hide();
        }, 2500);
    }

    hide() {
        if (!this.player.video.paused && this.canHide()) {
            this.visible = false;

            document.body.classList.remove('-focus');
        }
    }

    lock(name) {
        this.#locks.add(name);

        this.show();
    }

    unlock(name) {
        this.#locks.delete(name);

        this.scheduleHide();
    }

    canHide() {
        return this.#locks.size === 0;
    }
}

export class Player extends TEvents {
    static Events = {
        PAUSE: 'pause',
        PLAY: 'play',
        SEEKED: 'seeked',
        SEEKING: 'seeking',
        BUFFERED: 'buffered',
        TIME_UPDATE: 'timeupdate',
        ERROR: 'error',
        ENDED: 'ended',
        ALTERNATIVE_FULLSCREEN: 'alternativefullscreen',
        FULL_SCREEN_CHANGE: 'fullscreenchange',
        IOS_FULL_SCREEN_CHANGE: 'webkitbeginfullscreen',
        DURATION_CHANGE: 'durationchange',
        VOLUME_CHANGE: 'volumechange',
        RATE_CHANGE: 'ratechange',
        LOAD_META_DATA: 'loadedmetadata',
        ENTER_PIP: 'enterpip',
        EXIT_PIP: 'exitpip',
        SKIP: 'skip',
        TUNIM_CHANGE_EPISODE: 'tunimeepisodechange',
        TUNIM_NEXT_EPISODE: 'tunimenextepisode',
        SOURCE_LOADED: 'sourceonload',
        FOCUS: 'onplayerfocus',
        PROGRESS: 'progress',
        KODIK_LOADED: 'kodikloaded'
    }
    /**
     * @param {HTMLVideoElement} video 
     * @param {{requiredQuality:string|number, autoQualitySelect:boolean, defaultUIControls:boolean, autoFullScreen:boolean, autoEpisodeSwitch:boolean, enableMediaSession:boolean, touchControls:boolean}} [opts] 
     */
    constructor(video, opts = {}) {
        super();

        /**@type {HTMLDivElement} */
        this.root = document.getElementById('video-wrapper');
        this.video = video;
        this.hls = new Hls();

        this.opts = {
            requiredQuality: Number(opts.requiredQuality ?? 720),
            autoQualitySelect: opts.autoQualitySelect ?? true,
            autoFullScreen: opts.autoFullScreen ?? false,
            defaultUIControls: opts.defaultUIControls ?? false,
            autoEpisodeSwitch: opts.autoEpisodeSwitch ?? true,
            enableMediaSession: opts.enableMediaSession ?? true,
            touchControls: opts.touchControls ?? true
        };

        this.services = {};

        this.device = {
            isHls: Hls.isSupported(),
            isIOS: isIOS(),
            isPWA: isPWA()
        };

        this.audioLocked = true;
        this.components = new Controls(this);
        this.listeners = new Listeners(this);
        this.interface = new Interface(this);

        this.onWindowClickEvent = () => {
            log('Блокировка аудио снята', 'tplayer');
            if (this.audioLocked) {
                this.audioLocked = false;
                this.video.muted = false;
            }

            window.removeEventListener('click', this.onWindowClickEvent);
            window.removeEventListener('touchstart', this.onWindowClickEvent);
            window.removeEventListener('pointerdown', this.onWindowClickEvent);
        };

        window.addEventListener('click', this.onWindowClickEvent);
        window.addEventListener('touchstart', this.onWindowClickEvent, { passive: true });
        window.addEventListener('pointerdown', this.onWindowClickEvent);

        if (this.device.isHls) {
            this.hls.attachMedia(this.video);
        }

        // Возврат на вкладку после долгого простоя
        // Обновляем источник превентивно, пока видео на паузе.
        this.sourceLoadedAt = 0;
        const SOURCE_STALE_MS = 60 * 60 * 1000; // 1 час

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') return;
            if (!this.source || !this.video.paused) return;
            if (Date.now() - this.sourceLoadedAt < SOURCE_STALE_MS) return;

            log('Источник устарел после простоя — обновление', 'tplayer');
            this.refreshSource({ resume: false });
        });

        Logger.setOpts({ opts: this.opts, device: this.device });
    }

    /**
     * @param {Source} source
     */
    attach(source) {
        this.source = source;
        // Момент получения ссылок — по нему определяем протухание CDN-ссылок
        this.sourceLoadedAt = Date.now();

        const link = source.getSource(this.opts.requiredQuality, {
            auto: this.opts.autoQualitySelect
        });

        if (this.device.isHls) {
            this.hls.loadSource(link);
        } else {
            this.video.src = link;
        }

        this.trigger(Player.Events.SOURCE_LOADED, source);
    }

    /**
     * Перезапрашивает источник у tunime-hub БЕЗ кэша (свежие CDN-ссылки)
     * и переподключает его, сохраняя позицию и состояние воспроизведения.
     * Используется при фатальных сетевых ошибках HLS (протухшая ссылка)
     * и при возврате на вкладку после долгого простоя.
     * @param {{resume?: boolean}} [opts]
     * @returns {Promise<boolean>} удалось ли обновить
     */
    async refreshSource({ resume = true } = {}) {
        const meta = this.source?.meta;
        if (!meta) return false;

        try {
            const { Tunime } = await import("../../modules/api.tunime.js");

            const url = await meta.getLink();
            if (!url) return false;

            const payload = await Tunime.video.source(url, false); // caching=false
            if (!payload) return false;

            const source = new Source(meta, payload);
            if (source.getAvailableLabels().length === 0) return false;

            const time = this.video.currentTime;
            const paused = this.video.paused;

            this.attach(source);

            // После фатальной ошибки hls.js останавливает загрузку —
            // перезапускаем явно
            if (this.device.isHls) this.hls.startLoad();

            const onReady = () => {
                this.video.removeEventListener('loadedmetadata', onReady);
                if (time > 0 && Number.isFinite(time)) this.video.currentTime = time;
                if (!paused && resume) this.main.play();
            };
            this.video.addEventListener('loadedmetadata', onReady);

            log(`Источник обновлён без кэша. currentTime=${time}`, 'tplayer');
            return true;
        } catch (e) {
            warn('Не удалось обновить источник без кэша', 'tplayer', { details: { error: String(e) } });
            return false;
        }
    }

    main = {
        /**@type {undefined | null | Promise} */
        promise: null,
        play: () => {
            this.main.promise = this.video.play();
            log('Воспроизведение видео', 'tplayer', { details: { currentTime: this.video.currentTime } });

            if (this.main.promise !== undefined) {
                this.main.promise.then(() => {
                    this.main.promise = null;
                }).catch(err => {
                    this.main.promise = null;
                    if (err.name === 'AbortError') return;
                    throw err;
                })
            }
        }
    }
}

function isIOS() {
    const userAgent = window.navigator.userAgent.toLowerCase();

    // 1. Простая проверка User Agent для iPhone и iPod
    const classicTouch = /iphone|ipod/.test(userAgent);

    // 2. Проверка iPad (включая современные модели на iPadOS)
    // iPadOS представляется как Macintosh, поэтому проверяем наличие multi-touch
    const isIPad = /ipad/.test(userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    return classicTouch || isIPad;
};

function isPWA() {
    const app = JSON.parse(localStorage.getItem('application_installed')) ?? { installed: false }
    return app.installed;
}