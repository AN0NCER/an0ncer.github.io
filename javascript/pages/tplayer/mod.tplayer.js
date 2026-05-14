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
    /**
     * @param {Player} player 
     */
    constructor(player) {
        this.player = player;

        this.visible = true;
        this.#init();
    }

    set(val) {
        if (this.player.video.paused)
            return this.visible = true;

        return this.visible = !!val;
    }

    #init() {
        if (this.player.opts.defaultUIControls) {
            this.player.video.setAttribute("controls", "controls");
            window.document.body.classList.add('-nocontrols');
            return;
        }

        const handler = () => {
            const cl = '-focus';

            if (this.visible)
                document.body.classList.add(cl);
            else
                document.body.classList.remove(cl);

            this.player.trigger(Player.Events.FOCUS, this.visible);
        }

        (() => {
            let hideTimeout;

            const showControls = () => {
                clearTimeout(hideTimeout);

                if (this.visible !== true) {
                    this.set(true);
                    handler();
                }

                hideTimeout = setTimeout(() => {
                    if (this.set !== false) {
                        this.set(false);
                        handler();
                    }
                }, 3000);
            }

            document.addEventListener('mousemove', () => showControls());
            document.addEventListener('click', () => showControls());
        })();

        handler();
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
        }

        window.addEventListener('click', this.onWindowClickEvent);

        if (this.device.isHls) {
            this.hls.attachMedia(this.video);
        }

        Logger.setOpts({ opts: this.opts, device: this.device });
    }

    /**
     * @param {Source} source 
     */
    attach(source) {
        this.source = source;

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