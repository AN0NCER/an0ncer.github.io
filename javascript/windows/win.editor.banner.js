import { OAuth } from "../core/main.core.js";
import { TWindow } from "../core/window.core.js";
import { Tunime } from "../modules/api.tunime.js";
import { Popup } from "../modules/tun.popup.js";
import { Template } from "../modules/tun.template.js";
import { WindowIntercator } from "../modules/win.module.js";

const config = {
    tpl: 'win.editor.banner.tpl',
    css: 'win.editor.banner.css',
    ell: '.window-banner-edit',
}

export function WBanner(image = '/images/page.user/head.profile.jpg', { append = 'body', placeholder = "Ссылка на изображение", value = "", def = '/images/page.user/head.profile.jpg' } = {}) {
    return new Promise(async (resolve) => {
        $(append).append((await Template(config.tpl)).html({ src: image, placeholder, value }).css(config.css, '/style/win/css').text());

        let is_update = false;

        const _window = new TWindow({
            oninit: () => {
                $('.banner-edit-bar').on('click', () => {
                    _window.hide();
                });

                $('.banner-edit-input-wrapper > input').on('input', function () {
                    const val = this.value;
                    if (isUrl(val)) {
                        $(`.banner-preview`).css('--bg', `url('${val}')`);
                    }
                });

                $('.btn-banner-send').on('click', function () {
                    const val = $('.banner-edit-input-wrapper > input').val();
                    if (!isUrl(val)) {
                        return;
                    }

                    if (val === value) {
                        return new Popup('banner-update', 'Баннер уже установлен!', 400);
                    }

                    Tunime.api.user(OAuth.user.id, async (response) => {
                        const { complete, value } = response;

                        if (!complete || typeof value === "undefined") {
                            console.log(response?.err);
                            return new Popup('banner-update', 'Произошла ошибка...', 400);
                        }

                        /**@type {error: {msg:[{type:string,msg:string}],value:number}, task: {msg:string[], value:number}, updatet: {msg:string[], value:number}} */
                        const data = value.data;
                        let msg = "На модерации";

                        if (data.error.count > 0 && (msg = data.error.msg.find(x => x.type === "banner").msg)) {
                            return new Popup('banner-update', msg || 'Произошла ошибка...', 400);
                        }

                        is_update = true;
                        _window.hide();
                    }).PATCH({ banner: val })
                });

                $('.btn-banner-clear').on('click', function () {
                    if (value.length <= 0) {
                        return;
                    }

                    Tunime.api.user(OAuth.user.id, async (response) => {
                        const { complete } = response;

                        if (!complete || typeof response.value === "undefined") {
                            console.log(response?.err);
                            return new Popup('banner-update', 'Произошла ошибка...', 400);
                        }

                        const data = response.value.data;

                        let msg = "Баннер удален.";
                        if (data.error.count > 0 && (msg = data.error.msg.find(x => x.type === "banner").msg)) {
                            return new Popup('banner-update', msg || 'Произошла ошибка...', 400);
                        }

                        value = "";

                        $('.banner-edit-input-wrapper > input').val();
                        $('.banner-edit-wrapper > .banner-preview').css('--bg', `url('${def}')`);
                        $('header > .header-image').css('--bg', `url('${def}')`);
                        new Popup('banner-update', msg, 400);
                    }).PATCH({ banner: null });

                })
            },
            animate: {
                animhide: () => {
                    _window.destroy();
                    $(`.window-banner-edit`).remove();
                    resolve(is_update);
                }
            },
            onhide: () => {
                resolve(is_update);
            },
            verification: () => {
                return $SHADOW.state.permissions.includes("acc");
            }
        }, config.ell);
        _window.show("Нет доступа!");

        _window.module.add(WindowIntercator);
    })
}

function isUrl(value) {
    if (typeof value !== 'string') return false;

    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}