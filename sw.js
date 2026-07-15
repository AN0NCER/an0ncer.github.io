const version = '3.2.13';
const hash = "ab1ff"; // общий hash сборки — генерируется скриптом (см. вывод в консоли)

const cacheName = `pwa-tunime-${hash}-v${version}`;
const cachePrefix = 'pwa-tunime-';

/**
 * Список файлов app shell.
 * Формат: { path: string, hash: string, size: number }
 */
const appShellFilesToCache = [
    // Директория: /images/icons
    { path: "/images/icons/logo-x192-b.png", hash: "96e7fe80", size: 18615 },
    { path: "/images/icons/logo-x192-o.png", hash: "f27f6c07", size: 12924 },
    { path: "/images/icons/logo-x256-b.png", hash: "92ed71f9", size: 29763 },
    { path: "/images/icons/logo-x256-o.png", hash: "b2a1c936", size: 21414 },
    { path: "/images/icons/logo-x384-b.png", hash: "41ddf8d4", size: 69646 },
    { path: "/images/icons/logo-x384-o.png", hash: "a7f1dd25", size: 58006 },
    { path: "/images/icons/logo-x512-b.png", hash: "e70c0536", size: 135614 },
    { path: "/images/icons/logo-x512-o.png", hash: "3417a929", size: 122751 },
    { path: "/images/icons/manifest-b.json", hash: "12b98e43", size: 896 },
    { path: "/images/icons/manifest-o.json", hash: "d8853c50", size: 891 },
    // Директория: /images/page.user
    { path: "/images/page.user/head.profile.jpg", hash: "3bcc07c6", size: 612860 },
    // Директория: /images/seasons
    { path: "/images/seasons/autum.webp", hash: "8ac71ff3", size: 56080 },
    { path: "/images/seasons/spring.webp", hash: "7c13fce9", size: 40542 },
    { path: "/images/seasons/summer.webp", hash: "63c65474", size: 18738 },
    { path: "/images/seasons/winter.webp", hash: "37d2439f", size: 92478 },
    // Директория: /images/settings
    { path: "/images/settings/set.blue.plr.png", hash: "0d795c91", size: 18124 },
    { path: "/images/settings/set.default.plr.png", hash: "40764d97", size: 17163 },
    { path: "/images/settings/set.menu.default.png", hash: "67abfc9c", size: 62970 },
    { path: "/images/settings/set.quality.360.png", hash: "2b6134b7", size: 322374 },
    { path: "/images/settings/set.quality.480.png", hash: "10af8c2e", size: 339329 },
    { path: "/images/settings/set.quality.720.png", hash: "c1e7f6b1", size: 369627 },
    // Директория: /images
    { path: "/images/ava.webp", hash: "741c9c83", size: 74142 },
    { path: "/images/collections.png", hash: "abeaf397", size: 75664 },
    { path: "/images/endlist.png", hash: "8e1c0799", size: 4290 },
    { path: "/images/error-trailers.webp", hash: "36d223a1", size: 10298 },
    { path: "/images/icon-web.png", hash: "c1a17f41", size: 3169 },
    { path: "/images/img.404a.webp", hash: "54eff25f", size: 56816 },
    { path: "/images/img.login.jpg", hash: "3bcc07c6", size: 612860 },
    { path: "/images/noanime.png", hash: "0869213b", size: 2361 },
    { path: "/images/player-icon.png", hash: "31250187", size: 3445 },
    { path: "/images/popup.webp", hash: "266f5957", size: 3092 },
    { path: "/images/preview-image.png", hash: "0d5298d7", size: 803164 },
    { path: "/images/tun-card.png", hash: "675f5bbf", size: 171908 },
    { path: "/images/verify.action.png", hash: "c1d7bfdc", size: 521144 },
    // Директория: /javascript/auto
    { path: "/javascript/auto/download_a.js", hash: "7c6b60bd", size: 6866 },
    // Директория: /javascript/core
    { path: "/javascript/core/hub.core.js", hash: "b9facf26", size: 22959 },
    { path: "/javascript/core/main.core.js", hash: "481710c8", size: 15217 },
    { path: "/javascript/core/menu.core.js", hash: "6053760f", size: 20564 },
    { path: "/javascript/core/menu.help.js", hash: "fd5380e3", size: 7134 },
    { path: "/javascript/core/pwa.core.js", hash: "551b785c", size: 24317 },
    { path: "/javascript/core/window.core.js", hash: "01d8bbde", size: 8873 },
    // Директория: /javascript/library
    { path: "/javascript/library/anime.esm.min.js", hash: "ef3a1e3c", size: 92254 },
    { path: "/javascript/library/anime.min.js", hash: "281f8cf6", size: 17748 },
    { path: "/javascript/library/embla.esm.js", hash: "2287bf3c", size: 49759 },
    { path: "/javascript/library/hls.esm.js", hash: "09e58f20", size: 386258 },
    { path: "/javascript/library/hls.js", hash: "82cb8ef5", size: 1040662 },
    { path: "/javascript/library/jqery.min.js", hash: "9c4c5226", size: 89664 },
    { path: "/javascript/library/jsyaml.js", hash: "0947f6d6", size: 126046 },
    { path: "/javascript/library/md5.wasm.min.js", hash: "534ca617", size: 10080 },
    { path: "/javascript/library/rxjs.umd.min.js", hash: "7701cca6", size: 88914 },
    { path: "/javascript/library/swiper-bundle.min.js", hash: "633ecc16", size: 143645 },
    { path: "/javascript/library/tmpl.lib.js", hash: "d0a364f4", size: 7551 },
    // Директория: /javascript/modules
    { path: "/javascript/modules/AnimeCard.js", hash: "38b9d59f", size: 6628 },
    { path: "/javascript/modules/api.jikan.js", hash: "f92e0d04", size: 7177 },
    { path: "/javascript/modules/api.kodik.js", hash: "f0075b9f", size: 1488 },
    { path: "/javascript/modules/api.shiki.js", hash: "f5a60dcc", size: 17672 },
    { path: "/javascript/modules/api.tunime.js", hash: "5de095c9", size: 6781 },
    { path: "/javascript/modules/Collection.js", hash: "130a5892", size: 11953 },
    { path: "/javascript/modules/EventTools.js", hash: "99abdfe2", size: 7019 },
    { path: "/javascript/modules/functions.js", hash: "190f522f", size: 18262 },
    { path: "/javascript/modules/Popup.js", hash: "7dd4ec65", size: 1471 },
    { path: "/javascript/modules/Settings.js", hash: "5f42e081", size: 327 },
    { path: "/javascript/modules/TDatabase.js", hash: "d7bece74", size: 9882 },
    { path: "/javascript/modules/TDownload.js", hash: "8ab397d8", size: 50152 },
    { path: "/javascript/modules/tun.cache.js", hash: "b9e8c7d7", size: 4006 },
    { path: "/javascript/modules/tun.notification.js", hash: "5fb32c38", size: 10295 },
    { path: "/javascript/modules/tun.popup.js", hash: "98f5858c", size: 6448 },
    { path: "/javascript/modules/tun.template.js", hash: "f818d667", size: 5289 },
    { path: "/javascript/modules/tun.update.js", hash: "f06f1326", size: 23009 },
    { path: "/javascript/modules/tun.verify.js", hash: "39519389", size: 4385 },
    { path: "/javascript/modules/win.module.js", hash: "c020a605", size: 6836 },
    { path: "/javascript/modules/Windows.js", hash: "c98d1c47", size: 3866 },
    // Директория: /javascript/pages/anime
    { path: "/javascript/pages/anime/default.js", hash: "de1c8507", size: 1429 },
    // Директория: /javascript/pages/downloads
    { path: "/javascript/pages/downloads/mod_manager.js", hash: "a57ec467", size: 19071 },
    { path: "/javascript/pages/downloads/mod_player.js", hash: "c60e89dc", size: 25487 },
    { path: "/javascript/pages/downloads/mod_utils.js", hash: "c3fa4e72", size: 1426 },
    { path: "/javascript/pages/downloads/mod_voice.js", hash: "47c79758", size: 7387 },
    // Директория: /javascript/pages/index
    { path: "/javascript/pages/index/mod_account.js", hash: "18cdde70", size: 3196 },
    { path: "/javascript/pages/index/mod_animes.js", hash: "a150c6fd", size: 4428 },
    { path: "/javascript/pages/index/mod_github.js", hash: "14845ba3", size: 3769 },
    { path: "/javascript/pages/index/mod_history_watch.js", hash: "49d95404", size: 5552 },
    { path: "/javascript/pages/index/mod_notify.js", hash: "6d5cab57", size: 19096 },
    { path: "/javascript/pages/index/mod_trailers.js", hash: "8b8a3efd", size: 12522 },
    { path: "/javascript/pages/index/mod_trailers_animation.js", hash: "4fb6ce54", size: 2092 },
    { path: "/javascript/pages/index/mod_update.js", hash: "03f4256f", size: 30013 },
    { path: "/javascript/pages/index/mod_window.js", hash: "fc9bd881", size: 1521 },
    // Директория: /javascript/pages/list
    { path: "/javascript/pages/list/mod_alist.js", hash: "8ef7c24f", size: 9874 },
    { path: "/javascript/pages/list/mod_carousel.js", hash: "270cc341", size: 2460 },
    { path: "/javascript/pages/list/mod_collections.js", hash: "44a3e2db", size: 19927 },
    { path: "/javascript/pages/list/mod_core.js", hash: "008636a1", size: 10968 },
    { path: "/javascript/pages/list/mod_filter.js", hash: "f6243f8d", size: 3320 },
    { path: "/javascript/pages/list/mod_html.js", hash: "54448d9e", size: 3770 },
    { path: "/javascript/pages/list/mod_search.js", hash: "442026fc", size: 7647 },
    { path: "/javascript/pages/list/mod_ui.js", hash: "3556ba05", size: 3928 },
    { path: "/javascript/pages/list/mod_w_anime.js", hash: "6f93870c", size: 5209 },
    // Директория: /javascript/pages/login
    { path: "/javascript/pages/login/mod.page.js", hash: "e4de02f7", size: 1669 },
    // Директория: /javascript/pages/search
    { path: "/javascript/pages/search/mod_card.js", hash: "2fe98da6", size: 7570 },
    { path: "/javascript/pages/search/mod_genres.js", hash: "e8d693fd", size: 65240 },
    { path: "/javascript/pages/search/mod_history.js", hash: "f1cd9b6e", size: 5067 },
    { path: "/javascript/pages/search/mod_popular.js", hash: "fd1c0bd4", size: 2396 },
    { path: "/javascript/pages/search/mod_search.js", hash: "21b8d36c", size: 20881 },
    { path: "/javascript/pages/search/mod_seasons.js", hash: "4d18a1a6", size: 1833 },
    { path: "/javascript/pages/search/mod_studios.js", hash: "f209ecee", size: 3750 },
    { path: "/javascript/pages/search/mod_voicelist.js", hash: "0af95672", size: 2635 },
    { path: "/javascript/pages/search/mod_w_filter.js", hash: "23ace84f", size: 8305 },
    { path: "/javascript/pages/search/mod_w_genres.js", hash: "88ae7f45", size: 4131 },
    { path: "/javascript/pages/search/mod_w_season.js", hash: "7ff9c79c", size: 7279 },
    // Директория: /javascript/pages/settings
    { path: "/javascript/pages/settings/mod.engine.js", hash: "055d6089", size: 18929 },
    { path: "/javascript/pages/settings/mod.func.js", hash: "0a5a4a65", size: 924 },
    { path: "/javascript/pages/settings/mod.header.js", hash: "42042fef", size: 14736 },
    { path: "/javascript/pages/settings/mod.search.js", hash: "b0280528", size: 2192 },
    { path: "/javascript/pages/settings/mod.selector.js", hash: "ec48b1df", size: 2780 },
    { path: "/javascript/pages/settings/mod.storage.js", hash: "7ae9af10", size: 11716 },
    { path: "/javascript/pages/settings/setup.update.js", hash: "03ea69b4", size: 3034 },
    // Директория: /javascript/pages/tplayer/comps
    { path: "/javascript/pages/tplayer/comps/cps.input.js", hash: "3362a0ac", size: 11318 },
    { path: "/javascript/pages/tplayer/comps/cps.playback.js", hash: "33bb8a53", size: 30799 },
    { path: "/javascript/pages/tplayer/comps/cps.screen.js", hash: "23097bd7", size: 5649 },
    { path: "/javascript/pages/tplayer/comps/cps.system.js", hash: "ff9bf867", size: 4688 },
    { path: "/javascript/pages/tplayer/comps/cps.upscale.js", hash: "99d6c9ea", size: 27240 },
    // Директория: /javascript/pages/tplayer/utils
    { path: "/javascript/pages/tplayer/utils/util.entity.js", hash: "649d3c34", size: 6561 },
    { path: "/javascript/pages/tplayer/utils/util.event.js", hash: "0e45b5a0", size: 3944 },
    { path: "/javascript/pages/tplayer/utils/util.log.js", hash: "65475d6b", size: 10959 },
    // Директория: /javascript/pages/tplayer
    { path: "/javascript/pages/tplayer/mod.api.js", hash: "bb4c5fac", size: 4614 },
    { path: "/javascript/pages/tplayer/mod.errors.js", hash: "89bcd838", size: 6488 },
    { path: "/javascript/pages/tplayer/mod.tplayer.js", hash: "08fde6ec", size: 12338 },
    // Директория: /javascript/pages/user
    { path: "/javascript/pages/user/io.friends.js", hash: "d7452efb", size: 7162 },
    { path: "/javascript/pages/user/mod.achievements.io.js", hash: "5fb8c405", size: 1510 },
    { path: "/javascript/pages/user/mod.achiv.franchises.js", hash: "2c5c4f51", size: 9169 },
    { path: "/javascript/pages/user/mod.anime.win.js", hash: "94594213", size: 9352 },
    { path: "/javascript/pages/user/mod.favorites.js", hash: "069e8bf9", size: 27179 },
    { path: "/javascript/pages/user/mod.friends.js", hash: "5c197c0f", size: 9387 },
    { path: "/javascript/pages/user/mod.friends.win.js", hash: "d522dc39", size: 10888 },
    { path: "/javascript/pages/user/mod.header.js", hash: "c1734bf4", size: 7743 },
    { path: "/javascript/pages/user/mod.history.js", hash: "18b92e86", size: 6485 },
    { path: "/javascript/pages/user/mod.level.js", hash: "bd57d3d1", size: 2358 },
    { path: "/javascript/pages/user/mod.loader.js", hash: "5b674957", size: 5760 },
    { path: "/javascript/pages/user/mod.stats.js", hash: "bdbd82df", size: 1309 },
    { path: "/javascript/pages/user/util.event.js", hash: "0e45b5a0", size: 3944 },
    // Директория: /javascript/pages/watch/utils
    { path: "/javascript/pages/watch/utils/util.event.js", hash: "0e45b5a0", size: 3944 },
    { path: "/javascript/pages/watch/utils/util.scroll.js", hash: "2095edce", size: 1212 },
    // Директория: /javascript/pages/watch
    { path: "/javascript/pages/watch/mod.chronology.js", hash: "f791be39", size: 5873 },
    { path: "/javascript/pages/watch/mod.db.js", hash: "c09599c7", size: 3497 },
    { path: "/javascript/pages/watch/mod.dubs.js", hash: "62ed7026", size: 1494 },
    { path: "/javascript/pages/watch/mod.dubs.win.js", hash: "04fb2866", size: 10865 },
    { path: "/javascript/pages/watch/mod.episode.win.js", hash: "d85e18bf", size: 5087 },
    { path: "/javascript/pages/watch/mod.notifi.js", hash: "7027b3d5", size: 4183 },
    { path: "/javascript/pages/watch/mod.resource.js", hash: "bafd85a0", size: 25790 },
    { path: "/javascript/pages/watch/mod.score.js", hash: "63ae23ba", size: 5716 },
    { path: "/javascript/pages/watch/mod.synch.js", hash: "bd1f52f3", size: 4054 },
    { path: "/javascript/pages/watch/mod.urate.js", hash: "f4444e6a", size: 5309 },
    { path: "/javascript/pages/watch/mod_collection.js", hash: "64415859", size: 9780 },
    { path: "/javascript/pages/watch/mod_download.js", hash: "310b340e", size: 22904 },
    { path: "/javascript/pages/watch/mod_history.js", hash: "e4907d84", size: 4350 },
    { path: "/javascript/pages/watch/mod_player.js", hash: "91522c7b", size: 23564 },
    { path: "/javascript/pages/watch/mod_private.js", hash: "fe33885c", size: 245 },
    { path: "/javascript/pages/watch/mod_transition.js", hash: "f2e80bc7", size: 5138 },
    { path: "/javascript/pages/watch/mod_ui.js", hash: "ffa8af0c", size: 16330 },
    { path: "/javascript/pages/watch/mod_wscore.js", hash: "354322fb", size: 6757 },
    { path: "/javascript/pages/watch/room.guest.client.js", hash: "83214318", size: 11045 },
    { path: "/javascript/pages/watch/room.owner.client.js", hash: "990978de", size: 8842 },
    // Директория: /javascript/pages
    { path: "/javascript/pages/404a.js", hash: "39b75479", size: 1830 },
    { path: "/javascript/pages/downloads.js", hash: "5b0d0b52", size: 3006 },
    { path: "/javascript/pages/index.js", hash: "22437c60", size: 2262 },
    { path: "/javascript/pages/list.js", hash: "5c890db4", size: 486 },
    { path: "/javascript/pages/login.js", hash: "fd345956", size: 4420 },
    { path: "/javascript/pages/player.js", hash: "cb42ed19", size: 5913 },
    { path: "/javascript/pages/search.js", hash: "7471250a", size: 6316 },
    { path: "/javascript/pages/settings.js", hash: "e3939525", size: 26522 },
    { path: "/javascript/pages/tplayer.js", hash: "f20645e8", size: 3983 },
    { path: "/javascript/pages/user.js", hash: "4bf824e6", size: 4919 },
    { path: "/javascript/pages/watch.js", hash: "cdc673ff", size: 8626 },
    // Директория: /javascript/services
    { path: "/javascript/services/dispatcher.js", hash: "2a790095", size: 2334 },
    { path: "/javascript/services/installing.js", hash: "dfe8f97d", size: 465 },
    // Директория: /javascript/utils
    { path: "/javascript/utils/auth.login.js", hash: "d4d0000d", size: 1629 },
    { path: "/javascript/utils/auth.logout.js", hash: "5dc81506", size: 792 },
    // Директория: /javascript/windows/settings
    { path: "/javascript/windows/settings/win.notification.setup.js", hash: "60e97f29", size: 9351 },
    // Директория: /javascript/windows
    { path: "/javascript/windows/win.character.js", hash: "745a693c", size: 28332 },
    { path: "/javascript/windows/win.editor.banner.js", hash: "e2a34749", size: 8300 },
    { path: "/javascript/windows/win.editor.character.js", hash: "e6a5188a", size: 12035 },
    { path: "/javascript/windows/win.notification.js", hash: "40a40e43", size: 6407 },
    { path: "/javascript/windows/win.rooms.create.js", hash: "4de25a74", size: 6149 },
    { path: "/javascript/windows/win.rooms.js", hash: "cbd2df39", size: 11805 },
    { path: "/javascript/windows/win.search.character.js", hash: "fe205e15", size: 11897 },
    // Директория: /javascript
    { path: "/javascript/parametrs.js", hash: "5c5f3319", size: 8225 },
    // Директория: /style/css/min
    { path: "/style/css/min/swiper-bundle.min.css", hash: "ee1a5395", size: 16482 },
    // Директория: /style/css
    { path: "/style/css/downloads.css", hash: "2e417433", size: 38689 },
    { path: "/style/css/index.css", hash: "bee060be", size: 69458 },
    { path: "/style/css/list.css", hash: "36265311", size: 32896 },
    { path: "/style/css/login.css", hash: "7bf0759b", size: 35725 },
    { path: "/style/css/main.css", hash: "a295f8c1", size: 852 },
    { path: "/style/css/notfound.css", hash: "be3e603d", size: 20882 },
    { path: "/style/css/pop.update.css", hash: "b096770e", size: 6138 },
    { path: "/style/css/search.css", hash: "07f62b39", size: 89326 },
    { path: "/style/css/settings.css", hash: "a3dd3ce2", size: 44477 },
    { path: "/style/css/ticons.css", hash: "f21da079", size: 72707 },
    { path: "/style/css/tplayer.css", hash: "3c2ae5d7", size: 23830 },
    { path: "/style/css/user.css", hash: "6863aab9", size: 78959 },
    { path: "/style/css/verify.css", hash: "fdfe046c", size: 7716 },
    { path: "/style/css/watch.css", hash: "58da5676", size: 68643 },
    // Директория: /style/fonts
    { path: "/style/fonts/Inter.ttf", hash: "32204736", size: 804612 },
    { path: "/style/fonts/Manrope.ttf", hash: "cf98436d", size: 164936 },
    { path: "/style/fonts/NovaSquare.ttf", hash: "587aee63", size: 86120 },
    { path: "/style/fonts/RobotoMono.ttf", hash: "fb485e02", size: 181388 },
    // Директория: /style/menu/css
    { path: "/style/menu/css/menu.core.css", hash: "e9414822", size: 9041 },
    // Директория: /style/win/css/setup
    { path: "/style/win/css/setup/win.notification.setup.css", hash: "4d4fc23e", size: 16256 },
    // Директория: /style/win/css
    { path: "/style/win/css/win.character.css", hash: "91a1b97f", size: 20104 },
    { path: "/style/win/css/win.dubs.css", hash: "806ba842", size: 10288 },
    { path: "/style/win/css/win.editor.banner.css", hash: "84818cab", size: 8318 },
    { path: "/style/win/css/win.editor.character.css", hash: "c240565a", size: 7585 },
    { path: "/style/win/css/win.episode.css", hash: "33031f3f", size: 7902 },
    { path: "/style/win/css/win.notification.css", hash: "f49046b5", size: 5156 },
    { path: "/style/win/css/win.rooms.create.css", hash: "364b211f", size: 27355 },
    { path: "/style/win/css/win.rooms.css", hash: "9f3bbe37", size: 11922 },
    { path: "/style/win/css/win.search.character.css", hash: "e0d3b9b0", size: 11190 },
    // Директория: /style/window/win/css
    { path: "/style/window/win/css/win.character.css", hash: "91a1b97f", size: 20104 },
    { path: "/style/window/win/css/win.editor.banner.css", hash: "830fd77b", size: 7148 },
    { path: "/style/window/win/css/win.editor.character.css", hash: "c240565a", size: 7585 },
    { path: "/style/window/win/css/win.search.character.css", hash: "e0d3b9b0", size: 11190 },
    // Директория: /templates/settings
    { path: "/templates/settings/win.notification.setup.tpl", hash: "dd9fdf87", size: 6849 },
    // Директория: /templates
    { path: "/templates/icons.pack.tpl", hash: "ca8d2721", size: 6121 },
    { path: "/templates/pop.update.tpl", hash: "5d12f3a6", size: 1228 },
    { path: "/templates/win.character.tpl", hash: "fda24163", size: 5375 },
    { path: "/templates/win.editor.banner.tpl", hash: "c49ef931", size: 1920 },
    { path: "/templates/win.editor.character.tpl", hash: "fe4742f6", size: 3868 },
    { path: "/templates/win.episode.tpl", hash: "ed1ff119", size: 2189 },
    { path: "/templates/win.notification.tpl", hash: "04b72cdf", size: 3886 },
    { path: "/templates/win.rooms.create.tpl", hash: "d489c41f", size: 4525 },
    { path: "/templates/win.rooms.tpl", hash: "73cd7ed8", size: 8478 },
    { path: "/templates/win.search.character.tpl", hash: "14c6baa2", size: 1774 },
    { path: "/templates/win.verify.tpl", hash: "5c7ea6a1", size: 1506 },
    // Директория: /
    { path: "/404.html", hash: "ca82d9db", size: 2741 },
    { path: "/404a.html", hash: "7b27f708", size: 8806 },
    { path: "/downloads.html", hash: "c6265b5a", size: 19976 },
    { path: "/index.html", hash: "50f75e44", size: 25570 },
    { path: "/list.html", hash: "20b43bdd", size: 24551 },
    { path: "/login.html", hash: "4d094eb8", size: 7130 },
    { path: "/manifest.json", hash: "85d58cdf", size: 874 },
    { path: "/search.html", hash: "eaa636e6", size: 21615 },
    { path: "/settings.html", hash: "2bc78650", size: 13326 },
    { path: "/tplayer.html", hash: "aedc4dfc", size: 21598 },
    { path: "/user.html", hash: "3937591f", size: 27553 },
    { path: "/watch.html", hash: "afacbe77", size: 66820 },
];

