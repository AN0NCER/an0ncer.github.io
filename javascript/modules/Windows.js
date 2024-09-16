import { Sleep } from "./functions.js";
import { ShowInfo } from "./Popup.js";

/**
 * @typedef {Object} target
 * @property {function():void} init - Метод для инициализации окна
 * @property {function():void} show - Метод для показа окна
 * @property {function():void} hide - Метод для скрытия окна
 * @property {Object} anim
 * @property {function():void} anim.showed - Метод для анимации показа окна
 * @property {function():void} anim.hided - Метод для анимации скрытия окна
 * @property {function():boolean} verif - Функция для проверки авторизации
 */

export class WindowManagement {
    /**
     * @param {target} target - Объект с методами для работы с окном
     * @param {string} el - Селектор элемента окна
     */
    constructor(target = {
        init: function () { },
        show: function () { },
        hide: function () { },
        anim: {
            showed: function () { },
            hided: function () { },
        },
        verif: function () { return true; },
    }, el = '.windowed') {
        this.authorized = false;
        this.showed = false;
        this.element = el;
        this.target = target;
        this.target.init();
        $(`${this.element} > .hide-window`).click(() => {
            this.hide();
            this.target.hide();
        });
    }

    init(authorized) {
        this.authorized = authorized;
    }

    click(title = "Вы должны авторизоваться!") {
        if (!this.target.verif()) {
            ShowInfo(title, "auth");
            return;
        }
        this.show();
        this.target.show();
    }

    async hide() {
        this.showed = false;
        let el = $(this.element);
        $(`${this.element} > .window-content`).css('transform', '');
        await Sleep(300);
        $(`${this.element} > .window-content`).addClass('hide');
        $(`${this.element} > .hide-window`).css('opacity', 0);
        await Sleep(300);
        el.addClass('hide');
        $(`${this.element} > .hide-window`).css('opacity', '');
        $(window).off(`resize.${this.element}`);
        if (this.target.anim?.hided) {
            this.target.anim.hided();
        }
    }

    async show() {
        this.showed = true;
        let el = $(`${this.element}.hide`);
        el.css('display', 'block');
        await Sleep(10);
        $(`${this.element} > .hide-window`).css('opacity', 1);
        el.removeClass('hide');
        el.css('display', '');
        await Sleep(300);
        $(`${this.element} > .hide-window`).css('opacity', '');
        $(`${this.element} > .window-content`).removeClass('hide');
        await Sleep(10);
        $(`${this.element} > .window-content`).css('transform', 'translateY(0%)')
        $(window).on(`resize.${this.element}`, this.#resize.bind(this));
        $(window).resize();
        if (this.target.anim?.showed) {
            this.target.anim.showed();
        }
    }

    #resize() {
        const wHeight = $(window).height(),
            eHeight = $(`${this.element}>.window-content`).height();
        if (wHeight <= eHeight) {
            $(`${this.element}>.window-content`).addClass('border-hide');
        } else {
            $(`${this.element}>.window-content`).removeClass('border-hide');
        }
    }
}  