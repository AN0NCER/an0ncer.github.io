import { TWindow } from "../../core/window.core.js";
import { TNotifi } from "../../modules/tun.notification.js";
import { Template } from "../../modules/tun.template.js"
import { WindowIntercator } from "../../modules/win.module.js";

const config = {
    tpl: '/settings/win.notification.setup.tpl',
    css: 'win.notification.setup.css',
    ell: '.window-notification-setup',
    /**@type {TWindow} */
    win: null
};

const variable = [
    { option: 'dubEpisode', label: `При выходе новых <span>эпизодов</span>` },
    { option: 'roomCreate', label: `При приглашении в <span>комнату</span>` }
];

let EnabledUI = false;

export default async function SetupNotificationWindow() {
    if (EnabledUI) return;
    EnabledUI = true;

    $('body').append(((await Template(config.tpl)).css(config.css, 'style/win/css/setup/')).text());
    const dom = $(config.ell);

    const win = new TWindow({
        oninit: () => {
            const multiple = dom.find('.notification-type-select[multiple]');
            const label = dom.find('#notification-checkbox-wrapper label');
            const checkbox = dom.find('#notification-checkbox-wrapper input[type="checkbox"]');
            const reset = dom.find('.btn-cancel');

            (/*Управление выбором разрешения*/() => {
                multiple.empty();

                const innerHtml = [];

                variable.forEach((element) => {
                    innerHtml.push(genVariable(element));
                });

                innerHtml.push(`<div class="commit-change">Применить</div>`)

                multiple.append(innerHtml.join(''));

                const commitBtn = multiple.find('.commit-change');

                // Текущий выбор из DOM
                const getSelected = () =>
                    multiple.find('[option][select]')
                        .map((_, el) => $(el).attr('option'))
                        .get();

                // Сравнение без учёта порядка
                const isEqual = (a, b) =>
                    a.length === b.length &&
                    [...a].sort().every((v, i) => v === [...b].sort()[i]);

                const updateCommitState = () => {
                    const changed = !isEqual(getSelected(), TNotifi.getAllowedList());
                    commitBtn.toggleClass('active', changed);
                };

                updateCommitState();

                multiple.on('click', '[option]', (e) => {
                    const opt = $(e.currentTarget);
                    if (opt.attr('select')) {
                        opt.removeAttr('select');
                    } else {
                        opt.attr('select', true);
                    }
                    updateCommitState(true);
                });

                multiple.on('click', '.commit-change', () => {
                    if (!commitBtn.hasClass('active')) return;
                    commitBtn.toggleClass('active', false);
                    // применить изменения, например:
                    // TNotifi.setAllowedList(getSelected());
                    TNotifi.setAllow(getSelected()).then(({ allowed, complete }) => {
                        updateCommitState();
                    });
                });
            })();

            (/*Управление checkbox нажатием*/() => {
                // Попытка повторить react
                const [hasRequest, setRequest] = useState(false);

                useEffect(() => {
                    const value = hasRequest();
                    if (value) {
                        label.addClass('-load');
                    } else {
                        label.removeClass('-load');
                    }
                }, [setRequest])

                checkbox.on('input', () => {
                    if (hasRequest()) return;
                    /**@type {boolean} */
                    const value = checkbox.prop('checked');

                    if (TNotifi.getStore().hub) {
                        setRequest(true);
                        TNotifi.setEnable(value).then(({ enabled }) => {
                            checkbox.prop('checked', enabled);
                        }).finally(() => setRequest(false));
                    } else if (value) {
                        setRequest(true);
                        TNotifi.request().finally(() => setRequest(false));
                    }
                });
            })();

            (/*Управлене кнопкой сбросить */() => {
                // Попытка повторить react
                const [hasRequest, setRequest] = useState(false);

                useEffect(() => {
                    const value = hasRequest();
                    if (value) {
                        reset.addClass('-load');
                    } else {
                        reset.removeClass('-load');
                    }
                }, [setRequest]);

                reset.on('click', () => {
                    if (hasRequest()) return;
                    setRequest(true);

                    TNotifi.requestWin('Сбросить уведомления? <br> Все ваши подписки будут удалены, и вы перестанете получать уведомления, пока не включите их заново.').then((permission) => {
                        if (permission === 1) {
                            TNotifi.resetHard().then(({ complete, count }) => {
                                console.log(`[TNotifi] Отписано от ${count} подписок`);

                                if (complete) {
                                    localStorage.removeItem('db:notifications');
                                }

                                setRequest(false);
                            });
                        } else {
                            setRequest(false);
                        }
                    });
                });
            })();
        },
        animate: {
            animhide: () => {
                win.destroy();
                EnabledUI = false;
            }
        }
    }, config.ell);


    TNotifi.on('state', (permision) => {
        setState(permision, dom);
        setSystem(TNotifi.getSysPermision(), dom);
        setAllowed(TNotifi.getAllowedList(), dom);
    }, { replay: true });


    win.module.add(WindowIntercator);
    win.show();
}

function setAllowed(list = [], dom) {
    const multiple = dom.find('.notification-type-select[multiple]');

    multiple.find('[option]').removeAttr('select');

    list.forEach((el) => {
        multiple.find(`[option="${el}"]`).attr('select', true);
    });
}

function setState(permision, dom) {
    const checkbox = dom.find('#notification-checkbox-wrapper input[type="checkbox"]');
    const multiple = dom.find('.notification-type-select-wrapper');
    const state = dom.find('.notification-setup-state');

    if (permision === 1) {
        checkbox.prop('checked', true);
        multiple.prop('inert', '');
        state.text('on');
    } else {
        checkbox.prop('checked', false);
        multiple.prop('inert', true);
        state.text('off');
    }
}

function setSystem(permision, dom) {
    const reset = dom.find('.btn-cancel');

    if ([0, 1].includes(permision)) {
        reset.removeAttr('disable');
    } else {
        dom.find('#notification-checkbox-wrapper').attr('disable', true)
        reset.attr('disable', true);
    }

}

function genVariable({ option = '', label = '' } = {}) {
    return (`
        <div class="select-option" option='${option}'>
            <div class="select-checkbox"></div>
            <div class="select-value">${label}</div>
        </div>
    `).trim();
}


// Изменения и наблюдения за состояниями (Может быть начну использовать потом чаще)
// поэтому надо подумать куда его впихнуть и как его можно в моем проекте использовать

function useState(initialValue) {
    let state = initialValue;
    const listeners = []; // сюда попадут колбэки эффектов, которые следят за этим state

    const getState = () => state;

    const setState = (newValue) => {
        if (newValue === state) return; // не изменилось — ничего не делаем
        state = newValue;
        listeners.forEach(fn => fn()); // изменилось — уведомляем всех, кто подписан
    };

    // "приватный" метод для useEffect, чтобы подписаться на изменения
    setState._subscribe = (fn) => listeners.push(fn);

    return [getState, setState];
};


function useEffect(callback, deps) {
    deps.forEach(setState => {
        setState._subscribe(callback);
    });

    callback();
}