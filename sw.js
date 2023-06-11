var version = '71';
var cacheName = 'pwa-tunime-v' + version;
var appShellFilesToCache = [
    //Pages
    '/',
    '/index.html',
    '/404.html',
    '/search.html',
    '/settings.html',
    '/list.html',
    '/user.html',
    '/watch.html',
    '/login.html',
    //Styles
    '/style/css/main.css',
    '/style/css/settings.css',
    '/style/css/login.css',
    '/style/css/index.css',
    '/style/css/search.css',
    '/style/css/user.css',
    '/style/css/watch.css',
    '/style/css/list.css',
    '/style/css/min/swiper-bundle.min.css',
    //Library
    '/javascript/library/jqery.min.js',
    '/javascript/library/anime.min.js',
    '/javascript/library/swiper-bundle.min.js',
    '/javascript/library/swiper-bundle.min.js.map',
    //Javascript
    '/javascript/kodik.js',
    '/javascript/jmenu.js',
    '/javascript/server.js',
    '/javascript/parametrs.js',
    '/javascript/shikimori.js',
    //Engine
    '/javascript/engine/orientation.js',
    '/javascript/engine/event_handler.js',
    '/javascript/engine/window_managment.js',
    //Pages
    '/javascript/pages/index.js',
    '/javascript/pages/search.js',
    '/javascript/pages/settings.js',
    '/javascript/pages/list.js',
    '/javascript/pages/login.js',
    '/javascript/pages/user.js',
    '/javascript/pages/watch.js',
    //Custom
    '/javascript/custom/experemental.js',
    '/javascript/custom/swtreilers.js',
    '/javascript/custom/updatedialog.js',
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