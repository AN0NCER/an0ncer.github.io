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
        let is_block = false;
        let file = null;

        const sendLink = async () => {
            const val = $('.banner-edit-input-wrapper > input').val();
            if (!isUrl(val)) {
                return;
            }

            if (val === value) {
                return new Popup('banner-update', 'Баннер уже установлен!', 400);
            }

            is_block = true;

            try {
                await Tunime.api.user(OAuth.user.id, async (response) => {
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
            } finally {
                is_block = false;
            }

        }

        const sendFile = async () => {
            is_block = true;
            try {
                await Tunime.api.user(OAuth.user.id, async (response) => {
                    if (!response.parsed) return new Popup('banner-update', 'Произошла неизвестная ошибка', 400);

                    if (!response.complete) {
                        return new Popup('banner-update', response.value?.msg ?? 'Ошибка!', 400)
                    }

                    value = response.value.img;
                    is_update = true;
                    _window.hide();
                    file = null;
                }).POST({ banner: file });
            } finally {
                is_block = false;
            }
        }

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
                    if (is_block) return;
                    if (file) {
                        sendFile();
                    } else {
                        sendLink();
                    }
                });

                $('.btn-banner-clear').on('click', function () {
                    const preview = $('.banner-edit-wrapper > .banner-preview');
                    const input = $('.banner-edit-input-wrapper > input');

                    if (file) {
                        file = null;

                        if (image !== def) {
                            value = image;
                        } else {
                            value = "";
                        }

                        preview.css('--bg', `url('${image}')`);
                        input.val(value);
                        input.prop('disabled', false);
                        return;
                    }

                    if (value.length <= 0 || value === def) {
                        return;
                    }

                    Tunime.api.user(OAuth.user.id, async (response) => {
                        const { complete } = response;

                        if (!complete || typeof response.value === "undefined") {
                            console.log(response?.err);
                            return new Popup('banner-update', 'Произошла ошибка...', 400);
                        }

                        const data = response.value.data.msg.banner;

                        new Popup('banner-update', data, 400);

                        value = "";
                        image = def;

                        $('.banner-edit-input-wrapper > input').val(value);
                        $('.banner-edit-wrapper > .banner-preview').css('--bg', `url('${image}')`);
                        $('header > .header-image').css('--bg', `url('${image}')`);
                    }).DELETE({ banner: null });

                });

                $('.banner-edit-input-wrapper > .btn-banner-select').on('click', async function () {
                    file = await pickImageFile();
                    if (file) {
                        previewFoto(file);
                        value = `file:${file.name}`;
                        const input = $('.banner-edit-input-wrapper > input');
                        input.val(value);
                        input.prop('disabled', true);
                    }
                });
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

async function previewFoto(file) {
    if (!file) return;

    const url = await fileToDataURL(file);

    $('.banner-edit-wrapper > .banner-preview').css('--bg', `url('${url}')`);

    function fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);      // строка вида: "data:image/png;base64,...."
            fr.onerror = reject;
            fr.readAsDataURL(file);
        });
    }
}

function pickImageFile() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.style.position = 'fixed';
        input.style.left = '-9999px';
        document.body.appendChild(input);

        input.addEventListener('change', () => {
            const file = input.files?.[0] ?? null;

            input.remove();

            if (file && !file.type.startsWith('image/')) {
                resolve(null);
                return;
            }

            resolve(file);
        }, { once: true });

        input.click();
    });
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