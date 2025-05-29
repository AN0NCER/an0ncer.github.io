import { createTimeline, utils } from "../library/anime.esm.min.js";
import { Popup } from "../modules/tun.popup.js";

export class Module {
    /**
     * @param {TWindow} win 
     */
    constructor(win, { enable = true, id } = {}) {
        this.win = win;
        this.enable = enable;
        this.id = id;
        this.events = [];
    }

    addEventListener(el, type, event) {
        type = `${type}.${this.id}`;
        el.on(type, event);
        this.events.push({ type, el });
    }

    off() {
        for (let i = 0; i < this.events.length; i++) {
            const { el, type } = this.events[i];
            el.off(type);
        }
    }

    on() { }

    destroy() {
        // Отписать все события
        this.off();

        // Очистить массив событий
        this.events = [];

        // Обнулить ссылки
        this.win = null;
        this.enable = null;
        this.id = null;
    }
}

class ModuleManager {
    /** @param {TWindow} win */
    constructor(win) {
        this.win = win;
        /**@type {[Module]} */
        this.plugins = [];
    }

    add(pluginClass, options = {}) {
        /**@type {Module} */
        const plugin = new pluginClass(this.win, options);
        this.plugins.push(plugin);

        if (plugin.enable !== false) plugin.on();
    }

    get(id) {
        return this.plugins.find(p => p.id === id);
    }

    remove(id) {
        const index = this.plugins.findIndex(p => p.id === id);
        if (index !== -1) {
            this.plugins[index].off();
            this.plugins.splice(index, 1);
        }
    }

    clear() {
        for (const plugin of this.plugins) {
            plugin.off();
        }
        this.plugins = [];
    }

    destroy() {
        // Уничтожить все плагины
        for (const plugin of this.plugins) {
            plugin.destroy();
        }

        // Очистить массив плагинов
        this.plugins = [];

        // Обнулить ссылку на окно
        this.win = null;
    }
}

export class TWindow {
    #callbacks = {
        init: [],
        show: [],
        hide: [],
        animshow: [],
        animhide: []
    }

    constructor({
        oninit = () => { },
        onshow = () => { },
        onhide = () => { },
        verification = () => { return true; },
        animate = { animshow: () => { }, animhide: () => { } }
    } = {}, el = '.windowed') {
        const { animshow = () => { }, animhide = () => { } } = animate;

        this.verification = verification;
        this.element = el;
        this.showed = false;

        this.module = new ModuleManager(this);
        this.$win = $(`${this.element}`);
        this.$win.addClass('-v2');

        this.on('init', oninit);
        this.on('show', onshow);
        this.on('hide', onhide);
        this.on('animshow', animshow);
        this.on('animhide', animhide);

        $(`${this.element} > .hide-window`).on(`click${el}`, () => {
            this.hide();
        });

        this.#trigger('init');

        this.module.add(BorderRadius);
    }

    async show(pop = "Проверка не прошла!") {
        if (!this.verification()) {
            return new Popup("win", pop);
        }

        this.showed = true;
        this.#trigger('show');

        createTimeline({
            defaults: { ease: 'out(3)' },
            onBegin: () => {
                $('body').addClass('-noscrol');
                this.$win.css('display', 'block');
            },
            onComplete: () => { this.#trigger('animshow') }
        }).add(`${this.element} > .hide-window`, {
            duration: 300,
            opacity: [0, 1],
            onBegin: () => {
                this.$win.removeClass('hide');
                this.$win.css('display', '');
            }
        }).add(`${this.element} > .window-content`, {
            duration: 300,
            y: ['100%', '0%'],
            onBegin: () => {
                $(`${this.element} > .window-content`).removeClass('hide');
            }
        });
    }

    async hide() {
        this.showed = false;
        this.#trigger('hide');

        const height = utils.get(`${this.element} > .window-content`, 'height');
        const y = utils.get(`${this.element} > .window-content`, 'y');

        createTimeline({
            defaults: { ease: 'out(3)' },
            onComplete: () => { this.#trigger('animhide') }
        }).add(`${this.element} > .window-content`, {
            duration: 300,
            y: [y, height],
            onComplete: () => {
                $(`${this.element} > .window-content`).addClass('hide');
                $('body').removeClass('-noscrol');
            }
        }).add(`${this.element} > .hide-window`, {
            duration: 300,
            opacity: [1, 0],
            onComplete: () => {
                this.$win.addClass('hide');
            }
        });
    }

    /**
     * Подписка на событие
     * @param {string} event 
     * @param {Function} callback 
     * @param {string|null} id 
     */
    on(event, callback, id = null) {
        if (this.#callbacks[event]) {
            this.#callbacks[event].push({ id, fn: callback, once: false });
        }
    }

    /**
     * Подписка на одноразовое событие
     */
    once(event, callback, id = null) {
        if (this.#callbacks[event]) {
            this.#callbacks[event].push({ id, fn: callback, once: true });
        }
    }

    /**
     * Отписка по id
     */
    off(event, id) {
        if (this.#callbacks[event]) {
            this.#callbacks[event] = this.#callbacks[event].filter(cb => cb.id !== id);
        }
    }

    /**
     * Вызов всех коллбеков события
     */
    async #trigger(event, ...args) {
        if (this.#callbacks[event]) {
            const remain = [];

            for (const cb of this.#callbacks[event]) {
                await cb.fn(...args);
                if (!cb.once) remain.push(cb);
            }

            this.#callbacks[event] = remain;
        }
    }

    async destroy() {
        if (this.showed) {
            await this.hide();

            // Дождаться окончания анимации скрытия
            await new Promise(resolve => {
                this.once('animhide', resolve);
            });
        }

        $(`${this.element} > .hide-window`).off(`click${this.element}`);

        this.#callbacks = {
            init: [],
            show: [],
            hide: [],
            animshow: [],
            animhide: []
        };

        if (this.module && typeof this.module.destroy === 'function') {
            this.module.destroy();
        }

        this.$win.remove();

        $('body').removeClass('-noscrol');

        this.$win = null;
        this.element = null;

        this.showed = false;
        this.verification = null;
        this.module = null;
    }
}

export class BorderRadius extends Module {
    constructor(win, { }) {
        super(win, { id: 'borderradius' });

        this.win.on('animshow', () => { this.on(); });
        this.win.on('hide', () => { this.off(); })
    }

    on() {
        if (!this.win.showed) return;

        const $content = $(`${this.win.element}>.window-content`);
        const $window = $(window);

        let h = {
            window: $window.height(),
            content: $content.height()
        };

        this.addEventListener($(window), 'resize', () => {
            h = {
                window: $window.height(),
                content: $content.height()
            };

            if (h.window <= h.content) {
                return $content.addClass('border-hide');
            }

            return $content.removeClass('border-hide');
        });

        if (h.window <= h.content) {
            return $content.addClass('border-hide');
        }
    }

    off() {
        super.off();
        $(`${this.win.element}>.window-content`).removeClass('border-hide');
    }
}