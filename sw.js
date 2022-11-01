var version = '6';
var cacheName = 'pwa-tunime-v' + version;
var appShellFilesToCache = [
    '/',
    '/index.html',
    '/style/css/main.css',
    '/style/css/index.css',
    '/javascript/library/jqery.min.js',
    '/javascript/library/anime.min.js'
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