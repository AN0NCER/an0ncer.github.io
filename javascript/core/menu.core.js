import { Template } from "../modules/tun.template.js";
import { onTransitionEnd } from "./menu.help.js";
import { MENU_CONTROLLER, MENU_CONTEXT, MENU_GENERATOR } from "./menu.help.js";

const MENU_SAFE_EXTRA = 10;

/**
 * Следит за высотой .app-menu и синхронизирует layout документа
 * @param {HTMLElement} hostEl
 * @param {HTMLElement} menuEl
 * @param {() => boolean} isOpen
 */
function observeMenuHeight(hostEl, menuEl, isOpen, isRotate) {
    const root = document.documentElement;
    let first = true;

    const ro = new ResizeObserver(entries => {
        const rect = entries[0].contentRect;
        const height = rect.height;
        const width = rect.width;

        // Локальные для самого hostEl (если где-то нужны)
        hostEl.style.setProperty('--menu-height', `${height}px`);
        hostEl.style.setProperty('--menu-width', `${width}px`);

        // Определяем угол (с нормализацией -90 → 270)
        let angle = screen?.orientation?.angle ?? window.orientation ?? 0;
        if (angle === -90) angle = 270;
        const isLandscape = angle === 90 || angle === 270;

        const rotate = typeof isRotate === 'function' ? isRotate() : !!isRotate;

        let offset;

        if (rotate && isLandscape) {
            // Горизонтальный режим + кручение меню → работаем по ширине
            offset = `calc(${width}px + ${MENU_SAFE_EXTRA}px)`;

            root.style.setProperty('--menu-height-safe', `0px`);
            root.style.setProperty('--menu-width-safe', offset);
        } else {
            // Обычный (вертикальный) → работаем по высоте
            offset = `calc(${height}px + ${MENU_SAFE_EXTRA}px)`;

            root.style.setProperty('--menu-height-safe', offset);
            root.style.setProperty('--menu-width-safe', `0px`);
        }

        // Глобовый offset, если ты его используешь
        root.style.setProperty(
            '--layout-menu-offset',
            isOpen() ? offset : '0px'
        );

        if (first) {
            first = false;
        }
    });

    ro.observe(menuEl);

    return () => ro.disconnect();
}

class MAdapter {
    getStyle() {
        return $PARAMETERS.menu.menustyle || 'default';
    }
    /** id шаблона в документе */
    getTemplateId(style) {
        return `tpl-menu-${style}`; // <template id="tpl-menu-default"> и т.п.
    }

    loadTemplate(style) {
        const templateId = this.getTemplateId(style);

        /**@type {HTMLTemplateElement|null} */
        const tplEl = document.getElementById(templateId);

        if (!tplEl || !(tplEl instanceof HTMLTemplateElement)) {
            const ids = [...document.querySelectorAll('template[id]')].map(t => t.id);
            const err = new Error(`Template "${templateId}" not found in document`);
            err.__tpl_debug = { templateId, found: ids };
            throw err;
        }

        return { tplEl, templateId }
    }
}

class MRender {
    /**
    * @param {{ host: string|Element, adapter: MAdapter, fallbackStyle?: string }} opts
    */
    constructor({ host, adapter, fallbackStyle = 'default' }) {
        this.host = host;
        this.adapter = adapter;
        this.fallbackStyle = fallbackStyle;

        /**@type {Element|null} */
        this.hostEl = null;

        /**Защита от повторного вызова */
        this._mountPromise = null;
    }

    /**
     * Получает dom хост (куда вставляется меню)
     */
    resolveHost() {
        if (this.hostEl) return this.hostEl;
        this.hostEl = typeof this.host === 'string' ? document.querySelector(this.host) : this.host;
        if (!this.hostEl) throw new Error('Host not found')
        return this.hostEl;
    }

