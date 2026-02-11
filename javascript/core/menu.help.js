import { TMenu } from './menu.core.js';

export const MENU_GENERATOR = {
    toggle: (context) => {
        const element = $(`<label class="-off"></label>`);

        let enabled = false;

        context.enabled().then(val => {
            enabled = val;
            if (!enabled) return;
            element.removeClass('-off')
        });

        element.on('click', (e) => {
            if (!enabled) return;
            const _check = e.target.checked;

            if (_check !== undefined) {
                context.set(_check);
            }
        });

        return { element: element.append(`<div class="btn-label"><div class="item-icon"><svg viewBox="0 0 640 640"><use href="#i-${context.icon}"></use></div><div class="item-title">${context.title}</div></div><div class="checkbox"><input type="checkbox" ${context.get() ? 'checked' : ''}><div class="switch-slider"></div></div>`), box: { height: 50 } }
    },
    divider: () => {
        return { element: $(`<div class="item-line"></div>`), box: { height: 1 } };
    },
    action: (context) => {
        const element = $(`<div class="menu-btn -off"></div>`);

        let enable = false;

        context.enabled().then(val => {
            enable = val;
            if (!enable) return
            element.removeClass('-off')
        });

        element.on('click', () => {
            if (!enable) return;
            context.run();
        });

        if (typeof context.selected === "function") {
            if (context.selected(TMenu.page)) {
                element.addClass('-selected');
            }
        }

        const action = $(`<div class="item-action"></div>`);

        if (context.subtitle) {
            context.subtitle().then((val) => {
                action.text(val);
            });
        }

        return { element: element.append(`<div class="btn-label"><div class="item-icon"><svg viewBox="0 0 640 640"><use href="#i-${context.icon}"></use></svg></div><div class="item-title">${context.title}</div></div>`, action), box: { height: 50 } };
    }
}
export const MENU_CONTEXT = {
    user: [
        {
            key: 'settings',
            type: 'action',
            title: 'Настройки',
            icon: 'settings',
            enabled: async () => true,
            subtitle: async () => 'Перейти',
            run: async () => {
                location.href = 'settings.html';
            },
            selected: (ctx) => ctx.page === 'settings'
        },
        {
            key: 'updates',
            type: 'action',
            title: 'Обновления',
            icon: 'updates',
            enabled: async () => (await import('./pwa.core.js')).$PWA.enabled,
            subtitle: async () => {
                const { $PWA } = await import('./pwa.core.js');
                return $PWA.enabled ? $PWA.meta.version : '0.0.0';
            },
            run: async () => {
                location.href = 'index.html?update=show';
            }
        },
        { key: 'sep-1', type: 'divider' },
        {
            key: 'autologin',
            type: 'toggle',
            title: 'Автовход',
            icon: 'login',
            enabled: async () => (await import('./main.core.js')).OAuth.auth,
            get: () => !!$PARAMETERS.autologin,
            set: (val) => {
                setParameter('autologin', !!val);
            }
        },
        {
            key: 'logout',
            type: 'action',
            title: 'Выход',
            icon: 'logout',
            enabled: async () => (await import('./main.core.js')).OAuth.auth,
            subtitle: async () => {
                const { OAuth } = await import('./main.core.js');
                return OAuth?.user?.nickname || 'Пользователь';
            },
            run: async () => {
                const { logout } = await import('../utils/auth.logout.js');
                await logout();
            }
        }
    ],
    play: [
        {
            key: 'downloads',
            type: 'action',
            title: 'Загруженные аниме',
            icon: 'download',
            enabled: async () => true,
            subtitle: async () => 'Перейти',
            run: async () => { location.href = 'downloads.html'; },
            selected: (ctx) => ctx.page === 'downloads'
        },
        { key: 'sep-2', type: 'divider' },
        {
            key: 'playerFull',
            type: 'toggle',
            title: 'Авто-Full экран',
            icon: 'fullscreen',
            enabled: async () => true,
            get: () => !!$PARAMETERS.player.full,
            set: (val) => setParameter('full', !!val)
        },
        {
            key: 'playerAutoNext',
            type: 'toggle',
            title: 'Авто-Переключение',
            icon: 'autonext',
            enabled: async () => true,
            get: () => !!$PARAMETERS.player.autonekst,
            set: (val) => setParameter('autonekst', !!val)
        },
        {
            key: 'playerTunime',
            type: 'toggle',
            title: 'Плеер Tunime',
            icon: 'player',
            enabled: async () => true,
            get: () => !!$PARAMETERS.player.standart,
            set: (val) => setParameter('standart', !!val)
        }
    ]
}

export const MENU_CONTROLLER = {
    index: async () => ({
        page: 'index.html'
    }),

    play: async () => {
        const key = 'last-watch';
        const data = JSON.parse(localStorage.getItem(key));
        if (data && data[0]) {
            const { id } = data[0];
            window.location.href = `watch.html?id=${id}&player=true&continue=${data[0].continue}`;
        }
    },

    search: async () => ({
        page: 'search.html'
    }),

    list: () => isAuthPage('list.html'),
    user: () => isAuthPage('user.html')
}

export async function isAuthPage(yes, no = 'login.html') {
    const { OAuth } = await import('./main.core.js');

    return {
        page: OAuth.auth ? yes : no,
        auth: true
    };
}

export function onTransitionEnd(el, type = 'opacity') {
    let handler;

    const promise = new Promise((resolve) => {
        handler = (e) => {
            if (!type || e.propertyName === type) {
                el.removeEventListener('transitionend', handler);
                resolve(e);
            }
        };

        el.addEventListener('transitionend', handler);
    });

    const disable = () => {
        if (handler) {
            el.removeEventListener('transitionend', handler);
        }
    };

    const stop = () => {
        const current = getComputedStyle(el)[type];

        const transition = el.style.transition;
        el.style.transition = 'none';

        el.style[type] = current;
        void el.offsetHeight;
        el.style.transition = transition;
    }

    return { promise, disable, stop };
}