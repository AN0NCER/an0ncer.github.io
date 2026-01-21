import { animate } from "../../library/anime.esm.min.js";

let GLOBAL_ID = 0;

const log = console.log.bind(console, '[mod.engine] ->');
const err = console.error.bind(console, '[mod.engine] ->');
const warn = console.warn.bind(console, '[mod.engine] ->');

const dependency = {
    map: new Map(),
    register: function (id, dependsOn) {
        if (dependsOn) {
            const { param, value } = dependsOn;
            if (!this.map.get(param)) this.map.set(param, []);
            this.map.get(param).push({ id, val: value });
        }
        return this;
    },
    update: function (param, value) {
        if (!param || typeof value === undefined) return;

        let obj = undefined;
        if (!(obj = this.map.get(param))) return;

        obj.forEach(({ id, val }) => {
            const wrapper = $(`[data-id="${id}"]`);
            if (value === val) {
                return wrapper.removeClass('-disable');
            }
            wrapper.addClass('-disable');
        });
    },
    updateAll: function () {
        this.map.forEach((params, key) => {
            const el = iSettings.getByParam(key);
            params.forEach(({ id, val }) => {
                const wrapper = $(`[data-id="${id}"]`);
                if (el.value === val) {
                    return wrapper.removeClass('-disable');
                }
                wrapper.addClass('-disable');
            });
        })
    }
}

class iElement {
    constructor(setup, type, defaultValue = undefined) {
        this.id = generateUniqueId();
        this.value = defaultValue;
        this.param = setup.param;
        this.type = type;
        iSettings.settings.set(this.id, this);
        dependency.register(this.id, setup.dependsOn);
    }

    set(value, event = () => { }) {
        if (value instanceof Promise) return;
        this.value = value;
        event(this.value);
        dependency.update(this.param, this.value);
    }

    get() {
        return this.value;
    }
}

const iSettings = new class {
    constructor() {
        this.settings = new Map();
    }

    getByParam(param) {
        for (let [key, element] of this.settings) {
            if (element.param === param) return element;
        }
    }
}()

