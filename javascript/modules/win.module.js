import { Module } from "../core/window.core.js";
import { createAnimatable } from "../library/anime.esm.min.js";

export class LazyLoad extends Module {
    constructor(win, { sentinel, callback = () => { }, margin = '200px', threshold = 0 } = {}) {
        super(win, { id: "lazyloader" });

        this.sentinel = sentinel;
        this.margin = margin;
        this.threshold = threshold;
        this.callback = callback;
    }


    on() {
        if (!this.enable) return;

        this.observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            // Когда sentinel попадает в зону видимости — вызываем функцию
            if (entry.isIntersecting) {
                this.callback();
            }
        }, {
            root: null,
            rootMargin: this.margin,
            threshold: this.threshold
        })

        this.observer.observe($(this.sentinel)[0]);
    }

    off() {
        if (!this.observer) return;

        try {
            this.observer.unobserve($(this.sentinel)[0]);
        } catch (e) {
            // sentinel уже удалён или не наблюдался — игнорируем
        }

        this.observer.disconnect();
        this.observer = null;
    }
}

export class PullToClose extends Module {
    /**
     * @param {TWindow} win 
     */
    constructor(win, { scroll } = {}) {
        super(win, { id: 'pulltoclose' });

        this.scroll = scroll;
    }

    on() {
        if (!this.enable) return;

        this.addEventListener($(this.scroll)[0], 'scroll', (e) => {
            const scrollTop = $(e.currentTarget).scrollTop();
            if (scrollTop < 0 && scrollTop < -80) {
                this.win.hide();
            }
        });
    }
}

export class WindowIntercator extends Module {
    /**
     * @param {TWindow} win 
     */
    constructor(win) {
        super(win, { id: "windowintercator" });

        this.$bar = $(`${this.win.element}`).find(`.window-bar`);
        this.$win = $(`${this.win.element} > .window-content`);

        this.animatable = createAnimatable();
        this.moving = false;
        this.animate = false;

        this.coefficient = 1;
        this.closestep = 40;

        this.win.on('animshow', () => { this.on(); }, this.id);
        this.win.on('hide', () => { this.off(); }, this.id);
    }

    on() {
        if (!this.win.showed || !this.enable) return;

        let startY = 0;
        let height = 0;

        let currentHeight = 0;
        let lastStep = 0;
        let prevDistance = 0;

        let close = false;

        const gen = () => {
            this.animatable = createAnimatable(this.$win[0], {
                y: { unit: 'px' },
                height: { unit: 'px' },
                ease: 'out(5)',
                duration: 300
            });
        }

        const onStart = (y) => {
            if (!this.win.showed || this.moving || this.animate) return;

            this.moving = true;
            this.coefficient = 1;

            startY = y;
            height = this.$win.height();

            currentHeight = height;
            lastStep = 0;
            prevDistance = 0;

            this.animatable.revert();
            gen();

            const w = $(window);

            w.on(`mousemove.${this.id}`, (e) => {
                onMove(e.originalEvent.clientY);
            });

            w.on(`touchmove.${this.id}`, (e) => {
                if (e.originalEvent.touches.length > 0) {
                    onMove(e.originalEvent.touches[0].clientY);
                }
            });

            w.on(`mouseup.${this.id}`, onEnd);
            w.on(`touchend.${this.id}`, onEnd);
        };

        const onMove = (y) => {
            if (!this.moving || this.animate) return;
            const translateY = (startY - y) * -1;
            if (translateY < 0) {
                const distance = Math.abs(translateY);
                const delta = distance - prevDistance;
                prevDistance = distance;
                const stepSize = 5;
                // Сколько шагов по 5 пикселей мы прошли с момента последнего изменения
                const deltaSteps = Math.floor((distance - lastStep) / stepSize);

                if (deltaSteps > 0) {
                    lastStep += deltaSteps * stepSize;
                    this.coefficient = Math.max(0.05, this.coefficient - deltaSteps * 0.05);
                }

                const deltaHeight = delta * this.coefficient;
                currentHeight += deltaHeight;
                this.animatable.height(currentHeight);
            } else {
                this.animatable.y(translateY);
            }
            if ((translateY / height) * 100 >= this.closestep) {
                close = true;
            } else {
                close = false;
            }
        };

        const onEnd = () => {
            if (!this.moving) return;
            this.moving = false;
            this.animate = true;

            const w = $(window);

            w.off(`mousemove.${this.id}`);
            w.off(`touchmove.${this.id}`);
            w.off(`mouseup.${this.id}`);
            w.off(`touchend.${this.id}`);

            this.win.once('animhide', () => {
                this.animatable.revert();
                this.animate = false;
            })

            if (close) {
                this.animatable.height(height);
                this.win.hide();
            } else {
                this.animatable.animations.y.onComplete = () => {
                    this.animatable.revert();
                    this.animate = false;
                }

                this.animatable.height(height);
                this.animatable.y(0);
            }
        }

        this.addEventListener(this.$bar[0], 'mousedown', (e) => {
            onStart(e.clientY);
        });

        this.addEventListener(this.$bar[0], 'touchstart', (e) => {
            if (e.touches.length > 0) {
                onStart(e.touches[0].clientY);
            }
        });

        this.addEventListener(window, 'touchmove', (e) => {
            if ($(e.target).closest('.window-bar').length > 0) {
                e.preventDefault();
            }
        }, { passive: false });

        this.addEventListener(window, 'resize', (e) => {
            if (this.moving) {
                onEnd();
                this.animate = false;
                this.animatable.revert();
            }
        });
    }

    off() {
        super.off();
    }
}