import { Sleep } from "../modules/funcitons.js";

export class WindowManagement {
    constructor(target = {
        init: function () { },
        show: function () { },
        hide: function () { },
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

    click() {
        if (!this.target.verif()) {
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
    }
}  