const servers = [
    "https://tunime.onrender.com",
    "https://tunime-hujg.onrender.com"
];

const log = console.log.bind(console, `[${version}]:[${hash}] ->`);
const err = console.error.bind(console, `[${version}]:[${hash}] ->`);
const warn = console.warn.bind(console, `[${version}]:[${hash}] ->`);

const worker = self;

const setup = {
    // Дефолтные значения
    defaults: {
        install: {
            channel: 'sw-update',
            activate: true,
            install: true,
            batchSize: 3
        }
        // Добавьте другие параметры здесь
    },

    // Кеш операции
    cache: {
        val: null,
        req: 'settings',
        key: 'pwa-settings',

        get: async function () {
            if (this.val) return this.val;
            try {
                const cache = await caches.open(this.key);
                const response = await cache.match(this.req);
                if (response) {
                    this.val = await response.json();
                    return this.val;
                }
                return null;
            } catch (error) {
                err('error get settings:', error);
                return null;
            }
        },

        set: async function (value) {
            try {
                const cache = await caches.open(this.key);
                const response = new Response(JSON.stringify(value));
                await cache.put(this.req, response);
                this.val = value;
                return true;
            } catch (error) {
                err('error set settings:', error);
                return false;
            }
        },

        clear: async function () {
            try {
                const cache = await caches.open(this.key);
                await cache.delete(this.req);
                this.val = null;
                return true;
            } catch (error) {
                err('error clear settings:', error);
                return false;
            }
        }
    },

    // Получить значение настройки
    getValue: async function (key, customDefault = null) {
        const all = await this.cache.get();
        const storedValue = all && all.hasOwnProperty(key) ? all[key] : null;

        // Используем дефолтные значения из setup.defaults или переданные customDefault
        const defaultValue = customDefault !== null ? customDefault : this.defaults[key] || null;

        if (storedValue === null) {
            return defaultValue;
        }

        if (typeof storedValue === 'object' && storedValue !== null && typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
            return { ...defaultValue, ...storedValue };
        }

        return storedValue;
    },

    // Получить все настройки
    getAll: async function () {
        const stored = await this.cache.get() || {};
        const result = {};

        // Объединяем дефолтные значения с сохраненными
        for (const key in this.defaults) {
            result[key] = await this.getValue(key);
        }

        // Добавляем любые дополнительные настройки, которые не имеют дефолтов
        for (const key in stored) {
            if (!this.defaults.hasOwnProperty(key)) {
                result[key] = stored[key];
            }
        }

        return result;
    },

    // Получить дефолтные значения
    getDefaults: function () {
        return { ...this.defaults };
    },

    // Установить значение настройки
    setValue: async function (key, value) {
        const current = await this.cache.get() || {};
        current[key] = value;
        return await this.cache.set(current);
    },

    // Обновить настройки (глубокое слияние)
    update: async function (updates) {
        const current = await this.cache.get() || {};

        const merge = (target, source) => {
            return Object.keys(source).reduce((result, key) => {
                result[key] = source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
                    ? merge(target[key] || {}, source[key])
                    : source[key];
                return result;
            }, { ...target });
        };

        return await this.cache.set(merge(current, updates));
    },

    // Сброс к дефолтным значениям
    reset: async function () {
        await this.cache.set(this.defaults);
        return await this.getAll();
    }
};