    /**
     * Монтирует меню (с fallback на default, если стиль не найден)
     * @param {{ style?: string }} [opts]
     */
    async mount(opts = {}) {
        if (this._mountPromise) return this._mountPromise;

        this._mountPromise = (async () => {
            const hostEl = this.resolveHost();
            const style = opts.style || this.adapter.getStyle();

            let loaded;
            let mountedStyle = style;

            try {
                loaded = this.adapter.loadTemplate(style);
            } catch (e) {
                if (style !== this.fallbackStyle) {
                    console.warn(
                        `[Menu] style "${style}" not found in document, fallback to "${this.fallbackStyle}"`
                    );
                    loaded = this.adapter.loadTemplate(this.fallbackStyle);
                    mountedStyle = this.fallbackStyle;
                } else {
                    throw e;
                }
            }

            hostEl.replaceChildren(loaded.tplEl.content.cloneNode(true));

            hostEl.dataset.menuStyle = mountedStyle;
            hostEl.dataset.rotate = TMenu.state.isRotate;
            hostEl.dataset.menuTemplate = loaded.templateId;

            return {
                host: hostEl,
                menu: hostEl.querySelector('.app-menu'),
                context: hostEl.querySelector('.app-menu-context'),
                style: mountedStyle,
                templateId: loaded.templateId,
            };
        })();

        try {
            return await this._mountPromise;
        } finally {
            this._mountPromise = null;
        }
    }
}

class MContext {
    menu = {
        id: null, // текущий id сгенерированного меню
        view: {
            isOpen: false,  // открыто ли меню
            itemsCount: 0,  // сколько пунктов меню
            totalHeight: 0, // суммарная высота
        },
        async: {
            pendingRender: null // Promise рендера/перегенерации меню
        }
    }

    iconsState = {
        sprite: null,          // загруженный SVG-спрайт / документ
        isLoaded: false,       // спрайт готов к использованию
        pendingLoad: null      // Promise загрузки иконок
    };

    static GAP = 5;
    static PADDING_V = 20;

    constructor(contextEl, { host, sprite = 'icons.pack.tpl' } = {}) {
        /**@type {HTMLDivElement} */
        this.host = host;
        /**@type {HTMLDivElement} */
        this.contextEl = contextEl;
        /**@type {HTMLDivElement} */
        this.controlsEl = contextEl.querySelector('.context-controls');
        /**@type {HTMLDivElement} */
        this.closeArea = contextEl.querySelector('.context-close-area');

        this.iconsState.sprite = sprite;
        this.#loadFile();
    }

    async #loadFile() {
        if (this.iconsState.pendingLoad || !this.host) return;

        this.iconsState.pendingLoad = (async () => {
            try {
                const tpl = await Template(this.iconsState.sprite);
                this.host.insertAdjacentHTML('beforeend', tpl.text());
                return true;
            } catch (err) {
                console.error(err);
                return false;
            }
        })()

