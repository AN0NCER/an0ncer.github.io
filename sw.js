var version = '13';
var cacheName = 'pwa-tunime-v' + version;
var appShellFilesToCache = [
    '/',
    '/index.html',
    '/404.html',
    '/search.html',
    '/watch.html',
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
    '/javascript/library/aspjknml.js',
    '/javascript/library/engine_sw.js',
    '/javascript/library/jdub.js',
    '/javascript/library/jeps.js',
    '/javascript/library/jmenu.js',
    '/javascript/library/server.js',
    '/javascript/library/shikimori.js',
    '/javascript/library/pages/index.js',
    '/javascript/library/pages/search.js',
    '/javascript/library/pages/list.js',
    '/javascript/library/pages/user.js',
    '/javascript/library/pages/watch.js',
    '/data/swiper.json'
];

var dataCacheName = 'pwa-tunime-data-v' + version;

self.addEventListener('install', event => {
    console.log('[SW]: Installed');

    event.waitUntil(caches.open(cacheName).then((cache) => {
        console.log('[SW]: Caching App Shell');
        return cache.addAll(appShellFilesToCache);
    }));
});

self.addEventListener('activate', event => {
    console.log('[SW]: Activate');
});

self.addEventListener('fetch', event => {
    console.log('[SW]: Fetch');

    console.log(event);

    console.log('[SW]: '+event.request);

    event.respondWith(
        caches.match(event.request).then((response) => {
            if(response){
                console.log('[SW]: returning' + event.request.url + 'from cache');
                return response;
            }else{
                console.log('[SW]: returning' + event.request.url + 'from net');
                return fetch(event.request);
            }
        })
    )
});