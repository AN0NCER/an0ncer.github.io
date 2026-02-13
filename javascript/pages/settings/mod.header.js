import { animate, spring } from "../../library/anime.esm.min.js";

class AnimPannel {
    constructor(/**@type {AnimController} */ io, { element } = {}) {
        this.io = io;

        /**@type {HTMLDivElement} */
        this.pannelEl = element;
        /**@type {HTMLDivElement} */
        this.wrapperEl = io.io.wrapperEl;

        this.isAnimate = false;
        this.isCollaps = true;

        this.css = (() => {
            const styles = getComputedStyle(this.pannelEl);

            return {
                maxWidth: parseInt(styles.getPropertyValue('--panel-max-width')),
                minWidth: parseInt(styles.getPropertyValue('--panel-min-width')),
                safeZone: parseInt(styles.getPropertyValue('--panel-safe-zone')),
                padding: parseInt(styles.getPropertyValue('--padding'))
            }
        })();

        this.ease = spring({ bounce: 0.3, duration: 400 });
    }

    expand() {
        if (!this.isAnimate) {
            this.defaultWidth = this.pannelEl.offsetWidth;
            this.currentWidth = Math.min(this.wrapperEl.offsetWidth - this.css.safeZone, this.css.maxWidth);
        }

        animate(this.pannelEl, {
            '--input-placeholder-opacity': 1,
            '--input-scale': [1.2, 1],
            width: [`${this.defaultWidth}px`, `${this.currentWidth}px`],

            ease: this.ease,

            onBegin: () => {
                this.pannelEl.classList.add('-enable');
                this.isAnimate = true;
                this.isCollaps = false;
            },
            onComplete: () => {
                this.isAnimate = false;
            }
        })
    }

    collapse() {
        animate(this.pannelEl, {
            '--input-placeholder-opacity': 0,
            '--input-scale': [1.2, 1],
            width: [`${this.currentWidth}px`, `${this.defaultWidth}px`],

            ease: this.ease,

            onBegin: () => {
                this.isAnimate = true;
                this.isCollaps = true;
            },
            onComplete: () => {
                this.pannelEl.classList.remove('-enable');
                this.pannelEl.style.width = '';

                if (!this.io.isMobile) {
                    this.pannelEl.style.setProperty('--input-placeholder-opacity', '1');
                }

                this.isAnimate = false;
            }
        })
    }

    _update(prev, isMobile) {
        if (!isMobile) {
            this.pannelEl.style.width = '';
            this.pannelEl.style.setProperty('--input-placeholder-opacity', '1');
        } else {
            this.pannelEl.style.setProperty('--input-placeholder-opacity', '0');
        }

        if (isMobile && this.io.isFocus) {
            this.defaultWidth = this.pannelEl.offsetWidth;
            this.currentWidth = Math.min(this.io.screen.width - this.css.padding * 2 - this.css.safeZone, this.css.maxWidth);

            animate(this.pannelEl, {
                width: [`${this.defaultWidth}px`, `${this.currentWidth}px`],
                '--input-scale': [0.8, 1],

                ease: this.ease,

                onBegin: () => {
                    this.defaultWidth = this.css.minWidth;
                    this.pannelEl.classList.add('-enable');
                    this.isAnimate = true;
                    this.isCollaps = false;
                },
                onComplete: () => {
                    this.isAnimate = false;
                }
            })
        }

        if (isMobile && !this.io.isFocus) {
            this.pannelEl.classList.remove('-enable');
            this.pannelEl.style.setProperty('--input-placeholder-opacity', '0');
        }
    }
}

class AnimProfil {

    default = {
        '--p-ava-size': '55px',
        '--p-c-width': 'auto',
        '--p-c-scale': 1,
        '--p-c-opacity': 1,
        '--p-c-x': '0px',
        '--p-gap': '10px'
    }

    constructor(/**@type {AnimController} */ io, { element } = {}) {
        this.io = io;

        /**@type {HTMLDivElement} */
        this.profilEl = element;
        /**@type {HTMLDivElement} */
        this.contentEl = element.querySelector('.profile-content');
        this.contentWidth = 0;

        this.isCollaps = false;
        this.isAnimate = false;

        this.ease = spring({ bounce: 0.3, duration: 400 });
    }