        try {
            this.iconsState.isLoaded = await this.iconsState.pendingLoad;
        } finally {
            this.iconsState.pendingLoad = null;
        }
    }

    /**
     * Создаёт DOM-узел меню и считает его логическую высоту
     * @param {string} id
     * @returns {{ el: HTMLDivElement, height: number, count: number } | null}
     */
    buildMenuView(id) {
        const data = MENU_CONTEXT[id] || [];
        const menu = document.createElement(`div`);
        menu.className = `animate-wrapper`;
        menu.dataset.id = id;

        let height = 0;
        let count = 0;

        for (const context of data) {
            const generator = MENU_GENERATOR[context.type];
            if (!generator) continue;

            const { element, box } = generator(context);
            menu.appendChild(element[0] || element);
            height += box.height;
            count++;
        }

        if (count === 0) return null;

        if (count > 1) {
            height += (count - 1) * MContext.GAP;
        }

        height += MContext.PADDING_V * 2;

        return { el: menu, height, count };
    }

    /**
     * Анимирует высоту controlsEl
     * @param {number} targetHeight
     * @returns {Promise<void>}
     */
    animateHeight(targetHeight) {
        const controls = this.controlsEl;
        const from = controls.offsetHeight;

        // если первый раз – выставляем исходную высоту
        controls.style.height = `${from}px`;

        controls.classList.remove('-hide');
        void controls.offsetHeight;

        const anim = onTransitionEnd(controls, 'height');
        controls.style.height = `${targetHeight}px`;

        return anim.promise.then(() => {
            controls.style.height = ''; // убираем инлайн, отдаём CSS
        });
    }

    /**
     * 
     * @param {Object} view
     * @param {number} view.count 
     * @param {number} view.height 
     * @param {HTMLDivElement} view.el 
     */
    async openPanel(view) {
        this.controlsEl.insertAdjacentElement('beforeend', view.el);

        this.contextEl.classList.remove('-hide');
        void this.contextEl.offsetWidth; // Ждем отрисовку в dom

        if (this.closeArea) {
            this.closeArea.style.opacity = '1';
        }


        await this.animateHeight(view.height - MContext.PADDING_V * 2);

        this.menu.view.totalHeight = view.height;
        this.menu.view.isOpen = true;
    }

    async switchMenu(oldId, newView) {
        const controls = this.controlsEl;
        const oldEl = controls.querySelector(`.animate-wrapper[data-id="${oldId}"]`);

        if (!oldEl) {
            return this.openPanel(newView);
        }

        const width = oldEl.offsetWidth;

        // подготовка нового
        controls.insertAdjacentElement('beforeend', newView.el);

        void newView.el.offsetHeight;

        const contentHeight = newView.height - MContext.PADDING_V * 2;
        newView.el.style.height = `${contentHeight}px`;
        newView.el.style.transform = `translateX(-${width + 10}px)`;

        const slideOut = onTransitionEnd(oldEl, 'transform');
        const slideIn = onTransitionEnd(newView.el, 'transform');

        //Анимация старого
        oldEl.style.transform = `translateX(-${width + 10}px)`;
        await Promise.all([slideOut.promise, slideIn.promise]);
        newView.el.style.transition = `null`;
        newView.el.style.transform = ``;

        void this.controlsEl.offsetWidth;
        newView.el.style.transition = ``;

        oldEl.remove();

        this.menu.view.totalHeight = newView.height;
        this.menu.view.isOpen = true;
    }

    async show(id) {
        // не создаём несколько параллельных операций
        if (this.menu.async.pendingRender) {
            await this.menu.async.pendingRender;
        }
        // если уже открыто именно это меню – ничего не делаем
        if (this.menu.id === id && this.menu.view.isOpen) return;

        this.menu.async.pendingRender = this.#showInternal(id);

        try {
            await this.menu.async.pendingRender;
        } finally {
            this.menu.async.pendingRender = null;
        }
    }

    async #showInternal(id) {
        const view = this.buildMenuView(id);
        if (!view) return;

        if (!this.menu.view.isOpen) {
            await this.openPanel(view);
        } else {
            await this.switchMenu(this.menu.id, view);

            // если надо – анимируем изменение высоты (если меню выше/ниже)
            if (this.menu.view.totalHeight !== view.height) {
                const contentHeight = view.height - MContext.PADDING_V * 2;
                await this.animateHeight(contentHeight);
            }
        }

        this.menu.id = id;
        this.menu.view.itemsCount = view.count;
    }

    async hide() {
        if (this.menu.async.pendingRender || !this.menu.view.isOpen) return;

        const controls = this.controlsEl;

        const from = controls.offsetHeight;
        controls.style.height = `${from}px`;
        controls.style.minHeight = `${from - MContext.PADDING_V * 2}px`;
        void controls.offsetHeight;

        this.controlsEl.classList.add('-hide');

        const anim = onTransitionEnd(controls, 'height');

        controls.style.height = '0px'
        controls.style.minHeight = `0px`;

        if (this.closeArea) {
            this.closeArea.style.opacity = 0;
        }

        await anim.promise;

        this.contextEl.classList.add('-hide');
        controls.style.height = '';
        controls.style.minHeight = '';

        this.menu.view.isOpen = false;
        this.menu.id = null;

        this.controlsEl.replaceChildren();
    }
}

class MController {
    /**
    * @param {{ host: Element, menuEl, contextEl}} opts
    */
    constructor({ host, menuEl, contextEl } = {}) {
        this.host = host;

        this.menuEl = menuEl;
        this.contextEl = contextEl;

        this.context = new MContext(this.contextEl, {
            host: this.host
        });

        this.addListeners();
    }

