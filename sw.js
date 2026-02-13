const version = '3.0.1';
const hash = "57f27";

const cacheName = `pwa-tunime-${hash}-v${version}`;

const appShellFilesToCache = [
    // Директория: /images/genres
    "/images/genres/comedy.svg",
    "/images/genres/dementia_psychological.svg",
    "/images/genres/drama.svg",
    "/images/genres/fantasy.svg",
    "/images/genres/historical.svg",
    "/images/genres/horror_thriller.svg",
    "/images/genres/mecha.svg",
    "/images/genres/military.svg",
    "/images/genres/music.svg",
    "/images/genres/mystery.svg",
    "/images/genres/police.svg",
    "/images/genres/romance.svg",
    "/images/genres/slice_of_life.svg",
    "/images/genres/space.svg",
    "/images/genres/sports.svg",
    "/images/genres/supernatural.svg",
    // Директория: /images/icons
    "/images/icons/logo-x192-b.png",
    "/images/icons/logo-x192-o.png",
    "/images/icons/logo-x256-b.png",
    "/images/icons/logo-x256-o.png",
    "/images/icons/logo-x384-b.png",
    "/images/icons/logo-x384-o.png",
    "/images/icons/logo-x512-b.png",
    "/images/icons/logo-x512-o.png",
    "/images/icons/manifest-b.json",
    "/images/icons/manifest-o.json",
    // Директория: /images/page.user
    "/images/page.user/head.profile.jpg",
    // Директория: /images/seasons
    "/images/seasons/autum.webp",
    "/images/seasons/spring.webp",
    "/images/seasons/summer.webp",
    "/images/seasons/winter.webp",
    // Директория: /images/settings
    "/images/settings/set.menu.default.png",
    "/images/settings/set.quality.360.png",
    "/images/settings/set.quality.480.png",
    "/images/settings/set.quality.720.png",
    // Директория: /images
    "/images/ava.jpeg",
    "/images/black-bg-player.png",
    "/images/collections.png",
    "/images/endlist.png",
    "/images/error-trailers.webp",
    "/images/icon-web.png",
    "/images/img.404a.webp",
    "/images/img.login.jpg",
    "/images/noanime.png",
    "/images/player-icon.png",
    "/images/popup.webp",
    "/images/preview-image.png",
    "/images/tun-card.png",
    "/images/verify.action.png",
    // Директория: /javascript/auto
    "/javascript/auto/download_a.js",
    // Директория: /javascript/core
    "/javascript/core/main.core.js",
    "/javascript/core/menu.core.js",
    "/javascript/core/menu.help.js",
    "/javascript/core/pwa.core.js",
    "/javascript/core/window.core.js",
    // Директория: /javascript/library
    "/javascript/library/anime.esm.min.js",
    "/javascript/library/anime.min.js",
    "/javascript/library/embla.esm.js",
    "/javascript/library/hls.js",
    "/javascript/library/jqery.min.js",
    "/javascript/library/jsyaml.js",
    "/javascript/library/md5.wasm.min.js",
    "/javascript/library/rxjs.umd.min.js",
    "/javascript/library/swiper-bundle.min.js",
    // Директория: /javascript/modules
    "/javascript/modules/AnimeCard.js",
    "/javascript/modules/api.jikan.js",
    "/javascript/modules/api.kodik.js",
    "/javascript/modules/api.shiki.js",
    "/javascript/modules/api.tunime.js",
    "/javascript/modules/Collection.js",
    "/javascript/modules/EventTools.js",
    "/javascript/modules/functions.js",
    "/javascript/modules/Popup.js",
    "/javascript/modules/Settings.js",
    "/javascript/modules/TDatabase.js",
    "/javascript/modules/TDownload.js",
    "/javascript/modules/tun.cache.js",
    "/javascript/modules/tun.popup.js",
    "/javascript/modules/tun.template.js",
    "/javascript/modules/tun.update.js",
    "/javascript/modules/tun.verify.js",
    "/javascript/modules/win.module.js",
    "/javascript/modules/Windows.js",
    // Директория: /javascript/pages/anime
    "/javascript/pages/anime/default.js",
    // Директория: /javascript/pages/downloads
    "/javascript/pages/downloads/mod_manager.js",
    "/javascript/pages/downloads/mod_player.js",
    "/javascript/pages/downloads/mod_utils.js",
    "/javascript/pages/downloads/mod_voice.js",
    // Директория: /javascript/pages/index
    "/javascript/pages/index/mod_account.js",
    "/javascript/pages/index/mod_animes.js",
    "/javascript/pages/index/mod_github.js",
    "/javascript/pages/index/mod_history_watch.js",
    "/javascript/pages/index/mod_notify.js",
    "/javascript/pages/index/mod_trailers.js",
    "/javascript/pages/index/mod_trailers_animation.js",
    "/javascript/pages/index/mod_update.js",
    "/javascript/pages/index/mod_window.js",
    // Директория: /javascript/pages/list
    "/javascript/pages/list/mod_alist.js",
    "/javascript/pages/list/mod_carousel.js",
    "/javascript/pages/list/mod_collections.js",
    "/javascript/pages/list/mod_core.js",
    "/javascript/pages/list/mod_filter.js",
    "/javascript/pages/list/mod_html.js",
    "/javascript/pages/list/mod_search.js",
    "/javascript/pages/list/mod_ui.js",
    "/javascript/pages/list/mod_w_anime.js",
    // Директория: /javascript/pages/player
    "/javascript/pages/player/mod_animation.js",
    "/javascript/pages/player/mod_api.js",
    "/javascript/pages/player/mod_event.js",
    "/javascript/pages/player/mod_functions.js",
    "/javascript/pages/player/mod_mediasession.js",
    "/javascript/pages/player/mod_settings.js",
    "/javascript/pages/player/mod_shortcuts.js",
    "/javascript/pages/player/mod_stream.js",
    "/javascript/pages/player/mod_ui.js",
    // Директория: /javascript/pages/search
    "/javascript/pages/search/mod_card.js",
    "/javascript/pages/search/mod_genres.js",
    "/javascript/pages/search/mod_history.js",
    "/javascript/pages/search/mod_popular.js",
    "/javascript/pages/search/mod_search.js",
    "/javascript/pages/search/mod_seasons.js",
    "/javascript/pages/search/mod_studios.js",
    "/javascript/pages/search/mod_voicelist.js",
    "/javascript/pages/search/mod_w_filter.js",
    "/javascript/pages/search/mod_w_genres.js",
    "/javascript/pages/search/mod_w_season.js",
    // Директория: /javascript/pages/settings
    "/javascript/pages/settings/mod.engine.js",
    "/javascript/pages/settings/mod.func.js",
    "/javascript/pages/settings/mod.header.js",
    "/javascript/pages/settings/mod.search.js",
    "/javascript/pages/settings/mod.selector.js",
    "/javascript/pages/settings/mod.storage.js",
    "/javascript/pages/settings/setup.update.js",
    // Директория: /javascript/pages/user
    "/javascript/pages/user/io.friends.js",
    "/javascript/pages/user/mod.achievements.io.js",
    "/javascript/pages/user/mod.achiv.franchises.js",
    "/javascript/pages/user/mod.anime.win.js",
    "/javascript/pages/user/mod.favorites.js",
    "/javascript/pages/user/mod.friends.js",
    "/javascript/pages/user/mod.friends.win.js",
    "/javascript/pages/user/mod.header.js",
    "/javascript/pages/user/mod.history.js",
    "/javascript/pages/user/mod.level.js",
    "/javascript/pages/user/mod.loader.js",
    "/javascript/pages/user/mod.stats.js",
    "/javascript/pages/user/util.event.js",
    // Директория: /javascript/pages/watch
    "/javascript/pages/watch/mod.chronology.js",
    "/javascript/pages/watch/mod.resource.js",
    "/javascript/pages/watch/mod_collection.js",
    "/javascript/pages/watch/mod_dbanime.js",
    "/javascript/pages/watch/mod_download.js",
    "/javascript/pages/watch/mod_history.js",
    "/javascript/pages/watch/mod_player.js",
    "/javascript/pages/watch/mod_private.js",
    "/javascript/pages/watch/mod_scrolling.js",
    "/javascript/pages/watch/mod_transition.js",
    "/javascript/pages/watch/mod_translation.js",
    "/javascript/pages/watch/mod_ui.js",
    "/javascript/pages/watch/mod_urate.js",
    "/javascript/pages/watch/mod_wscore.js",
    "/javascript/pages/watch/room.guest.client.js",
    "/javascript/pages/watch/room.owner.client.js",
    // Директория: /javascript/pages
    "/javascript/pages/404a.js",
    "/javascript/pages/downloads.js",
    "/javascript/pages/index.js",
    "/javascript/pages/list.js",
    "/javascript/pages/login.js",
    "/javascript/pages/player.js",
    "/javascript/pages/search.js",
    "/javascript/pages/settings.js",
    "/javascript/pages/user.js",
    "/javascript/pages/watch.js",
    // Директория: /javascript/services
    "/javascript/services/dispatcher.js",
    "/javascript/services/installing.js",
    // Директория: /javascript/utils
    "/javascript/utils/auth.login.js",
    "/javascript/utils/auth.logout.js",
    // Директория: /javascript/windows
    "/javascript/windows/win.character.js",
    "/javascript/windows/win.editor.banner.js",
    "/javascript/windows/win.editor.character.js",
    "/javascript/windows/win.rooms.create.js",
    "/javascript/windows/win.rooms.js",
    "/javascript/windows/win.search.character.js",
    // Директория: /javascript
    "/javascript/parametrs.js",
    // Директория: /style/css/min
    "/style/css/min/swiper-bundle.min.css",
    // Директория: /style/css
    "/style/css/downloads.css",
    "/style/css/index.css",
    "/style/css/list.css",
    "/style/css/login.css",
    "/style/css/main.css",
    "/style/css/notfound.css",
    "/style/css/player.css",
    "/style/css/pop.update.css",
    "/style/css/search.css",
    "/style/css/settings.css",
    "/style/css/ticons.css",
    "/style/css/user.css",
    "/style/css/verify.css",
    "/style/css/watch.css",
    // Директория: /style/fonts
    "/style/fonts/Inter.ttf",
    "/style/fonts/Manrope.ttf",
    "/style/fonts/NovaSquare.ttf",
    // Директория: /style/menu/css
    "/style/menu/css/menu.core.css",
    // Директория: /style/win/css
    "/style/win/css/win.character.css",
    "/style/win/css/win.editor.banner.css",
    "/style/win/css/win.editor.character.css",
    "/style/win/css/win.rooms.create.css",
    "/style/win/css/win.rooms.css",
    "/style/win/css/win.search.character.css",
    // Директория: /style/window/win/css
    "/style/window/win/css/win.character.css",
    "/style/window/win/css/win.editor.banner.css",
    "/style/window/win/css/win.editor.character.css",
    "/style/window/win/css/win.search.character.css",
    // Директория: /templates
    "/templates/icons.pack.tpl",
    "/templates/pop.update.tpl",
    "/templates/win.character.tpl",
    "/templates/win.editor.banner.tpl",
    "/templates/win.editor.character.tpl",
    "/templates/win.rooms.create.tpl",
    "/templates/win.rooms.tpl",
    "/templates/win.search.character.tpl",
    "/templates/win.verify.tpl",
    // Директория: /
    "/404.html",
    "/404a.html",
    "/downloads.html",
    "/index.html",
    "/list.html",
    "/login.html",
    "/manifest.json",
    "/player.html",
    "/search.html",
    "/settings.html",
    "/user.html",
    "/watch.html",
];

