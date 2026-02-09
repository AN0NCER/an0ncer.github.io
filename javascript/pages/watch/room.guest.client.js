import { Private } from "./mod_private.js";
import { Player } from "../watch.js";
import { Users } from "../../modules/api.shiki.js";
import { Popup } from "../../modules/tun.popup.js";

/**
 * Контекст комнаты — всё, что нужно функциям работать с одним ws и общим состоянием.
 * @typedef {Object} ctx
 * @property {WebSocket} ws
 * @property {typeof Player} Player
 * @property {boolean} vPaused
 * @property {{pause: boolean}} config
 * @property {{getTime: () => Promise<number>}} controll
 * @property {{t:number,p:boolean,ts:number,v:number}} state
 * @property {{member_joined: () => {}, member_left: () => {}, init: () => {}}} user
 * @property {{isInkognito: boolean, selectedEpisode: number, selectedTranslation: string}} saveUserSession
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

/**@param {ctx} ctx  */
function VideoTime(ctx) {
    /**@type {Set<resolve>} */
    const task = new Set();
    let process = false;

    ctx.Player.CMessage.on("time", ({ value }) => {
        for (const resolve of task) resolve(value);
        task.clear();

        process = false;
    });

    return {
        getTime: async function () {
            return new Promise((resolve) => {
                task.add(resolve);

                if (process) return;
                ctx.Player.PControl.Exec("get_time");
            })
        }
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
        member_joined: async function (uid) {
            const userInfo = await getUserInfo(uid);
            if (!userInfo) return;
            set.add(uid);
            update();
            new Popup('member_joined', `Пользователь ${userInfo.nickname} присоединился`);
        },
        member_left: async function (uid) {
            const userInfo = usersMap.get(uid);
            if (!userInfo) return;
            set.delete(uid);
            update();
            new Popup('member_left', `Пользователь ${userInfo.nickname} отключился`);
        },
        init: async function (members = []) {
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
// 2) Player bindings — отдельно, легко добавлять новые события
// ============================================================================

/**
 * Подключение событий на плеер
 * @param {ctx} ctx 
 */
function VEvents(ctx) {
    const player = ctx.Player.CMessage;

    const offSEvents = [
        player.on("play", () => {
            ctx.vPaused = false;
            if (ctx.state.p) {
                ctx.Player.PControl.Exec("pause");
            }
        }),

        player.on("pause", () => {
            ctx.vPaused = true;
            if (!ctx.state.p) {
                ctx.Player.PControl.Exec("play");
                if (ctx.config.pause) {
                    send(ctx, 'pause_request');
                }
            }
        })
    ];

    ctx.ws.addEventListener("close", () => {
        offSEvents.forEach(off => off());
    });
}

// ============================================================================
// 4) Server messages
// ============================================================================

/**@param {ctx} ctx  */
function SEvents(ctx) {
    const handlers = {
        room_setup: ({ kodikId, canPause, episode, members }) => {
            ctx.saveUserSession = {
                isInkognito: Private.INCOGNITO,
                selectedEpisode: Player.CEpisodes.selected,
                selectedTranslation: Player.CTranslation.id
            };

            ctx.user.init(members);

            ctx.Player.isOwner = false;

            if (!ctx.param.save) {
                Private.INCOGNITO = true;
            }

            ctx.config.pause = canPause;

            ctx.Player.CEpisodes.Select(episode);

            if (ctx.Player.selected.id !== kodikId) {
                ctx.Player.CTranslation.Select({
                    id: ctx.Player.results.get(kodikId).translation.id,
                    user_handler: true
                });
            } else {
                ctx.Player.Load();
            }
        },

        tick: async (state) => {
            let { t, p, ts, v } = state;
            if (v <= ctx.state.v) return;
            ctx.state = state;

            if (p && !ctx.vPaused) {
                ctx.Player.PControl.Exec("pause");
            } else if (!p && ctx.vPaused) {
                ctx.Player.PControl.Exec("play");
            }

            const ageSec = (Date.now() - ts) / 1000;
            const expected = p ? t : (t + Math.max(0, ageSec));
            const time = await ctx.controll.getTime();

            const diff = expected - time;

            if (Math.abs(diff) > 1.5) {
                Player.PControl.Exec("seek", { seconds: expected });
            }
        },

        seek: ({ t }) => {
            ctx.Player.PControl.Exec("seek", { seconds: t });
        },

        episode_switch: ({ episode }) => {
            ctx.vPaused = true;
            ctx.Player.CEpisodes.Select(episode);
            ctx.Player.Load();
        },

        voice_switch: ({ kodikId }) => {
            ctx.vPaused = true;
            ctx.Player.CTranslation.Select({
                id: ctx.Player.results.get(kodikId).translation.id,
                user_handler: true
            });
        },

        pause_request: ({ uid }) => {
        },

        member_joined: ({ uid }) => {
            new Popup('member_joined', `Пользователь присоединился`);
            // обновить UI/список участников
        },
        member_left: ({ uid }) => {
            new Popup('member_left', `Пользователь отключился`);
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

export function RoomGuest({ wsUrl, onopen = () => { }, onclose = () => { } } = {}) {
    const ws = new WebSocket(wsUrl);

    /**@type {ctx} */
    const ctx = {
        ws, Player,
        state: { p: true, t: 0, v: 0, ts: Date.now() },
        vPaused: true,
        config: { pause: false },
        param: {
            save: $PARAMETERS.rooms.roomssave
        }
    }

    ctx.controll = VideoTime(ctx);
    ctx.user = VUsers(ctx);
    VEvents(ctx);
    const offSEvents = SEvents(ctx);

    ws.addEventListener("open", () => {
        onopen();
    });

    ws.addEventListener("close", () => {
        offSEvents();

        new Popup('room_closed', 'Комната была закрыта');

        if (!ctx.param.save) {
            ctx.Player.CEpisodes.Select(ctx.saveUserSession.selectedEpisode);

            if (ctx.Player.CTranslation.id !== ctx.saveUserSession.selectedTranslation) {
                ctx.Player.CTranslation.Select({
                    id: ctx.saveUserSession.selectedTranslation,
                    user_handler: true
                });
            } else {
                ctx.Player.Load();
            }
        }


        Private.INCOGNITO = ctx.saveUserSession.isInkognito;
        ctx.Player.isOwner = true;

        onclose();
    });
}