    collapse() {
        this.contentWidth = this.contentEl.offsetWidth;

        animate(this.profilEl, {
            '--p-ava-size': [this.default["--p-ava-size"], '45px'],
            '--p-c-width': [`${this.contentWidth}px`, '0px'],
            '--p-c-scale': [this.default["--p-c-scale"], 0.5],
            '--p-c-opacity': [this.default["--p-c-opacity"], 0],
            '--p-c-x': [this.default["--p-c-x"], `-50px`],
            '--p-gap': [this.default["--p-gap"], `0px`],

            ease: this.ease,

            onBegin: () => {
                this.isAnimate = true;
                this.isCollaps = true;
            },
            onCompleye: () => {
                this.isAnimate = false;
            }
        })
    }

    expand() {
        animate(this.profilEl, {
            '--p-ava-size': ['45px', this.default["--p-ava-size"]],
            '--p-c-width': ['0px', `${this.contentWidth}px`],
            '--p-c-scale': [0.5, this.default["--p-c-scale"]],
            '--p-c-opacity': [0, this.default["--p-c-opacity"]],
            '--p-c-x': [`-50px`, this.default["--p-c-x"]],
            '--p-gap': [`0px`, this.default["--p-gap"]],

            ease: this.ease,

            onBegin: () => {
                this.isAnimate = true;
                this.isCollaps = false;
            },
            onCompleye: () => {
                this.isAnimate = false;
            }
        });
    }

    _update(prev, isMobile) {
        if (this.io.isFocus && isMobile) {
            this.collapse();
        }

        if (this.io.isFocus && !isMobile && this.isCollaps) {
            this.expand();
        }
    }
}

class AnimController {
    isMobile = false;
    #isLock = false;
    #isFocus = false;

    get isFocus() {
        return this.#isFocus;
    }

