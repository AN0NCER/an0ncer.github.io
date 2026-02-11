import { OAuth } from "../../core/main.core.js";
import { Friends, Users } from "../../modules/api.shiki.js";
import { Tunime } from "../../modules/api.tunime.js";
import { TCache } from "../../modules/tun.cache.js";
import { IOFriends } from "./io.friends.js";
import { WFriends } from "./mod.friends.win.js";
import { TEvents } from "./util.event.js";
import { TPage } from "../user.js";

/**
 * @callback Users
 * @param {[{avatar:string, id:number, image:{x160:string, x148:string, x80:string, x64:string, x48:string, x32:string, x16:string},last_online_at:string, nickname:string, url:string }]} data
 */

export const TFriends = new class extends TEvents {
    /**@type {Users} */
    #data = undefined;
    #loaded = false;

    constructor() {
        super();
        this.cache = new TCache();
        this.win = new WFriends();
        this.id = null;

        this.#controls();
        this.#events();
    }

    init(id) {
        this.id = id;

        const key = `user-${id}-friends`;
        this.cache.get("requests", key).then((value) => this.set(value));

        IOFriends.Next();
        this.on('init', (value) => this.draw(value), { once: true, replay: true });
    }

    #events() {
        const key = `user-${this.id}-friends`;

        IOFriends.on('next', (value, page, isLoaded) => {
            IOFriends.canCachePage(this.id).then(can => {
                if (!can) return;
                this.cache.put("requests", key, value).catch(() => { });
            })

            this.set(value);
        })
    }

    #controls() {
        const $group = $(`.group-list`)
        $group.on('click', '.friend-wrapper', function () {
            const id = $(this).attr('data-id');
            window.location.href = `user.html?id=${id}`;
        });

        $group.on('click', '.btn-control.-rem', function () {
            const id = $(this).attr('data-id');
            console.log(id);
            Friends.friends(id, (response) => {
                IOFriends.removeFriend(Number(id));
                if (TFriends.id !== null) {
                    TFriends.cache.delete("requests", `user-${OAuth.user.id}-friends`);
                }
                $(this).removeClass('-rem').addClass('-add');
            }).DELETE();
        })

        $group.on('click', '.btn-control.-add', function () {
            const $btn = $(this);
            const id = $btn.attr('data-id');

            Friends.friends(id, (response) => {
                console.log(response);
                IOFriends.addFriend(Number(id));
                $btn.removeClass('-add').addClass('-rem');
            }).POST();
        });

        $group.on('click', '.btn.window-friends', () => {
            this.win.show(TPage.id);
        });
    }

    set(value) {
        if (value === null) return;

        const change = value !== this.#data;
        this.#data = value;

        if (!this.#loaded) {
            this.#loaded = true;
            return this.trigger("init", this.#data, { replay: true });
        }

        if (change) {
            return this.trigger("update", this.#data);
        }
    }

    async draw(value) {
        if (value.length !== 0) {
            $(`.user-friends-wrapper`).removeClass('-hide');
        }

        const $group = $('.group-list').empty();

        //Отправить первые 4 друга
        TAppFriends.getIds(value.slice(0, 4).map(v => v.id)).then((statuses) => {
            const icons = {
                'user': ['tunime', 'app'],
                'dev': ['code', 'dev']
            }
            for (const key in statuses) {
                if (!Object.hasOwn(statuses, key) || Object.keys(statuses[key]).length === 0) continue;

                const status = statuses[key];
                const [icon, type] = icons[status.type] || ['tunime', 'app'];

                $(`.friend-wrapper[data-id=${key}] > .context-wrapper > .title-wrapper`).prepend(`<div class="tag -${status.type}"><div class="ticon i-${icon}"></div>${type}</div>`);

                $(`.friend-wrapper[data-id=${key}] > .context-wrapper > .rest-wrapper > .description`).text(status.tag).addClass('-app');

                if (status.state) {
                    $(`.friend-wrapper[data-id=${key}] > .context-wrapper > .rest-wrapper > .online-wrapper`).text('В сети').addClass('-app');
                } else {
                    $(`.friend-wrapper[data-id=${key}] > .context-wrapper > .rest-wrapper > .online-wrapper`).text(`Онлайн: ${timeAgo(new Date(status.lastSeen))}`);
                }
            }
        });

        for (let i = 0; i < Math.min(value.length, 4); i++) {
            $group.append(await this.gen(value[i]));
        }

        const images = value.slice(-3).map(v => `<img src="${v.image.x80}" alt="">`);

        $group.append(`<div class="btn window-friends"><div class="btn-wrapper"><div class="users-images">${images.join('')}</div><div class="btn-title">Показать список</div></div><div class="btn-icon"><div class="ticon i-window-maximize"></div></div></div>`);
    }

    async gen(user, cl = { [1]: "-rem", [-1]: "-hide", [0]: "-add" }) {
        const last_online_at = new Date(user.last_online_at);
        return `<div class="friend"><div class="friend-wrapper" data-id="${user.id}"><div class="img-wrapper" style="--img: url(${user.image.x160})"></div><div class="context-wrapper -opacity"><div class="title-wrapper"><div class="title">${user.nickname}</div></div><div class="rest-wrapper"><div class="description">SHIKI Пользователь</div><div class="online-wrapper">Онлайн: <span class="value">${timeAgo(last_online_at)}</span></div></div></div></div><div class="btn-control ${cl[await IOFriends.isFriendAsync(user.id)]}" data-id="${user.id}"><div class="ticon i-user-plus"></div><div class="ticon i-user-minus"></div></div></div>`
    }
}();

export const TAppFriends = new class {
    constructor() {
        this.cache = new TCache();
    }

    getIds(ids = []) {
        return new Promise((resolve) => {
            if (TFriends.id === null || !Array.isArray(ids) || ids.length === 0) {
                return {};
            }

            this.cache.get("metadata", `user-${TFriends.id}-friends-status`).then(async (value) => {
                value = value || {};
                const [needIds, readyIds] = (() => {
                    const need = [];
                    const ready = [];

                    for (const id of ids) {
                        /**@type {{createdAt: Object, tag: string, type: string, lastSeen: Object, state: boolean}} */
                        const item = value?.[id];
                        if (!item) {
                            need.push(id);
                            continue;
                        }

                        ready.push(id);
                    }

                    return [need, ready];
                })();

                const raw = await this.#get(needIds);

                if (await IOFriends.canCachePage(TFriends.id) && needIds.length > 0) {
                    for (const id of needIds) {
                        const item = raw.data[id];
                        value[id] = item ? item : {};
                    }
                    this.cache.put("metadata", `user-${TFriends.id}-friends-status`, value, 10 * 60 * 1000);
                }

                //Обьединяем readyIds и полученные данные
                const result = { ...raw.data };

                for (const id of readyIds) {
                    result[id] = value[id];
                }

                return resolve(result);
            });
        });
    }

    /**
     * Получает статусы друзей по их идентификаторам
     * @param {number[]} ids 
     * @returns {Promise<Object.<number, {createdAt: Object, tag: string, type: string, lastSeen: Object, state: boolean}>>}
     */
    #get(ids = []) {
        if (ids.length === 0) {
            return Promise.resolve({ data: {} });
        }
        return new Promise((resolve) => {
            Tunime.api.users(async (response) => {
                if (!response.complete || !response.parsed)
                    return;
                return resolve(response.value);
            }).GET(ids);
        });
    }
}();

const rtf = new Intl.RelativeTimeFormat("ru", { numeric: "always" });

export function timeAgo(date) {
    const now = new Date();
    let diffInSeconds = Math.round((date - now) / 1000); // прошедшее время → отрицательное значение

    const units = [
        ["year", 365 * 24 * 60 * 60],
        ["month", 30 * 24 * 60 * 60],
        ["day", 24 * 60 * 60],
        ["hour", 60 * 60],
        ["minute", 60],
        ["second", 1],
    ];

    for (const [unit, secondsInUnit] of units) {
        const value = Math.trunc(diffInSeconds / secondsInUnit);

        if (Math.abs(value) >= 1) {
            return rtf.format(value, unit);
            // например: -2, "minute" → "2 минуты назад"
        }
    }

    return "только что";
}