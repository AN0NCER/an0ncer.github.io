import { TWindow } from "../../core/window.core.js";
import { Popup } from "../../modules/tun.popup.js";
import { WindowIntercator } from "../../modules/win.module.js";
import { getParametrByKey } from "./mod.engine.js";

let _property = null;
let _mode = 'single';
let _id = null;

const WindowSelect = {
    oninit: function () {
        $('.selector-wrapper').on('click', '.option', function () {
            const $e = $(this);
            const key = $e.attr('data-key');

            WindowSelect[_mode]($e, key);
        });

        $('.window-bar > .window-close').on('click', () => {
            _windowSelect.hide();
        });
    },
    onshow: () => { },
    onhide: () => { },

    single: ($e, key) => {
        /**@type {string} */
        const selected = getParametrByKey($PARAMETERS, _property);

        if (key === selected) return;

        $('.selector-wrapper > .-select').removeClass('-select');
        $e.addClass('-select');

        setParameter(_property, key);
        $(`.button-tips-wrapper[data-id="${_id}"], .select-wrapper[data-id="${_id}"]`).find('.value').text($e.text());
    },

    multiple: ($e, key) => {
        /**@type {[string]} */
        const selected = getParametrByKey($PARAMETERS, _property);

        if (selected.includes(key)) {
            selected.splice(selected.findIndex(x => x === key), 1);
            $e.removeClass('-select');
        } else {
            selected.push(key);
            $e.addClass('-select');
        }

        setParameter(_property, selected);
        $(`.button-tips-wrapper[data-id="${_id}"]`).find('.value').text(selected.length);
    }
}

const _windowSelect = new TWindow(WindowSelect, '.window-selector');
_windowSelect.module.add(WindowIntercator);

export function WindowSelector({ param, variation, description, mode, title, id } = {}) {
    if (!param || !variation) return new Popup('win.sel', 'Произошла ошибка!');
    _property = param;
    _mode = mode;
    _id = id;

    $('.selector-wrapper').empty();

    const selected = getParametrByKey($PARAMETERS, _property);

    for (let i = 0; i < variation.length; i++) {
        const { key, val } = variation[i];
        const cl = ['option'].concat(selected.includes(key) ? '-select' : []);
        $('.selector-wrapper').append(`<div class="${cl.join(' ')}" data-key="${key}"><span class="title">${val}</span><span class="circle"></span></div>`);
    }

    $('.tip-text').text(description);
    $('.selector-bar > .window-title').text(title);

    _windowSelect.show();
}

// const w = {
//     oninit: () => { },
//     onshow: () => { },
//     onhide: () => { },
//     animate: {
//         animshow: () => {
//             // _w.hide();
//         }
//     }
// };

// const _w = new TWindow(w, '.window-selector');

// _w.show();