const servers = [
    "https://192.168.31.45:3001",
    "https://tunime.onrender.com",
    "https://tunime-hujg.onrender.com"
];

const log = console.log.bind(console, `[${version}]:[${hash}] ->`);
const err = console.error.bind(console, `[${version}]:[${hash}] ->`);
const warn = console.warn.bind(console, `[${version}]:[${hash}] ->`);

const worker = self;

const setup = {
    // Дефолтные значения
    defaults: {
        install: {
            channel: 'sw-update',
            activate: true,
            install: true,
            batchSize: 2
        }
        // Добавьте другие параметры здесь
    },

    // Кеш операции
    cache: {
        val: null,
        req: 'settings',
        key: 'pwa-settings',

        get: async function () {
            if (this.val) return this.val;
            try {
                const cache = await caches.open(this.key);
                const response = await cache.match(this.req);
                if (response) {
                    this.val = await response.json();
                    return this.val;
                }
                return null;
            } catch (error) {
                err('error get settings:', error);
                return null;
            }
        },

        set: async function (value) {
            try {
                const cache = await caches.open(this.key);
                const response = new Response(JSON.stringify(value));
                await cache.put(this.req, response);
                this.val = value;
                return true;
            } catch (error) {
                err('error set settings:', error);
                return false;
            }
        },

        clear: async function () {
            try {
                const cache = await caches.open(this.key);
                await cache.delete(this.req);
                this.val = null;
                return true;
            } catch (error) {
                err('error clear settings:', error);
                return false;
            }
        }
    },

    // Получить значение настройки
    getValue: async function (key, customDefault = null) {
        const all = await this.cache.get();
        const storedValue = all && all.hasOwnProperty(key) ? all[key] : null;

        // Используем дефолтные значения из setup.defaults или переданные customDefault
        const defaultValue = customDefault !== null ? customDefault : this.defaults[key] || null;

        if (storedValue === null) {
            return defaultValue;
        }

        if (typeof storedValue === 'object' && storedValue !== null && typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
            return { ...defaultValue, ...storedValue };
        }

        return storedValue;
    },

    // Получить все настройки
    getAll: async function () {
        const stored = await this.cache.get() || {};
        const result = {};

        // Объединяем дефолтные значения с сохраненными
        for (const key in this.defaults) {
            result[key] = await this.getValue(key);
        }

        // Добавляем любые дополнительные настройки, которые не имеют дефолтов
        for (const key in stored) {
            if (!this.defaults.hasOwnProperty(key)) {
                result[key] = stored[key];
            }
        }

        return result;
    },

    // Получить дефолтные значения
    getDefaults: function () {
        return { ...this.defaults };
    },

    // Установить значение настройки
    setValue: async function (key, value) {
        const current = await this.cache.get() || {};
        current[key] = value;
        return await this.cache.set(current);
    },

    // Обновить настройки (глубокое слияние)
    update: async function (updates) {
        const current = await this.cache.get() || {};

        const merge = (target, source) => {
            return Object.keys(source).reduce((result, key) => {
                result[key] = source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
                    ? merge(target[key] || {}, source[key])
                    : source[key];
                return result;
            }, { ...target });
        };

        return await this.cache.set(merge(current, updates));
    },

    // Сброс к дефолтным значениям
    reset: async function () {
        await this.cache.set(this.defaults);
        return await this.getAll();
    }
};