const map = {
    'checkbox.tip': (val) => {
        const ielement = new iElement(val, 'checkbox', false);
        const id = ielement.id;

        const { classes = [], styles = [], dependsOn } = val;
        const { enable = () => { return true } } = val;
        const { title, description, param } = val;
        const { click = () => { } } = val;

        const {
            get = () => { return getParametrByKey($PARAMETERS, param) },
            set = (checked) => { if (param) setParameter(param, checked); }
        } = val;

        const cl = ['checkbox-wrapper', 'closset', '-hide'].concat(classes);
        const st = [].concat(styles.map(x => `${x.key}: ${x.val};`));

        const value = get();
        ielement.set(value);
        let vl = value;

        if (value instanceof Promise) {
            vl = false;
            cl.push('-load');
            Promise.resolve(value).then((result) => {
                ielement.set(result);
                $(`#${id}`).prop('checked', result);
                $(`[data-id="${id}"]`).removeClass('-load');
            }).catch((e) => err(`Ошибка получение данных ${id}, ${e}`));
        }

        if (!enable(ielement.id)) cl.push('-disable');

        setTimeout(() => {
            $(`.checkbox-wrapper[data-id="${id}"]`).on('change', 'input[type="checkbox"]', function (e) {
                const checked = $(this).is(':checked');
                ielement.set(checked, set);
                click(checked);
            });
        }, 0);

        return `<div class="${cl.join(' ')}" ${st.length > 0 ? `style="${st.join('')}"` : ''} data-id="${id}"><div class="checkbox" param><div class="btn tooltip"><div class="ticon i-caret-right"></div></div><label><div class="title" tit>${title}</div><div class="checkbox"><input id="${id}" type="checkbox" ${vl ? "checked" : ""}><div class="switch-slider"></div></div></label></div><div class="tips">${description}</div></div>`;
    },
    'button.event': (val) => {
        const ielement = new iElement(val, 'button');
        const id = ielement.id;

        const { classes = [], styles = [] } = val;
        const { enable = () => { return true } } = val;
        const { title, description, param } = val;
        const { click = () => { }, icon } = val;

        const cl = ['btn-value-wrapper', 'closset'].concat(classes);
        const st = [].concat(styles.map(x => `${x.key}: ${x.val};`));

        Promise.resolve(val.value()).then(result => {
            $(`#${id}`).html(result).removeClass('-load');
        }).catch(err => { log(err) });

        setTimeout(() => {
            $(`.btn[data-id="${id}"]`).on('click', () => {
                click();
            });
        }, 0);

        if (!enable()) cl.push('-disable');

        return `<div class="${cl.join(' ')}" ${st.length > 0 ? `style="${st.join('')}"` : ''}><div class="btn button" data-id="${id}" param><div class="icon"><div class="ticon i-${icon}"></div></div><label><div class="title" tit>${title}</div><div class="value -load" id="${id}"><span class="loader"></span></div></label></div></div>`;
    },
    'img.select': (val) => {
        const ielement = new iElement(val, 'imageselector');
        const id = ielement.id;

        const { classes = [], styles = [] } = val;
        const { click = () => { } } = val;
        const { variation = [], title, description, param } = val;

        const {
            get = () => { return getParametrByKey($PARAMETERS, param) },
            selected = () => { return variation.findIndex(x => x.key == get()) },
            set = (key) => {
                setParameter(param, key);
            }
        } = val;

        const cl = ['img-select-wrapper', '-hide'].concat(classes);
        const st = [].concat(styles.map(x => `${x.key}: ${x.val};`));

        let select = selected();
        select = select !== -1 ? select : 0;
        ielement.set(select);

        const element = (variation = []) => {
            let html = "";
            for (let i = 0; i < variation.length; i++) {
                const { img, val, key } = variation[i];
                html += ` <div class="element-wrapper" data-key="${key}"><div class="bg" style="--bg: url(/images/settings/${img})"></div><span class="value">${val}</span></div>`;
            }
            return html;
        }
        //TODO: Add click event
        setTimeout(() => {
            const $element = $(`.img-select-wrapper[data-id="${id}"]`);
            $element.find(`.element-wrapper[data-key="${variation[select].key}"]`).addClass('-select');

            $element.on('click', '.element-wrapper', (e) => {
                const $e = $(e.currentTarget);
                if ($e.hasClass('-select')) return;

                const key = $e.attr('data-key');
                const select = variation.findIndex(x => x.key === key);

                ielement.set(key, set);
                $element.find('label > .value').text(variation[select].val);
                $element.find('.-select').removeClass('-select');
                $e.addClass('-select');
                click(variation[select]);
            });
        }, 0);

        return `<div class="${cl.join(' ')}" ${st.length > 0 ? `style="${st.join('')}"` : ''} data-id="${id}"><div class="button-wrapper"><div class="btn button" param><div class="icon"><div class="ticon i-caret-right"></div></div><label><div class="title" tit>${title}</div><div class="value">${variation[select].val}</div></label></div></div><div class="scroll scroll-none"><div class="list">${element(variation)}</div><div class="tip">${description}</div></div></div>`;
    },
    'btn.tip': (val) => {
        const ielement = new iElement(val, 'button');
        const id = ielement.id;

        const { classes = [], styles = [] } = val;
        const { enable = () => { return true } } = val;
        const { title, description, param } = val;
        const { click, mode, variation } = val;

        const {
            getParam = () => getParametrByKey($PARAMETERS, param),
            getIndex = () => variation.findIndex(x => x.key === getParam()),
        } = val;

        let {
            getValue = () => getParam().length,
            setValue = (value) => setParameter(param, value),
        } = val;

        if (mode === 'single') {
            getValue = () => variation.find(x => x.key === getParam()).val;
            setValue = (index) => setParameter(param, variation[index].key);
        }

        ielement.set(getParam());
        const modSetValue = (val) => { ielement.set(val, setValue); }

        const cl = ['button-tips-wrapper', 'closset', '-hide'].concat(classes);
        const st = [].concat(styles.map(x => `${x.key}: ${x.val};`));

        const content = getValue();

        setTimeout(() => {
            $(`.button-tips-wrapper[data-id="${id}"]`).on('click', 'label', function () {
                click({ variation, mode, title, id, description, getValue: getParam, setValue: modSetValue, getIndex });
            });
        }, 0);

        return `<div class="${cl.join(' ')}" ${st.length > 0 ? `style="${st.join('')}"` : ''} data-id="${id}"><div class="btn button" param><div class="icon tooltip"><div class="ticon i-caret-right"></div></div><label><div class="title" tit>${title}</div><div class="value">${content}</div></label></div><div class="tips">${description}</div></div>`;
    },
    'sel.one': (val) => {
        const ielement = new iElement(val, 'selector');
        const id = ielement.id;

        const { classes = [], styles = [] } = val;
        const { enable = () => { return true } } = val;
        const { title, description, param } = val;
        const { variation, click, icon } = val;

        const {
            getValue = () => variation.find(x => x.key == getParametrByKey($PARAMETERS, param)).val,
            setValue = (index) => setParameter(param, variation[index].key),
            getIndex = () => variation.findIndex(x => x.key === getParametrByKey($PARAMETERS, param)),
        } = val;

        const modSetValue = (val) => { ielement.set(val, setValue); }

        const cl = ['select-wrapper'].concat(classes);
        const st = [].concat(styles.map(x => `${x.key}: ${x.val};`));

        Promise.resolve(getValue()).then(result => {
            ielement.set(result);
            $(`#${id}`).html(result).removeClass('-load');
        }).catch(e => { err(e) });

        setTimeout(() => {
            $(`.select-wrapper[data-id="${id}"]`).on('click', '.icon, .title', () => {
                click({ variation, description, mode: "single", title, id, setValue: modSetValue, getValue, getIndex });
            });

            $(`.control[data-id="${id}"]`).on('click', '.btn', function (e) {
                const $e = $(this);
                const id = $e.attr('id');
                let index = getIndex();

                if (id === "nx") {
                    index = index < variation.length - 1 ? index + 1 : 0;
                } else {
                    index = index > 0 ? index - 1 : variation.length - 1;
                }

                modSetValue(index);

                $(e.delegateTarget).find('.value').text(variation[index].val);
            });
        }, 0);

        if (!enable(id)) cl.push('-disable');

        return `<div class="${cl.join(' ')}" ${st.length > 0 ? `style="${st.join('')}"` : ''} data-id="${id}"><div class="btn button" param><div class="icon tooltip"><div class="ticon i-${icon}"></div></div><label><div class="title" tit>${title}</div><div class="control" data-id="${id}"><div class="btn" id="ps"><div class="ticon i-caret-left"></div></div><span class="value -load" id="${id}"><span class="loader"></span></span><div class="btn" id="nx"><div class="ticon i-caret-right"></div></div></div></label></div></div>`;
    },
    'btn': (val) => {
        const ielement = new iElement(val, 'button');
        const id = ielement.id;

        const { classes = [], styles = [] } = val;
        const { enable = () => { return true } } = val;
        const { title, description, param } = val;
        const { icon, click } = val;

        const cl = ['button-wrapper'].concat(classes);
        const st = [].concat(styles.map(x => `${x.key}: ${x.val};`));

        setTimeout(() => {
            $(`.button-wrapper[data-id="${id}"]`).on('click', '.o-button', click);
        }, 0);

        return `<div class="${cl.join(' ')}" ${st.length > 0 ? `style="${st.join('')}"` : ''} data-id="${id}"><div class="o-button" param><div class="icon"><div class="ticon i-${icon}"></div></div><div class="value" tit>${title}</div></div></div>`;
    },
    'custom': (val) => {
        const ielement = new iElement(val, 'custom');
        const id = ielement.id;

        const { classes = [], styles = [] } = val;
        const { html, on } = val;

        const cl = ['custom-element'].concat(classes);
        const st = [].concat(styles.map(x => `${x.key}: ${x.val};`));

        setTimeout(() => {
            on(id);
        }, 0);

        return `<div class="${cl.join(' ')}" ${st.length > 0 ? `style="${st.join('')}"` : ''} id="${id}">${html}</div>`;
    }
}