/**
 * Манифест установленных файлов: { [path]: hash }
 * Хранится в кеше настроек (pwa-settings), который переживает activate-очистку.
 * По нему определяем, какие файлы можно перенести из старого кеша.
 */
const manifest = {
    req: 'files-manifest',

    get: async function () {
        try {
            const cache = await caches.open(setup.cache.key);
            const response = await cache.match(this.req);
            return response ? await response.json() : null;
        } catch (error) {
            err('error get manifest:', error);
            return null;
        }
    },

    set: async function (files) {
        try {
            const map = {};
            for (const f of files) map[f.path] = f.hash;
            const cache = await caches.open(setup.cache.key);
            await cache.put(this.req, new Response(JSON.stringify(map)));
            return true;
        } catch (error) {
            err('error set manifest:', error);
            return false;
        }
    },

    clear: async function () {
        try {
            const cache = await caches.open(setup.cache.key);
            await cache.delete(this.req);
            return true;
        } catch (error) {
            return false;
        }
    }
};

/**
 * Оценивает объём предстоящей загрузки: сколько файлов/байт придётся скачать,
 * а сколько можно перенести из старого кеша (hash совпадает и файл реально в кеше).
 * @param {Array<{path:string, hash:string, size:number}>} files
 */
async function estimateDownload(files) {
    const total = files.length;
    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

    let downloadCount = 0;
    let downloadSize = 0;

    try {
        const oldManifest = await manifest.get() || {};

        // Множество путей, реально лежащих в старых кешах приложения
        const names = await caches.keys();
        const cachedPaths = new Set();
        for (const name of names) {
            if (!name.startsWith(cachePrefix) || name === cacheName) continue;
            const cache = await caches.open(name);
            for (const request of await cache.keys()) {
                cachedPaths.add(new URL(request.url).pathname);
            }
        }

        for (const file of files) {
            const reusable = oldManifest[file.path] === file.hash && cachedPaths.has(file.path);
            if (!reusable) {
                downloadCount++;
                downloadSize += file.size || 0;
            }
        }
    } catch (error) {
        // При ошибке считаем, что качать придётся всё
        err('estimate error:', error);
        downloadCount = total;
        downloadSize = totalSize;
    }

    return {
        total,
        totalSize,
        downloadCount,
        downloadSize,
        downloadMB: +(downloadSize / 1024 / 1024).toFixed(2),
        reuseCount: total - downloadCount,
        reuseSize: totalSize - downloadSize
    };
}