const session = {
    // Проверить, была ли установка отклонена в текущем сеансе
    isInstallationRejectedInSession: async function () {
        const current = await setup.cache.get() || {};
        const sessionId = current.currentSessionId;
        const rejectedInSession = current.rejectedInSession;

        // Если нет sessionId, значит сессия еще не синхронизирована
        if (!sessionId) {
            return false;
        }

        return rejectedInSession === sessionId;
    },

    // Отметить установку как отклоненную в текущем сеансе
    markInstallationRejectedInSession: async function () {
        const current = await setup.cache.get() || {};
        const sessionId = current.currentSessionId;

        // Если нет sessionId, не можем отметить отклонение
        if (!sessionId) {
            warn('Cannot mark installation as rejected: no session ID');
            return false;
        }

        current.rejectedInSession = sessionId;
        return await setup.cache.set(current);
    },

    // Очистить отклонение (для принудительного сброса)
    clearRejection: async function () {
        const current = await setup.cache.get() || {};
        delete current.rejectedInSession;
        return await setup.cache.set(current);
    },

    // Установить sessionId (вызывается из основного потока)
    setSessionId: async function (sessionId) {
        const current = await setup.cache.get() || {};
        current.currentSessionId = sessionId;
        return await setup.cache.set(current);
    },

    // Получить текущий sessionId
    getCurrentSessionId: async function () {
        const current = await setup.cache.get() || {};
        return current.currentSessionId;
    }
}

