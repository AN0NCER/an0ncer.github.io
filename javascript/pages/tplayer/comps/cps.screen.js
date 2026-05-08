import { Player } from '../mod.tplayer.js';
import { Component } from '../utils/util.entity.js';

export class Fullscreen extends Component {
    setup() {
        this.root = this.player.root;
        /**@type {HTMLDivElement} */
        this.btn = this.root.querySelector('#media-fullscreen-button');

        if (this.player.opts.autoFullScreen) {
            this.player.on(Player.Events.PLAY, this.handle(() => {
                if (!document.fullscreenElement) {
                    Fullscreen.toggleFullScreen(this.root, this.video);
                }
            }, 'COMPONENT_MEDIUM'), { once: true });
        }

        this.player.on(Player.Events.FULL_SCREEN_CHANGE, this.handle((isFull) => {
            this.log(`Fullscreen change to: ${isFull}`);
            if (isFull) {
                this.root.classList.add('-full-screen');
            } else {
                this.root.classList.remove('-full-screen');
            }
        }, 'COMPONENT_MEDIUM'));
    }

    init() {
        this.btn.addEventListener('click', this.handle(() => Fullscreen.toggleFullScreen(this.root, this.video), 'COMPONENT_FATAL'));
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
                this.log('Вход в PiP mode');
                this.isPiPmode = true;
            });

            this.player.on(Player.Events.EXIT_PIP, () => {
                this.log('Выход из PiP mode');
                this.isPiPmode = false;
            });
        }
    }

    init() {
        this.btn.addEventListener('click', this.handle(() => {
            if (!this.supported || !this.loaded) return;

            if (!this.isPiPmode) {
                this.video.requestPictureInPicture();
            } else {
                document.exitPictureInPicture();
            }
        }, 'COMPONENT_LOW'));
    }
}

export class VisualFeedback extends Component {
    setup() {
        this.container = this.player.root.querySelector('.display-points-info-wrapper');
        this.timer = null;
        this.err_code = "COMPONENT_LOW";
    }

    init() {
        this.showIcon = this.handle((type, value) => {
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
        });
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
        this.player.on(Player.Events.KODIK_LOADED, this.handle((meta) => {
            this.runame.textContent = meta.titleAnime;
            this.enname.textContent = meta.titleOrig;
            this.episode.textContent = `Эпизод ${meta.episode} из ${meta.lastEpisode}`;
            this.voice.textContent = meta.titleVoice;
            this.quality.textContent = meta.quality;

            this.loader.style.setProperty('--src', `url("${meta?.screenshots[0]}")`);
        }, 'COMPONENT_LOW'));

        this.player.on(Player.Events.DURATION_CHANGE, this.handle(() => {
            this.loader.classList.add('-hide');

            this.log('Скрытие анимации загрузки.');
        }));
    }
}