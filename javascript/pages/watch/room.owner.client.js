import { Users } from "../../modules/api.shiki.js";
import { Sleep } from "../../modules/functions.js";
import { Popup } from "../../modules/tun.popup.js";
import { Player } from "../watch.js";

/**
 * Контекст комнаты — всё, что нужно функциям работать с одним ws и общим состоянием.
 * @typedef {Object} ctx
 * @property {WebSocket} ws
 * @property {typeof Player} Player
 * @property {boolean} vPaused
 * @property {ReturnType<typeof setInterval> | null} vTimer
 * @property {number} vTickMS
 * @property {{member_joined: () => {}, member_left: () => {}, init: () => {}}} user
 */

/**
 * @typedef {'tick' | 'seek' | 'episode_switch' | 'voice_switch' | 'pause_request' | 'sync_request'} wsTypes
 */

/**
 * @typedef {Object} WsPayloadMap
 * @property {{ t:number, p:boolean }} tick
 * @property {{ t:number, p:boolean }} seek
 * @property {{ episode:number }} episode_switch
 * @property {{ kodikId:string }} voice_switch
 * @property {{ }} pause_request
 * @property {{ }} sync_request
 */

// ============================================================================
// 1) WS helpers — отдельные функции, но работают с тем же ws через ctx
// ============================================================================

/**
 * @template {wsTypes} T
 * @param {T} type 
 * @param {WsPayloadMap[T]} [payload] 
 */
function send(ctx, type, payload = {}) {
    if (ctx.ws.readyState !== WebSocket.OPEN) return;
    ctx.ws.send(JSON.stringify({ type, ...payload }));
}

// ============================================================================
// 2) Sync helpers — отдельные функции, общий доступ к paused/timer через ctx
// ============================================================================

function Tick(ctx) {
    return {
        on: function () { this.off(); ctx.vTimer = this.__interval() },
        off: () => { clearInterval(ctx.vTimer); ctx.vTimer = null; },
        time: () => { ctx.Player.PControl.Exec("get_time") },
        __interval: function () { return setInterval(() => this.time(), ctx.vTickMS) }
    }
}

function VUsers(ctx, usersMap = new Map()) {
    const getUserInfo = async (uid) => {
        const fetch = async () => {
            const response = await Users.info(uid).GET();
            if (response.failed) {
                if (response.status === 426) {
                    await Sleep(1000);
                    return await fetch();
                }
                return null;
            }
            return {
                id: response.id,
                image: response.image['x64'],
                nickname: response.nickname
            }
        }
        if (!uid) return null;

        if (usersMap.has(uid)) {
            return usersMap.get(uid);
        }

        const userInfo = await fetch();
        if (userInfo) usersMap.set(uid, userInfo);
        return userInfo;
    };

    const dom = {
        ui: document.querySelector('.room-controller-wrapper'),
        usersList: document.querySelector('.users-image-wrapper'),
        userCount: document.querySelector('.users-count-text'),
        btn: document.querySelector('.room-info-content-wrapper > .btn-disconnect')
    }

    let set = new Set();

    const update = async () => {
        dom.userCount.textContent = `${set.size}`;

        if (set.size <= 4) {
            dom.usersList.innerHTML = '';
            set.forEach(async (uid) => {
                const userInfo = await getUserInfo(uid);
                if (!userInfo) return;
                const userElement = document.createElement('span');
                userElement.classList.add('user-image');
                userElement.style.setProperty('--img', `url(${userInfo.image})`);
                userElement.setAttribute('data-uid', userInfo.id);
                dom.usersList.append(userElement);
            });
        } else {
            dom.usersList.innerHTML = '';
            dom.usersList.classList.add('-many');
        }
    }

    return {
        member_joined: async (uid) => {
            const userInfo = await getUserInfo(uid);
            if (!userInfo) return;
            set.add(uid);
            update();
            new Popup('member_joined', `Пользователь ${userInfo.nickname} присоединился`);
            // обновить UI/список участников
        },

        member_left: (uid) => {
            const userInfo = usersMap.get(uid);
            if (!userInfo) return;
            set.delete(uid);
            update();
            new Popup('member_left', `Пользователь ${userInfo.nickname} отключился`);
            // обновить UI/список участников
        },

        init: async (members = []) => {
            set = new Set(members);

            update();

            dom.ui.classList.remove('-hide');

            ctx.ws.addEventListener('close', () => {
                new Popup('room_closed', 'Комната была закрыта');
                dom.ui.classList.add('-hide');
            });

            dom.btn.addEventListener('click', () => {
                ctx.ws.close();
            });
        }
    }
}

// ============================================================================
// 3) Player bindings — отдельно, легко добавлять новые события
// ============================================================================

/**
 * Подключение событий на плеер
 * @param {ctx} ctx 
 */
function VEvents(ctx) {
    const tick = Tick(ctx);
    const player = ctx.Player.CMessage;
    const episodes = ctx.Player.CEpisodes;
    const voice = ctx.Player.CTranslation;

    const offSEvents = [
        player.on("time", ({ value }) => {
            send(ctx, 'tick', { t: value, p: ctx.vPaused });
        }),

        player.on("pause", () => {
            ctx.vPaused = true;
            tick.time();
            tick.off();
        }),

        player.on("play", () => {
            ctx.vPaused = false;
            tick.time();
            tick.on();
        }),

        player.on("seek", ({ value: { time } }) => {
            send(ctx, "seek", { t: time });
        }),

        player.on("skip_button", () => {
            tick.time();
        }),

        episodes.on("selected", ({ episode, user_handler }) => {
            if (!user_handler) return;
            ctx.vPaused = true;
            tick.off();
            send(ctx, "episode_switch", { episode });
        }),

        voice.on("selected", () => {
            ctx.vPaused = true;
            tick.off();
            send(ctx, "voice_switch", { kodikId: ctx.Player.selected.id });
        })
    ];

    ctx.ws.addEventListener("close", () => {
        offSEvents.forEach(off => off());
        tick.off();
    });
}

// ============================================================================
// 4) Server messages
// ============================================================================

function SEvents(ctx) {
    const handlers = {
        room_setup: ({ members = [], canPause, episode }) => {
            ctx.user.init(members);
        },
        pause_request: () => {
            ctx.vPaused = true;
            ctx.Player.PControl.Exec("pause");
        },
        member_joined: ({ uid }) => {
            ctx.user.member_joined(uid);
        },
        member_left: ({ uid }) => {
            ctx.user.member_left(uid);
        }
    };

    const onMessage = (event) => {
        let msg;
        try {
            msg = JSON.parse(event.data);
        } catch {
            return;
        }

        const handler = handlers[msg.type];
        if (!handler) return;
        handler(msg);
    };

    ctx.ws.addEventListener("message", onMessage);
    return () => ctx.ws.removeEventListener("message", onMessage);
}


export const RoomOwner = ({ wsUrl, usersMap, onopen = () => {}, onclose = () => {} } = {}) => {
    const ws = new WebSocket(wsUrl);

    /**@type {ctx} */
    const ctx = {
        ws, Player,
        vPaused: true,
        vTimer: null,
        vTickMS: 2000
    };

    ctx.user = VUsers(ctx, usersMap);

    VEvents(ctx);
    const offSEvents = SEvents(ctx);

    ws.addEventListener("open", () => {
        onopen();
    });

    ws.addEventListener("close", () => {
        offSEvents();
        clearInterval(ctx.vTimer);
        onclose();
    });
}