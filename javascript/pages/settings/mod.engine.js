import { animate } from "../../library/anime.esm.min.js";

const dependencyMap = {};
const paramDefinitions = {};

const gen = {
    'checkbox.tip': (val) => {
        const { classes = [], styles = [] } = val;
        const { title, description, param } = val;

        registerDefinition(val);

        const cl = ['checkbox-wrapper', 'closset', '-hide'].concat(classes);
        const st = [].concat(styles.map(x => `${x.key}: ${x.val};`));
        const vl = getParametrByKey($PARAMETERS, param);

        return `<div class="${cl.join(' ')}" data-param="${param}" ${st.length > 0 ? `style="${st.join('')}"` : ''}><div class="checkbox" param><div class="btn tooltip"><div class="ticon i-caret-right"></div></div><label><div class="title" tit>${title}</div><div class="checkbox"><input type="checkbox" ${vl ? "checked" : ""}><div class="switch-slider"></div></div></label></div><div class="tips">${description}</div></div>`;
    },
    'button.event': (val) => {
        const { classes = [], styles = [] } = val;
        const { title, icon, click = () => { } } = val;
        const { enable = () => { return true } } = val;

        const cl = ['btn-value-wrapper', 'closset'].concat(classes);
        const st = [].concat(styles.map(x => `${x.key}: ${x.val};`));

        const id = generateUniqueId('tun');

        Promise.resolve(val.value()).then(result => {
            $(`#${id}`).html(result).removeClass('-load');
        }).catch(err => { console.log(err) });

        setTimeout(() => {
            $(`.btn[data-id="${id}"]`).on('click', () => {
                click();
            });
        }, 0);

        if (!enable()) cl.push('-disable');

        return `<div class="${cl.join(' ')}" ${st.length > 0 ? `style="${st.join('')}"` : ''}><div class="btn button" data-id="${id}" param><div class="icon"><div class="ticon i-${icon}"></div></div><label><div class="title" tit>${title}</div><div class="value -load" id="${id}"><span class="loader"></span></div></label></div></div>`;
    },
    'img.select': (val) => {
        const { classes = [], styles = [] } = val;
        const { title, variation, param, description } = val;
        const { click = () => { } } = val;

        const cl = ['img-select-wrapper', '-hide'].concat(classes);
        const st = [].concat(styles.map(x => `${x.key}: ${x.val};`));

        const id = generateUniqueId('tun');
        const select = variation.findIndex(x => x.key === getParametrByKey($PARAMETERS, param));

        const element = (variation = []) => {
            let html = "";
            for (let i = 0; i < variation.length; i++) {
                const { img, val, key } = variation[i];
                html += ` <div class="element-wrapper" data-key="${key}"><div class="bg" style="--bg: url(/images/settings/${img})"></div><span class="value">${val}</span></div>`;
            }
            return html;
        }

        setTimeout(() => {
            const $element = $(`.img-select-wrapper[data-id="${id}"]`);
            $element.find(`.element-wrapper[data-key="${variation[select].key}"]`).addClass('-select');
            $element.on('click', '.element-wrapper', (e) => {
                const $e = $(e.currentTarget);
                if ($e.hasClass('-select')) return;

                const key = $e.attr('data-key');
                const select = variation.findIndex(x => x.key === key);
                setParameter(param, key);

                $element.find('label > .value').text(variation[select].val);
                $element.find('.-select').removeClass('-select');
                $e.addClass('-select');
                click(key);
            });
        }, 0);

        return `<div class="${cl.join(' ')}" ${st.length > 0 ? `style="${st.join('')}"` : ''} data-id="${id}"><div class="button-wrapper"><div class="btn button" param><div class="icon"><div class="ticon i-caret-right"></div></div><label><div class="title" tit>${title}</div><div class="value">${variation[select].val}</div></label></div></div><div class="scroll scroll-none"><div class="list">${element(variation)}</div><div class="tip">${description}</div></div></div>`;
    },
    'btn.tip': (val) => {
        const { classes = [], styles = [] } = val;
        const { title, description, variation, click, mode } = val;

        const cl = ['button-tips-wrapper', 'closset', '-hide'].concat(classes);
        const st = [].concat(styles.map(x => `${x.key}: ${x.val};`));
        const id = generateUniqueId('tun');

        const param = getParametrByKey($PARAMETERS, val.param);
        const value = mode === "single" ? variation.find(x => x.key === param).val : param.length;

        setTimeout(() => {
            $(`.button-tips-wrapper[data-id="${id}"]`).on('click', 'label', function () {
                click({ param: val.param, variation, description, mode, title, id });
            });
        }, 0);

        return `<div class="${cl.join(' ')}" ${st.length > 0 ? `style="${st.join('')}"` : ''} data-id="${id}"><div class="btn button" param><div class="icon tooltip"><div class="ticon i-caret-right"></div></div><label><div class="title" tit>${title}</div><div class="value">${value}</div></label></div><div class="tips">${description}</div></div>`;
    },
    'sel.one': (val) => {
        const { classes = [], styles = [] } = val;
        const { icon, title, description, param, variation } = val;
        const { click, mode } = val;

        const cl = ['select-wrapper'].concat(classes);
        const st = [].concat(styles.map(x => `${x.key}: ${x.val};`));
        const id = generateUniqueId('tun');

        const value = variation.find(x => x.key == getParametrByKey($PARAMETERS, param)).val;

        setTimeout(() => {
            $(`.select-wrapper[data-id="${id}"]`).on('click', '.icon, .title', () => {
                click({ param: val.param, variation, description, mode, title, id });
            });

            $(`.control[data-id="${id}"]`).on('click', '.btn', function (e) {
                const $e = $(this);
                const id = $e.attr('id');
                let index = variation.findIndex(x => x.key === getParametrByKey($PARAMETERS, param));

                if (id === "nx") {
                    index = index < variation.length - 1 ? index + 1 : 0;
                } else {
                    index = index > 0 ? index - 1 : variation.length - 1;
                }

                setParameter(param, variation[index].key);
                $(e.delegateTarget).find('.value').text(variation[index].val);
            });
        }, 0);

        return `<div class="${cl.join(' ')}" ${st.length > 0 ? `style="${st.join('')}"` : ''} data-id="${id}"><div class="btn button" param><div class="icon tooltip"><div class="ticon i-${icon}"></div></div><label><div class="title" tit>${title}</div><div class="control" data-id="${id}"><div class="btn" id="ps"><div class="ticon i-caret-left"></div></div><span class="value">${value}</span><div class="btn" id="nx"><div class="ticon i-caret-right"></div></div></div></label></div></div>`;
    },
    'btn': (val) => {
        const { classes = [], styles = [] } = val;
        const { icon, title, click = () => {} } = val;

        const cl = ['button-wrapper'].concat(classes);
        const st = [].concat(styles.map(x => `${x.key}: ${x.val};`));
        const id = generateUniqueId('tun');

        setTimeout(() => {
            $(`.button-wrapper[data-id="${id}"]`).on('click', '.o-button', click);
        }, 0);

        return `<div class="${cl.join(' ')}" ${st.length > 0 ? `style="${st.join('')}"` : ''} data-id="${id}"><div class="o-button" param><div class="icon"><div class="ticon i-${icon}"></div></div><div class="value" tit>${title}</div></div></div>`;
    }
}

