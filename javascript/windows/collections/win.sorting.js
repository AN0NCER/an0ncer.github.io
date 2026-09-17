import { TWindow } from "../../core/window.core.js";
import { pressable } from "../../modules/tun.animate.js";
import { Template } from "../../modules/tun.template.js";
import { WindowIntercator } from "../../modules/win.module.js";
import { DEFAULT, read, reset, write } from "./win.sorting/mod.state.js";
import { createSwitch } from "./win.sorting/mod.switch.js";

const config = {
    tpl: '/collections/win.sorting.tpl',
    css: 'win.sorting.css',
    cssPath: 'style/win/css/collections/',
    ell: '.window-collection-sorting'
};

/**
 * Выбранный порядок.
 *
 * @typedef {Object} TSorting
 * @property {'title' | 'count' | 'updated'} key - по чему сортируем
 * @property {'asc' | 'desc'} dir - в какую сторону
 * @property {boolean} groups - собирать ли автогруппы по префиксу
 */

/** @type {{promise: Promise<TSorting>, resolve: Function, win: TWindow, value: TSorting, onChange: Function} | null} */
let instance = null;

/**
 * Окно сортировки коллекций.
 *
 * Кнопки подтверждения нет, но и список на каждое нажатие не
 * перерисовывается: его перестройка приходилась бы ровно на анимацию
 * подсветки, и та захлёбывалась на телефоне. Поэтому выбор запоминается
 * сразу, а применяется тем, кто открыл окно, — по завершении промиса.
 *
 * @param {{value?: TSorting, onChange?: (value: TSorting) => void}} [opts]
 *  value — текущий порядок. Без него берётся сохранённый на устройстве.
 *  onChange зовётся на каждое нажатие: для лёгких реакций вроде подписи
 *  на кнопке, но не для перерисовки списка
 * @returns {Promise<TSorting>}
 */
export function WCollectionSorting({ value = null, onChange = () => { } } = {}) {
    if (instance) {
        return Promise.reject({
            code: 'ALREADY_OPEN',
            msg: 'Окно уже открыто',
        });
    }

    let settle;

    const promise = new Promise((resolve) => { settle = resolve; });

    // До первого await: иначе два синхронных вызова создали бы два окна
    instance = {
        promise,
        resolve: settle,
        win: null,
        value: value ? { ...value } : read(),
        onChange
    };

    open().catch((err) => {
        const value = instance?.value ?? { ...DEFAULT };

        instance = null;
        settle(value);
        console.error('[win.sorting] не удалось открыть окно', err);
    })

    return promise;
}

async function open() {
    const html = (await Template(config.tpl)).css(config.css, config.cssPath).text();
    $('body').append(html);

    /** Снять обработчики при закрытии окна */
    let detach = () => { };

    const win = new TWindow({
        animate: {
            // Единственная точка завершения промиса — как бы окно ни закрыли
            animhide: () => {
                const { resolve, value } = instance ?? {};

                detach();
                win.destroy();
                instance = null;

                resolve?.(value ?? { ...DEFAULT });
            }
        }
    }, config.ell);

    win.module.add(WindowIntercator);

    // Содержимое подключаем после конструктора: oninit вызывается внутри
    // него, и переменная win там ещё недоступна
    const wrapper = win.$win[0];

    detach = bind(wrapper);

    win.show();

    instance.win = win;

    return win;
}

/**
 * Обработчики окна.
 *
 * @param {HTMLElement} wrapper
 * @returns {() => void} отписка
 */
function bind(wrapper) {
    const close = wrapper.querySelector('.window-close');
    const resetBtn = wrapper.querySelector('.btn-action[data-type="reset"]');

    /** Сортировка одна на всё окно, автогруппы — отдельный переключатель */
    const wrappers = [...wrapper.querySelectorAll('.group-sorting-wrapper[data-sort]')];

    /** Отдать состояние наружу и запомнить на устройстве */
    const commit = () => {
        const { value, onChange } = instance ?? {};
        if (!value) return;

        write(value);
        onChange?.({ ...value });
    };

    /** @type {Map<string, ReturnType<createSwitch>>} */
    const switches = new Map();

    /** Расставить подсветку по состоянию: активна ровно одна из шести */
    const paint = ({ silent = true, animated = true } = {}) => {
        const value = instance?.value ?? { ...DEFAULT };

        for (const [key, control] of switches) {
            if (key === 'groups') {
                control.select(value.groups ? 'on' : 'off', { silent, animated });
                continue;
            }

            // В группе, по которой сортируем, подсвечено направление,
            // в остальных выбора нет вовсе
            control.select(key === value.key ? value.dir : null, { silent, animated });
        }
    };

    for (const el of wrappers) {
        const key = el.dataset.sort;

        switches.set(key, createSwitch(el, {
            onChange: (picked) => {
                if (!instance) return;

                if (key === 'groups') {
                    instance.value = { ...instance.value, groups: picked === 'on' };
                } else {
                    instance.value = { ...instance.value, key, dir: picked };
                }

                // Гашение соседних групп, запись на устройство и
                // перерисовка списка — всё это в следующий кадр: иначе
                // оно приходится на первый кадр пружины и та дёргается
                requestAnimationFrame(() => {
                    if (!instance) return;

                    // Выбрали в одной группе — две другие гаснут
                    paint();
                    commit();
                });
            }
        }));
    }

    const onReset = () => {
        if (!instance) return;

        instance.value = reset();

        paint();
        commit();
    };

    const onClose = () => WCollectionSorting.close();

    resetBtn?.addEventListener('click', onReset);
    close?.addEventListener('click', onClose);

    const unpress = pressable([resetBtn].filter(Boolean));

    // Стартовое состояние — без анимации: окно только открылось, и
    // разъезжающаяся подсветка выглядела бы как чужое нажатие
    paint({ animated: false });

    return () => {
        resetBtn?.removeEventListener('click', onReset);
        close?.removeEventListener('click', onClose);

        for (const control of switches.values()) control.destroy();

        unpress();
    };
}

/**
 * Закрыть окно программно
 * @returns {boolean} было ли что закрывать
 */
WCollectionSorting.close = () => {
    if (!instance?.win) return false;

    instance.win.hide();
    return true;
};

/** Открыто ли окно сейчас */
Object.defineProperty(WCollectionSorting, 'isOpen', {
    get: () => instance !== null
});

/** Выбранный порядок — тот же, что применён на странице */
Object.defineProperty(WCollectionSorting, 'value', {
    get: () => instance ? { ...instance.value } : read()
});

export default WCollectionSorting;

/**
 * УПРАВЛЕНИЕ ОКНОМ
 *
 *   WCollectionSorting({ value, onChange })   открыть
 *   WCollectionSorting.close()                закрыть
 *   WCollectionSorting.isOpen                 открыто ли сейчас
 *   WCollectionSorting.value                  текущий порядок
 *
 * Применять выбранное нужно по завершении промиса — пока окно открыто,
 * тяжёлая работа мешает анимации подсветки.
 */