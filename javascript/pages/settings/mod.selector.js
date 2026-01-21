import { TWindow } from "../../core/window.core.js";
import { Popup } from "../../modules/tun.popup.js";
import { WindowIntercator } from "../../modules/win.module.js";

let MODE = 'single';
let ID = null;

let GET_INDEX = () => { return -1 };
let GET_VALUE = () => { return null };
let SET_VALUE = () => { };

const WindowSelect = {
    oninit: function () {
        $('.selector-wrapper').on('click', '.option', function () {
            const $e = $(this);
            const id = parseInt($e.attr('data-id'));

            WindowSelect[MODE]($e, id);
        });

        $('.window-bar > .window-close').on('click', () => {
            _windowSelect.hide();
        });
    },

    onshow: () => { },
    onhide: () => { },

    single: ($e, id) => {
        const selected = GET_INDEX();

        if (id === selected) return;

        $('.selector-wrapper > .-select').removeClass('-select');
        $e.addClass('-select');

        SET_VALUE(id);
        
        $(`.button-tips-wrapper[data-id="${ID}"], .select-wrapper[data-id="${ID}"]`).find('.value').text($e.text());
    },

    multiple: ($e, key) => {
        key = $e.attr('data-key')
        /**@type {[string]} */
        const selected = GET_VALUE();

        console.log(key);

        if (selected.includes(key)) {
            selected.splice(selected.findIndex(x => x === key), 1);
            $e.removeClass('-select');
        } else {
            selected.push(key);
            $e.addClass('-select');
        }

        SET_VALUE(selected);
        $(`.button-tips-wrapper[data-id="${ID}"]`).find('.value').text(selected.length);
    }
}

const _windowSelect = new TWindow(WindowSelect, '.window-selector');
_windowSelect.module.add(WindowIntercator);

export function WindowSelector({ variation, getValue, setValue, getIndex, description, title, mode, id }) {
    if (!getValue || !setValue) return new Popup('win.sel', 'Произошла ошибка!');

    MODE = mode;
    ID = id;
    SET_VALUE = setValue;
    GET_VALUE = getValue;
    GET_INDEX = getIndex;

    $('.selector-wrapper').empty();

    const selected = GET_VALUE();

    for (let i = 0; i < variation.length; i++) {
        const { key, val } = variation[i];
        let cl = ['option'];
        try {
            cl = cl.concat(selected.includes(key) ? '-select' : []);
        } catch (error) {
            console.error(error);
        }
        $('.selector-wrapper').append(`<div class="${cl.join(' ')}" data-id="${i}" data-key="${key}"><span class="title">${val}</span><span class="circle"></span></div>`);
    }

    $('.tip-text').text(description);
    $('.selector-bar > .window-title').text(title);

    _windowSelect.show();
}