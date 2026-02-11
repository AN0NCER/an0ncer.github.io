import { animate, createAnimatable, createDraggable, spring, utils } from "../library/anime.esm.min.js";
import { Template } from "./tun.template.js";

const CONFIG = {
    FILES: {
        TEMPLATE: 'pop.update.tpl',
        STYLE: 'pop.update.css'
    },
    TIMING: {
        TIMEOUT: 5000,
        ANIMATION_DURATION: 300,
        ANIMATION_DURATION_X2: 600
    },
    SELECTORS: {
        WRAPPER: '.update-wrapper',
        UPDATE: '.tun-update',
        MOUSE: '.tun-mouse',
        TEXT_INFO: '.update-text > .update-info',
        TEXT_TITLE: '.update-text > .update-title',
        ICON: '.icon-update',
        CONTROLS: '.tun-update-controls-wrapper'
    }
}

export const UIEvents = new class {
    /**@type {{[eventName]: Set<{fn:()=>{},once:boolean,id:string,event:string}>}} */
    callbacks = {}

    /**@type {WeakMap<() => {}, {fn:()=>{},once:boolean,id:string,event:string}>} */
    #meta = new WeakMap();

    #parse(eventName) {
        const [event, id] = eventName.split('.');
        return { event, id: id || null };
    }

    /**
    * Подписка на событие
    * @param {"dragRelease"|"hide"|"init"} eventName 
    * @param {Function} callback 
    * @param {{once?:boolean}} options 
    */
    on(eventName, callback, options = {}) {
        const { event, id } = this.#parse(eventName);

        if (this.#meta.has(callback)) {
            const existingEntry = this.#meta.get(callback);
            if (existingEntry.event === event && existingEntry.id === id) {
                return;
            }
        }

        if (!this.callbacks[event]) {
            this.callbacks[event] = new Set();
        }

        const entry = {
            fn: callback,
            once: !!options.once,
            id,
            event
        };

        this.callbacks[event].add(entry);
        this.#meta.set(callback, entry);
    }

    /**
     * Отписка от событий
     * @param {"dragRelease"|"hide"|"init"} eventName 
     * @param {Function|null} callback 
     */
    off(eventName, callback = null) {
        const { event, id } = this.#parse(eventName);

        if (callback && typeof callback === "function") {
            const meta = this.#meta.get(callback);
            if (meta && this.callbacks[event]) {
                if ((id && meta.id === id) || !id) {
                    this.callbacks[event].delete(meta);
                    this.#meta.delete(callback);
                }
            }
            return;
        }

        if (id) {
            const set = this.callbacks[event];
            if (!set) return;
            for (const cb of Array.from(set)) {
                if (cb.id === id) {
                    set.delete(cb);
                    this.#meta.delete(cb.fn);
                }
            }
        } else if (this.callbacks[event]) {
            for (const cb of this.callbacks[event]) {
                this.#meta.delete(cb.fn)
            }
            delete this.callbacks[event];
        }
    }

    /**
     * Вызов всех коллбеков события
     * @param {"dragRelease"|"hide"|"init"} event 
     * @param  {...any} args 
     */
    trigger(event, ...args) {
        const entries = Array.from(this.callbacks[event] || []);
        const remain = new Set();

        for (const entry of entries) {
            try {
                entry.fn(...args);
            } catch (err) {
                console.error(`UIEvents: ошибка в обработчике "${entry.event}"${entry.id ? '.' + entry.id : ''}:`, err);
            } finally {
                if (!entry.once) {
                    remain.add(entry);
                } else {
                    this.#meta.delete(entry.fn)
                }
            }
        }

        this.callbacks[event] = remain;
        if (remain.size === 0) {
            delete this.callbacks[event];
        }
    }
}();

class UIProgress {
    #value = { progress: 0 };

    constructor() {
        const ref = $(CONFIG.SELECTORS.UPDATE);

        this.animatable = createAnimatable(this.#value, {
            progress: 0,
            duration: 300,
            ease: 'out(2)',
            onUpdate: () => ref.css({ '--progress': `${this.#value.progress}%` })
        });
    }

    set(value) {
        this.animatable.progress(value);
    }

    get() {
        return this.#value.progress;
    }
}

class UICursor {
    constructor(control) {
        const { SELECTORS: { MOUSE } } = CONFIG;
        /** @type {UIControl} */
        this.control = control;
        this.circle = createAnimatable(MOUSE, {
            x: 0,
            y: 0,
            ease: 'out(2)',
        });
        this.onClickEvent = true;
        this.enable = false;
        this.on();
    }

