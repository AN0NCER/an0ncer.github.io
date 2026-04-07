import Hls from "../../library/hls.esm.js";
import { Tunime } from "../../modules/api.tunime.js";
import { Source } from "./util.entity.js";
import { TEvents } from "./util.event.js";
import { logger } from "./util.log.js";

class Component extends TEvents {
    /**
     * @param {HTMLVideoElement} video 
     * @param {Player} player 
     * @param {string} id 
     * @param {{}} opts 
     */
    constructor(video, player, id, opts = {}) {
        super()

        this.id = id;
        this.video = video;
        this.player = player;

        this.opts = opts;
    }

    setup() { }
    init() { }
    destroy() { }
}

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
            el.setup(opts);
            el.init();
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
            'timeupdate': Player.Events.TIME_UPDATE,
            'error': Player.Events.ERROR,
            'ended': Player.Events.ENDED,
            'durationchange': Player.Events.DURATION_CHANGE,
            'volumechange': Player.Events.VOLUME_CHANGE,
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
    }

    bind(target, eventMap, callback) {
        Object.entries(eventMap).forEach(([src, dest]) => {
            target.addEventListener(src, (e) => callback(dest, e));
        })
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

                this.set(true);
                handler();

                hideTimeout = setTimeout(() => {
                    this.set(false);
                    handler();
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
        PROGRESS: 'progress'
    }
    /**
     * @param {HTMLVideoElement} video 
     * @param {{requiredQuality:string|number, autoQualitySelect:boolean, defaultUIControls:boolean, autoFullScreen:boolean, autoEpisodeSwitch:boolean, enableMediaSession:boolean}} [opts] 
     */
    constructor(video, opts = {}) {
        super();

        /**@type {HTMLDivElement} */
        this.root = document.getElementById('video-wrapper');
        this.video = video;
        this.hls = new Hls();

        this.opts = {
            requiredQuality: Number(opts.requiredQuality || 720),
            autoQualitySelect: opts.autoQualitySelect || true,
            autoFullScreen: opts.autoFullScreen || false,
            defaultUIControls: opts.defaultUIControls || false,
            autoEpisodeSwitch: opts.autoEpisodeSwitch || true,
            enableMediaSession: opts.enableMediaSession || true
        };

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
            if (this.audioLocked) {
                this.audioLocked = false;
                this.video.muted = false;
            }

            window.removeEventListener('click', this.onWindowClickEvent);
        }

        window.addEventListener('click', this.onWindowClickEvent);
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
            this.hls.attachMedia(this.video);
        } else {
            this.video.src = link;
        }

        this.trigger(Player.Events.SOURCE_LOADED, source);
    }
}

export class PictureInPicture extends Component {
    setup() {
        this.isPiPmode = false;
        this.loaded = false;
        this.supported = true;
        this.root = this.player.root;
        /**@type {HTMLDivElement} */
        this.btn = this.root.querySelector('#media-pip-button');

        const isPiPSupported =
            'pictureInPictureEnabled' in document &&
            typeof HTMLVideoElement.prototype.requestPictureInPicture === 'function';

        if (!isPiPSupported || (this.player.device.isIOS && this.player.device.isPWA)) {
            this.supported = false;
            this.btn.classList.add('-disable');
        }

        if (this.supported) {
            this.player.on(Player.Events.LOAD_META_DATA, () => {
                this.btn.classList.remove('-load');
                this.loaded = true;
            }, { once: true });

            this.player.on(Player.Events.ENTER_PIP, () => {
                this.isPiPmode = true;
            });

            this.player.on(Player.Events.EXIT_PIP, () => {
                this.isPiPmode = false;
            });
        }
    }

    init() {
        this.btn.addEventListener('click', () => {
            if (!this.supported || !this.loaded) return;

            if (!this.isPiPmode) {
                this.video.requestPictureInPicture();
            } else {
                document.exitPictureInPicture();
            }
        });
    }
}

export class Fullscreen extends Component {
    setup() {
        this.root = this.player.root;
        /**@type {HTMLDivElement} */
        this.btn = this.root.querySelector('#media-fullscreen-button');

        if (this.player.opts.autoFullScreen) {
            this.player.on(Player.Events.PLAY, () => {
                if (!document.fullscreenElement) {
                    this.toggleFullScreen();
                }
            }, { once: true });
        }
    }

