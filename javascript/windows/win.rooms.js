import { OAuth } from "../core/main.core.js";
import { TWindow } from "../core/window.core.js";
import { Users } from "../modules/api.shiki.js";
import { Tunime } from "../modules/api.tunime.js";
import { Sleep } from "../modules/functions.js";
import { Popup } from "../modules/tun.popup.js";
import { Template } from "../modules/tun.template.js"
import { WindowIntercator } from "../modules/win.module.js";
import { $ID, Player } from "../pages/watch.js";

const config = {
    tpl: 'win.rooms.tpl',
    css: 'win.rooms.css',
    ell: '.window-rooms',
    /**@type {TWindow} */
    win: null
}

const usersMap = new Map();
const roomsMap = new Map();

let isConnect = false;

export function WRooms({ dom = 'body' } = {}) {
    if (config.win) return config.win.show();


    return new Promise(async (resolve) => {
        /**@type {HTMLDivElement} */
        const $dom = await (async () => {
            $(dom).append((await Template(config.tpl)).css(config.css, '/style/win/css').text());
            return $(config.ell)[0];
        })();

        let loadedOnce = false;
        let lastFetchAt = 0;
        const STALE_MS = 10_000;

        const refreshRooms = async (force = false) => {
            const now = Date.now();
            if (!force && loadedOnce && (now - lastFetchAt) < STALE_MS) return;

            lastFetchAt = now;

            const { complete, parsed, value } = await Tunime.rooms.list($ID);
            if (!complete || !parsed) return;

            const tplCard = $dom.querySelector('#room-card-template');
            const tplEmpty = $dom.querySelector('#room-card-empty');
            const host = $dom.querySelector('.rooms-grid-list');

            host.innerHTML = '';
            roomsMap.clear();

            UIRooms(value.data, {
                tplCard, tplEmpty, host,
                onOwnerLoaded: () => applyRoomFilter(searchQuery)
            });
            loadedOnce = true;

            applyRoomFilter(searchQuery); // чтобы фильтр применялся после перерендера
        }

        let searchQuery = '';

        const applyRoomFilter = (query = '') => {
            const q = query.trim().toLowerCase();
            const cards = $dom.querySelectorAll('.rooms-grid-list .room-card');

            cards.forEach((card) => {
                const owner = (card.dataset.ownerName || '').toLowerCase();
                card.style.display = !q || owner.includes(q) ? '' : 'none';
            });
        };


        const createRoom = async () => {
            if (isConnect) return new Popup('wss', 'Сначало надо отключится.', 301);

            const { WUsers } = await import('./win.rooms.create.js');

            WUsers({
                oncreate: (ids, access, { canPause, canMembers }) => {
                    Tunime.rooms.create($ID, {
                        access,
                        friendIds: [...ids.keys()],
                        kodikId: Player.selected.id,
                        episode: Player.CEpisodes.selected,
                        canPause, canMembers
                    }).then(async (response) => {
                        if (!response.complete || !response.parsed)
                            return new Popup('wss', 'Не удалось создать комнату', 301);

                        const { RoomOwner } = await import("../pages/watch/room.owner.client.js");

                        RoomOwner({
                            wsUrl: response.value.data.wsUrl, usersMap: ids,
                            onopen: () => {
                                config.win.hide();
                                new Popup('wss', 'Комната создана');
                                isConnect = true;
                            },
                            onclose: () => {
                                isConnect = false;
                            }
                        });
                    })
                }
            });
        }

        config.win = new TWindow({
            oninit: () => {
                const $bar = $dom.querySelector('.window-bar');
                const $wrapper = $dom.querySelector('.rooms-search-wrapper');

                $wrapper.querySelector('.btn-new').addEventListener('click', () => {
                    createRoom();
                });

                $wrapper.querySelector('input').addEventListener('input', (e) => {
                    searchQuery = e.currentTarget.value || '';
                    applyRoomFilter(searchQuery);
                })

                $bar.querySelector('.window-close').addEventListener('click', () => {
                    config.win.hide();
                });

                ((lastFetchAt = 0) => {
                    const STALE_MS = 30_000;
                    const btnReload = $wrapper.querySelector('.btn-reload');

                    btnReload.addEventListener('click', () => {
                        const now = Date.now();
                        if ((now - lastFetchAt) < STALE_MS) {
                            const remaining = Math.ceil((STALE_MS - (now - lastFetchAt)) / 1000);
                            return ReloadTimer(btnReload, remaining);
                        }
                        lastFetchAt = now;
                        refreshRooms(true);
                        ReloadTimer(btnReload, 30);
                    });
                })();
            },
            onshow: () => {
                refreshRooms();
            }
        }, config.ell);

        refreshRooms().then(() => {
            config.win.show();
        });

        config.win.module.add(WindowIntercator);
    });
};

