import { TWindow } from "../core/window.core.js";
import { animate, utils } from "../library/anime.esm.min.js";

const win = {
    animate: {
        animshow: () => {
            $('.verify-task-wrapper').addClass('-show');
        }
    },

    onhide: () => {
        $('.verify-task-wrapper').removeClass('-show');
    }
}

function injectStyle(file) {
    const link = `/style/css/${file}`;
    if ($(`link[href="${link}"]`).length > 0) return;

    $('head').append(`<link rel="stylesheet" href="${link}">`);
}

async function Template(file) {
    const response = await fetch(`/templates/${file}`);
    let tpl = await response.text();

    const menu = {
        html: (data = {}) => {
            for (const key in data) {
                const regex = new RegExp(`{{${key}}}`, 'g');
                tpl = tpl.replace(regex, data[key]);
            }
            return menu;
        },
        text: () => {
            return tpl;
        }
    }

    return menu;
}

export function TVerify({ title = '', warning = '', template = 'win.verify.tpl', append = 'body', window = '.verify-action' } = {}) {
    injectStyle('verify.css');
    const id = Math.random().toString(19).slice(2);

    return new Promise(async (resolve, reason) => {
        $(append).append((await Template(template)).html({ id, warning, title }).text());

        const tw = new TWindow(win, window);
        tw.show();

        (() => {
            const pin = $(`#pin-${id}`);
            const text = $(`#swipeText-${id}`);
            const cncl = $(`#cancel-${id}`);

            let dragging = false;
            let onverify = false;

            let width = {
                pin: 0,
                swipe: 0
            };

            let startX = 0;

            const onDown = (x, type) => {
                if (dragging) return;

                type = type === "mousedown" ?
                    ["mousemove", "mouseup"] :
                    ["touchmove", "touchend"];

                const callback = {
                    "touchmove": (e) => {
                        if (e.originalEvent.touches.length > 0) {
                            onDrag(e.originalEvent.touches[0].clientX)
                        }
                    },
                    "mousemove": (e) => {
                        onDrag(e.originalEvent.clientX);
                    }
                }

                startX = x;

                width.pin = pin.width();
                width.swipe = pin.parent().width() - width.pin;

                $(window).on(`${type[0]}.${id}`, callback[type[0]]);

                $(window).on(`${type[1]}.${id}`, () => {
                    onUp(type);
                });

                dragging = true;
            }

            const onDrag = (touchX) => {
                if (!dragging) return;

                const delta = touchX - startX;
                const prcnt = (delta / width.swipe) * 100;
                if (delta >= 0 && delta <= width.swipe && !onverify) {
                    utils.set(pin[0], { x: `${delta}px` });
                }

                if (prcnt > 90 && !onverify) {
                    onverify = true;
                    utils.set(pin[0], { x: `${width.swipe}px` });
                    text.text('Подтверждено!');
                } else if (prcnt < 90 && onverify) {
                    onverify = false;
                    text.text('Проведите');
                } else if (prcnt < 0) {
                    utils.set(pin[0], { x: `${0}px` });
                }
            }

            const onUp = (type) => {
                $(window).off(`${type[0]}.${id}`);
                $(window).off(`${type[1]}.${id}`);

                if (onverify) {
                    tw.once('hide', () => {
                        resolve(onverify);
                    });
                    return tw.destroy();
                }

                animate(pin[0], {
                    x: 0,
                    duration: 300,
                    ease: 'out(3)',
                    onComplete: () => {
                        dragging = false;
                    }
                });

            }

            pin.on(`mousedown.${id}`, (e) => {
                onDown(e.originalEvent.clientX, e.originalEvent.type);
            });

            pin.on(`touchstart.${id}`, (e) => {
                if (e.originalEvent.touches.length > 0) {
                    onDown(e.originalEvent.touches[0].clientX, e.originalEvent.type);
                }
            });

            cncl.on('click', function () {
                tw.destroy();
                reason(new Error(`tun.cancel`));
            });

            tw.on('hide', () => {
                cncl.off('click');
                pin.off(`mousedown.${id}`);
                pin.off(`touchstart.${id}`);
            });
        })();
    });
}