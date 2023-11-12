import { WindowManagement } from "../../modules/Windows.js";

const WindowSelect = {
    init: function () {
        $('.window-bar > .window-close').on('click', () => {
            _windowMehrSelect.hide();
            _windowSelect.hide();
        })
    },
    show: () => { },
    hide: () => { },
    verif: () => { return true; }
}

const _windowSelect = new WindowManagement(WindowSelect, '.window-select');
const _windowMehrSelect = new WindowManagement(WindowSelect, '.window-select-mehr');


export function ShowSelect(title, key, def, params = [], selected, event) {
    $('.content-selectes > .selectes').off('click.selectes');
    $('.button-clear-param').off('click.selectes');
    $('.select-bar > .window-title').text(title);
    $('.content-selectes').empty();
    for (let i = 0; i < params.length; i++) {
        const element = params[i];
        $('.content-selectes').append(`<div class="selectes ${selected == element.key ? 'select' : ''}" data-key="${element.key}"><div class="variant"><div class="variant-key">${element.val}</div><div class="variant-selected"><div class="circle"></div></div></div></div>`);
    }
    $('.content-selectes > .selectes').on('click.selectes', function () {
        const element = $(this);
        const val = element.attr('data-key');
        if (val == selected)
            return;
        $('.content-selectes > .selectes.select').removeClass('select');
        element.addClass('select');
        setParameter(key, val);
        if (event && typeof event == 'function') {
            event();
        }
        selected = val;
        const slectedIndex = params.findIndex(x => x.key == selected);
        $(`label[data-param="${key}"] > .select`).text(params[slectedIndex].val);
    });
    $('.button-clear-param').on('click.selectes', function () {
        $('.content-selectes > .selectes.select').removeClass('select');
        $(`.content-selectes > .selectes[data-key="${def}"]`).addClass('select');
        const slectedIndex = params.findIndex(x => x.key == def);
        $(`label[data-param="${key}"] > .select`).text(params[slectedIndex].val);
        setParameter(key, def);
        if (event && typeof event == 'function') {
            event();
        }
    });
    _windowSelect.click();
}

export function ShowMoreSelect(title, key, params = [], selected = [], description) {
    $('.select-mehr-bar > .window-title').text(title);
    $('.content-wraper > .info-text > span').text(description);
    $('.content-selectes-more').empty();
    $('.content-selectes-more > .selectes').off('click.selectes');
    for (let i = 0; i < params.length; i++) {
        const element = params[i];
        $('.content-selectes-more').append(`<div class="selectes ${selected.findIndex(x => x == element.key) != -1 ? 'select' : ''}" data-key="${element.key}"><div class="variant"><div class="variant-key">${element.val}</div><div class="variant-selected"><div class="circle"></div></div></div></div>`);
    }
    $('.content-selectes-more > .selectes').on('click.selectes', function () {
        const element = $(this);
        const val = element.attr('data-key');
        const index = selected.findIndex(x => x == val);
        if (element.hasClass('select')) {
            selected.splice(index, 1);
            element.removeClass('select');
        } else {
            selected.push(val);
            element.addClass('select');
        }
        $(`label[data-param="${key}"] > .select`).text(selected.length);
        setParameter(key, selected);
    });
    _windowMehrSelect.click();
}