worker.addEventListener('install', (event) => {
    /**
     * Запрашивает разрешение на установку
     * @param {BroadcastChannel} channel 
     * @returns {Promise<boolean>}
     */
    const requestInstallPermission = (channel) => {
        return new Promise((resolve, reject) => {
            const end = (bool) => {
                channel.removeEventListener('message', listener);
                if (bool) {
                    return resolve(bool);
                } else {
                    return reject(new Error('Installation rejected by user'));
                }
            }

            const listener = (event) => {
                switch (event.data.type) {
                    case 'INSTALL_APPROVED':
                        end(true);
                        break;
                    case 'INSTALL_REJECTED':
                        session.markInstallationRejectedInSession().then(() => {
                            log('Installation rejected for current session');
                            end(false);
                        });
                        break;
                    case 'INSTALL_RECEIVED':
                        clearTimeout(timer);
                        break;
                }
            }

            channel.addEventListener('message', listener);

            const timer = setTimeout(() => {
                end(true);
            }, 1000);

            channel.postMessage({
                type: 'INSTALL_PERMISSION_REQUEST',
                payload: { version, hash, cacheName, total: appShellFilesToCache.length }
            });
        });
    }

    event.waitUntil(
        setup.getValue('install').then(async (s) => {
            // Проверяем, была ли установка отклонена в текущем сеансе
            const isRejectedInSession = await session.isInstallationRejectedInSession();
            if (isRejectedInSession) {
                throw new Error('Installation was rejected');
            }

            const broadcast = new BroadcastChannel(s.channel);

            if (!s.install) {
                await requestInstallPermission(broadcast);
            }

            await setup.update({ 'source': 'worker' });

            broadcast.postMessage({
                type: 'NEW_VERSION',
                payload: { version, hash, cacheName, total: appShellFilesToCache.length }
            });

            await caching(appShellFilesToCache, s);

            if (s.activate) {
                worker.skipWaiting();
            }
        })
    );
});