const session = {
    // Проверить, была ли установка отклонена в текущем сеансе
    isInstallationRejectedInSession: async function () {
        const current = await setup.cache.get() || {};
        const sessionId = current.currentSessionId;
        const rejectedInSession = current.rejectedInSession;

        // Если нет sessionId, значит сессия еще не синхронизирована
        if (!sessionId) {
            return false;
        }

        return rejectedInSession === sessionId;
    },

    // Отметить установку как отклоненную в текущем сеансе
    markInstallationRejectedInSession: async function () {
        const current = await setup.cache.get() || {};
        const sessionId = current.currentSessionId;

        // Если нет sessionId, не можем отметить отклонение
        if (!sessionId) {
            warn('Cannot mark installation as rejected: no session ID');
            return false;
        }

        current.rejectedInSession = sessionId;
        return await setup.cache.set(current);
    },

    // Очистить отклонение (для принудительного сброса)
    clearRejection: async function () {
        const current = await setup.cache.get() || {};
        delete current.rejectedInSession;
        return await setup.cache.set(current);
    },

    // Установить sessionId (вызывается из основного потока)
    setSessionId: async function (sessionId) {
        const current = await setup.cache.get() || {};
        current.currentSessionId = sessionId;
        return await setup.cache.set(current);
    },

    // Получить текущий sessionId
    getCurrentSessionId: async function () {
        const current = await setup.cache.get() || {};
        return current.currentSessionId;
    }
}

