<span class="windowed window-anime-list unselectable hide">
    <span class="hide-window"></span>
    <span class="window-content content-anime-list scroll-none hide">
        <span class="content-wrapper">
            <div class="wrapper">
                <div class="window-bar anime-list-bar">
                    <div class="window-title">Список аниме</div>
                    <div class="window-bar-wrapper">
                        <div class="win-bar-count">
                            0
                        </div>
                        <div class="win-bar-btn window-close">
                            <svg class="icon" viewBox="0 0 640 640" aria-hidden="true">
                                <use href="#i-xmark"></use>
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="anime-list-wrapper">
                    <div class="anime-list"></div>
                    <div class="anime-list-loader" data-state="idle">
                        <svg viewBox="0 0 640 640" aria-hidden="true">
                            <use href="#i-loader"></use>
                        </svg>
                    </div>
                </div>
                <div class="anime-list-empty-wrapper" data-state="idle">
                    <div class="anime-list-empty" data-for="idle">
                        <span>Здесь пока нет аниме. <br>Жми для поиска</span>
                        <span>
                            <svg viewBox="0 0 10 10" aria-hidden="true">
                                <use href="#i-ios-search"></use>
                            </svg>
                        </span>
                        <span>чтобы наполнить эту <br>коллекцию разными аниме.</span>
                    </div>
                    <div class="anime-list-empty" data-for="loading">
                        <span>Ищем по всем мирам...</span>
                    </div>
                    <div class="anime-list-empty" data-for="nofound">
                        <span>Такой истории не нашлось.<br>Попробуй другое название.</span>
                        <span class="query"></span>
                    </div>
                    <div class="anime-list-empty" data-for="error">
                        <span>Поиск не отозвался.<br>Проверь соединение и повтори.</span>
                    </div>
                </div>
                <div class="win-actions-wrapper">
                    <div class="win-actions">
                        <div class="search-wrapper">
                            <input type="text" placeholder="Поиск аниме" autocomplete="off">
                            <div class="btn-action a-fill a-tt filter-close">
                                <svg class="icon" viewBox="0 0 640 640" aria-hidden="true">
                                    <use href="#i-xmark" class="i-xmark"></use>
                                    <use href="#i-check" class="i-check"></use>
                                </svg>
                            </div>
                        </div>
                        <div class="default-wrapper">
                            <div class="btn-action filter-action">
                                <svg class="icon" viewBox="0 0 10 10" aria-hidden="true">
                                    <use href="#i-ios-search"></use>
                                </svg>
                            </div>
                            <div class="btn-action a-fill a-text a-tt a-primary" data-type="accept">Установить</div>
                        </div>
                    </div>
                </div>
                <div class="safe-area-actions"></div>
            </div>
        </span>
    </span>
    <template id="anime-card-item">
        <div class="card-anime-h" data-id="">
            <div class="img-wrapper">
                <img alt="" loading="lazy">
            </div>
            <div class="anime-wrapper">
                <div class="info-wrapper">
                    <div class="title"></div>
                    <div class="season-type">
                        <div class="type"></div><span class="pin"></span>
                        <div class="seas"></div>
                    </div>
                    <div class="video-info">
                        <div class="episodes"><span></span></div>
                        <div class="status"></div>
                    </div>
                </div>
                <div class="more-wrapper">
                    <div class="in-list">
                        <span class="val"></span>
                        <svg class="t-icon" viewBox="0 0 640 640" aria-hidden="true">
                            <use href="#i-user"></use>
                        </svg>
                    </div>
                    <div class="anime-score">
                        <div class="shikimori">
                            <span></span>
                            <svg class="t-icon" viewBox="0 0 640 640" aria-hidden="true">
                                <use href="#i-star"></use>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            <div class="btn btn-status" data-state="undefined">
                <div class="wrapper">
                    <svg viewBox="0 0 640 640" aria-hidden="true">
                        <use href="#i-check" class="state completed"></use>
                        <use href="#i-bookmark-2" class="state planned on_hold"></use>
                        <use href="#i-play" class="state watching rewatching"></use>
                        <use href="#i-box-archive" class="state dropped"></use>
                    </svg>
                </div>
            </div>
        </div>
    </template>
    <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
        <symbol id="i-xmark" viewBox="0 0 640 640">
            <path
                d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" />
        </symbol>
        <symbol id="i-ios-search" viewBox="0 0 10 10">
            <path
                d="M8 4C8 6.20914 6.20914 8 4 8C1.79086 8 0 6.20914 0 4C0 1.79086 1.79086 0 4 0C6.20914 0 8 1.79086 8 4ZM1.25895 4C1.25895 5.51384 2.48616 6.74105 4 6.74105C5.51384 6.74105 6.74105 5.51384 6.74105 4C6.74105 2.48616 5.51384 1.25895 4 1.25895C2.48616 1.25895 1.25895 2.48616 1.25895 4Z"
                fill="white" />
            <rect x="6.85144" y="5.7688" width="4.11406" height="1.63503" rx="0.817516"
                transform="rotate(45 6.85144 5.7688)" fill="white" />
        </symbol>
        <!-- Заглушка индикатора загрузки: заменить на нужную иконку -->
        <symbol id="i-loader" viewBox="0 0 640 640">
            <path
                d="M320 96C320 78.3 334.3 64 352 64C493.4 64 608 178.6 608 320C608 461.4 493.4 576 352 576C210.6 576 96 461.4 96 320C96 302.3 110.3 288 128 288C145.7 288 160 302.3 160 320C160 426.1 245.9 512 352 512C458.1 512 544 426.1 544 320C544 213.9 458.1 128 352 128C334.3 128 320 113.7 320 96z" />
        </symbol>
        <symbol id="i-check" viewBox="0 0 640 640">
            <path
                d="M530.8 134.1C516.7 123.5 496.6 126.4 486 140.6L263.6 437.2L152.9 348.7C139.1 337.6 118.9 339.9 107.9 353.7C96.9 367.5 99.1 387.7 112.9 398.7L248.9 507.5C256 513.2 265.1 515.7 274.1 514.5C283.1 513.3 291.2 508.4 296.6 501.1L536.6 181.1C547.2 167 544.3 146.9 530.1 136.3z" />
        </symbol>
        <symbol id="i-star" viewBox="0 0 640 640">
            <path
                d="M341.5 45.1C337.4 37.1 329.1 32 320.1 32C311.1 32 302.8 37.1 298.7 45.1L225.1 189.3L65.2 214.7C56.3 216.1 48.9 222.4 46.1 231C43.3 239.6 45.6 249 51.9 255.4L166.3 369.9L141.1 529.8C139.7 538.7 143.4 547.7 150.7 553C158 558.3 167.6 559.1 175.7 555L320.1 481.6L464.4 555C472.4 559.1 482.1 558.3 489.4 553C496.7 547.7 500.4 538.8 499 529.8L473.7 369.9L588.1 255.4C594.5 249 596.7 239.6 593.9 231C591.1 222.4 583.8 216.1 574.8 214.7L415 189.3L341.5 45.1z" />
        </symbol>
        <symbol id="i-user" viewBox="0 0 640 640">
            <path
                d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z" />
        </symbol>
        <symbol id="i-bookmark-2" viewBox="0 0 640 640">
            <path
                d="M192 64C156.7 64 128 92.7 128 128L128 544C128 555.5 134.2 566.2 144.2 571.8C154.2 577.4 166.5 577.3 176.4 571.4L320 485.3L463.5 571.4C473.4 577.3 485.7 577.5 495.7 571.8C505.7 566.1 512 555.5 512 544L512 128C512 92.7 483.3 64 448 64L192 64z" />
        </symbol>
        <symbol id="i-play" viewBox="0 0 640 640">
            <path
                d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z" />
        </symbol>
        <symbol id="i-box-archive" viewBox="0 0 640 640">
            <path
                d="M64 128C64 110.3 78.3 96 96 96L544 96C561.7 96 576 110.3 576 128L576 160C576 177.7 561.7 192 544 192L96 192C78.3 192 64 177.7 64 160L64 128zM96 240L544 240L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 240zM248 304C234.7 304 224 314.7 224 328C224 341.3 234.7 352 248 352L392 352C405.3 352 416 341.3 416 328C416 314.7 405.3 304 392 304L248 304z" />
        </symbol>
    </svg>
</span>