    init() {
        this.btn.addEventListener('click', () => Fullscreen.toggleFullScreen(this.root, this.video));
    }

    static toggleFullScreen(root, video) {
        const container = root;

        const fullscreenApi = container.requestFullscreen
            || container.webkitRequestFullScreen
            || container.mozRequestFullScreen
            || container.msRequestFullscreen;

        if (fullscreenApi == undefined) {
            if (video.webkitEnterFullscreen) {
                video.webkitEnterFullscreen();
            } else if (Player.requestFullscreen) {
                video.requestFullscreen();
            }
        }

        if (!document.fullscreenElement) {
            fullscreenApi.call(container);
        } else {
            document.exitFullscreen();
        }
    }
}

export class Quality extends Component {
    static Events = {
        QUALITY_SELECT: 'qualityselected'
    }

    setup() {
        this.isAuto = false;
        this.quality = this.player.opts.requiredQuality;
        this.availbleQuality = [];

        this.template = {
            btn: document.getElementById('quality-btn'),
        };

        this.dom = {
            container: document.getElementById('media-quality-selectors'),
            values: document.querySelectorAll('[data-source="quality"]'),
            button: document.getElementById('media-qiality-button'),
            interact: document.querySelector('.interactive.quality-selector'),
            close: document.getElementById('media-close-quality')
        };

        this.auto(this.player.opts.autoQualitySelect);
    }

    init() {
        this.player.on(Player.Events.SOURCE_LOADED, (source) => {
            // Очистка dom от старых ресурсов качеств
            this.dom.container.replaceChildren();
            this.availbleQuality = source.getAvailableLabels();
            this.availbleQuality = this.availbleQuality.map(x => Number(x));

            this.tplCreateQuality('auto', -1, this.isAuto);

            this.availbleQuality.forEach((q) => {
                this.tplCreateQuality(`${q}p`, q);
            });
        });

        this.dom.button.addEventListener('click', () => {
            this.dom.interact.classList.remove('-hide');
        });

        this.video.addEventListener('resize', () => {
            if (this.isAuto) {
                const quality = this.detectQuality(this.video);

                this.dom.values.forEach(element => {
                    element.textContent = `${quality}p`
                });
            }
        });

        this.dom.container.addEventListener('click', (e) => {
            /**@type {HTMLDivElement} */
            const btn = e.target.closest('.btn-quality');
            if (btn) {
                const value = Number(btn.dataset.id);
                this.changeQuality(value);
                this.dom.interact.classList.add('-hide');
            }
        });

        this.dom.close.addEventListener('click', () => {
            this.dom.interact.classList.add('-hide');
        })
    }

    auto(value) {
        this.isAuto = value;

        if (this.isAuto) {
            this.dom.button.classList.add('-auto');
        } else {
            this.dom.button.classList.remove('-auto');
        }
    }

    tplCreateQuality(label, id, selected = false) {
        const clone = this.template.btn.content.cloneNode(true);
        const btn = clone.querySelector('.btn-quality');
        btn.querySelector('.text').textContent = label;
        btn.dataset.id = id;
        this.dom.container.appendChild(clone);

        if (selected) {
            btn.classList.add('-select');
        }
    }

    changeQuality(quality) {
        const isAuto = quality === -1;
        this.auto(isAuto);

        if (this.player.device.isHls) {
            this.setPreferredQuality(this.player.hls, quality);
        } else {
            const time = this.video.currentTime;
            const onpaused = this.video.paused;

            this.player.on(Player.Events.LOAD_META_DATA, () => {
                this.video.currentTime = time;
                if (!onpaused) this.video.play();
            }, { once: true });

            if (isAuto) {
                this.video.src = this.player.source.getSource(this.availbleQuality[0], { auto: true });
            } else {
                this.video.src = this.player.source.getBestMatch(quality);
            }
        }

        if (!isAuto) {
            this.dom.values.forEach(element => {
                element.textContent = `${quality}p`
            });
        }

        this.dom.container.querySelector('.-select').classList.remove('-select');
        this.dom.container.querySelector(`[data-id="${quality}"]`).classList.add('-select');
    }

