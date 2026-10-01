const version = '3.3.0';
const hash = "2436ff"; // общий hash сборки — генерируется скриптом (см. вывод в консоли)

const cacheName = `pwa-tunime-${hash}-v${version}`;
const cachePrefix = 'pwa-tunime-';

/**
 * Список файлов app shell.
 * Формат: { path: string, hash: string, size: number }
 * @type {[{path:string, hash:string, size:number}]}
 */
const appShellFilesToCache = [];

const servers = [
    "https://hub.tunime.app"
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
            batchSize: 3
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

/**
 * Манифест установленных файлов: { [path]: hash }
 * Хранится в кеше настроек (pwa-settings), который переживает activate-очистку.
 * По нему определяем, какие файлы можно перенести из старого кеша.
 */
const manifest = {
    req: 'files-manifest',

    get: async function () {
        try {
            const cache = await caches.open(setup.cache.key);
            const response = await cache.match(this.req);
            return response ? await response.json() : null;
        } catch (error) {
            err('error get manifest:', error);
            return null;
        }
    },

    set: async function (files) {
        try {
            const map = {};
            for (const f of files) map[f.path] = f.hash;
            const cache = await caches.open(setup.cache.key);
            await cache.put(this.req, new Response(JSON.stringify(map)));
            return true;
        } catch (error) {
            err('error set manifest:', error);
            return false;
        }
    },

    clear: async function () {
        try {
            const cache = await caches.open(setup.cache.key);
            await cache.delete(this.req);
            return true;
        } catch (error) {
            return false;
        }
    }
};

/**
 * Оценивает объём предстоящей загрузки: сколько файлов/байт придётся скачать,
 * а сколько можно перенести из старого кеша (hash совпадает и файл реально в кеше).
 * @param {Array<{path:string, hash:string, size:number}>} files
 */
async function estimateDownload(files) {
    const total = files.length;
    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

    let downloadCount = 0;
    let downloadSize = 0;

    try {
        const oldManifest = await manifest.get() || {};

        // Множество путей, реально лежащих в старых кешах приложения
        const names = await caches.keys();
        const cachedPaths = new Set();
        for (const name of names) {
            if (!name.startsWith(cachePrefix) || name === cacheName) continue;
            const cache = await caches.open(name);
            for (const request of await cache.keys()) {
                cachedPaths.add(new URL(request.url).pathname);
            }
        }

        for (const file of files) {
            const reusable = oldManifest[file.path] === file.hash && cachedPaths.has(file.path);
            if (!reusable) {
                downloadCount++;
                downloadSize += file.size || 0;
            }
        }
    } catch (error) {
        // При ошибке считаем, что качать придётся всё
        err('estimate error:', error);
        downloadCount = total;
        downloadSize = totalSize;
    }

    return {
        total,
        totalSize,
        downloadCount,
        downloadSize,
        downloadMB: +(downloadSize / 1024 / 1024).toFixed(2),
        reuseCount: total - downloadCount,
        reuseSize: totalSize - downloadSize
    };
}

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
     * @param {object} estimate - оценка загрузки из estimateDownload()
     * @returns {Promise<boolean>}
     */
    const requestInstallPermission = (channel, estimate) => {
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
                payload: { version, hash, cacheName, ...estimate }
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

            // Оценка: сколько реально нужно скачать, а сколько перенесётся из кеша
            const estimate = await estimateDownload(appShellFilesToCache);

            if (!s.install) {
                await requestInstallPermission(broadcast, estimate);
            }

            await setup.update({ 'source': 'worker' });

            broadcast.postMessage({
                type: 'NEW_VERSION',
                payload: { version, hash, cacheName, ...estimate }
            });

            // registration.active === null -> старого SW нет, это первый визит
            //
            // При ОБНОВЛЕНИИ (registration.active есть) поведение прежнее
            // один-в-один: попап с прогрессом -> полная докачка -> и только
            // потом skipWaiting и перезагрузка в готовую новую версию.
            const isFirstInstall = worker.registration.active === null;

            if (!isFirstInstall) {
                await caching(appShellFilesToCache, s);
            }

            if (s.activate) {
                worker.skipWaiting();
            }
        })
    );
});

worker.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        await worker.clients.claim();
        log('worker activated (fast activate, caching in background).');
    })());

    backgroundCaching();
});