    async addListeners() {
        let _clickPromise = null;
        const menu = $(this.menuEl);

        menu.on('click', '.menu-btn', async (e) => {
            if (_clickPromise) return _clickPromise;

            /**@type {HTMLDivElement} */
            const element = e.currentTarget;
            const _id = element.dataset.id;

            _clickPromise = MENU_CONTROLLER[_id]();

            try {
                const data = await _clickPromise;
                if (data?.page) {
                    window.location.href = data.page;
                }
            } finally {
                _clickPromise = null;
            }
        });

        $('.context-close-area').on('click', () => {
            this.context.hide();
        })

        menu.on('contextmenu', '.menu-btn', (e) => {
            e.preventDefault();

            /**@type {HTMLDivElement} */
            const element = e.currentTarget;
            const _id = element.dataset.id;

            this.context.show(_id);
        });

        (async () => {
            /**@type {HTMLDivElement} */
            let element = null;
            let called = false;
            let timer;

            menu.on('touchstart', '.menu-btn', (e) => {
                element = e.currentTarget;
                const _id = element.dataset.id;
                element.classList.add('-pressed');

                called = false;
                clearTimeout(timer);

                timer = setTimeout(() => {
                    clearTimeout(timer);
                    if (called) return;

                    element.classList.remove('-pressed');
                    this.context.show(_id);
                    called = true;
                }, 700);
            })

            $(document).on('touchend', () => {
                clearInterval(timer);

                element.classList.remove('-pressed');
                element = null;
            });
        })();
    }
}

export const TMenu = new class {
    help = {
        MENU_CONTEXT,
        MENU_CONTROLLER
    }
    // read-only контекст
    context = {
        page: document.body.dataset.page || 'unknown',
        style: 'default'
    }

    // состояние меню
    state = {
        isOpen: false,
        isRotate: $PARAMETERS.menu.menuver,
        isRevers: $PARAMETERS.menu.menureverse,

        // ссылка на dom
        host: null,
        menuEl: null,
        contextEl: null,

        //загруженный стиль
        mountedStyle: null,

        _unbindSize: null
    };

    #adapter = new MAdapter();
    #render = new MRender({ host: `#app-menu-host`, adapter: this.#adapter, fallbackStyle: 'default' });

    async init() {
        // 1 -> Монтируем меню на страницу
        const mount = await this.#render.mount({ style: this.context.style });

        // 2 -> Установка состояния меню
        this.state.isOpen = true;
        this.state.host = mount.host;
        this.state.menuEl = mount.menu;
        this.state.contextEl = mount.context;
        this.state.mountedStyle = mount.style;

        // 3 -> Наблюдатель за .app-menu с установкой глобальных CSS переменных
        this.state._unbindSize?.();
        if (this.state.host && this.state.menuEl) {
            this.state._unbindSize = observeMenuHeight(
                this.state.host,
                this.state.menuEl,
                () => this.state.isOpen,
                () => this.state.isRotate
            )
        }

        // 4 -> Установка событий на нажатия и контекстного меню
        this.controller = new MController({
            host: this.state.host,
            menuEl: this.state.menuEl,
            contextEl: this.state.contextEl
        });

        // 5 -> Выделяет текущую страницу
        this.state.menuEl.querySelector(`.menu-btn[data-id="${this.page}"]`)?.classList.add('-sel');
    }

    /**
     * ---------------------------
     * Вспомогательные get функции
     * ---------------------------
     */

    get isOpen() {
        return this.state.isOpen;
    }

    get page() {
        return this.context.page;
    }

    /**
     * ---------------------------
     * Вспомогательеые set функции
     * ---------------------------
     */

    async setStyle(style) {
        this.context.style = style;

        const mount = await this.#render.mount({ style });

        this.state.isOpen = true;
        this.state.host = mount.host;
        this.state.menuEl = mount.menu;
        this.state.contextEl = mount.context;
        this.state.mountedStyle = mount.style;

        this.state._unbindSize?.();
        if (this.state.host && this.state.menuEl) {
            this.state._unbindSize = observeMenuHeight(
                this.state.host,
                this.state.menuEl,
                () => this.state.isOpen,
                () => this.state.isRotate
            );
        }
    }
}();

(() => {
    const root = document.documentElement;
    const body = document.body;

    let lastAngle = null;

    const update = () => {
        const angle = getAngle();
        if (angle === lastAngle) return;
        lastAngle = angle;

        body.setAttribute('angle', String(angle));

        // core vars на html
        root.style.setProperty('--core-angle', `${angle}deg`);
        root.style.setProperty('--core-angle-num', String(angle));
    };

    update();

    window.addEventListener('orientationchange', update, { passive: true });

    if (screen?.orientation?.addEventListener) {
        screen.orientation.addEventListener('change', update);
    }

    function getAngle() {
        let angle = screen?.orientation?.angle ?? window.orientation ?? 0;
        if (angle === -90) angle = 270;

        if (TMenu.state.isRevers) {
            if (angle === 90) angle = 270;
            else if (angle === 270) angle = 90;
        }

        return angle;
    }
})();