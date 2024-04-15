import { CreateVerify } from "../../modules/ActionVerify.js";
import { WindowManagement } from "../../modules/Windows.js";

const exception = ['tunime-id', 'application_installed'];

const WindowStorage = {
    init: function () {
        $('.window-bar > .window-close').on('click', () => {
            _windowStorage.hide();
        });
        $('.button-clear-app').on('click', () => {
            CreateVerify().then((val) => {
                for (const key in localStorage) {
                    if (exception.includes(key)) {
                        continue;
                    }
                    localStorage.removeItem(key);
                }
                for (const key in sessionStorage) {
                    if (exception.includes(key)) {
                        continue;
                    }
                    sessionStorage.removeItem(key);
                }
                if (localStorage.getItem('application_installed')) {
                    const data = JSON.parse(localStorage.getItem('application_installed'));
                    if (data.installed) {
                        document.location.replace('/?mode=standalone');
                    }
                }
                document.location.replace('/');
            }).catch((reason) => {

            });
        });
    },
    show: () => {
    },
    anim: {
        showed: () => {

        },
        hided: () => {
            $('.list-local-storage').empty();
            $('.list-session-storage').empty();
        }
    },
    hide: () => { },
    verif: () => { return true; }
}

const _windowStorage = new WindowManagement(WindowStorage, '.window-app-size');

export function ShowStorage(title = "Хранилище") {
    $('.select-bar > .window-title').text(title);
    let d = 'KB', s = Storage.Local.size();
    if (s > 1000) {
        d = 'MB';
        s = (s / 1000).toFixed(2);
    }
    $("#locdata > span").text(`${s} ${d}`);
    d = 'KB', s = Storage.Session.size();
    if (s > 1000) {
        d = 'MB';
        s = (s / 1000).toFixed(2);
    }
    $("#sesdata > span").text(`${Storage.Session.size()} KB`);

    let _xLen, _x;
    for (_x in localStorage) {
        if (!localStorage.hasOwnProperty(_x)) {
            continue;
        }
        let d = 'KB';
        _xLen = (((localStorage[_x].length + _x.length) * 2) / 1024).toFixed(2);
        if (_xLen > 1000) {
            d = 'MB';
            _xLen = (_xLen / 1000).toFixed(2);
        }
        $('.list-local-storage').append(`<div class="storage-element"><div>${_x}</div><span>${_xLen} ${d}</span></div>`);
    }
    for (_x in sessionStorage) {
        if (!sessionStorage.hasOwnProperty(_x)) {
            continue;
        }
        let d = 'KB';
        _xLen = (((sessionStorage[_x].length + _x.length) * 2) / 1024).toFixed(2);
        if (_xLen > 1000) {
            d = 'MB';
            _xLen = (_xLen / 1000).toFixed(2);
        }
        $('.list-session-storage').append(`<div class="storage-element"><div>${_x}</div><span>${_xLen} ${d}</span></div>`);
    }
    _windowStorage.click();
}

export const Storage = {
    Local: {
        size: function () {
            var _lsTotal = 0,
                _xLen, _x;
            for (_x in localStorage) {
                if (!localStorage.hasOwnProperty(_x)) {
                    continue;
                }
                _xLen = ((localStorage[_x].length + _x.length) * 2);
                _lsTotal += _xLen;
            };
            return (_lsTotal / 1024).toFixed(2);
        }
    },
    Session: {
        size: function () {
            var _lsTotal = 0,
                _xLen, _x;
            for (_x in sessionStorage) {
                if (!sessionStorage.hasOwnProperty(_x)) {
                    continue;
                }
                _xLen = ((sessionStorage[_x].length + _x.length) * 2);
                _lsTotal += _xLen;
            };
            return (_lsTotal / 1024).toFixed(2);
        }
    },

    size: function () {
        var _lsTotal = 0,
            _xLen, _x;
        for (_x in localStorage) {
            if (!localStorage.hasOwnProperty(_x)) {
                continue;
            }
            _xLen = ((localStorage[_x].length + _x.length) * 2);
            _lsTotal += _xLen;
        };
        for (_x in sessionStorage) {
            if (!sessionStorage.hasOwnProperty(_x)) {
                continue;
            }
            _xLen = ((sessionStorage[_x].length + _x.length) * 2);
            _lsTotal += _xLen;
        };
        return (_lsTotal / 1024).toFixed(2);
    }
}