async function backgroundCaching() {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        // Кэш неполон -> первая установка (или прерванная докачка)
        if (keys.length < appShellFilesToCache.length) {
            const s = await setup.getValue('install');
            await caching(appShellFilesToCache, s);
        }

        // Только когда текущий кэш полон, убираем старые
        const names = await caches.keys();
        await Promise.all(
            names.map(name => {
                if (name !== cacheName && name !== setup.cache.key) {
                    return caches.delete(name);
                }
            })
        );

        log('background caching finished, old caches cleaned.');
    } catch (error) {
        err('background caching failed:', error);
    }
}

/**
 * Инкрементальное кеширование.
 * Файл с совпадающим hash переносится из старого кеша (без сети),
 * изменённый или новый — скачивается.
 * @param {Array<{path:string, hash:string, size:number}>} filesToCache
 */
async function caching(filesToCache, { channel, batchSize }) {
    const broadcast = new BroadcastChannel(channel);
    try {
        const cache = await caches.open(cacheName);
        const total = filesToCache.length;
        const totalSize = filesToCache.reduce((sum, f) => sum + (f.size || 0), 0);
        let processed = 0;
        let reusedCount = 0;
        let downloadedCount = 0;
        let downloadedSize = 0;

        if (total === 0) {
            warn('no files to cache.');
            return;
        }

        // Манифест предыдущей установки: { path: hash }
        const oldManifest = await manifest.get() || {};

        // Открываем старые кеши приложения (кроме текущего)
        const names = await caches.keys();
        const oldCaches = await Promise.all(
            names
                .filter(name => name.startsWith(cachePrefix) && name !== cacheName)
                .map(name => caches.open(name))
        );

        const fromOldCaches = async (path) => {
            for (const oldCache of oldCaches) {
                const response = await oldCache.match(path);
                if (response) return response;
            }
            return null;
        };

        log(`caching ${total} files, ~${(totalSize / 1024 / 1024).toFixed(2)} MB (old caches: ${oldCaches.length}).`);

        const batch = async (files) => {
            const batchPromises = files.map(async (file) => {
                let success = true;
                let reused = false;
                try {
                    // hash не изменился — пробуем перенести из старого кеша
                    if (oldManifest[file.path] === file.hash) {
                        const old = await fromOldCaches(file.path);
                        if (old) {
                            await cache.put(file.path, old);
                            reused = true;
                            reusedCount++;
                        }
                    }

                    // изменён, новый или не найден в старом кеше — качаем
                    if (!reused) {
                        await cache.add(file.path);
                        downloadedCount++;
                        downloadedSize += file.size || 0;
                    }
                } catch (error) {
                    success = false;
                    err(`!failed to cache ${file.path}`, error);
                }

                processed++;
                const percent = ((processed / total) * 100).toFixed(2);
                broadcast.postMessage({
                    type: 'CACHE_PROGRESS',
                    payload: { total, processed, percent, file: file.path, size: file.size, success, reused }
                });

                return { file: file.path, success, reused };
            });
            await Promise.allSettled(batchPromises);
        };

        // Разбиваем файлы на батчи
        for (let i = 0; i < total; i += batchSize) {
            const batchFiles = filesToCache.slice(i, i + batchSize);
            await batch(batchFiles);
        }

        // Сохраняем манифест новой версии
        await manifest.set(filesToCache);

        log(`caching complete! reused: ${reusedCount}, downloaded: ${downloadedCount} (~${(downloadedSize / 1024 / 1024).toFixed(2)} MB).`);
        broadcast.postMessage({
            type: 'CACHE_COMPLETE',
            payload: { version, cacheName, reused: reusedCount, downloaded: downloadedCount, downloadedSize }
        });
    } catch (error) {
        err('!failed start caching!:', error);
        broadcast.postMessage({ type: 'CACHE_ERROR', payload: { error: error.message } });
    }
}

