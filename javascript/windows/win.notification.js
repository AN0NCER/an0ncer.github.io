import { TWindow } from "../core/window.core.js";
import { animate, utils } from "../library/anime.esm.min.js";
import { Template } from "../modules/tun.template.js";
import { WindowIntercator } from "../modules/win.module.js";

let PROMISE_UNLOCK = true;

/**
 * @param {{
 *  content?:string,
 *  append?:string,
 *  onConfirm?: () => any // вызывается СИНХРОННО в момент подтверждения (touchend/mouseup)
 * }} settings 
 * @returns {Promise<-1 | 0 | 1>}
 */
export async function WNotification({ content = 'Хотите получать уведомления от Tunime?<br />Уведомлениями можно будет управлять через настройки.', append = 'body', onConfirm } = {}) {
    if (!PROMISE_UNLOCK) return 0;
    PROMISE_UNLOCK = false;

    return new Promise(async (resolve) => {
        $(append).append((await Template('win.notification.tpl')).html({ content }).css('win.notification.css', '/style/win/css').text());

        let PROMISE_VALUE = 0;
        let CALLBACK_RESULT;

        const tw = new TWindow({
            animate: {
                animhide: () => {
                    tw.destroy();
                    PROMISE_UNLOCK = true;
                }
            },
            onhide: () => {
                resolve({ win: PROMISE_VALUE, result: CALLBACK_RESULT });
            },
            oninit: () => {
                $('.notification-bar > .window-close').on('click', () => {
                    tw.hide();
                });
            }
        }, '.window-notification');

        tw.module.add(WindowIntercator);

        tw.show();

        (() => {
            const pin = $(`#pin-notification`);
            const text = $(`#swipeText-notification`);
            const cncl = $(`#denie-notification`);

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

                $(window).on(`${type[0]}`, callback[type[0]]);

                $(window).on(`${type[1]}`, () => {
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
                $(window).off(`${type[0]}`);
                $(window).off(`${type[1]}`);

                if (onverify) {
                    PROMISE_VALUE = 1;

                    if (typeof onConfirm === 'function') {
                        const isActive = ('userActivation' in navigator) && navigator.userActivation.isActive;

                        if (isActive) {
                            try {
                                CALLBACK_RESULT = onConfirm();
                            } catch (e) {
                                console.warn('[WNotification] onConfirm error:', e);
                            }

                            return tw.hide();
                        } else {
                            // Если нет пользовательского нажатия проверяем на робота
                            isRobot();
                            return;
                        }
                    } else {
                        return tw.hide();
                    }

                } else {
                    PROMISE_VALUE = 0;
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

            const isRobot = () => {
                $('.window-notification .access-swiper').attr('no-robot', true);
                $('.window-notification .no-robot-confirm').off('click').on('click', () => {
                    try {
                        CALLBACK_RESULT = onConfirm();
                    } catch (e) {
                        console.warn('[WNotification] onConfirm error:', e);
                    }

                    tw.hide();
                });
            }

            pin.on(`mousedown`, (e) => {
                onDown(e.originalEvent.clientX, e.originalEvent.type);
            });

            pin.on(`touchstart`, (e) => {
                if (e.originalEvent.touches.length > 0) {
                    onDown(e.originalEvent.touches[0].clientX, e.originalEvent.type);
                }
            });

            cncl.on('click', function () {
                PROMISE_VALUE = -1;
                tw.hide();
            });
        })();
    });
}