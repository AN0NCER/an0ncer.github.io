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
            'seeking': Player.Events.SEEKING,
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
                    Fullscreen.toggleFullScreen(this.root, this.video);
                }
            }, { once: true });
        }

        this.player.on(Player.Events.FULL_SCREEN_CHANGE, (isFull) => {
            if (isFull) {
                this.root.classList.add('-full-screen');
            } else {
                this.root.classList.remove('-full-screen');
            }
        });
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
        this.dom.values.forEach(element => {
            element.textContent = `${this.quality}p`
        });

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
            this.player.on(Player.Events.PROGRESS, () => onBuf());
        }

        this.player.on(Player.Events.SOURCE_LOADED, () => {
            const source = this.player.source;

            const thumb = document.getElementById('media-thumbinal-preview');
            const timestamp = document.getElementById('media-timestamp-preview');
            const preview = thumb.querySelector('.preview');
            const cache = document.getElementById('media-cache-thumbinals');

            this.tiles = {
                disable: (!source.tiles.pattern || !source.tiles.interval || !source.tiles.width) || !this.opts.preview,
                pattern: source.tiles?.pattern,
                interval: source.tiles?.interval,
                width: source.tiles?.width,
                height: 90,
                x: source.tiles?.x,
                y: source.tiles?.y
            };

            if (this.tiles.disable) {
                thumb.classList.add('-nopreview');
            } else {
                thumb.classList.remove('-nopreview');
            }

            const tiles = this.tiles;

            /**@type {Map<string,'loaded'|'loading'>} */
            const imageCache = new Map();

            /**
             * Очистка от старых кешей
             */
            function clearCache() {
                cache.innerHTML = '';
                imageCache.clear();
            }


            function preloadSheet(index) {
                if (index <= 0) return;

                const paddedIndex = String(index).padStart(4, '0');
                const url = tiles.pattern.replace('{index}', paddedIndex);

                if (imageCache.has(url)) return;

                imageCache.set(url, 'loading');

                const hiddenImg = document.createElement('img');
                hiddenImg.classList.add('tile-cache-item');
                hiddenImg.style.display = 'none';

                hiddenImg.onload = () => {
                    imageCache.set(url, 'loaded');
                };

                hiddenImg.onerror = () => {
                    // Убираем из Map чтобы можно было перепопробовать при необходимости
                    imageCache.delete(url);
                    hiddenImg.remove();
                };

                hiddenImg.src = url;
                cache.appendChild(hiddenImg);
            }

            clearCache();

            if (this.tiles.disable) {
                this.updateThumb = (seconds) => {
                    timestamp.textContent = this.formatTime(seconds);
                }
            } else {
                // Последний успешно отображённый стейт
                let lastLoadedSrc = null;
                let lastLoadedPos = { x: 0, y: 0 };

                this.updateThumb = (seconds) => {
                    //Математика кадров
                    const frameIndex = Math.floor(seconds / this.tiles.interval);
                    const framesPerSheet = this.tiles.x * this.tiles.y; // 25

                    // Номер файла (tiles0001, tiles0002...)
                    const fileIndex = Math.floor(frameIndex / framesPerSheet) + 1;
                    const paddedIndex = String(fileIndex).padStart(4, '0');
                    const currentUrl = this.tiles.pattern.replace('{index}', paddedIndex);

                    // Позиция внутри файла
                    const indexInSheet = frameIndex % framesPerSheet;
                    const col = indexInSheet % this.tiles.x;
                    const row = Math.floor(indexInSheet / this.tiles.x);

                    const posX = -(col * this.tiles.width);
                    const posY = -(row * this.tiles.height);

                    // Ставим URL только если он реально изменился (экономим ресурсы)
                    const newSrc = `url("${currentUrl}")`;

                    // Подгружаем соседние листы при смене файла
                    if (thumb.style.getPropertyValue('--src') !== newSrc) {
                        preloadSheet(fileIndex - 1);
                        preloadSheet(fileIndex);
                        preloadSheet(fileIndex + 1);
                    }

                    // Показываем кадр только если лист уже загружен
                    if (imageCache.get(currentUrl) === 'loaded') {
                        thumb.style.setProperty('--src', newSrc);
                        preview.style.backgroundPosition = `${posX}px ${posY}px`;

                        // Запоминаем последний удачный стейт
                        lastLoadedSrc = newSrc;
                        lastLoadedPos = { x: posX, y: posY };
                    } else {
                        // Лист ещё грузится — держим последний удачный кадр
                        if (lastLoadedSrc) {
                            thumb.style.setProperty('--src', lastLoadedSrc);
                            preview.style.backgroundPosition = `${lastLoadedPos.x}px ${lastLoadedPos.y}px`;
                        }
                    }

                    timestamp.textContent = this.formatTime(seconds);
                }
            }
        });
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
        if (!ratio) return;
        this.controller.style.setProperty('--mouse-percent', `${ratio * 100}%`);
    }

    startDragging(e) {
        if (!this.duration) return;

        if (e.type === 'touchstart') e.preventDefault();

        this.isDragging = true;
        this.wasPlayingBeforeDrag = !this.video.paused;
        this.video.play();
        this.video.pause();

        this.controller.classList.add('-drag');
        const progress = this.calculateProgress(this.getClientX(e));
        this.updateBarWidth(progress);
        this.updateThumb(progress * this.duration);

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
        requestAnimationFrame(() => {
            this.updateBarWidth(progress)
            this.updateThumb(progress * this.duration);
        });
    }

    stopDragging(e) {
        if (!this.isDragging) return;
        this.isDragging = false;

        this.controller.classList.remove('-drag');
        const finalX = e.changedTouches ? e.changedTouches[0].clientX : this.getClientX(e);
        const progress = this.calculateProgress(finalX);

        this.video.currentTime = progress * this.duration;

        if (this.wasPlayingBeforeDrag) {
            this.video.play();
        }

        window.removeEventListener('mousemove', this.moveHandler);
        window.removeEventListener('touchmove', this.moveHandler);
        window.removeEventListener('mouseup', this.stopHandler);
        window.removeEventListener('touchend', this.stopHandler);
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

export class Volume extends Component {
    setup() {
        this.dom = {
            btns: document.querySelectorAll('[data-type="volume-btn"]'),
            bars: document.querySelectorAll('[data-type="volume-slider"]'),
            value: document.querySelectorAll('[data-source="volume"]'),
            tags: document.querySelectorAll('[data-type="volume-tag"]'),
            close: document.getElementById('media-close-volume'),
            presets: document.getElementById('media-presets-volume')
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

        // Состояния громкости
        (() => {
            // Константы ключей
            const SESSION_KEY = 'tvolume_default';
            const LOCAL_KEY = 'tvolume_presets';

            // Загружаем данные
            const sessionVal = JSON.parse(sessionStorage.getItem(SESSION_KEY));
            const localPresets = JSON.parse(localStorage.getItem(LOCAL_KEY)) || {
                speakers: 0.5,
                headphones: 0.3
            };

            // Определяем, какой тип был выбран последним
            const currentType = sessionStorage.getItem('tvolume_active_type') ?? 'default';

            this.state = {
                type: currentType,
                value: currentType === 'default'
                    ? (sessionVal ?? 1)
                    : (localPresets[currentType] ?? 0.5)
            };

            // Метод для смены типа
            this.setPreset = (type) => {
                this.dom.presets.querySelector('.-select')?.classList.remove('-select');
                this.state.type = type;
                if (type === 'default') {
                    this.state.value = JSON.parse(sessionStorage.getItem(SESSION_KEY)) ?? 1;
                } else {
                    this.state.value = localPresets[type] ?? 0.5;
                }
                this.video.volume = this.state.value;
                sessionStorage.setItem('tvolume_active_type', type);
                this.dom.presets.querySelector(`.btn[data-id="${type}"]`)?.classList.add('-select');
            };

            let updateHandler = null;

            this.setPreset(this.state.type);

            this.player.on(Player.Events.VOLUME_CHANGE, () => {
                clearTimeout(updateHandler);

                updateHandler = setTimeout(() => {
                    this.state.value = this.video.volume;
                    if (this.state.type === 'default') {
                        sessionStorage.setItem(SESSION_KEY, this.video.volume);
                    } else {
                        localPresets[this.state.type] = this.video.volume;
                        localStorage.setItem(LOCAL_KEY, JSON.stringify(localPresets));
                    }
                }, 400);
            });

            this.dom.presets.addEventListener('click', (e) => {
                /**@type {HTMLDivElement} */
                const btn = e.target.closest('.btn[data-id]');
                if (btn) {
                    const id = btn.dataset.id;
                    if (id === this.state.type) {
                        return this.setPreset('default');
                    }
                    return this.setPreset(id);
                }
            })
        })();
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
        this.loader = document.querySelector('.video-loader');
        this.runame = document.querySelector('.title-wrapper > .ru');
        this.enname = document.querySelector('.title-wrapper > .eng');
        this.episode = document.querySelector('.meta > .episode');
        this.voice = document.querySelector('.meta > .voice');
        this.quality = document.querySelector('.meta > .q');
    }

    init() {
        this.player.on(Player.Events.KODIK_LOADED, (meta) => {
            this.runame.textContent = meta.titleAnime;
            this.enname.textContent = meta.titleOrig;
            this.episode.textContent = `Эпизод ${meta.episode} из ${meta.lastEpisode}`;
            this.voice.textContent = meta.titleVoice;
            this.quality.textContent = meta.quality;

            this.loader.style.setProperty('--src', `url("${meta?.screenshots[0]}")`);
        });

        this.player.on(Player.Events.DURATION_CHANGE, () => {
            this.loader.classList.add('-hide');
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
    init() {
        this.player.on(Player.Events.SOURCE_LOADED, () => {
            this.clearPreview();

            const thumbnails = this.player.source.thumbinals;
            if (thumbnails && thumbnails.length > 0) {
                this.startAutoPreview(thumbnails);
            }
        })

        this.player.on(Player.Events.PLAY, () => {
            this.clearPreview();
        });
    }

    startAutoPreview(images) {
        const container = this.player.root;

        const previewWrapper = document.createElement('div');
        previewWrapper.classList.add('preview-animation-wrapper');

        const imageElements = images.map((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            img.classList.add('preview-img');
            if (index === 0) img.classList.add('active');
            previewWrapper.appendChild(img);
            return img;
        });

        container.appendChild(previewWrapper);

        let currentIndex = 0;

        // Запускаем бесконечный цикл
        this.previewInterval = setInterval(() => {
            imageElements[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % imageElements.length;
            imageElements[currentIndex].classList.add('active');
        }, 5000);
    }

    clearPreview() {
        // Останавливаем таймер
        if (this.previewInterval) {
            clearInterval(this.previewInterval);
            this.previewInterval = null;
        }
        // Удаляем старую обертку из DOM
        const oldWrapper = this.player.root.querySelector('.preview-animation-wrapper');
        if (oldWrapper) {
            oldWrapper.remove();
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
            this.player.components.list.get('visualfeedback')?.showIcon('play');
        } else {
            this.video.pause();
            this.player.components.list.get('visualfeedback')?.showIcon('pause');
        }
    }

    toggleFullScreen() {
        Fullscreen.toggleFullScreen(this.player.root, this.video);
    }

    seek(s) {
        this.video.currentTime = Math.max(0, this.video.currentTime + s);
        this.player.components.list.get('visualfeedback')?.showIcon(s === 10 ? 'right' : 'left');
    }

    volume(v) {
        this.video.volume = Math.max(0, Math.min(1, this.video.volume + v));
        this.player.components.list.get('visualfeedback')?.showIcon('volume', this.video.volume);

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

        console.log(this.opts);
    }

    init() {
        let lastCheckTime = -1;

        this.player.on(Player.Events.TIME_UPDATE, () => {
            if (this.skips.length <= 0) return;

            const time = this.video.currentTime;

            if (Math.floor(time) === lastCheckTime) return;
            lastCheckTime = Math.floor(time);

            // Ищем, находимся ли мы сейчас в зоне пропуска
            const activeSkip = this.skips.find(x => time >= x.from && time <= (x.to - 1));

            if (activeSkip === this.currentSkip) return;
            this.currentSkip = activeSkip;

            if (activeSkip) {
                this.btn.classList.remove('-hide');
            } else {
                this.btn.classList.add('-hide');
            }
        });

        this.btn.addEventListener('click', () => {
            if (this.currentSkip) {
                // Перематываем видео на конец отрезка
                this.video.currentTime = this.currentSkip.to;

                // Скрываем кнопку сразу после нажатия
                this.btn.classList.add('-hide');
                this.currentSkip = null;
            }
        });

        if (this.opts?.seeking) {
            let previousTime = 0;

            this.player.on(Player.Events.TIME_UPDATE, () => {
                if (!this.video.seeking) {
                    previousTime = this.video.currentTime;
                }
            });

            this.player.on(Player.Events.SEEKING, () => {
                const currentTime = this.video.currentTime;

                if (this.currentSkip && currentTime > previousTime) {
                    // Перематываем видео на конец отрезка
                    this.video.currentTime = this.currentSkip.to;

                    // Скрываем кнопку сразу после нажатия
                    this.btn.classList.add('-hide');
                    this.currentSkip = null;
                }
            });
        }
    }
}

export class Touch extends Component {
    setup() {
        this.overlay = this.player.root.querySelector('#gesture-overlay');

        // Состояние для перемотки
        this.lastTaps = { left: 0, right: 0 };
        this.doubleTapDelay = 300;
        this.longPressDelay = 1000;

        this.longPressTimer = null;
        this.isSpeedUp = false;
        this.startY = 0;
        this.isSwiping = false;
    }

    init() {
        const leftZone = this.overlay.querySelector('.left');
        const centerZone = this.overlay.querySelector('.center');
        const rightZone = this.overlay.querySelector('.right');

        // ЦЕНТР: Мгновенная пауза
        centerZone.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.togglePlay();
        });

        // ЛЕВО: Только двойной тап
        leftZone.addEventListener('pointerdown', (e) => this.handleTap(e, 'left'));

        // ПРАВО: Двойной тап + Громкость + Ускорение
        rightZone.addEventListener('pointerdown', (e) => {
            rightZone.setPointerCapture(e.pointerId);

            this.startY = e.clientY;
            this.startX = e.clientX; // Добавим X, чтобы проверять общее смещение
            this.isSwiping = false;
            this.isSpeedUp = false; // Сброс при каждом нажатии

            this.handleTap(e, 'right');

            // Запуск таймера ускорения
            this.longPressTimer = setTimeout(() => {
                // Активируем ускорение, только если мы НЕ начали свайпать
                if (!this.isSwiping) {
                    this.startSpeedUp();
                }
            }, this.longPressDelay);

            rightZone.setPointerCapture(e.pointerId);
        });

        rightZone.addEventListener('pointermove', (e) => {
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Если ускорение уже активно, игнорируем любые движения для громкости
            if (this.isSpeedUp) return;

            if (!rightZone.hasPointerCapture(e.pointerId)) return;

            const diffY = this.startY - e.clientY;
            const diffX = this.startX - e.clientX;
            const totalMovement = Math.sqrt(diffX * diffX + diffY * diffY);

            // Если палец сдвинулся больше чем на 20px — это осознанный свайп
            if (totalMovement > 20 && !this.player.device.isIOS) {
                this.isSwiping = true;
                this.cancelLongPress(); // Отменяем будущий запуск ускорения

                // Меняем громкость только если есть движение по вертикали
                if (Math.abs(diffY) > 5) {
                    this.changeVolume(diffY > 0 ? 0.02 : -0.02);
                    this.startY = e.clientY;
                }
            }
        });

        rightZone.addEventListener('pointerup', (e) => {
            this.stopEverything(e);
        });

        rightZone.addEventListener('pointercancel', (e) => {
            this.stopEverything(e);
        });
    }

    // --- Логика ускорения ---
    startSpeedUp() {
        if (this.isSwiping) return; // Не ускоряем, если идет свайп громкости
        this.isSpeedUp = true;
        this.video.playbackRate = 2.0;
        this.player.components.list.get('visualfeedback')?.showIcon('speed2x');
    }

    stopEverything(e) {
        this.cancelLongPress();

        if (this.isSpeedUp) {
            this.video.playbackRate = 1.0;
            this.isSpeedUp = false;
            this.player.components.list.get('visualfeedback')?.showIcon('speed1x');
        }

        this.isSwiping = false;

        if (e && e.target.hasPointerCapture(e.pointerId)) {
            e.target.releasePointerCapture(e.pointerId);
        }
    }

    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    // --- Остальные методы ---
    handleTap(e, side) {
        const now = Date.now();
        if (now - this.lastTaps[side] < this.doubleTapDelay) {
            this.video.currentTime += (side === 'right' ? 10 : -10);
            this.cancelLongPress(); // Двойной тап отменяет лонгпресс
            this.lastTaps[side] = 0;
            this.showFeedback(side);
        } else {
            this.lastTaps[side] = now;
        }
    }

    togglePlay() {
        this.video.paused ? this.video.play() : this.video.pause();
        /**@type {VisualFeedback} */
        this.player.components.list.get('visualfeedback')?.showIcon(this.video.paused ? 'pause' : 'play');
    }

    changeVolume(delta) {
        this.video.volume = Math.max(0, Math.min(1, this.video.volume + delta));
        this.player.components.list.get('visualfeedback')?.showIcon('volume', this.video.volume);
    }

    showFeedback(side) {
        this.player.components.list.get('visualfeedback')?.showIcon(side, 10);
    }
}

export class VisualFeedback extends Component {
    setup() {
        this.container = this.player.root.querySelector('.display-points-info-wrapper');
        this.timer = null;
    }

    init() {
        this.showIcon = (type, value) => {
            clearTimeout(this.timer);
            this.container.removeAttribute('data-type');

            void this.container.offsetWidth;

            this.container.setAttribute('data-type', type);

            if (value !== undefined) {
                // const textElement = this.container.querySelector('.info-value');
                // if (textElement) textElement.textContent = value;
            }

            this.timer = setTimeout(() => {
                this.container.removeAttribute('data-type');
            }, 1000);
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