worker.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        await worker.clients.claim();

        const names = await caches.keys();

        await Promise.all(
            names.map(name => {
                if (name !== cacheName && name !== setup.cache.key) {
                    return caches.delete(name);
                }
            })
        );

        log('worker activated.');
    })());
});

async function caching(filesToCache, { channel, batchSize }) {
    const broadcast = new BroadcastChannel(channel);
    try {
        const cache = await caches.open(cacheName);
        const total = filesToCache.length;
        let processed = 0;

        if (total === 0) {
            warn('no files to cache.');
            return;
        }

        log(`caching ${total} files.`);

        const batch = async (files) => {
            const batchPromises = files.map(async (file) => {
                let success = true;
                try {
                    await cache.add(file);
                } catch (error) {
                    success = false;
                    err(`!failed to cache ${file}`, error);
                }

                processed++;
                const percent = ((processed / total) * 100).toFixed(2);
                broadcast.postMessage({
                    type: 'CACHE_PROGRESS',
                    payload: { total, processed, percent, file, success }
                });

                return { file, success };
            });
            await Promise.allSettled(batchPromises);
        };

        // Разбиваем файлы на батчи
        for (let i = 0; i < total; i += batchSize) {
            const batchFiles = filesToCache.slice(i, i + batchSize);
            await batch(batchFiles);
        }

        log(`caching complete!`);
        broadcast.postMessage({ type: 'CACHE_COMPLETE', payload: { version, cacheName } });
    } catch (error) {
        err('!failed start caching!:', error);
        broadcast.postMessage({ type: 'CACHE_ERROR', payload: { error: error.message } });
    }
}

(() => {
    worker.addEventListener('fetch', event => {
        event.respondWith((async () => {
            const url = new URL(event.request.url);
            try {
                if (servers.some(s => url.href.startsWith(s))) {
                    return fetch(new Request(event.request, {
                        ...event.request,
                        headers: new Headers({
                            ...Object.fromEntries(event.request.headers),
                            Authorization: (event.request.headers.get('Authorization') || '') + version
                        })
                    }));
                }

                if (url.pathname.startsWith('/javascript/pages/anime/')) {
                    const response = await fetch(event.request);
                    if (response.status !== 404) return response;

                    return fetch('/javascript/pages/anime/default.js');
                }

                if (worker.location.hostname !== url.hostname) {
                    return fetch(event.request);
                }

                const cached = await caches.match(event.request);
                if (cached) return cached;

                if (url.pathname === "/") {
                    return (await caches.match('/index.html')) || fetch(event.request);
                }

                return (await caches.match(url.pathname)) || fetch(event.request);
            } catch (e) {
                warn(`fetch error ${e}`)
                return fetch(event.request);
            }
        })());
    });
})(log('fetch event support enabled'));

(() => {
    const methods = {
        'ACTIVATE': () => {
            worker.skipWaiting();
            return { complete: true };
        },
        'META': async () => {
            const source = await setup.getValue('source', 'worker');
            return { version, hash, source };
        },
        'SETUP': async (payload) => {
            if (!payload || typeof payload !== 'object') {
                return { error: 'Invalid payload' };
            }
            await setup.update(payload);
            return { value: await setup.getAll() };
        },
        'SETUP_CLEAR': async () => {
            await setup.setValue('install', setup.defaults.install);
            return { complete: true };
        },
        'GET_SETUP': async ({ key = 'install', defaultValue = null }) => {
            return setup.getValue(key, defaultValue);
        },
        'GET_DEFAULTS': () => {
            return setup.getDefaults();
        },
        'NEW_SESSION': async (payload) => {
            if (!payload || typeof payload !== "string") {
                return { error: 'Invalid payload' };
            }
            await session.setSessionId(payload);
        },
        'RECACHE': async (payload) => {
            if (!payload?.channel) return { error: 'channel unset' };

            new BroadcastChannel(payload.channel).postMessage({
                type: 'NEW_VERSION',
                payload: { version, hash, cacheName }
            });

            await caches.delete(cacheName);

            const settings = await setup.getValue('install');

            caching(appShellFilesToCache, { ...settings, ...payload });
            return { process: true };
        }
    }

    worker.addEventListener('message', async ({ source: client, data }) => {
        const { type, payload } = data;

        if (!methods[type])
            return client.postMessage(JSON.stringify({ type }));
        const value = await methods[type](payload);

        client.postMessage(JSON.stringify({ type, payload: value }));
    });
})(log('message system ready'));