    setPreferredQuality(hls, targetHeight) {
        if (!hls.levels || !hls.levels.length) return;

        // авто режим
        if (targetHeight === -1) {
            hls.currentLevel = -1;
            return;
        }

        const levels = hls.levels;

        const sorted = levels
            .map((l, i) => ({ index: i, height: l.height }))
            .sort((a, b) => a.height - b.height);

        let selected = sorted[0];

        for (const level of sorted) {
            if (level.height <= targetHeight) {
                selected = level;
            } else {
                break;
            }
        }

        hls.currentLevel = selected.index;
    }

    detectQuality(video) {
        const h = video.videoHeight;
        let closest = this.availbleQuality[0];

        for (const q of this.availbleQuality) {
            if (Math.abs(q - h) < Math.abs(closest - h)) {
                closest = q;
            }
        }

        return closest;
    }
}

export class PlayButton extends Component {
    setup() {
        /**@type {HTMLDivElement} */
        this.btn = this.player.root.querySelector('#media-play-button');

        this.player.on(Player.Events.PLAY, () => {
            logger.log('VIDEO', `Video on played`, { paused: this.video.paused, time: this.video.currentTime });
            this.btn.classList.add('-pause');
        });

        this.player.on(Player.Events.PAUSE, () => {
            logger.log('VIDEO', `Video on paused`, { paused: this.video.paused, time: this.video.currentTime });
            this.btn.classList.remove('-pause');
        });

        logger.log('INFO', '[component] PlayButton init');
    }

    init() {
        this.btn.addEventListener('click', () => {
            logger.log('CLICK', 'Set Player playback to ' + !this.video.paused);
            if (this.video.paused) {
                this.video.play();
            } else {
                this.video.pause();
            }
        });
    }
}

export class Timer extends Component {
    setup() {
        this.current = this.player.root.querySelector('#media-current-time');
        this.duration = this.player.root.querySelector('#media-source-duration');
    }

    init() {
        this.player.on(Player.Events.TIME_UPDATE, () => {
            this.current.textContent = this.formatTime(this.video.currentTime);
        });
        this.player.on(Player.Events.DURATION_CHANGE, () => {
            this.duration.textContent = this.formatTime(this.video.duration);
        });
    }

    formatTime(seconds) {
        seconds = Math.floor(seconds); // отбрасываем дробную часть
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        const twoDigits = (num) => num.toString().padStart(2, '0');

        if (h > 0) {
            return `${h}:${twoDigits(m)}:${twoDigits(s)}`;
        } else {
            return `${twoDigits(m)}:${twoDigits(s)}`;
        }
    }
}

export class ProgressBar extends Component {
    setup() {
        this.bar = document.getElementById('media-progress-bar');
        this.load = document.getElementById('media-load-bar');
        this.controller = document.querySelector('.video-timeline-controller');
        /**@type {HTMLDivElement} */
        this.container = document.querySelector('.progress-bar-wrapper');

        this.duration = 0;
        this.isDragging = false;
        this.isFocus = false;
        this.wasPlayingBeforeDrag = false;

        this.player.on(Player.Events.DURATION_CHANGE, () => {
            this.duration = this.video.duration;
            this.container.classList.add('-hide');
            this.player.on(Player.Events.PLAY, () => {
                this.container.classList.remove('-hide');
            }, { once: true });
        });

        //буферизация
        const onBuf = () => {
            const bufferedRanges = this.video.buffered;

            if (bufferedRanges.length > 0) {
                const loadedTime = bufferedRanges.end(bufferedRanges.length - 1);
                const percent = Math.min(Math.max(0, (loadedTime / this.duration)), 1);
                this.load.style.width = percent * 100 + '%';
            }
        }

        if (this.player.device.isHls) {
            this.player.hls.on(Hls.Events.BUFFER_APPENDED, () => onBuf());
        } else {
            console
            this.player.on(Player.Events.PROGRESS, () => onBuf());
        }
    }

    init() {
        // Обновление прогресса при проигрывания
        this.player.on(Player.Events.TIME_UPDATE, () => {
            if (!this.isDragging) {
                this.updateBarWidth(this.video.currentTime / this.duration);
            }
        });

        // Показ/скрытие контроллера
        this.container.addEventListener('mouseenter', () => this.openController());
        this.container.addEventListener('mouseleave', () => this.closeController());
        this.container.addEventListener('touchstart', (event) => {
            event.stopPropagation();
            this.openController();
        });

        // Логика перетаскивания
        // Десктопные события
        this.controller.addEventListener('mousedown', (e) => this.startDragging(e));

        // Мобильные события
        this.controller.addEventListener('touchstart', (e) => this.startDragging(e), { passive: false });

        // Общие обработчики (для удаления)
        this.moveHandler = (e) => this.drag(e);
        this.stopHandler = (e) => this.stopDragging(e);
        this.onTouchOut = (e) => this.handleOutsideTouch(e);
    }