worker.addEventListener('install', (event) => {
    /**
     * Запрашивает разрешение на установку
     * @param {BroadcastChannel} channel
     * @param {object} estimate - оценка загрузки из estimateDownload()
     * @returns {Promise<boolean>}
     */
    const requestInstallPermission = (channel, estimate) => {
        return new Promise((resolve, reject) => {
            const end = (bool) => {
                channel.removeEventListener('message', listener);
                if (bool) {
                    return resolve(bool);
                } else {
                    return reject(new Error('Installation rejected by user'));
                }
            }

            const listener = (event) => {
                switch (event.data.type) {
                    case 'INSTALL_APPROVED':
                        end(true);
                        break;
                    case 'INSTALL_REJECTED':
                        session.markInstallationRejectedInSession().then(() => {
                            log('Installation rejected for current session');
                            end(false);
                        });
                        break;
                    case 'INSTALL_RECEIVED':
                        clearTimeout(timer);
                        break;
                }
            }

            channel.addEventListener('message', listener);

            const timer = setTimeout(() => {
                end(true);
            }, 1000);

            channel.postMessage({
                type: 'INSTALL_PERMISSION_REQUEST',
                payload: { version, hash, cacheName, ...estimate }
            });
        });
    }

    event.waitUntil(
        setup.getValue('install').then(async (s) => {
            // Проверяем, была ли установка отклонена в текущем сеансе
            const isRejectedInSession = await session.isInstallationRejectedInSession();
            if (isRejectedInSession) {
                throw new Error('Installation was rejected');
            }

            const broadcast = new BroadcastChannel(s.channel);

            // Оценка: сколько реально нужно скачать, а сколько перенесётся из кеша
            const estimate = await estimateDownload(appShellFilesToCache);

            if (!s.install) {
                await requestInstallPermission(broadcast, estimate);
            }

            await setup.update({ 'source': 'worker' });

            broadcast.postMessage({
                type: 'NEW_VERSION',
                payload: { version, hash, cacheName, ...estimate }
            });

            await caching(appShellFilesToCache, s);

            if (s.activate) {
                worker.skipWaiting();
            }
        })
    );
});