export const Engine = {
    render: (setup) => {
        const builder = (params) => {
            let html = "";
            for (let i = 0; i < params.length; i++) {
                const { type } = params[i];
                try {
                    if (map[type]) {
                        html += map[type](params[i]);
                    }
                } catch (e) {
                    err(e);
                }
            }
            return html;
        }

        for (let i = 0; i < setup.length; i++) {
            const { name, params } = setup[i];
            $('main').append(`<div class="block-wrapper"><div class="title">${name}</div><div class="params-wrapper">${builder(params)}</div></div>`);
        }

        dependency.updateAll();

        hideAnimation();
    }
}

function hideAnimation() {
    // Раскрываем: от 0 до scrollHeight

    $('.checkbox-wrapper, .button-tips-wrapper').on('click', '.tooltip', function (e) {
        const $wrapper = $(this).closest('.closset');
        const $tips = $wrapper.find('> .tips');
        const fullHeight = $tips[0].scrollHeight;

        let opacity = 1;
        let height = fullHeight + 14;
        let padding = ['0px 10px', '7px 10px'];
        let onComplete = function () { $tips.css('height', 'auto'); };
        let onBegin = function () { $tips.css('overflow', 'hidden'); $wrapper.removeClass('-hide'); }

        if (!$wrapper.hasClass('-hide')) {
            $tips.css('height', fullHeight + 'px');
            $tips[0].offsetHeight;
            height = 0;
            opacity = 0;
            padding = ['7px 10px', '0px 10px'];
            onComplete = function () { };
            onBegin = function () { $tips.css('overflow', 'hidden'); $wrapper.addClass('-hide'); }
        }

        return animate($tips[0], {
            height,
            opacity,
            padding,
            duration: 300,
            easing: 'cubicBezier(0.29, -0.81, 0.42, 1.68)',
            onComplete,
            onBegin
        });
    });

    $('.img-select-wrapper').on('click', '.btn', function (e) {
        const $wrapper = $(this).closest('.img-select-wrapper');
        const $scroll = $wrapper.find('> .scroll');
        const fullHeight = $scroll[0].scrollHeight;

        if ($wrapper.hasClass('-hide')) {
            animate($scroll[0], {
                height: fullHeight,
                opacity: 1,
                duration: 300,
                easing: 'cubicBezier(0.29, -0.81, 0.42, 1.68)',
                onBegin: function () {
                    $scroll.css('overflow', 'hidden');
                    $wrapper.removeClass('-hide');
                },
                onComplete: function () {
                    $scroll.css('height', 'auto');
                    $scroll.css('overflow', '');
                }
            });
        } else {
            $scroll.css('height', fullHeight + 'px');
            $scroll[0].offsetHeight;

            animate($scroll[0], {
                height: 0,
                opacity: 0,
                duration: 300,
                easing: 'cubicBezier(0.29, -0.81, 0.42, 1.68)',
                onBegin: function () {
                    $scroll.css('overflow', 'hidden');
                    $wrapper.addClass('-hide');
                },
                onComplete: function () {
                    $scroll.css('overflow', '');
                }
            });
        }
    });
}

function generateUniqueId(prefix = 'gen') {
    return `${prefix}-${GLOBAL_ID++}`;
}

/**
 * Рекурсивно ищет значение по указанному ключу в объекте, включая вложенные объекты и массивы.
 * @param {Object} obj - Объект, в котором нужно выполнить поиск.
 * @param {string} targetKey - Искомый ключ.
 * @returns {*} Значение, соответствующее ключу, или undefined, если ключ не найден.
 */
export function getParametrByKey(obj, targetKey) {
    // Проверка: если текущий объект не является объектом или массивом — прекратить обход
    if (typeof obj !== 'object' || obj === null) {
        return undefined;
    }

    // Перебираем все ключи текущего объекта
    for (const key in obj) {
        const value = obj[key];

        // Если ключ совпадает с искомым, возвращаем значение
        if (key === targetKey) {
            return value;
        }

        // Если значение — объект или массив, рекурсивно ищем внутри него
        if (typeof value === 'object' && value !== null) {
            const result = getParametrByKey(value, targetKey);
            if (result !== undefined) {
                return result; // Возвращаем, как только нашли
            }
        }
    }

    // Если ключ не найден
    return undefined;
}