    //Управление отображением прогресс бара

    handleOutsideTouch(event) {
        if (!this.container.contains(event.target)) {
            event.stopPropagation();
            this.closeController();
        }
    }

    openController() {
        if (this.controller.classList.contains('-enter')) return; // Уже открыто — ничего не делаем

        this.isFocus = true;
        this.controller.classList.add('-enter');
        this.player.root.classList.add('--bar');
        // Вешаем слушатель на окно только сейчас
        window.addEventListener('touchstart', this.onTouchOut);
    }

    closeController() {
        this.isFocus = false;
        this.controller.classList.remove('-enter');
        this.player.root.classList.remove('--bar');
        // Удаляем слушатель, так как он больше не нужен
        window.removeEventListener('touchstart', this.onTouchOut);
    }

    //---------------------------------------

    getClientX(e) {
        return e.touches ? e.touches[0].clientX : e.clientX;
    }

    calculateProgress(clientX) {
        const rect = this.controller.getBoundingClientRect();
        const offset = clientX - rect.left;
        return Math.min(Math.max(0, offset / rect.width), 1);
    }

    updateBarWidth(ratio) {
        this.bar.style.width = `${ratio * 100}%`;
    }

    startDragging(e) {
        if (!this.duration) return;

        if (e.type === 'touchstart') e.preventDefault();

        this.isDragging = true;
        this.wasPlayingBeforeDrag = !this.video.paused;
        this.video.play();
        this.video.pause();

        this.updateBarWidth(this.calculateProgress(this.getClientX(e)));

        window.addEventListener('mousemove', this.moveHandler);
        window.addEventListener('touchmove', this.moveHandler, { passive: false });
        window.addEventListener('mouseup', this.stopHandler);
        window.addEventListener('touchend', this.stopHandler);
    }

    drag(e) {
        if (!this.isDragging) return;

        // Предотвращаем стандартное поведение
        if (e.cancelable) e.preventDefault();

        const progress = this.calculateProgress(this.getClientX(e));
        requestAnimationFrame(() => this.updateBarWidth(progress));
    }

    stopDragging(e) {
        if (!this.isDragging) return;
        this.isDragging = false;

        const finalX = e.changedTouches ? e.changedTouches[0].clientX : this.getClientX(e);
        const progress = this.calculateProgress(finalX);

        this.video.currentTime = progress * this.duration;
        console.log(this.video.currentTime, progress * this.duration);

        if (this.wasPlayingBeforeDrag) {
            this.video.play();
        }

        window.removeEventListener('mousemove', this.moveHandler);
        window.removeEventListener('touchmove', this.moveHandler);
        window.removeEventListener('mouseup', this.stopHandler);
        window.removeEventListener('touchend', this.stopHandler);
    }
}

export class Volume extends Component {
    setup() {
        this.dom = {
            btns: document.querySelectorAll('[data-type="volume-btn"]'),
            bars: document.querySelectorAll('[data-type="volume-slider"]'),
            value: document.querySelectorAll('[data-source="volume"]'),
            tags: document.querySelectorAll('[data-type="volume-tag"]'),
            close: document.getElementById('media-close-volume')
        };

        this.interact = document.getElementById('media-volume-interactive');
        this.container = document.getElementById('media-volume-container');
        this.btn = document.getElementById('media-volume-btn');

        this.classList = ['v-100', 'v-50', 'v-0'];

        this.player.on(Player.Events.PLAY, () => {
            this.updateMute();
        });

        this.player.on(Player.Events.VOLUME_CHANGE, () => {
            this.updateMute();

            requestAnimationFrame(() => this.updateBarWidth(this.video.volume));

            this.dom.btns.forEach(element => {
                element.classList.remove(...this.classList);

                if (this.video.muted) {
                    element.classList.add('-mute');
                } else {
                    element.classList.remove('-mute');
                }

                if (this.video.volume < 0.2) {
                    element.classList.add(this.classList[2]);
                } else if (this.video.volume > 0.2 && this.video.volume < 0.5) {
                    element.classList.add(this.classList[1]);
                } else {
                    element.classList.add(this.classList[0]);
                }
            });
        });

        this.isDragging = false;
        this.dragElement = null;

        // Общие обработчики (для удаления)
        this.moveHandler = (e) => this.drag(e);
        this.stopHandler = (e) => this.stopDragging(e);

        this.updateBarWidth(this.video.volume);

        this.dom.bars.forEach(target => {
            // Логика перетаскивания
            // Десктопные события
            target.addEventListener('mousedown', (e) => this.startDragging(e));
            // Мобильные события
            target.addEventListener('touchstart', (e) => this.startDragging(e));
        });
    }