    set isFocus(value) {
        if (this.#isLock) return;
        this.#isFocus = value;
    }

    constructor(/**@type {THeader} */ io) {
        this.io = io;

        this.profil = new AnimProfil(this, { element: io.profilEl });
        this.pannel = new AnimPannel(this, { element: io.pannelEl });

        (async () => {
            const mq = window.matchMedia(`(max-width: 600px)`);

            const handleChange = (e) => {
                this.update(this.isMobile, e.matches);
                this.isMobile = e.matches;
                this.io.pannelEl.classList.toggle('-mini', e.matches);
            }

            mq.addEventListener('change', handleChange);
            handleChange(mq);
        })();

        (async () => {
            const handleChange = () => {
                const { width, height } = window.screen;
                this.screen = {
                    width,
                    height
                };
            }

            window.addEventListener('resize', handleChange);
            handleChange(window.screen);
        })();
    }

    async update(prev, next) {
        this.profil._update(prev, next);
        this.pannel._update(prev, next);
    }

    async focus() {
        if (this.isFocus) return;

        this.isFocus = true;

        if (!this.isMobile) return;

        this.profil.collapse();
        this.pannel.expand();
    }

    async blur() {
        if (!this.isFocus) return;

        this.isFocus = false;

        if (!this.isMobile || this.#isLock) return;

        this.profil.expand();
        this.pannel.collapse();
    }

    lock() {
        this.#isLock = true;
    }

    unlock() {
        this.#isLock = false;
    }
}

export const THeader = new class {
    /**
     * 
     * @param {Object} opts
     * @param {string} [opts.dom.wrapper]
     * @param {string} [opts.dom.pannel]
     * @param {string} [opts.dom.profil]
     * @param {() => void} [opts.events.onprofil]
     * @param {() => string} [opts.events.oninput]
     * @param {() => string} [opts.events.onsearch]
     * @param {() => void} [opts.events.onbutton]
     */
    async init({ dom, events } = {}) {
        dom = { wrapper: ".head-wrapper", pannel: ".quick-panel", profil: ".profile", ...dom };
        events = { onprofil: () => { }, oninput: () => { }, onsearch: () => { }, onbutton: () => { }, ...events }

        // 1 -> Получение елементов управления

        /**@type {HTMLDivElement} общая обертка всех елементов */
        this.wrapperEl = document.querySelector(dom.wrapper);
        /**@type {HTMLDivElement} обертка контроллеров (кнопка с поиском) */
        this.pannelEl = this.wrapperEl.querySelector(dom.pannel);
        /**@type {HTMLDivElement} обертка профиля пользователя */
        this.profilEl = this.wrapperEl.querySelector(dom.profil);

        // 2 -> Инициализация логики

        this.anim = new AnimController(this);
        this.logic = new LogicController(this, { events });
    }
}

class LogicController {
    constructor(/**@type {THeader} */ io, { events } = {}) {
        this.io = io;
        this.anim = io.anim;

        this.profil = new LogicProfil(this, { element: io.profilEl, onclick: events.onprofil });
        this.pannel = new LogicPannel(this, { element: io.pannelEl, onsearch: events.onsearch, oninput: events.oninput, onclick: events.onbutton });
    }
}

class LogicProfil {
    constructor(/**@type {LogicController} */ io, { element, onclick } = {}) {
        this.io = io;

        /**@type {HTMLElement} */
        this.btnEl = element;
        this.onclick = onclick;
        this.event();
    }

    event() {
        const avaWrapper = this.btnEl.querySelector('.ava-wrapper');

        this.btnEl.addEventListener('click', () => {
            this.onclick();
        })

        const on = () => {
            animate(avaWrapper, {
                scale: 1.25,
                ease: spring({
                    bounce: 0.69,
                    duration: 199
                })
            });
        }

        const off = () => {
            animate(avaWrapper, {
                scale: 1,
                ease: spring({
                    bounce: 0.69,
                    duration: 199
                })
            });
        }

        this.btnEl.addEventListener('pointerdown', on);

        this.btnEl.addEventListener('pointerup', off);
        this.btnEl.addEventListener('pointercancel', off);
        this.btnEl.addEventListener('pointerleave', off);
    }
}

class LogicPannel {
    constructor(/**@type {LogicController} */ io, { element, onclick, onsearch, oninput } = {}) {
        this.io = io;
        /**@type {HTMLDivElement} */
        this.pannelEl = element;

        /**@type {() => void} */
        this.onclick = onclick;
        /**@type {() => string} */
        this.oninput = oninput;
        /**@type {() => string} */
        this.onsearch = onsearch;

        this.hasValue = false;

        /**@type {HTMLDivElement} */
        this.searchEl = element.querySelector('.btn#page-search');
        /**@type {HTMLDivElement} */
        this.btnEl = element.querySelector('.btn#account-edit');
        /**@type {HTMLInputElement} */
        this.input = element.querySelector('#search');

        this.event();
    }

    event() {
        /**@type {HTMLHeadElement} */
        const headerEl = document.querySelector('header');
        /**@type {HTMLDivElement} */
        const iconEl = this.searchEl.querySelector('.c-wrapper');
        /**@type {HTMLElement} */
        const btnSearchEl = this.searchEl.querySelector('.i-wrapper');

        btnSearchEl.addEventListener('click', () => {
            if (this.hasValue) {
                this.hasValue = false;
                iconEl.classList.remove('-clear');
                this.input.value = '';
                this.io.anim.unlock();
                this.input.blur();
                this.oninput(this.input.value, this.input);
                return
            }

            if (!this.io.anim.isFocus) {
                this.input.focus();
            }
        });

        this.input.addEventListener('input', () => {
            this.oninput(this.input.value, this.input);
            if (this.input.value.length > 0) {
                this.hasValue = true;
                this.io.anim.lock();
                iconEl.classList.add('-clear');
            } else {
                this.hasValue = false;
                this.io.anim.unlock();
                iconEl.classList.remove('-clear');
            }
        });

        this.input.addEventListener('keydown', (e) => {
            const isEnter =
                e.key === 'Enter' ||
                e.code === 'Enter' ||
                e.code === 'NumpadEnter' ||
                e.keyCode === 13;

            if (isEnter) {
                this.onsearch(this.input.value, this.input)
            }
        });

        this.input.addEventListener('focus', () => {
            this.io.anim.focus();
            headerEl.classList.add('-sticky');
        })

        this.input.addEventListener('blur', () => {
            if (this.input.value.length > 0) return;
            headerEl.classList.remove('-sticky');
            this.io.anim.blur();
        });

        this.btnEl.addEventListener('click', () => {
            this.onclick();
        })

        const on = () => {
            animate(this.btnEl, {
                scale: 1.25,
                ease: spring({
                    bounce: 0.69,
                    duration: 199
                })
            });
        }

        const off = () => {
            animate(this.btnEl, {
                scale: 1,
                ease: spring({
                    bounce: 0.69,
                    duration: 199
                })
            });
        }

        this.btnEl.addEventListener('pointerdown', on);

        this.btnEl.addEventListener('pointerup', off);
        this.btnEl.addEventListener('pointercancel', off);
        this.btnEl.addEventListener('pointerleave', off);
    }
}