worker.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        await worker.clients.claim();

        const names = await caches.keys();

        await Promise.all(
            names.map(name => {
                if (name !== cacheName && name !== setup.cache.key) {
                    return caches.delete(name);
                }
            })
        );

        log('worker activated.');
    })());
});

/**
 * Инкрементальное кеширование.
 * Файл с совпадающим hash переносится из старого кеша (без сети),
 * изменённый или новый — скачивается.
 * @param {Array<{path:string, hash:string, size:number}>} filesToCache
 */
async function caching(filesToCache, { channel, batchSize }) {
    const broadcast = new BroadcastChannel(channel);
    try {
        const cache = await caches.open(cacheName);
        const total = filesToCache.length;
        const totalSize = filesToCache.reduce((sum, f) => sum + (f.size || 0), 0);
        let processed = 0;
        let reusedCount = 0;
        let downloadedCount = 0;
        let downloadedSize = 0;

        if (total === 0) {
            warn('no files to cache.');
            return;
        }

        // Манифест предыдущей установки: { path: hash }
        const oldManifest = await manifest.get() || {};

        // Открываем старые кеши приложения (кроме текущего)
        const names = await caches.keys();
        const oldCaches = await Promise.all(
            names
                .filter(name => name.startsWith(cachePrefix) && name !== cacheName)
                .map(name => caches.open(name))
        );

        const fromOldCaches = async (path) => {
            for (const oldCache of oldCaches) {
                const response = await oldCache.match(path);
                if (response) return response;
            }
            return null;
        };

        log(`caching ${total} files, ~${(totalSize / 1024 / 1024).toFixed(2)} MB (old caches: ${oldCaches.length}).`);

        const batch = async (files) => {
            const batchPromises = files.map(async (file) => {
                let success = true;
                let reused = false;
                try {
                    // hash не изменился — пробуем перенести из старого кеша
                    if (oldManifest[file.path] === file.hash) {
                        const old = await fromOldCaches(file.path);
                        if (old) {
                            await cache.put(file.path, old);
                            reused = true;
                            reusedCount++;
                        }
                    }

                    // изменён, новый или не найден в старом кеше — качаем
                    if (!reused) {
                        await cache.add(file.path);
                        downloadedCount++;
                        downloadedSize += file.size || 0;
                    }
                } catch (error) {
                    success = false;
                    err(`!failed to cache ${file.path}`, error);
                }

                processed++;
                const percent = ((processed / total) * 100).toFixed(2);
                broadcast.postMessage({
                    type: 'CACHE_PROGRESS',
                    payload: { total, processed, percent, file: file.path, size: file.size, success, reused }
                });

                return { file: file.path, success, reused };
            });
            await Promise.allSettled(batchPromises);
        };

        // Разбиваем файлы на батчи
        for (let i = 0; i < total; i += batchSize) {
            const batchFiles = filesToCache.slice(i, i + batchSize);
            await batch(batchFiles);
        }

        // Сохраняем манифест новой версии
        await manifest.set(filesToCache);

        log(`caching complete! reused: ${reusedCount}, downloaded: ${downloadedCount} (~${(downloadedSize / 1024 / 1024).toFixed(2)} MB).`);
        broadcast.postMessage({
            type: 'CACHE_COMPLETE',
            payload: { version, cacheName, reused: reusedCount, downloaded: downloadedCount, downloadedSize }
        });
    } catch (error) {
        err('!failed start caching!:', error);
        broadcast.postMessage({ type: 'CACHE_ERROR', payload: { error: error.message } });
    }
}