    on() {
        if (this.enable) return;
        this.enable = true;

        const { SELECTORS: { MOUSE, UPDATE } } = CONFIG;

        const onMove = (clientX, clientY) => {
            const { width, height, left, top } = this.control.bound.get();
            const hw = width / 2;
            const hh = height / 2;
            const x = utils.clamp(clientX - left - hw, -hw, hw);
            const y = utils.clamp(clientY - top - hh, -hh, hh);

            this.circle.x(x);
            this.circle.y(y);
        };

        const onEnter = (e, p = { clientX: 0, clientY: 0 }) => {
            this.control.bound.update();
            const type = e.type === "mouseover" ?
                ["mousemove", "mouseleave"] :
                ["touchmove", "touchend"];


            animate(MOUSE, {
                opacity: 1,
                duration: 1000,
                easing: 'easeOutQuad'
            });

            onMove(p.clientX, p.clientY);

            const callbacks = {
                "touchmove": (e) => {
                    e.preventDefault();
                    const event = e.originalEvent;
                    if (event.touches.length > 0) {
                        const { clientX, clientY } = event.touches[0];
                        onMove(clientX, clientY);
                    }
                },
                "touchend": (e) => {
                    callbacks.end();
                },
                "mousemove": (e) => {
                    e.preventDefault();
                    const event = e.originalEvent;
                    onMove(event.clientX, event.clientY);
                },
                "mouseleave": (e) => {
                    callbacks.end();
                },
                "end": () => {
                    $(UPDATE).off(type[0], callbacks[type[0]]);
                    $(UPDATE).off(type[1], callbacks[type[1]]);

                    animate(MOUSE, {
                        opacity: 0,
                        duration: 1000,
                        easing: 'easeOutQuad'
                    });
                }
            };

            $(UPDATE).on(type[0], callbacks[type[0]]);
            $(UPDATE).on(type[1], callbacks[type[1]]);
        };

        const wrapper = document.querySelector(UPDATE);

        $(UPDATE).on('touchstart', (e) => {
            const event = e.originalEvent;
            if (event.touches.length > 0) {
                onEnter(event, event.touches[0]);
            }
        });

        $(UPDATE).on('mouseenter', (e) => {
            const event = e.originalEvent;
            onEnter(event, event);
        });

        wrapper.addEventListener('click', () => {
            animate(MOUSE, {
                opacity: 0,
                duration: 1000,
                easing: 'easeOutQuad'
            });
        }, { passive: false });
    }

    off() {
        this.enable = false;
    }
}

class UIDrag {
    y = 0

    constructor(control) {
        const { SELECTORS: { UPDATE } } = CONFIG;
        /**@type {UIControl} */
        this.control = control;
        this.draggable = createDraggable(UPDATE, {
            container: [0, 0, 0, 0],
            containerFriction: 0.95,
            scrollThreshold: 0,
            releaseStiffness: 200,
            releaseEase: spring({
                stiffness: 300,
                damping: 15,
                mass: 0.8,
            }),
            onDrag: (a) => {
                this.y = a.y;
            },
            onRelease: (a) => {
                UIEvents.trigger('dragRelease', this.y, this.control);
            }
        })
    }

    enable() {
        this.draggable.enable();
    }

    disable() {
        const { TIMING: { ANIMATION_DURATION } } = CONFIG;
        return new Promise((resolve) => {
            this.draggable.disable();
            animate(this.draggable.$target, {
                x: 0, y: 0,
                duration: ANIMATION_DURATION,
                ease: 'outBack(1.70158)',
                onComplete: resolve
            })
        });
    }
}

class UIMenu {
    constructor(control) {
        /**@type {UIControl} */
        this.control = control;
        this.showed = true;
        this.bounds = null;
    }

    show({ live = true } = {}) {
        return new Promise((resolve) => {
            if (this.showed) return resolve(this);

            const {
                SELECTORS: { CONTROLS },
                TIMING: { ANIMATION_DURATION_X2 }
            } = CONFIG;

            const wrapper = document.querySelector(CONTROLS);

            const style = {
                width: wrapper.style.width,
                minWidth: wrapper.style.minWidth,
                position: wrapper.style.position,
                visibility: wrapper.style.visibility
            }

            try {
                wrapper.style.visibility = 'hidden';
                wrapper.style.position = 'absolute';
                wrapper.style.width = 'auto';
                wrapper.style.minWidth = 'fit-content';

                this.bounds = wrapper.getBoundingClientRect();
            } finally {
                wrapper.style.minWidth = style.minWidth;
                wrapper.style.width = style.width;
                wrapper.style.position = style.position;
                wrapper.style.visibility = style.visibility;
            }

            const bound = this.bounds;

            const onComplete = () => {
                this.showed = true;
                resolve(this);
            }

            if (!this.control.showed || !live) {
                utils.set(wrapper, {
                    width: `${bound.width}px`,
                    'min-width': `${bound.width}px`
                });
                return onComplete();
            }

            animate(wrapper, {
                'min-width': [`${0}px`, `${bound.width}px`],
                width: bound.width,
                duration: ANIMATION_DURATION_X2,
                ease: 'inOutExpo',
                onComplete
            })
        });
    }

