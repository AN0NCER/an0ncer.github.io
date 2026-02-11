import { TWindow } from "../core/window.core.js";
import { Template } from "../modules/tun.template.js";
import { WindowIntercator } from "../modules/win.module.js";

/**
Визуальная схема работы
Контейнер (174x200px)
┌─────────────┐
│  [видимая   │  ← Большое изображение (1000x800px)
│   часть]    │     можно двигать влево/вправо/вверх/вниз
└─────────────┘

Начало: изображение в позиции (0, 0)
┌─────────────┐
│█████░░░░░░░░│  █ = видимая часть
└─────────────┘

После перетаскивания вправо: изображение в (-400px, 0)
┌─────────────┐
│░░░░░█████░░░│
└─────────────┘
*/

const config = {
    tpl: 'win.editor.character.tpl',
    css: 'win.editor.character.css',
    ell: '.window-character-edit',
}

class Size {
    constructor(width = 0, height = 0) {
        /**@type {number} */
        this.width = width,
            /**@type {number} */
            this.height = height;
    }
}

class Vector2 {
    constructor(x = 0, y = 0) {
        /**@type {number} */
        this.x = x;
        /**@type {number} */
        this.y = y;
    }

    /**
     * Set x and y components of an existing Vector2
     * @param {number} newX 
     * @param {number} newY 
     */
    set(newX, newY) {
        this.x = newX;
        this.y = newY;
    }
}

class Hexagon {
    static size = new Size(174, 200);
    size = Hexagon.size;

    Image = new class {
        /**
        * Загружает изображение и возвращает его размеры и пропорции
        * @param {string} src
        * @returns {Promise<{
        *   width: number,
        *   height: number,
        *   ratio: number,
        *   ratioText: string
        * }>}
        */
        metadata(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();

                img.onload = () => {
                    const width = img.naturalWidth;
                    const height = img.naturalHeight;
                    const ratio = width / height;

                    resolve({
                        width,
                        height,
                        ratio,
                        ratioText: `${width}:${height}`
                    });
                };

                img.onerror = () => reject(new Error('Image failed to load'));
                img.src = src;
            });
        }
    }
}

