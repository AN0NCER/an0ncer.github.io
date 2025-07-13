const version = '2.9.0';
const hash = '214c4';

const cacheName = `pwa-tunime-${hash}-v${version}`;

const appShellFilesToCache = [];

const servers = [
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