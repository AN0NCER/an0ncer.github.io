var version = '20';
var cacheName = 'pwa-tunime-v' + version;
var appShellFilesToCache = [
    '/',
    '/index.html',
    '/404.html',
    '/search.html',
    '/list.html',
    '/style/css/main.css',
    '/style/css/index.css',
    '/style/css/search.css',
    '/style/css/user.css',
    '/style/css/watch.css',
    '/style/css/list.css',
    '/style/css/min/swiper-bundle.min.css',
    '/javascript/library/jqery.min.js',
    '/javascript/library/anime.min.js',
    '/javascript/library/swiper-bundle.min.js',
    '/javascript/aspjknml.js',
    '/javascript/engine_sw.js',
    '/javascript/jdub.js',
    '/javascript/jeps.js',
    '/javascript/jmenu.js',
    '/javascript/server.js',
    '/javascript/shikimori.js',
    '/javascript/pages/index.js',
    '/javascript/pages/search.js',
    '/javascript/pages/list.js',
    '/javascript/pages/user.js',
    '/javascript/pages/watch.js',
    '/data/swiper.json'
];

var dataCacheName = 'pwa-tunime-data-v' + version;

self.addEventListener('install', event => {
    console.log('[SW]: Installed');
    self.skipWaiting();
    event.waitUntil(caches.open(cacheName).then((cache) => {
        console.log('[SW]: Caching App Shell');
        return cache.addAll(appShellFilesToCache);
    }));
});

self.addEventListener('activate', event => {
    console.log('[SW]: Activate');
    //Cleaning caching
    caches.keys().then(function (names) {
        for (let name of names)
            if (name != cacheName && name != 'pwa-tunime-v'+(version-1) && name != 'pwa-tunime-v'+(version-2)) caches.delete(name);
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