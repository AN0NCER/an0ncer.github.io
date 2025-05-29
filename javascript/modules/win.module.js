import { Module } from "../core/window.core.js";
import { animate, utils } from "../library/anime.esm.min.js";

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

        this.addEventListener($(this.scroll), 'scroll', (e) => {
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
        this.onmove = false;
        this.animate = false;
        this.coefficient = 1;
        this.closestep = 40;
    }

    on() {
        if (!this.enable) return;

        let startY = 0;
        let height = 0;

        let currentHeight = 0;
        let lastStep = 0;
        let prevDistance = 0;

        let close = false;

        const onStart = (y) => {
            if (!this.win.showed || this.onmove || this.animate) return;
            this.onmove = true;
            this.coefficient = 1;

            startY = y;
            height = this.$win.height();

            currentHeight = height;
            lastStep = 0;
            prevDistance = 0;

            const w = $(window);

            w.on(`mousemove.${this.id}`, (e) => { onMove(e.originalEvent.clientY); });
            w.on(`touchmove.${this.id}`, (e) => {
                if (e.originalEvent.touches.length > 0) {
                    onMove(e.originalEvent.touches[0].clientY);
                }
            });

            w.on(`mouseup.${this.id}`, onEnd);
            w.on(`touchend.${this.id}`, onEnd);
        };

        const onMove = (y) => {
            if (!this.onmove || this.animate) return;
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
                this.$win.height(currentHeight);
            } else {
                utils.set(this.$win[0], { y: `${translateY}px` });
            }
            if ((translateY / height) * 100 >= this.closestep) {
                close = true;
            } else {
                close = false;
            }
        };

        const onEnd = () => {
            if (!this.onmove) return;
            this.onmove = false;
            this.animate = true;

            const w = $(window);

            w.off(`mousemove.${this.id}`);
            w.off(`touchmove.${this.id}`);
            w.off(`mouseup.${this.id}`);
            w.off(`touchend.${this.id}`);

            if (close) {
                utils.set(this.$win[0], { height: height });
                this.win.hide();
            } else {
                animate(`${this.win.element} > .window-content`, {
                    translateY: 0,
                    height: height,
                    duration: 300,
                    ease: 'out(3)',
                    onComplete: () => {
                        this.animate = false;
                    }
                });
            }

            this.win.once('animhide', () => {
                this.$win.css('height', '')
                this.animate = false;
            });
        };

        this.addEventListener(this.$bar, 'mousedown', (e) => { onStart(e.originalEvent.clientY) });
        this.addEventListener(this.$bar, 'touchstart', (e) => {
            if (e.originalEvent.touches.length > 0) {
                onStart(e.originalEvent.touches[0].clientY);
            }
        });

        this.win.once('hide', () => {
            this.off();
        });
    }

    off() {
        super.off();

        this.win.once('animshow', () => {
            this.on();
        });
    }
}