(() => {
    worker.addEventListener('fetch', event => {
        const url = new URL(event.request.url);

        // игнорировать чужие домены
        if (url.origin !== self.location.origin && !servers.includes(url.origin)) {
            return;
        }

        event.respondWith(handleRequest(event.request));
    });

    const handleRequest = async (request) => {
        const url = new URL(request.url);

        try {
            if (servers.some(s => url.href.startsWith(s))) {
                return fetch(new Request(request, {
                    headers: new Headers({
                        ...Object.fromEntries(request.headers),
                        Authorization: request.headers.get('Authorization') || version
                    })
                }));
            }

            if (url.pathname.startsWith('/javascript/pages/anime/')) {
                const response = await fetch(request);
                if (response.status !== 404) return response;

                return fetch('/javascript/pages/anime/default.js');
            }

            const cache = await caches.open(cacheName);

            const cached = await cache.match(request);
            if (cached) return cached;

            if (url.pathname === "/") {
                return (await cache.match('/index.html')) || fetch(request);
            }

            return (await cache.match(url.pathname)) || fetch(request);

        } catch (e) {
            warn(`fetch error ${e}`);
            return fetch(request);
        }
    }
})(log('fetch event support enabled'));

(() => {
    const defaults = {
        title: 'Tunime',
        icon: '/images/icons/logo-x512-b.png',
        url: '/'
    };

    // Маппинг типов уведомлений на URL
    const routes = {
        co_watch_invite: (d) => `/watch.html?id=${d.animeId}&room=${d.roomId}`,
        new_episode: (d) => `/watch.html?id=${d.animeId}`,
    };

    /**
     * Безопасный парсинг данных push-события
     * @param {PushEvent} event
     * @returns {object|null}
     */
    const parsePushData = (event) => {
        if (!event.data) return null;
        try {
            return event.data.json();
        } catch {
            const text = event.data.text();
            return text ? { body: text } : null;
        }
    };

    /**
     * Определяет URL перехода по payload
     * @param {object} payload
     * @returns {string}
     */
    const resolveUrl = (payload) => {
        const inner = payload.data || {};
        if (payload.url) return payload.url;
        if (inner.type && routes[inner.type]) return routes[inner.type](inner);
        return defaults.url;
    };


    worker.addEventListener('push', (event) => {
        const data = parsePushData(event);

        if (!data) {
            warn('push: empty or invalid payload');
            return;
        }

        const options = {
            body: data.body || '',
            icon: data.icon || defaults.icon,
            badge: data.badge,
            image: data.image,
            tag: data.tag,
            silent: !!data.silent,
            data: {
                url: resolveUrl(data),
                payload: data.data || {}
            }
        };

        event.waitUntil(
            worker.registration.showNotification(data.title || defaults.title, options)
        );
    });

    worker.addEventListener('notificationclick', (event) => {
        event.notification.close();

        const { url, payload } = event.notification.data || {};
        const targetUrl = url || defaults.url;
        const message = { url: targetUrl, ...payload };

        event.waitUntil((async () => {

            const windowClients = await clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            });

            // Ищем вкладку именно нашего приложения
            const client = windowClients.find(c =>
                new URL(c.url).origin === self.location.origin &&
                c.frameType === 'top-level'
            );

            if (client) {
                await client.focus();
                // Открытая вкладка сама решает, что делать (роутинг без перезагрузки)
                client.postMessage({
                    type: 'PUSH_NOTIFICATION_CLICK',
                    payload: message
                });
                return;
            }

            // Подстраховка для iOS: сохраняем клик, страница заберёт его
            // через PUSH_PENDING при старте (openWindow на iOS игнорирует url)
            await setup.setValue('pushPending', message);
            return clients.openWindow(targetUrl);
        })());
    });
})(log('notification enabled'));

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

            // Полная перезакачка: удаляем кеш и манифест,
            // чтобы caching() не пытался переносить старые файлы
            await caches.delete(cacheName);
            await manifest.clear();

            const settings = await setup.getValue('install');

            caching(appShellFilesToCache, { ...settings, ...payload });
            return { process: true };
        },
        'PUSH_PENDING': async () => {
            const value = await setup.getValue('pushPending');
            if (value) await setup.setValue('pushPending', null);
            return value || null;
        },
    }

    worker.addEventListener('message', async ({ source: client, data }) => {
        const { type, payload } = data;

        if (!methods[type])
            return client.postMessage(JSON.stringify({ type }));
        const value = await methods[type](payload);

        client.postMessage(JSON.stringify({ type, payload: value }));
    });
})(log('message system ready'));