    init() {
        this.btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.player.device.isIOS) return;
            this.interact.classList.remove('-hide');
        });

        (() => {
            let t;

            const cancel = () => {
                clearTimeout(t);
                window.removeEventListener('touchend', cancel);
            }

            this.btn.addEventListener('touchstart', () => {
                if (this.player.device.isIOS) return;

                t = setTimeout(() => {
                    this.interact.classList.remove('-hide');
                    cancel();
                }, 1000);

                window.addEventListener('touchend', cancel);
            });
        })();


        this.dom.btns.forEach(target => {
            target.addEventListener('click', () => {
                if (this.video.muted) {
                    this.video.muted = false;
                } else {
                    this.video.muted = true;
                }
            });
        });

        this.container.addEventListener('mouseenter', () => {
            if (document.body.offsetWidth > 700 && !this.player.device.isIOS) {
                this.container.classList.add('-show');
            }
        });

        this.container.addEventListener('mouseleave', () => {
            this.container.classList.remove('-show');
        });

        this.dom.close.addEventListener('click', () => {
            this.interact.classList.add('-hide');
        });
    }

    updateMute() {
        if (this.video.muted) {
            this.btn.classList.add('-mute');

            if (this.player.audioLocked) {
                this.dom.tags.forEach(el => {
                    el.textContent = 'live';
                    el.classList.add('-show');
                });
            } else {
                this.dom.tags.forEach(el => {
                    el.textContent = 'mute';
                    el.classList.add('-show');
                });
            }

        } else {
            this.dom.tags.forEach(el => {
                el.classList.remove('-show');
            });
        }
    }

    startDragging(e) {
        if (e.type === 'touchstart') e.preventDefault();

        this.isDragging = true;

        this.dragElement = e.currentTarget;
        this.video.volume = this.calculateProgress(this.getClientX(e));

        window.addEventListener('mousemove', this.moveHandler);
        window.addEventListener('mouseup', this.stopHandler);
    }

    drag(e) {
        if (!this.isDragging) return;

        // Предотвращаем стандартное поведение
        if (e.cancelable) e.preventDefault();

        const progress = this.calculateProgress(this.getClientX(e));
        this.video.volume = progress;
    }

    stopDragging(e) {
        if (!this.isDragging) return;
        this.isDragging = false;

        const finalX = e.changedTouches ? e.changedTouches[0].clientX : this.getClientX(e);
        const progress = this.calculateProgress(finalX);

        this.video.volume = progress;

        window.removeEventListener('mousemove', this.moveHandler);
        // window.removeEventListener('touchmove', this.moveHandler);
        window.removeEventListener('mouseup', this.stopHandler);
        // window.removeEventListener('touchend', this.stopHandler);
    }

    updateBarWidth(ratio) {
        this.video.volume = ratio;
        this.dom.value.forEach(el => {
            el.style.width = `${ratio * 100}%`;
        });
    }

    calculateProgress(clientX) {
        const rect = this.dragElement.getBoundingClientRect();
        const offset = clientX - rect.left;
        return Math.min(Math.max(0, offset / rect.width), 1);
    }

    getClientX(e) {
        return e.touches ? e.touches[0].clientX : e.clientX;
    }
}

export class Loader extends Component {
    setup() {
        this.player.on(Player.Events.DURATION_CHANGE, () => {
            document.querySelector('.video-loader').classList.add('-hide');
        });
    }
}

