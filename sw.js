const version = '2.8.0';
const hash = '214c4';
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
    // Директория: /images/seasons
    "/images/seasons/autum.webp",
    "/images/seasons/spring.webp",
    "/images/seasons/summer.webp",
    "/images/seasons/winter.webp",
    // Директория: /images
    "/images/anime-not.png",
    "/images/ava.jpeg",
    "/images/black-bg-player.png",
    "/images/collections.png",
    "/images/endlist.png",
    "/images/error-trailers.png",
    "/images/icon-web.png",
    "/images/login-icon.png",
    "/images/logo-login.png",
    "/images/noanime.png",
    "/images/player-icon.png",
    "/images/popup.png",
    "/images/preview-image.png",
    "/images/tun-card.png",
    // Директория: /javascript/auto
    "/javascript/auto/download_a.js",
    // Директория: /javascript/library
    "/javascript/library/anime.min.js",
    "/javascript/library/hls.js",
    "/javascript/library/jqery.min.js",
    "/javascript/library/jsyaml.js",
    "/javascript/library/md5.wasm.min.js",
    "/javascript/library/rxjs.umd.min.js",
    "/javascript/library/swiper-bundle.min.js",
    // Директория: /javascript/modules
    "/javascript/modules/ActionVerify.js",
    "/javascript/modules/AnimeCard.js",
    "/javascript/modules/api.jikan.js",
    "/javascript/modules/Collection.js",
    "/javascript/modules/EventTools.js",
    "/javascript/modules/functions.js",
    "/javascript/modules/header.js",
    "/javascript/modules/Kodik.js",
    "/javascript/modules/Popup.js",
    "/javascript/modules/Settings.js",
    "/javascript/modules/ShikiAPI.js",
    "/javascript/modules/ShikiUSR.js",
    "/javascript/modules/TDatabase.js",
    "/javascript/modules/TDownload.js",
    "/javascript/modules/tun.cache.js",
    "/javascript/modules/TunimeApi.js",
    "/javascript/modules/Windows.js",
    // Директория: /javascript/pages/downloads
    "/javascript/pages/downloads/mod_manager.js",
    "/javascript/pages/downloads/mod_player.js",
    "/javascript/pages/downloads/mod_utils.js",
    "/javascript/pages/downloads/mod_voice.js",
    // Директория: /javascript/pages/index
    "/javascript/pages/index/mod_account.js",
    "/javascript/pages/index/mod_animes.js",
    "/javascript/pages/index/mod_github.js",
    "/javascript/pages/index/mod_history_watch.js",
    "/javascript/pages/index/mod_notify.js",
    "/javascript/pages/index/mod_search.js",
    "/javascript/pages/index/mod_trailers.js",
    "/javascript/pages/index/mod_trailers_animation.js",
    "/javascript/pages/index/mod_update.js",
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
    "/javascript/pages/search/mod_card.js",
    "/javascript/pages/search/mod_genres.js",
    "/javascript/pages/search/mod_history.js",
    "/javascript/pages/search/mod_popular.js",
    "/javascript/pages/search/mod_search.js",
    "/javascript/pages/search/mod_seasons.js",
    "/javascript/pages/search/mod_studios.js",
    "/javascript/pages/search/mod_voicelist.js",
    "/javascript/pages/search/mod_w_filter.js",
    "/javascript/pages/search/mod_w_genres.js",
    "/javascript/pages/search/mod_w_season.js",
    // Директория: /javascript/pages/settings
    "/javascript/pages/settings/mod_cleardb.js",
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
    "/javascript/pages/user/mod_w_anime.js",
    // Директория: /javascript/pages/watch
    "/javascript/pages/watch/mod.chronology.js",
    "/javascript/pages/watch/mod.resource.js",
    "/javascript/pages/watch/mod_collection.js",
    "/javascript/pages/watch/mod_dbanime.js",
    "/javascript/pages/watch/mod_download.js",
    "/javascript/pages/watch/mod_history.js",
    "/javascript/pages/watch/mod_player.js",
    "/javascript/pages/watch/mod_private.js",
    "/javascript/pages/watch/mod_scrolling.js",
    "/javascript/pages/watch/mod_transition.js",
    "/javascript/pages/watch/mod_translation.js",
    "/javascript/pages/watch/mod_ui.js",
    "/javascript/pages/watch/mod_urate.js",
    "/javascript/pages/watch/mod_wscore.js",
    // Директория: /javascript/pages
    "/javascript/pages/404a.js",
    "/javascript/pages/downloads.js",
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
    // Директория: /javascript/utils
    "/javascript/utils/auth.login.js",
    "/javascript/utils/auth.logout.js",
    // Директория: /javascript
    "/javascript/menu.js",
    "/javascript/parametrs.js",
    "/javascript/server.js",
    // Директория: /style/css/min
    "/style/css/min/swiper-bundle.min.css",
    // Директория: /style/css
    "/style/css/downloads.css",
    "/style/css/index.css",
    "/style/css/list.css",
    "/style/css/login.css",
    "/style/css/main.css",
    "/style/css/notfound.css",
    "/style/css/player.css",
    "/style/css/search.css",
    "/style/css/settings.css",
    "/style/css/ticons.css",
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
    "/downloads.html",
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

self.addEventListener('install', event => {
    const broadcast = new BroadcastChannel('tun.update');
    broadcast.postMessage({
        type: 'NEW_VERSION', payload: {
            version,
            hash,
            cacheName
        }
    });
    event.waitUntil(
        caches.open(cacheName).then(async (cache) => {
            console.log('[SW]: Caching App Shell');

            const total = appShellFilesToCache.length;
            let processed = 0;

            for (let i = 0; i < total; i++) {
                const file = appShellFilesToCache[i];
                let success = true;
                try {
                    await cache.add(file);
                } catch (err) {
                    success = false;
                }

                processed++;
                const percent = ((processed / total) * 100).toFixed(2);

                broadcast.postMessage({
                    type: 'CACHE_PROGRESS', payload: {
                        total,
                        processed,
                        percent,
                        file,
                        success
                    }
                });
            }

            console.log('[SW]: Caching complete.');
        }).catch((err) => {
            console.error('[SW]: Failed to open cache', err);
        })
    );

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

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    if (servers.some(s => url.href.startsWith(s))) {
        event.respondWith(fetch(new Request(event.request, {
            ...event.request,
            headers: new Headers({
                ...Object.fromEntries(event.request.headers),
                Authorization: (event.request.headers.get('Authorization') || '') + version
            })
        })));
        return;
    }

    event.respondWith((async () => {
        const url = new URL(event.request.url);
        const cachedResponse = await caches.match(event.request);

        if (cachedResponse) {
            return cachedResponse;
        }

        if (self.location.hostname !== url.hostname) {
            return fetch(event.request);
        }

        if (url.pathname === "/") {
            return caches.match('/index.html') || fetch(event.request);
        }

        return (await caches.match(url.pathname)) || fetch(event.request);
    })());
});

self.addEventListener('message', async event => {
    const call = {
        215: async (client) => {
            client.postMessage(JSON.stringify({ id: 215, val: version }));
        },
        221: async (client) => {
            await self.skipWaiting();
            client.postMessage(JSON.stringify({ id: 221, val: 'ok' }));
        },
        216: async (client) => {
            client.postMessage(JSON.stringify({ id: 216, val: hash }));
        },
        220: async (client) => {
            client.postMessage(JSON.stringify({ id: 220, val: { ver: version, hash: hash } }));
        }
    };

    const client = event.source;
    const id = event.data.id;
    if (call[id]) return call[id](client);
});