let intervalId = null;

function ReloadTimer(btn, seconds) {
    btn.classList.add('-timer');
    const timer = btn.querySelector('.timer');
    timer.textContent = seconds;
    clearInterval(intervalId);

    intervalId = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
            clearInterval(intervalId);
            intervalId = null;
            btn.classList.remove('-timer');
            timer.textContent = '';
        } else {
            timer.textContent = seconds;
        }
    }, 1000);
}


function UIRooms(data, { tplCard, tplEmpty, host, debug = false, onOwnerLoaded = () => { } } = {}) {
    const getUser = async (id) => {
        const response = await Users.info(id).GET();

        if (response.failed) {
            if (response.status === 426) {
                await Sleep(1000);
                return getUser(id);
            }
            return undefined;
        }

        return response;
    }

    const pluralRu = (n, one, few, many) => {
        n = Math.abs(n) % 100;
        const n1 = n % 10;

        if (n >= 11 && n <= 19) return many;
        if (n1 === 1) return one;
        if (n1 >= 2 && n1 <= 4) return few;
        return many;
    }

    const formatTime = (ms) => {
        ms = Math.max(0, Number(ms) || 0);

        const totalSeconds = Math.floor(ms / 1000);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours} ${pluralRu(hours, 'час', 'часа', 'часов')}`;
        }
        if (minutes > 0) {
            return `${minutes} ${pluralRu(minutes, 'минута', 'минуты', 'минут')}`;
        }
        if (seconds > 0) {
            return `${seconds} ${pluralRu(seconds, 'секунда', 'секунды', 'секунд')}`;
        }

        return '0 секунд';
    }

    const now = Date.now();

    if (!data || data.length === 0) {
        /**@type {HTMLTemplateElement} Копированный шаблон */
        const fragment = tplEmpty.content.cloneNode(true);
        host.append(fragment);
    }

    for (const room of data) {
        if (!room) continue;

        if (debug) console.log('Room info:', room);

        /**@type {HTMLTemplateElement} Копированный шаблон */
        const fragment = tplCard.content.cloneNode(true);
        /**@type {HTMLDivElement} Редактируеммый элемент */
        const root = fragment.firstElementChild;

        root.setAttribute('data-id', room.id);

        /**Установка пользователя */
        (async (id) => {
            let user = usersMap.get(id);

            if (user instanceof Promise) {
                user = await user;
            }

            if (!user) {
                const promise = getUser(id);
                usersMap.set(id, promise)
                user = await promise;
                usersMap.set(id, { nickname: user.nickname, image: { 'x64': user.image['x64'] } });
            }

            if (debug) console.log(user);

            return user;
        })(room.ownerId).then(({ nickname, image: { x64 } }) => {
            root.querySelector('[data-field="name"]').textContent = nickname;
            root.querySelector('[data-field="image"]').style.setProperty('--img', `url(${x64})`);
            root.dataset.ownerName = (nickname || '').toLowerCase();
            onOwnerLoaded();
        });

        const player = Player.results.get(room.kodikId);
        if (debug) console.log('Room Player info', player);

        root.querySelector('[data-field="voice"]').textContent = player.translation.title;
        root.querySelector('[data-field="episode"]').textContent = `${room.episode} из ${player.last_episode}`;

        root.querySelector('[data-field="type"]').textContent = room.acess === "friends" ? "Ограниченный доступ" : "Свободный доступ";
        root.querySelector('[data-field="members"]').textContent = room.members;
        root.querySelector('[data-field="await"]').textContent = room.wait.length;
        root.querySelector('[data-field="livetime"]').textContent = formatTime(now - room.createdAt);

        roomsMap.set(room.id, room);
        host.append(fragment);

        root.addEventListener('click', (e) => {
            const btn = e.target.closest('.room-connect-btn');
            if (!btn || !host.contains(btn)) return;

            if (isConnect) return new Popup('wss', 'Сначало надо отключится.', 301);

            if (room.acess !== "public" && !room.wait.includes(`${OAuth.user.id}`))
                return new Popup('wss', 'Нет доступа', 301);

            Tunime.rooms.join(room.id).then(async (response) => {
                if (!response.complete || !response.parsed) {
                    if (response.status === 404) {
                        return new Popup('wss', 'Комната не существует', 301);
                    }
                    return new Popup('wss', 'Не удалось войти', 301);
                }

                const { RoomGuest } = await import("../pages/watch/room.guest.client.js");
                
                RoomGuest({
                    wsUrl: response.value.data.wsUrl,
                    onopen: () => {
                        isConnect = true;
                        new Popup('wss', 'Присоединился в комнату');
                        config.win.hide();
                    },
                    onclose: () => {
                        isConnect = false;
                    }
                });
            });
        });
    }

    if (debug) console.log('Rooms: ', roomsMap);
}