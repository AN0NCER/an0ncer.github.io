<span class="windowed window-notification hide">
    <span class="hide-window"></span>
    <span class="window-content content-notification scroll-none hide">
        <span class="content-wrapper">
            <div class="wrapper">
                <div class="window-bar notification-bar">
                    <div class="window-title">Уведомление</div>
                    <div class="window-close">
                        <div class="ticon i-xmark"></div>
                    </div>
                </div>

                <div class="notification-list-wrapper">
                    <div class="bell-wrapper">
                        <svg class="icon" viewBox="0 0 640 640" aria-hidden="true">
                            <use href="#i-bell"></use>
                        </svg>
                    </div>
                    <div class="notification-text-wrapper">
                        {{content}}
                    </div>
                    <div class="access-swiper">
                        <div class="pin" id="pin-notification">
                            <div class="ticon i-angles-right"></div>
                        </div>
                        <span id="swipeText-notification">Разрешить</span>
                        <section class="no-robot">
                            <div class="icon-robot">
                                <svg class="icon" viewBox="0 0 576 512" aria-hidden="true">
                                    <use href="#i-robot"></use>
                                </svg>
                            </div>
                            <div class="no-robot-confirm">
                                Я не робот
                            </div>
                        </section>
                    </div>
                    <div id="denie-notification" class="btn">
                        Отказаться
                    </div>
                </div>
            </div>
        </span>
    </span>
    <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
        <symbol id="i-bell" viewBox="0 0 640 640">
            <path
                d="M320 64C302.3 64 288 78.3 288 96L288 99.2C215 114 160 178.6 160 256L160 277.7C160 325.8 143.6 372.5 113.6 410.1L103.8 422.3C98.7 428.6 96 436.4 96 444.5C96 464.1 111.9 480 131.5 480L508.4 480C528 480 543.9 464.1 543.9 444.5C543.9 436.4 541.2 428.6 536.1 422.3L526.3 410.1C496.4 372.5 480 325.8 480 277.7L480 256C480 178.6 425 114 352 99.2L352 96C352 78.3 337.7 64 320 64zM258 528C265.1 555.6 290.2 576 320 576C349.8 576 374.9 555.6 382 528L258 528z" />
        </symbol>
        <symbol id="i-robot" viewBox="0 0 576 512">
            <path fill="currentColor"
                d="M96 48c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 16 48 0c8.8 0 16 7.2 16 16l0 48 128 0 0-48c0-8.8 7.2-16 16-16l48 0 0-16c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-48 0 0 64 48 0c8.8 0 16 7.2 16 16l0 48 32 0 0-80c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 128c0 8.8-7.2 16-16 16l-48 0 0 80c0 8.8-7.2 16-16 16l-48 0 0 80c0 8.8-7.2 16-16 16l-96 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l48 0 0-32-192 0 0 32 48 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-96 0c-8.8 0-16-7.2-16-16l0-80-48 0c-8.8 0-16-7.2-16-16l0-80-48 0c-8.8 0-16-7.2-16-16L0 144c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 80 32 0 0-48c0-8.8 7.2-16 16-16l48 0 0-64-48 0c-8.8 0-16-7.2-16-16l0-32zm64 192l0 64c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm192 0l0 64c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16z" />
        </symbol>
    </svg>
</span>