(() => {
    worker.addEventListener('fetch', event => {
        const url = new URL(event.request.url);

        // игнорировать чужие домены
        if (url.origin !== self.location.origin && !servers.includes(url.origin)) {
            return;
        }

        event.respondWith(handleRequest(event.request));
    });

    const handleRequest = async (request) => {
        const url = new URL(request.url);

        try {
            if (servers.some(s => url.href.startsWith(s))) {
                return fetch(new Request(request, {
                    headers: new Headers({
                        ...Object.fromEntries(request.headers),
                        Authorization: (request.headers.get('Authorization') || '') + version
                    })
                }));
            }

            if (url.pathname.startsWith('/javascript/pages/anime/')) {
                const response = await fetch(request);
                if (response.status !== 404) return response;

                return fetch('/javascript/pages/anime/default.js');
            }

            const cached = await caches.match(request);
            if (cached) return cached;

            if (url.pathname === "/") {
                return (await caches.match('/index.html')) || fetch(request);
            }

            return (await caches.match(url.pathname)) || fetch(request);

        } catch (e) {
            warn(`fetch error ${e}`);
            return fetch(request);
        }
    }
})(log('fetch event support enabled'));

(() => {
    const defaults = {
        title: 'Tunime',
        icon: '/images/icons/logo-x512-b.png',
        url: '/'
    };

    // Маппинг типов уведомлений на URL
    const routes = {
        co_watch_invite: (d) => `/watch.html?id=${d.animeId}&room=${d.roomId}`,
        new_episode: (d) => `/watch.html?id=${d.animeId}`,
    };

    /**
     * Безопасный парсинг данных push-события
     * @param {PushEvent} event
     * @returns {object|null}
     */
    const parsePushData = (event) => {
        if (!event.data) return null;
        try {
            return event.data.json();
        } catch {
            const text = event.data.text();
            return text ? { body: text } : null;
        }
    };

    /**
     * Определяет URL перехода по payload
     * @param {object} payload
     * @returns {string}
     */
    const resolveUrl = (payload) => {
        const inner = payload.data || {};
        if (payload.url) return payload.url;
        if (inner.type && routes[inner.type]) return routes[inner.type](inner);
        return defaults.url;
    };


    worker.addEventListener('push', (event) => {
        const data = parsePushData(event);

        if (!data) {
            warn('push: empty or invalid payload');
            return;
        }

        const options = {
            body: data.body || '',
            icon: data.icon || defaults.icon,
            badge: data.badge,
            image: data.image,
            tag: data.tag,
            silent: !!data.silent,
            data: {
                url: resolveUrl(data),
                payload: data.data || {}
            }
        };

        event.waitUntil(
            worker.registration.showNotification(data.title || defaults.title, options)
        );
    });

    worker.addEventListener('notificationclick', (event) => {
        event.notification.close();

        const { url, payload } = event.notification.data || {};
        const targetUrl = url || defaults.url;
        const message = { url: targetUrl, ...payload };

        event.waitUntil((async () => {

            const windowClients = await clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            });

            // Ищем вкладку именно нашего приложения
            const client = windowClients.find(c =>
                new URL(c.url).origin === self.location.origin &&
                c.frameType === 'top-level'
            );

            if (client) {
                await client.focus();
                // Открытая вкладка сама решает, что делать (роутинг без перезагрузки)
                client.postMessage({
                    type: 'PUSH_NOTIFICATION_CLICK',
                    payload: message
                });
                return;
            }

            // Подстраховка для iOS: сохраняем клик, страница заберёт его
            // через PUSH_PENDING при старте (openWindow на iOS игнорирует url)
            await setup.setValue('pushPending', message);
            return clients.openWindow(targetUrl);
        })());
    });
})(log('notification enabled'));