    hide({ live = true } = {}) {
        return new Promise((resolve) => {
            if (!this.showed) return resolve(this);

            const {
                SELECTORS: { CONTROLS },
                TIMING: { ANIMATION_DURATION_X2 }
            } = CONFIG;

            const wrapper = document.querySelector(CONTROLS);

            const onComplete = () => {
                this.showed = false;
                resolve(this);
            }

            if (!this.control.showed || !live) {
                utils.set(wrapper, { width: 0, 'min-width': 0, });
                return onComplete();
            }

            const bounds = wrapper.getBoundingClientRect();

            animate(wrapper, {
                'min-width': [`${bounds.width}px`, `${0}px`],
                width: 0,
                duration: ANIMATION_DURATION_X2,
                ease: 'inOutExpo',
                onComplete
            });
        });
    }
}

class UIControl {
    constructor(core) {
        /**@type {SWUpdate} */
        this.core = core;

        this.showed = false;
        this.components = {
            progress: new UIProgress(),
            cursor: new UICursor(this),
            dragger: new UIDrag(this),
            menu: new UIMenu(this)
        }

        this.bound = new class {
            /**@type {{x:number,y:number,width:number,height:number,top:number, bottom:number, left:number,right:number}} */
            #bound;

            constructor(selector) {
                this.element = document.querySelector(selector);
                this.#bound = this.element.getBoundingClientRect();
            }

            get() {
                return this.#bound;
            }

            update() {
                this.#bound = this.element.getBoundingClientRect();
            }
        }(CONFIG.SELECTORS.UPDATE);
    }

    get info() {
        const { TEXT_INFO } = CONFIG.SELECTORS;
        return $(TEXT_INFO).text();
    }

    get title() {
        const { TEXT_TITLE } = CONFIG.SELECTORS;
        return $(TEXT_TITLE).text();
    }

    get icon() {
        const { ICON } = CONFIG.SELECTORS;
        const element = document.querySelector(ICON);
        const classList = element.classList;

        for (const name of classList) {
            if (name.startsWith('-')) {
                return name;
            }
        }

        return null;
    }

    set info(value) {
        const { TEXT_INFO } = CONFIG.SELECTORS;
        $(TEXT_INFO).html(value);
    }

    set title(value) {
        const { TEXT_TITLE } = CONFIG.SELECTORS;
        $(TEXT_TITLE).html(value);
    }

    set icon(value) {
        const { ICON } = CONFIG.SELECTORS;
        const element = document.querySelector(ICON);
        const classList = element.classList;

        for (const name of classList) {
            if (name.startsWith('-')) {
                classList.remove(name);
            }
        }

        classList.add(value);
    }

    show({ live = true } = {}) {
        return new Promise((resolve) => {
            if (this.showed) return resolve(this);

            const {
                SELECTORS: { WRAPPER },
                TIMING: { ANIMATION_DURATION }
            } = CONFIG;
            const wrapper = document.querySelector(WRAPPER);

            const onComplete = () => {
                this.showed = true;
                this.bound.update();
                resolve(this);
            }

            if (!live) {
                utils.set(wrapper, { top: '10px' });
                return onComplete();
            }

            animate(wrapper, {
                top: ['-100%', '10px'],
                duration: ANIMATION_DURATION,
                onComplete
            });
        });
    }

    hide() {
        if (!this.showed) return Promise.resolve(this);

        const {
            SELECTORS: { WRAPPER },
            TIMING: { ANIMATION_DURATION }
        } = CONFIG;

        return new Promise(async (resolve) => {
            animate(WRAPPER, {
                top: `-${this.bound.get().height}px`,
                duration: ANIMATION_DURATION,
                onBegin: () => {
                    this.showed = false;
                },
                onComplete: () => {
                    resolve(this);
                    UIEvents.trigger("hide", this);
                }
            });
        })
    }
}

export class SWUpdate {

    /**@type {SWUpdate} */
    static instance;
    /**
     * Основной класс елемента
     * @param {{version:string,type:"request"|"update"|"complete"}} param0 
     */
    constructor({ version = '0.0.0', type = 'update' } = {}) {
        if (SWUpdate.instance) {
            return SWUpdate.instance;
        }

        this.type = type;
        this.version = version;
        this.control = null;

        SWUpdate.instance = this;
    }

    async #create({ icon = '-download' } = {}) {
        if (this.control) {
            return this.control;
        }

        const { TEMPLATE, STYLE } = CONFIG.FILES;
        const template = await Template(TEMPLATE);
        template.css(STYLE);
        template.html({ title: `Обновление:`, icon, version: this.version });

        $(document.body).append(template.text());

