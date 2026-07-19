import { Player } from '../mod.tplayer.js';
import { Component } from '../utils/util.entity.js';
import { Fullscreen } from './cps.screen.js';

export class Keyboard extends Component {
    setup() {
        document.addEventListener('keydown', this.handle((e) => {
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
        }, 'COMPONENT_MEDIUM'));
    }

    toggleMute() {
        this.video.muted = !this.video.muted;
    }

    togglePlay() {
        if (this.video.paused) {
            this.player.main.play();
            this.player.components.list.get('vfeed')?.showIcon('play');
        } else {
            this.video.pause();
            this.player.components.list.get('vfeed')?.showIcon('pause');
        }
    }

    toggleFullScreen() {
        Fullscreen.toggleFullScreen(this.player.root, this.video);
    }

    seek(s) {
        this.video.currentTime = Math.max(0, this.video.currentTime + s);
        this.player.components.list.get('vfeed')?.showIcon(s === 10 ? 'right' : 'left');
    }

    volume(v) {
        this.video.volume = Math.max(0, Math.min(1, this.video.volume + v));
        this.player.components.list.get('vfeed')?.showIcon('volume', this.video.volume);

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

        this.err_code = "COMPONENT_MEDIUM";
    }

    init() {
        if (this.player.opts.defaultUIControls) {
            console.log(this.overlay);
            this.overlay.style.display = "none";
            return;
        }

        const leftZone = this.overlay.querySelector('.left');
        const centerZone = this.overlay.querySelector('.center');
        const rightZone = this.overlay.querySelector('.right');

        // ЦЕНТР: Мгновенная пауза
        centerZone.addEventListener('pointerdown', this.handle((e) => {
            e.preventDefault();
            this.togglePlay();
        }));

        // ЛЕВО: Только двойной тап
        leftZone.addEventListener('pointerdown', this.handle((e) => this.handleTap(e, 'left')));

        // ПРАВО: Двойной тап + Громкость + Ускорение
        rightZone.addEventListener('pointerdown', this.handle((e) => {
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
        }));

        rightZone.addEventListener('pointermove', this.handle((e) => {
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
        }));

        rightZone.addEventListener('pointerup', this.handle((e) => {
            this.stopEverything(e);
        }));

        rightZone.addEventListener('pointercancel', this.handle((e) => {
            this.stopEverything(e);
        }));
    }

    // --- Логика ускорения ---
    startSpeedUp() {
        if (this.isSwiping) return; // Не ускоряем, если идет свайп громкости
        this.isSpeedUp = true;
        this.video.playbackRate = 2.0;
        this.player.components.list.get('vfeed')?.showIcon('speed2x');
    }

    stopEverything(e) {
        this.cancelLongPress();

        if (this.isSpeedUp) {
            this.video.playbackRate = 1.0;
            this.isSpeedUp = false;
            this.player.components.list.get('vfeed')?.showIcon('speed1x');
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
        this.video.paused ? this.player.main.play() : this.video.pause();
        /**@type {VisualFeedback} */
        this.player.components.list.get('vfeed')?.showIcon(this.video.paused ? 'pause' : 'play');
    }

    changeVolume(delta) {
        this.video.volume = Math.max(0, Math.min(1, this.video.volume + delta));
        this.player.components.list.get('vfeed')?.showIcon('volume', this.video.volume);
    }

    showFeedback(side) {
        this.player.components.list.get('vfeed')?.showIcon(side, 10);
    }
}

export class Skips extends Component {
    static regex = /(\d+):(\d+)-(\d+):(\d+)/;

    setup() {
        this.skips = [];
        this.currentSkip = null;
        this.btn = document.querySelector('.skip-moment-wrapper');

        this.player.on(Player.Events.SOURCE_LOADED, this.handle(() => {
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
        }));

        this.err_code = "COMPONENT_LOW";
    }

    init() {
        let lastCheckTime = -1;

        this.player.on(Player.Events.TIME_UPDATE, this.handle(() => {
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
        }));

        this.btn.addEventListener('click', this.handle(() => {
            if (this.currentSkip) {
                this.log(`(Пользователь) Пропустил Опенинг/Эндинг. Установка время на: ${this.currentSkip.to}`);
                // Перематываем видео на конец отрезка
                this.video.currentTime = this.currentSkip.to;

                // Скрываем кнопку сразу после нажатия
                this.btn.classList.add('-hide');
                this.currentSkip = null;
            }
        }));

        if (this.opts?.seeking) {
            let previousTime = 0;

            this.player.on(Player.Events.TIME_UPDATE, this.handle(() => {
                if (!this.video.seeking) {
                    previousTime = this.video.currentTime;
                }
            }));

            this.player.on(Player.Events.SEEKING, this.handle(() => {
                const currentTime = this.video.currentTime;

                if (this.currentSkip && currentTime > previousTime) {
                    // Перематываем видео на конец отрезка
                    this.video.currentTime = this.currentSkip.to;

                    // Скрываем кнопку сразу после нажатия
                    this.btn.classList.add('-hide');
                    this.currentSkip = null;
                }
            }));
        }
    }
}