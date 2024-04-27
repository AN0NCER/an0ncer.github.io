import { WindowManagement } from "./Windows.js";

const WindowVerify = {
    init: function () {

    },
    anim: {
        hided: () => {
            $(`.window-verify-action`).remove();

        }
    },
    show: () => {
        $('body').css('overflow', 'hidden');
    },
    hide: () => {
        $('body').css('overflow', '');
    },
    verif: () => { return true; }
}



export function CreateVerify(text) {
    return new Promise((resolve) => {
        const id = Math.random().toString(19).slice(2);
        if (text) {
            $('body').append(GenVerify(id, text));
        } else {
            $('body').append(GenVerify(id));
        }
        const wm = new WindowManagement(WindowVerify, '.window-verify-action');

        const pin = $(`#pin-${id}`);
        const swipeText = $(`#swipeText-${id}`);
        let isDragging = false;
        let callbackCalled = false;

        pin.on('mousedown touchstart', function (event) {
            isDragging = true;
            callbackCalled = false;
        });

        $(document).on('mousemove touchmove', function (event) {
            if (isDragging && !callbackCalled) {
                const pinWidth = pin.width();
                const swipeWidth = pin.parent().width() - pinWidth;
                let touchX = event.clientX;
                if (event.originalEvent.touches)
                    touchX = event.originalEvent.touches[0].clientX;
                const containerLeft = pin.parent().offset().left;

                if (touchX - containerLeft >= swipeWidth) {
                    pin.css('transform', `translateX(${swipeWidth}px)`);
                    swipeText.text('Подтверждено!');
                    callbackCalled = true;
                } else {
                    const translateX = touchX - containerLeft - pinWidth / 2;
                    pin.css('transform', `translateX(${translateX}px)`);
                    swipeText.text('Проведите вправо');
                    callbackCalled = false;
                }
            }
        });

        $(document).on('mouseup touchend', function () {
            if (isDragging) {
                isDragging = false;
                pin.css('transform', '');

                // Проверяем, было ли подтверждение действия
                if (callbackCalled) {
                    wm.hide();
                    WindowVerify.hide();
                    resolve(true);
                }

                swipeText.text('Проведите вправо');
            }
        });

        $(`#cancel-${id}`).on('click', function () {
            wm.hide();
            WindowVerify.hide();
            throw new Error(`Отмена действия`);
        });

        wm.click();
    });
}

function GenVerify(id, warning = 'Внимание! Проподут выборы озвучек, история просмотра, история поиска, параметры и т.д.') {
    return `<!--Окно подтверждения действия-->
    <span class="windowed window-verify-action hide" id="verify-${id}">
        <span class="hide-window"></span>
        <span class="window-content hide">
            <span class="content-wraper">
                <div class="window-access-icon">
                    <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M94.711 1.01953C93.2344 0.351563 91.6172 0 90.0001 0C88.3829 0 86.7657 0.351563 85.3243 1.01953L19.0899 29.1094C11.3555 32.3789 5.5899 40.0078 5.62505 49.2188C5.80083 84.0938 20.1446 147.902 80.7188 176.906C86.5899 179.719 93.4102 179.719 99.2813 176.906C159.856 147.902 174.199 84.0938 174.375 49.2188C174.41 40.0078 168.645 32.3789 160.91 29.1094L94.711 1.01953ZM77.7338 78.9127H69.919C69.2266 78.9127 68.4352 77.9883 68.4352 77.4491V65.3548C68.4352 64.8156 69.2266 63.8142 70.0179 63.8142H109.982C110.773 63.8142 111.565 64.7386 111.565 65.2778V77.5261C111.565 78.0654 110.872 78.9127 110.081 78.9127H102.167C101.376 78.9127 100.683 78.1424 100.585 77.6031L99.991 75.2922H96.7266V104.796C96.7266 104.796 98.5072 105.335 99.1997 105.489C99.8921 105.643 100.486 106.26 100.486 106.876V114.502C100.486 115.118 99.7932 115.966 98.9029 115.966H81.0971C80.1079 115.966 79.5144 115.118 79.5144 114.425V106.953C79.5144 106.175 79.9463 105.717 81.0971 105.412C82.2479 105.108 83.2734 104.796 83.2734 104.796V75.2922H80.009C80.009 75.2922 79.9463 76.5058 79.6876 77.6031C79.4289 78.7005 78.8843 78.9127 77.7338 78.9127Z" />
                    </svg>
                </div>
                <div class="window-access-footer">
                    <span class="detail-access">
                        ${warning}
                    </span>
                    <div class="access-swiper">
                        <div class="pin" id="pin-${id}">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M18.3828 9.11719C18.8711 9.60547 18.8711 10.3984 18.3828 10.8867L12.1328 17.1367C11.6445 17.625 10.8516 17.625 10.3633 17.1367C9.875 16.6484 9.875 15.8555 10.3633 15.3672L15.7305 10L10.3672 4.63281C9.87891 4.14453 9.87891 3.35156 10.3672 2.86328C10.8555 2.375 11.6484 2.375 12.1367 2.86328L18.3867 9.11328L18.3828 9.11719ZM4.63281 2.86719L10.8828 9.11719C11.3711 9.60547 11.3711 10.3984 10.8828 10.8867L4.63281 17.1367C4.14453 17.625 3.35156 17.625 2.86328 17.1367C2.375 16.6484 2.375 15.8555 2.86328 15.3672L8.23047 10L2.86719 4.63281C2.37891 4.14453 2.37891 3.35156 2.86719 2.86328C3.35547 2.375 4.14844 2.375 4.63672 2.86328L4.63281 2.86719Z"
                                    fill="white" />
                            </svg>
                        </div>
                        <span id="swipeText-${id}">Проведите</span>
                    </div>
                    <div id="cancel-${id}" class="button-access-cancel">
                        Отмена
                    </div>
                </div>
            </span>
        </span>
    </span>`;
}

$('head').append(`<link rel="stylesheet" href="/style/css/verifyaction.css">`);