        this.control = new UIControl(this);
        UIEvents.trigger("init", this.control);
        return this.control;
    }

    static request(options = {}) {
        return new SWUpdate({
            version: options?.version,
            type: 'request'
        }).#create(options);
    }

    static update(options = {}) {
        return new SWUpdate({
            version: options?.version,
            type: 'update'
        }).#create(options);
    }

    static complete(options = {}) {
        return new SWUpdate({
            version: options?.version,
            type: 'complete'
        }).#create(options);
    }
}

let controller;

/**
 * Показывает диалоговое окно с запросом подтверждения обновления.
 * 
 * `Используется, чтобы запросить у пользователя согласие на установку доступного обновления.`
 * 
 * @param {{version:string,approved:string,reject:string,animations:boolean}} param
 * @returns {Promise<string>}
 */
export function updRequest({
    version = '0.0.0',
    approved = { type: 'INSTALL_APPROVED' },
    reject = { type: 'INSTALL_REJECTED' },
    animations = true
} = {}) {
    const { ICON } = CONFIG.SELECTORS;

    const off = () => {
        controller?.abort();
    }

    UIEvents.on("hide", () => {
        off();
    }, { once: true });

    return new Promise(async (resolve) => {
        const events = () => {
            off();

            controller = new AbortController();
            const signal = controller.signal;

            const icon = document.querySelector(ICON);
            const cancel = document.querySelector('.tun-update-controls > .btn-cancel');

            const createPressHandlers = (element) => {
                const press = () => {
                    element.classList.add('press');

                    document.removeEventListener

                    // Добавляем глобальные обработчики для мыши и touch
                    document.addEventListener('mouseup', pressend, { passive: true, once: true });
                    document.addEventListener('touchend', pressend, { passive: true, once: true });
                    document.addEventListener('touchcancel', pressend, { passive: true, once: true });
                }

                const pressend = () => {
                    element.classList.remove('press');
                    // Убираем все глобальные обработчики
                    document.removeEventListener('mouseup', pressend);
                    document.removeEventListener('touchend', pressend);
                    document.removeEventListener('touchcancel', pressend);
                }

                return { press, pressend };
            }

            // Создаем обработчики для icon
            const iconHandlers = createPressHandlers(icon);
            icon.addEventListener('mousedown', iconHandlers.press, { passive: true, signal });
            icon.addEventListener('touchstart', iconHandlers.press, { passive: true, signal });

            // Создаем обработчики для cancel
            const cancelHandlers = createPressHandlers(cancel);
            cancel.addEventListener('mousedown', cancelHandlers.press, { passive: true, signal });
            cancel.addEventListener('touchstart', cancelHandlers.press, { passive: true, signal });

            icon.addEventListener('click', () => {
                off();
                resolve(approved);
            }, { passive: true, signal })

            cancel.addEventListener('click', () => {
                off();
                resolve(reject);
                control.hide();
            }, { passive: true, signal });
        }

        const control = await SWUpdate.request({ version });
        control.icon = '-download';
        control.title = `Обновление: <span>${version}</span>`;
        control.info = 'Нажми чтобы установить';
        control.components.progress.set(0);
        if (animations) await control.components.menu.hide({ live: false });
        await control.show({ live: animations });
        await control.components.menu.show();

        events();
    });
}

/**
 * 
 * @param {{version:string,progress:number,total:number,animations:boolean}} param0 
 * @returns {Promise<UIProgress>}
 */
export function updInstall({
    version = '0.0.0',
    progress = 0,
    total = 0,
    animations = true
} = {}) {
    return new Promise(async (resolve) => {
        const control = await SWUpdate.update()
        control.icon = '-install';
        control.title = `Обновление: <span>${version}</span>`;
        control.info = `Загрузка: ${progress}% (0 / ${total} файлов)`;
        await control.components.menu.hide({ live: animations });
        await control.show({ live: animations });
        resolve(control.components.progress);
    });
}

export function updComplete({
    version = '0.0.0',
    progress = 100,
    animations = false
} = {}) {
    let timer;

    UIEvents.on("hide", () => {
        clearTimeout(timer);
        $('.update-wrapper').remove();
        if(SWUpdate.instance){
            SWUpdate.instance.control = null;
        }
    }, { once: true });

    const setTimer = (control) => {
        clearTimeout(timer);

        const { TIMING: { TIMEOUT } } = CONFIG;

        timer = setTimeout(async () => {
            control.components.dragger.disable();
            await control.hide();
        }, TIMEOUT)
    }

    return new Promise(async (resolve) => {
        const control = await SWUpdate.complete();
        control.icon = '-complete'
        control.title = `Установлено: <span>${version}</span>`;
        control.info = `Посмотреть обновление`;
        control.components.progress.set(progress);
        await control.components.menu.hide({ live: animations });
        await control.show({ live: animations });
        setTimer(control);
        resolve(control);
    })
}