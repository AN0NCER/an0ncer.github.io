var version = '78';
var cacheName = 'pwa-tunime-v' + version;
var appShellFilesToCache = [
    //Pages
    '/',
    '/404.html',
    '/index.html',
    '/list.html',
    '/login.html',
    '/search.html',
    '/settings.html',
    '/tunimeplayer.html',
    '/user.html',
    '/watch.html',
    //Styles
    '/style/css/index.css',
    '/style/css/list.css',
    '/style/css/login.css',
    '/style/css/main.css',
    '/style/css/search.css',
    '/style/css/settings.css',
    '/style/css/tunimeplayers.css',
    '/style/css/user.css',
    '/style/css/watch.css',
    //Styles//Min
    '/style/css/min/swiper-bundle.min.css',
    //Javascript
    '/javascript/jmenu.js',
    '/javascript/kodik.js',
    '/javascript/parametrs.js',
    '/javascript/server.js',
    '/javascript/shikimori.js',
    //Javascript//Custom
    '/javascript/custom/device.js',
    '/javascript/custom/swtreilers.js',
    '/javascript/custom/updatedialog.js',
    //Javascript//Engine
    '/javascript/engine/event_handler.js',
    '/javascript/engine/orientation.js',
    '/javascript/engine/window_managment.js',
    //Javascript//Library
    '/javascript/library/anime.min.js',
    '/javascript/library/hls.js',
    '/javascript/library/jqery.min.js',
    '/javascript/library/swiper-bundle.min.js',
    '/javascript/library/swiper-bundle.min.js.map',
    //Javascript//Modiles
    '/javascript/modules/AnimeCard.js',
    '/javascript/modules/funcitons.js',
    '/javascript/modules/header.js',
    '/javascript/modules/ShikiAPI.js',
    '/javascript/modules/ShikiUSR.js',
    '/javascript/modules/TunimeApi.js',
    '/javascript/modules/Windows.js',
    //Javascript//Pages
    '/javascript/pages/index.js',
    '/javascript/pages/list.js',
    '/javascript/pages/login.js',
    '/javascript/pages/search.js',
    '/javascript/pages/settings.js',
    '/javascript/pages/tunimeplayer.js',
    '/javascript/pages/user.js',
    '/javascript/pages/watch.js',
    //Javascript//Pages//Search
    '/javascript/pages/search/mod_history.js',
    '/javascript/pages/search/mod_list.js',
    '/javascript/pages/search/mod_recomendation.js',
    '/javascript/pages/search/mod_search.js',
    '/javascript/pages/search/mod_searchState.js',
    //Javascript//Pages//User
    '/javascript/pages/user/mod_history.js',
    //Javascript//Pages//Watch
    '/javascript/pages/watch/mod_history.js',
    '/javascript/pages/watch/mod_loadingpage.js',
    '/javascript/pages/watch/mod_player.js',
    '/javascript/pages/watch/mod_resources.js',
    '/javascript/pages/watch/mod_scrolling.js',
    '/javascript/pages/watch/mod_userrate.js',
    '/javascript/pages/watch/mod_window.js',
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