const Editor = new class extends Hexagon {
    value = new Vector2();
    hexagon = new Size(174, 200);

    onload = false;

    async init(img, { t = Date.now() } = {}) {
        if (this.onload) return;
        this.onload = true;
        this.img = img;
        this.meta = await this.Image.metadata(img);
        this.#ui();
        this.#bind();
        this.#load(t);
    }

    get() {
        return {
            x: this.value.x,
            y: this.value.y
        }
    }

    destroy() {
        $('.loading').removeClass('-hide');
        this.onload = false;
        delete this.img;
        delete this.meta;

        for (const [element, type, handler] of this.#events) {
            element.removeEventListener(type, handler);
        }

        this.#events = new Set();
    }

    #ui() {
        const $wrapper = $('.character-wrapper-show-box');

        const [editor_height, img_size, wrapper_size] = (() => {
            const { width, height } = this.hexagon;
            const { ratio } = this.meta;

            const EDITOR_PADDING = 40;
            const minHeight = height + EDITOR_PADDING;
            const calculatedHeight = ((width / ratio) - height) * 2 + minHeight;
            const editor_height = `${Math.max(calculatedHeight, minHeight)}px`;

            const result = [editor_height];

            if (ratio > 1) {
                result.push(`height="${height}"`);
                result.push(`--height: ${height}px`);
                return result;
            }

            result.push(`width="${width}"`);
            result.push(`--width: ${width}px`);
            return result;
        })();

        $('.character-editor').css('height', editor_height);

        $wrapper.empty();
        $wrapper.append(`<svg id="hexagon" width="174" height="200" viewBox="0 0 174 200"><defs><clipPath id="hexClip"><path d="M82.0172 1.32985C85.1024 -0.443295 88.8976 -0.443291 91.9828 1.32986L168.983 45.5827C172.087 47.3665 174 50.6731 174 54.2529V142.679C174 146.259 172.087 149.566 168.983 151.35L91.9828 195.602C88.8976 197.376 85.1024 197.376 82.0172 195.602L5.01715 151.35C1.91348 149.566 0 146.259 0 142.679V54.2529C0 50.6731 1.91348 47.3665 5.01716 45.5827L82.0172 1.32985Z"></path></clipPath></defs><g clip-path="url(#hexClip)"><image id="mainImage" href="${this.img}" x="0" y="0" ${img_size} preserveAspectRatio="xMidYMid slice"></image></g><path d="M82.1172 1.50327C85.1406 -0.234211 88.8594 -0.234211 91.8828 1.50327L168.883 45.7562C171.924 47.5042 173.8 50.7451 173.8 54.2533V142.679C173.8 146.187 171.924 149.428 168.883 151.176L91.8828 195.429C88.8594 197.167 85.1406 197.167 82.1172 195.429L5.11719 151.176C2.07558 149.428 0.200195 146.187 0.200195 142.679V54.2533C0.200195 50.7451 2.07558 47.5042 5.11719 45.7562L82.1172 1.50327Z" stroke="white" stroke-opacity="0.8" stroke-width="0.4" fill="none"></path></svg>`);
        $wrapper.append(`<div class="img-wrapper" style="${wrapper_size}"><img src="${this.img}" alt=""></div>`);
    }

    #events = new Set();

    on(dom, type, handler, options = {}) {
        const elements = Array.from(document.querySelectorAll(dom));
        elements.forEach(e => {
            e.addEventListener(type, handler, options);
            this.#events.add([e, type, handler]);
        });
    }

    #bind() {
        const imgWrapperElement = document.querySelector('.character-wrapper-show-box > .img-wrapper');

        let active = false;
        let ticking = false;

        const delta = new Vector2();
        const point = new Vector2();

        const percent = new Vector2();
        const tempPercent = new Vector2();
        const oldPercent = new Vector2();
        const position = new Vector2();

        /**@returns {{clientX:number, clientY:number}} */
        const getPoint = (e) => {
            if (e.touches && e.touches.length) {
                return e.touches[0];
            }
            return e;
        };

        const onEnd = () => {
            active = false;

            imgWrapperElement.style.willChange = 'auto';

            oldPercent.set(tempPercent.x, tempPercent.y);
            this.value.set(position.x, position.y);

            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
        };

        const info = this.meta;
        let imgWidth, imgHeight;

        if (info.ratio > 1) {
            imgHeight = this.size.height;
            imgWidth = imgHeight * info.ratio;
        } else {
            imgWidth = this.size.width;
            imgHeight = imgWidth / info.ratio;
        }

        const onMove = (e) => {
            if (!active || ticking) return;

            // актуальные координаты
            const p = getPoint(e);

            delta.set(p.clientX - point.x, p.clientY - point.y);

            percent.set(
                Math.max(Math.min(oldPercent.x + (delta.x / imgWidth * -100), 100), 0),
                Math.max(Math.min(oldPercent.y + (delta.y / imgHeight * -100), 100), 0)
            );

            ticking = true;
            requestAnimationFrame(() => {
                updatePostion(percent.x, percent.y);

                ticking = false;
            });
        };

        const onStart = (e) => {
            e.preventDefault();
            active = true;

            imgWrapperElement.style.willChange = 'transform';

            const p = getPoint(e);
            point.set(p.clientX, p.clientY);

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onEnd);
        };

        const dragTargets = '#mainImage, .character-wrapper-show-box > .img-wrapper';
        this.on(dragTargets, 'touchstart', onStart, { passive: false });
        this.on(dragTargets, 'mousedown', onStart);

        const img = document.getElementById('mainImage');

        const { height, width } = this.size;

        const maxYOffset = imgHeight - height;
        const maxXOffset = imgWidth - width;

        function updatePostion(hPercent, vPercent) {
            // Центрируем: 50% = центр, 0% = верх/лево, 100% = низ/право
            const yPos = -maxYOffset * (vPercent / 100);
            const xPos = -maxXOffset * (hPercent / 100);

            tempPercent.set(hPercent, vPercent);
            position.set(xPos, yPos);

            img.setAttribute('x', xPos);
            img.setAttribute('y', yPos);
            imgWrapperElement.style.transform = `translate(${xPos}px, ${yPos}px)`;
        }

        oldPercent.set(50, 50);
        updatePostion(50, 50);
        onEnd();
    }

    #load(t) {
        setTimeout(() => {
            $('.loading').addClass('-hide');
        }, Math.max(0, (300 - (Date.now() - t))));
    }
}();

/**
 * 
 * @returns {Promise<{type: "close" | "cancel" | "complete", value: {x: number, y: number}}>} 
 */
export function WCharacterEditor(img, { dom = 'body', z = 300, title = "Персонаж" } = {}) {
    let type = 'close';

    return new Promise(async (resolve) => {
        $(dom).append((await Template(config.tpl)).html({ z, title }).css(config.css, '/style/win/css').text());

        const window = new TWindow({
            oninit: () => {
                $('.character-edit-input-wrapper > .btn-character-cancel').on('click', function () {
                    type = 'cancel';
                    window.hide();
                });

                $('.character-edit-input-wrapper > .btn-character-add').on('click', function () {
                    type = 'complete';
                    window.hide();
                });

                $('.character-edit-bar > .window-close').on('click', function () {
                    type = 'close';
                    window.hide();
                });
            },

            onshow: async () => {
                await Editor.init(img);
            },

            onhide: () => {
                resolve({ type, value: Editor.get() });
            },

            animate: {
                animhide: () => {
                    window.destroy();
                    Editor.destroy();
                }
            },
            
            verification: () => {
                if (!$PARAMETERS.tunsync || !($SHADOW.state.isConnected && $SHADOW.state.permissions.includes('acc'))) {
                    type = 'close';
                    resolve({ type, value: null });
                    return false;
                }

                return true;
            }
        }, config.ell);

        window.module.add(WindowIntercator);
        window.show();
    })
}