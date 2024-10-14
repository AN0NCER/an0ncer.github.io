const version = '2.5.4';
const hash = '2c9f8';
const cacheName = `pwa-tunime-${hash}-v${version}`;
const appShellFilesToCache = [
    // Директория: /images/genres
    "/images/genres/comedy.svg",
    "/images/genres/dementia_psychological.svg",
    "/images/genres/drama.svg",
    "/images/genres/fantasy.svg",
    "/images/genres/historical.svg",
    "/images/genres/horror_thriller.svg",
    "/images/genres/mecha.svg",
    "/images/genres/military.svg",
    "/images/genres/music.svg",
    "/images/genres/mystery.svg",
    "/images/genres/police.svg",
    "/images/genres/romance.svg",
    "/images/genres/slice_of_life.svg",
    "/images/genres/space.svg",
    "/images/genres/sports.svg",
    "/images/genres/supernatural.svg",
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
    "/images/anime-not.png",
    "/images/ava.jpeg",
    "/images/black-bg-player.png",
    "/images/collections.png",
    "/images/error-trailers.png",
    "/images/icon-web.png",
    "/images/login-icon.png",
    "/images/logo-login.png",
    "/images/player-icon.png",
    "/images/popup.png",
    "/images/preview-image.png",
    // Директория: /javascript/auto
    "/javascript/auto/download_a.js",
    // Директория: /javascript/library
    "/javascript/library/anime.min.js",
    "/javascript/library/hls.js",
    "/javascript/library/hls.js.map",
    "/javascript/library/jqery.min.js",
    "/javascript/library/jsyaml.js",
    "/javascript/library/rxjs.umd.min.js",
    "/javascript/library/rxjs.umd.min.js.map",
    "/javascript/library/swiper-bundle.min.js",
    "/javascript/library/swiper-bundle.min.js.map",
    // Директория: /javascript/modules
    "/javascript/modules/ActionVerify.js",
    "/javascript/modules/AnimeCard.js",
    "/javascript/modules/Collection.js",
    "/javascript/modules/EventTools.js",
    "/javascript/modules/functions.js",
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
    "/javascript/pages/index/mod_github.js",
    "/javascript/pages/index/mod_history_watch.js",
    "/javascript/pages/index/mod_notify.js",
    "/javascript/pages/index/mod_search.js",
    "/javascript/pages/index/mod_trailers.js",
    "/javascript/pages/index/mod_trailers_animation.js",
    "/javascript/pages/index/mod_window.js",
    // Директория: /javascript/pages/list
    "/javascript/pages/list/mod_alist.js",
    "/javascript/pages/list/mod_carousel.js",
    "/javascript/pages/list/mod_collections.js",
    "/javascript/pages/list/mod_core.js",
    "/javascript/pages/list/mod_filter.js",
    "/javascript/pages/list/mod_html.js",
    "/javascript/pages/list/mod_search.js",
    "/javascript/pages/list/mod_ui.js",
    "/javascript/pages/list/mod_w_anime.js",
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
    "/javascript/pages/settings/mod_storage.js",
    // Директория: /javascript/pages/user
    "/javascript/pages/user/mod_achivements.js",
    "/javascript/pages/user/mod_favorites.js",
    "/javascript/pages/user/mod_franchises.js",
    "/javascript/pages/user/mod_friends.js",
    "/javascript/pages/user/mod_genres.js",
    "/javascript/pages/user/mod_history.js",
    "/javascript/pages/user/mod_level.js",
    "/javascript/pages/user/mod_load.js",
    "/javascript/pages/user/mod_stats.js",
    // Директория: /javascript/pages/watch
    "/javascript/pages/watch/mod_collection.js",
    "/javascript/pages/watch/mod_download.js",
    "/javascript/pages/watch/mod_franchise.js",
    "/javascript/pages/watch/mod_history.js",
    "/javascript/pages/watch/mod_load.js",
    "/javascript/pages/watch/mod_player.js",
    "/javascript/pages/watch/mod_private.js",
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
    // Директория: /javascript/services
    "/javascript/services/dispatcher.js",
    "/javascript/services/installing.js",
    "/javascript/services/update.js",
    // Директория: /javascript
    "/javascript/kodik.js",
    "/javascript/menu.js",
    "/javascript/parametrs.js",
    "/javascript/server.js",
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
    "/style/css/verifyaction.css",
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

const servers = [
    "https://tunime.onrender.com",
    "https://tunime-hujg.onrender.com"
];

self.addEventListener('install', async event => {
    event.waitUntil(caches.open(cacheName).then((cache) => {
        console.log('[SW]: Caching App Shell');
        return cache.addAll(appShellFilesToCache);
    }));

    setTimeout(() => {
        self.skipWaiting();
    }, 5000);
});

self.addEventListener('activate', event => {
    console.log('[SW]: Activate');
    //Cleaning caching
    caches.keys().then(function (names) {
        for (let name of names)
            if (name != cacheName) caches.delete(name);
    });
});

self.addEventListener('fetch', function (event) {
    if (servers.some(url => event.request.url.startsWith(url))) {
        let modifiedHeaders = new Headers(event.request.headers);
        let authHeader = modifiedHeaders.get('Authorization') || '';
        authHeader += version;
        modifiedHeaders.set('Authorization', authHeader);

        const modifiedRequest = new Request(event.request, {
            method: event.request.method,
            headers: modifiedHeaders,
            mode: event.request.mode,
            credentials: event.request.credentials,
            redirect: event.request.redirect,
            referrer: event.request.referrer,
            referrerPolicy: event.request.referrerPolicy,
            integrity: event.request.integrity,
            cache: event.request.cache,
        });

        event.respondWith(fetch(modifiedRequest));
    } else {
        event.respondWith(
            caches.match(event.request).then((response) => {
                if (response) {
                    return response;
                } else {
                    return fetch(event.request);
                }
            })
        )
    }
});

self.addEventListener('message', async event => {
    const client = event.source;
    if (event.data.id === 215) {
        client.postMessage(JSON.stringify({ id: 215, val: version }));
    } else if (event.data.id === 221) {
        await self.skipWaiting();
        client.postMessage(JSON.stringify({ id: 221, val: 'ok' }));
    } else if (event.data.id === 216) {
        const client = event.source;
        client.postMessage(JSON.stringify({ id: 216, val: hash }));
    } else if (event.data.id === 220) {
        const client = event.source;
        client.postMessage(JSON.stringify({ id: 220, val: { ver: version, hash: hash } }));
    }
});
