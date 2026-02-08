import { OAuth } from "../../core/main.core.js";
import { Friends } from "../../modules/api.shiki.js";
import { Tunime } from "../../modules/api.tunime.js";
import { Sleep } from "../../modules/functions.js";
import { Popup } from "../../modules/tun.popup.js";

export const UIBanner = new class {
    #default = "/images/page.user/head.profile.jpg";

    constructor() {
        /**@type {string | undefined} установленный баннер */
        this.banner = undefined;
        /**@type {boolean} находится ли баннер на обновлении */
        this.is_update = false;
    }

    init(data = undefined) {
        if (
            typeof data === "undefined" &&
            typeof this.banner === "undefined"
        ) return;

        if (data === undefined) {
            this.banner = banner;
            this.set(this.#default);
            this.update(false);
            return;
        }

        if (data.is_update) {
            this.update(true);
        }

        if (data.link) {
            this.banner = data.link
            this.set(data.link);
        }
    }

    update(is = false) {
        this.is_update = is;
        const $el = $('.edit-banner');

        if (this.is_update) {
            $el.addClass('-update');
        } else {
            $el.removeClass('-update');
        }
    }

    set(img) {
        $('.header-image').css('--bg', `url('${img}')`);
    }
}();

/**
 * @typedef {Object} SUser
 * @property {number} id индентификатор пользователя
 * @property {string} last_online_at последнее посещение пользователя
 * @property {string} nickname имя пользователя
 * @property {boolean} in_friends находится ли в друзьях
 * @property {{x160:string}} image изображение профиля
 */

export const UIHeader = new class {
    #id = 0;
    get id() { return this.#id }

    #same = false;
    get same() { return this.#same }

    #in_friends = false;
    get in_friends() { return this.#in_friends }

    init(/**@type {SUser} */ data) {
        if (OAuth.user?.id === data.id) {
            $('body').addClass('-same');
            this.#same = true;
        }

        this.#id = data.id;
        this.#in_friends = data.in_friends;

        $(`.profile-tag-wrapper`).append(`<div class="profile-tag">В Сети: ${timeAgo(new Date(data.last_online_at))}</div>`);
        $('.profile-nickname').text(data.nickname);
        $('.profile-avatar > img').attr('src', data.image.x160);

        if (!this.same) {
            $('#profile-settings').addClass(`-usr-${this.in_friends}`);
        }

        this.#events();
    }

    #events() {
        $("#profile-settings").on('click', async () => {
            if (this.same)
                return window.location.href = "settings.html";

            if (this.#in_friends) {
                this.#friends.remove();
            } else {
                this.#friends.add();
            }

        });

        $("#profile-share").on('click', () => {
            const link = Tunime.share.user(this.id);
            try {
                navigator.share({
                    title: $(document).attr("title"),
                    url: link
                });
            } catch {
                navigator?.clipboard?.writeText(link).then(() => {
                    new Popup('copy-clipboard', 'Ссылка скопирована.');
                }, (err) => {
                    console.log(err);
                })
            }
        });

        $(".edit-banner").on('click', async () => {
            if (UIBanner.is_update) return new Popup('banner-update', "Баннер на рассмотрении!");

            Tunime.help.hasAccount().then(async (value) => {
                console.log(value);
                try {
                    const win = await import("../../windows/win.editor.banner.js");

                    const is = await win.WBanner(UIBanner.banner, {
                        value: UIBanner.banner
                    });

                    UIBanner.update(is);
                } catch (err) {
                    console.log(err);
                }
            }).catch(({ msg }) => {
                console.log(msg);
                new Popup('acc-scope', msg);
            });

        });
    }

    #friends = {
        remove: (event = () => { }) => {
            const $profile = $('#profile-settings');
            $profile.addClass('-load');
            Friends.friends(this.id, async (response) => {
                if (response.failed) {
                    if (response.status == 429) {
                        await Sleep(1000);
                        return this.#friends.remove(event);
                    }

                    new Popup('friends', 'Произошла ошибка...');
                    return $profile.removeClass('-load');
                }

                $profile.removeClass(`-usr-${this.in_friends}`);
                this.#in_friends = false;
                $profile.addClass(`-usr-${this.in_friends}`);

                $profile.removeClass('-load');
            }).DELETE();
        },

        add: (event = () => { }) => {
            const $profile = $('#profile-settings');
            $profile.addClass('-load');
            Friends.friends(this.id, async (response) => {
                if (response.failed) {
                    if (response.status == 429) {
                        await Sleep(1000);
                        return this.#friends.add(event);
                    }

                    new Popup('friends', 'Произошла ошибка...');
                    return $profile.removeClass('-load');
                }

                $profile.removeClass(`-usr-${this.in_friends}`);
                this.#in_friends = true;
                $profile.addClass(`-usr-${this.in_friends}`);

                $profile.removeClass('-load');
            }).POST();
        }
    }
}();

export const UITunime = (data) => {
    const icons = {
        'user': ['tunime', 'app'],
        'dev': ['code', 'dev']
    }

    if (data.info) {
        const { state, type, tag, lastSeen } = data.info;

        const [i_icon, i_text] = icons[type] || ['tunime', 'app'];

        $(`.profile-tag-wrapper`).empty();
        $(`.profile-tag-wrapper`).prepend(`<div class="profile-tag -${type}"><div class="ticon i-${i_icon}"></div>${i_text}</div>`);
        $(`.profile-tag-wrapper`).append(`<div class="profile-tag">${state ? "В Сети" : `В Сети: ${timeAgo(new Date(lastSeen))}`}</div>`);
        $(`.profile-description`).text(tag);
    }

    UIBanner.init(data.public?.banner);
}

export function timeAgo(date) {
    const rtf = new Intl.RelativeTimeFormat("ru", { numeric: "always" });
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