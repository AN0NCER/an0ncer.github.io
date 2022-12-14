var version = '45';
var cacheName = 'pwa-tunime-v' + version;
var appShellFilesToCache = [
    //Pages
    '/',
    '/index.html',
    '/404.html',
    '/search.html',
    '/list.html',
    //Styles
    '/style/css/main.css',
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
    //Javascript
    '/javascript/aspjknml.js',
    '/javascript/jdub.js',
    '/javascript/jeps.js',
    '/javascript/jmenu.js',
    '/javascript/server.js',
    '/javascript/shikimori.js',
    //Pages
    '/javascript/pages/index.js',
    '/javascript/pages/search.js',
    '/javascript/pages/list.js',
    '/javascript/pages/user.js',
    '/javascript/pages/watch.js',
    //Custom
    '/javascript/custom/swtreilers.js',
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