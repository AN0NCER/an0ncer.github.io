const version = '2.0.0';
const hash = 'assb3';
const cacheName = `pwa-tunime-${hash}-v${version}`;
const appShellFilesToCache = [
];

self.addEventListener('install', async event => {
    try {
        if (!isValidKey((await caches.keys())[0])) {
            self.skipWaiting();
        }
    } catch {
        self.skipWaiting();
    }

    event.waitUntil(caches.open(cacheName).then((cache) => {
        console.log('[SW]: Caching App Shell');
        return cache.addAll(appShellFilesToCache);
    }))
});

self.addEventListener('activate', event => {
    console.log('[SW]: Activate');
    //Cleaning caching
    caches.keys().then(function (names) {
        for (let name of names)
            if (name != cacheName) caches.delete(name);
    });
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            } else {
                return fetch(event.request);
            }
        })
    )
});

self.addEventListener('message', async event => {
    if (event.data === 215) {
        const client = event.source;
        client.postMessage(JSON.stringify({ id: 215, val: version }));
    } else if (event.data === 221) {
        self.skipWaiting();
    } else if (event.data === 216) {
        const client = event.source;
        client.postMessage(JSON.stringify({ id: 216, val: hash }));
    } else if (event.data === 220) {
        const client = event.source;
        client.postMessage(JSON.stringify({ id: 220, val: { ver: version, hash: hash } }));
    }
});

// Функция для проверки ключа (Удалить через 5 месяцев или раньше)
function isValidKey(key) {
    // Регулярное выражение для проверки ключа
    const regex = /^pwa-tunime-[A-Za-z0-9]{5}-v\d+\.\d+\.\d+$/;

    // Проверяем ключ с помощью регулярного выражения
    return regex.test(key);
}