(() => {
    const methods = {
        'ACTIVATE': () => {
            worker.skipWaiting();
            return { complete: true };
        },
        'META': async () => {
            const source = await setup.getValue('source', 'worker');
            return { version, hash, source };
        },
        'SETUP': async (payload) => {
            if (!payload || typeof payload !== 'object') {
                return { error: 'Invalid payload' };
            }
            await setup.update(payload);
            return { value: await setup.getAll() };
        },
        'SETUP_CLEAR': async () => {
            await setup.setValue('install', setup.defaults.install);
            return { complete: true };
        },
        'GET_SETUP': async ({ key = 'install', defaultValue = null }) => {
            return setup.getValue(key, defaultValue);
        },
        'GET_DEFAULTS': () => {
            return setup.getDefaults();
        },
        'NEW_SESSION': async (payload) => {
            if (!payload || typeof payload !== "string") {
                return { error: 'Invalid payload' };
            }
            await session.setSessionId(payload);
        },
        'RECACHE': async (payload) => {
            if (!payload?.channel) return { error: 'channel unset' };

            new BroadcastChannel(payload.channel).postMessage({
                type: 'NEW_VERSION',
                payload: { version, hash, cacheName }
            });

            // Полная перезакачка: удаляем кеш и манифест,
            // чтобы caching() не пытался переносить старые файлы
            await caches.delete(cacheName);
            await manifest.clear();

            const settings = await setup.getValue('install');

            caching(appShellFilesToCache, { ...settings, ...payload });
            return { process: true };
        },
        'PUSH_PENDING': async () => {
            const value = await setup.getValue('pushPending');
            if (value) await setup.setValue('pushPending', null);
            return value || null;
        },
    }

    worker.addEventListener('message', async ({ source: client, data }) => {
        const { type, payload } = data;

        if (!methods[type])
            return client.postMessage(JSON.stringify({ type }));
        const value = await methods[type](payload);

        client.postMessage(JSON.stringify({ type, payload: value }));
    });
})(log('message system ready'));