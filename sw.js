var version = '156';
var cacheName = 'pwa-tunime-v' + version;
var appShellFilesToCache = [
    // Директория: /images/icons
    "/images/icons/logo-x192-b.png",
    "/images/icons/logo-x192-o.png",
    "/images/icons/logo-x256-b.png",
    "/images/icons/logo-x256-o.png",
    "/images/icons/logo-x384-b.png",
    "/images/icons/logo-x384-o.png",
    "/images/icons/logo-x512-b.png",
    "/images/icons/logo-x512-o.png",
    // Директория: /images
    "/images/anime-dragon.png",
    "/images/ava.jpeg",
    "/images/error-trailers.png",
    "/images/icon-web.png",
    "/images/login-icon.png",
    "/images/logo-login.png",
    "/images/magnifying-glass.png",
    "/images/player-icon.png",
    "/images/popup.png",
    "/images/preview-image.png",
    "/images/splashscreen.png",
    // Директория: /javascript/engine
    "/javascript/engine/event_handler.js",
    "/javascript/engine/orientation.js",
    // Директория: /javascript/library
    "/javascript/library/anime.min.js",
    "/javascript/library/hls.js",
    "/javascript/library/hls.js.map",
    "/javascript/library/jqery.min.js",
    "/javascript/library/rxjs.umd.min.js",
    "/javascript/library/rxjs.umd.min.js.map",
    "/javascript/library/swiper-bundle.min.js",
    "/javascript/library/swiper-bundle.min.js.map",
    // Директория: /javascript/modules
    "/javascript/modules/AnimeCard.js",
    "/javascript/modules/funcitons.js",
    "/javascript/modules/header.js",
    "/javascript/modules/Kodik.js",
    "/javascript/modules/Popup.js",
    "/javascript/modules/Settings.js",
    "/javascript/modules/ShikiAPI.js",
    "/javascript/modules/ShikiUSR.js",
    "/javascript/modules/TunimeApi.js",
    "/javascript/modules/Windows.js",
    // Директория: /javascript/pages/index
    "/javascript/pages/index/mod_account.js",
    "/javascript/pages/index/mod_animes.js",
    "/javascript/pages/index/mod_countdown.js",
    "/javascript/pages/index/mod_github.js",
    "/javascript/pages/index/mod_history_watch.js",
    "/javascript/pages/index/mod_notify.js",
    "/javascript/pages/index/mod_search.js",
    "/javascript/pages/index/mod_trailers.js",
    "/javascript/pages/index/mod_trailers_animation.js",
    "/javascript/pages/index/mod_window.js",
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
    "/javascript/pages/search/mod_history.js",
    "/javascript/pages/search/mod_list.js",
    "/javascript/pages/search/mod_recomendation.js",
    "/javascript/pages/search/mod_search.js",
    "/javascript/pages/search/mod_searchState.js",
    // Директория: /javascript/pages/settings
    "/javascript/pages/settings/mod_select.js",
    // Директория: /javascript/pages/user
    "/javascript/pages/user/mod_history.js",
    // Директория: /javascript/pages/watch
    "/javascript/pages/watch/mod_download.js",
    "/javascript/pages/watch/mod_history.js",
    "/javascript/pages/watch/mod_load.js",
    "/javascript/pages/watch/mod_player.js",
    "/javascript/pages/watch/mod_resource.js",
    "/javascript/pages/watch/mod_scrolling.js",
    "/javascript/pages/watch/mod_sdata.js",
    "/javascript/pages/watch/mod_translation.js",
    "/javascript/pages/watch/mod_ui.js",
    "/javascript/pages/watch/mod_urate.js",
    "/javascript/pages/watch/mod_wscore.js",
    // Директория: /javascript/pages
    "/javascript/pages/404a.js",
    "/javascript/pages/index.js",
    "/javascript/pages/list.js",
    "/javascript/pages/login.js",
    "/javascript/pages/player.js",
    "/javascript/pages/search.js",
    "/javascript/pages/settings.js",
    "/javascript/pages/user.js",
    "/javascript/pages/watch.js",
    // Директория: /javascript
    "/javascript/kodik.js",
    "/javascript/menu.js",
    "/javascript/parametrs.js",
    "/javascript/server.js",
    "/javascript/shikimori.js",
    // Директория: /style/css/min
    "/style/css/min/swiper-bundle.min.css",
    // Директория: /style/css
    "/style/css/index.css",
    "/style/css/list.css",
    "/style/css/login.css",
    "/style/css/main.css",
    "/style/css/notfound.css",
    "/style/css/player.css",
    "/style/css/search.css",
    "/style/css/settings.css",
    "/style/css/user.css",
    "/style/css/watch.css",
    // Директория: /style/fonts
    "/style/fonts/Inter.ttf",
    "/style/fonts/Manrope.ttf",
    "/style/fonts/NovaSquare.ttf",
    // Директория: /
    "/404.html",
    "/404a.html",
    "/index.html",
    "/list.html",
    "/login.html",
    "/player.html",
    "/search.html",
    "/settings.html",
    "/user.html",
    "/watch.html",
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