export class Switch extends Component {
    setup() {
        this.player.on(Player.Events.ENDED, () => {
            this.player.trigger(Player.Events.TUNIM_CHANGE_EPISODE, undefined);
        });

        this.player.on(Player.Events.TUNIM_NEXT_EPISODE, async (episode) => {

            const meta = this.player.source.meta;
            meta.episode = episode;

            const url = await meta.getLink();
            const src = await Tunime.video.source(url);
            const source = new Source(meta, src)

            this.player.on(Player.Events.DURATION_CHANGE, () => {
                this.video.play();
            }, { once: true });

            this.player.attach(source);
        });
    }
}

export class Media extends Component {
    setup() {
        if ("mediaSession" in navigator && this.player.opts.enableMediaSession) {
            this.player.on(Player.Events.SOURCE_LOADED, async () => {
                try {
                    const response = await fetch(`https://api.jikan.moe/v4/anime/${this.player.source.meta.animeId}/full`);

                    if (!response.ok)
                        return;

                    const raw = await response.json();

                    let metadata = {
                        title: this.player.source.meta.titleAnime,
                        artist: this.player.source.meta.titleVoice,
                        album: "Tunime",
                        artwork: [
                            {
                                src: raw.data.images.jpg.large_image_url,
                                sizes: "512x512",
                                type: "image/png"
                            },
                            {
                                src: './images/icons/logo-x256-o.png',
                                sizes: "256x256",
                                type: "image/png"
                            }
                        ]
                    };

                    navigator.mediaSession.metadata = new MediaMetadata(metadata);
                } catch (err) {
                    console.log(err);
                }
            });
        }
    }
}

export class Keyboard extends Component {
    setup() {
        document.addEventListener('keydown', (e) => {
            const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
            if (isTyping) return;

            switch (e.code) {

                case 'Space':
                case 'KeyK':
                    e.preventDefault();
                    this.togglePlay();
                    break;

                case 'ArrowLeft':
                case 'KeyJ':
                    e.preventDefault();
                    this.seek(-10);
                    break;

                case 'ArrowRight':
                case 'KeyL':
                    e.preventDefault();
                    this.seek(10);
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    this.volume(0.1);
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    this.volume(-0.1);
                    break;

                case 'KeyF':
                    this.toggleFullScreen();
                    break;

                case 'KeyM':
                    this.toggleMute();
                    break;
            }
        })
    }

    toggleMute() {
        this.video.muted = !this.video.muted;
    }

    togglePlay() {
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
    }

    toggleFullScreen() {
        Fullscreen.toggleFullScreen(this.player.root, this.video);
    }

    seek(s) {
        this.video.currentTime = Math.max(0, this.video.currentTime + s);
    }

    volume(v) {
        this.video.volume = Math.max(0, Math.min(1, this.video.volume + v));
    }
}

export class Skips extends Component {
    static regex = /(\d+):(\d+)-(\d+):(\d+)/;

    setup() {
        this.skips = [];
        this.currentSkip = null;
        this.btn = document.querySelector('.skip-moment-wrapper');

        this.player.on(Player.Events.SOURCE_LOADED, () => {
            this.skips = [];

            if (this.player.source.skips) {
                this.player.source.skips.forEach(raw => {
                    const match = raw.match(Skips.regex);
                    if (match) {
                        const from = parseInt(match[1]) * 60 + parseInt(match[2]);
                        const to = parseInt(match[3]) * 60 + parseInt(match[4]);
                        this.skips.push({ from, to });
                    }
                });
            }
        });
    }

    init() {
        let lastCheckTime = -1;

        this.player.on(Player.Events.TIME_UPDATE, () => {
            if (this.skips.length <= 0) return;

            const time = this.video.currentTime;

            if (Math.floor(time) === lastCheckTime) return;
            lastCheckTime = Math.floor(time);

            // Ищем, находимся ли мы сейчас в зоне пропуска
            const activeSkip = this.skips.find(x => time >= x.from && time <= x.to);

            if (activeSkip === this.currentSkip) return;
            this.currentSkip = activeSkip;

            if (activeSkip) {
                this.btn.classList.add('visible');
            } else {
                this.btn.classList.remove('visible');
            }
        });

        this.btn.addEventListener('click', () => {
            if (this.currentSkip) {
                // Перематываем видео на конец отрезка
                this.video.currentTime = this.currentSkip.to;

                // Скрываем кнопку сразу после нажатия
                this.btn.style.display = 'none';
                this.currentSkip = null;
            }
        })
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