let globalComponentId = 0;
function generateUniqueId(prefix = 'gen') {
    return `${prefix}-${globalComponentId++}-${Date.now().toString(36)}`;
}

function updateAllDependents() {
    Object.keys(dependencyMap).forEach(updateDependcies);
}

function registerDefinition(def) {
    const { param, dependsOn } = def;
    paramDefinitions[param] = def;

    if (dependsOn) {
        if (!dependencyMap[dependsOn.param]) {
            dependencyMap[dependsOn.param] = [];
        }
        dependencyMap[dependsOn.param].push(param);
    }
}

function updateDependcies(changedParam) {
    const dependents = dependencyMap[changedParam];
    if (!dependents) return;

    dependents.forEach(depParam => {
        const def = paramDefinitions[depParam];
        const wrapper = $(`[data-param="${depParam}"]`);
        const condition = def.dependsOn;
        const actual = getParametrByKey($PARAMETERS, condition.param);

        if (actual === condition.value) {
            return wrapper.removeClass('-disable');
        }

        wrapper.addClass('-disable');
    });
}

export function Engine(param) {
    const builder = (params) => {
        let html = "";
        for (let i = 0; i < params.length; i++) {
            const { type } = params[i];
            if (gen[type]) {
                html += gen[type](params[i]);
            }
        }
        return html;
    }

    for (let i = 0; i < param.length; i++) {
        const { name, params } = param[i];
        $('main').append(`<div class="block-wrapper"><div class="title">${name}</div><div class="params-wrapper">${builder(params)}</div></div>`);
    }

    updateAllDependents();

    $('.checkbox-wrapper').on('change', 'input[type="checkbox"]', function (e) {
        const param = $(this).closest('.closset').data('param');
        const checked = $(this).is(':checked');

        // Пример обновления параметра
        setParameter(param, checked);
        updateDependcies(param);
    });



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