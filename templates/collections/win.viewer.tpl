<span class="windowed window-collection-viewer unselectable hide">
    <span class="hide-window"></span>
    <span class="window-content content-collection-viewer scroll-none hide">
        <span class="content-wrapper">
            <div class="wrapper">
                <div class="window-bar collection-viewer-bar">
                    <div class="title-wrapper">
                        <div class="name-wrapper">
                            <div class="window-title"></div>
                        </div>
                        <div class="window-subtitle"><span class="count">0</span> Аниме</div>
                    </div>
                    <div class="window-bar-wrapper">
                        <div class="win-bar-btn collection-share">
                            <svg class="icon" viewBox="0 0 640 640" aria-hidden="true">
                                <use href="#i-share"></use>
                            </svg>
                        </div>
                        <div class="win-bar-btn window-close">
                            <svg class="icon" viewBox="0 0 640 640" aria-hidden="true">
                                <use href="#i-xmark"></use>
                            </svg>
                        </div>
                    </div>
                </div>

                <div class="viewer-list-wrapper">
                    <div class="viewer-list"></div>
                    <div class="viewer-list-loader" data-state="idle">
                        <svg viewBox="0 0 640 640" aria-hidden="true">
                            <use href="#i-loader"></use>
                        </svg>
                    </div>
                    <div class="viewer-empty-wrapper" data-state="none">
                        <div class="viewer-empty" data-for="loading">
                            <span>Открываем коллекцию...</span>
                        </div>
                        <div class="viewer-empty" data-for="idle">
                            <span>В этой коллекции<br>пока пусто.</span>
                        </div>
                        <div class="viewer-empty" data-for="error">
                            <span>Коллекция не открылась.<br>Проверь соединение и повтори.</span>
                        </div>
                    </div>
                </div>

                <div class="win-actions-wrapper">
                    <div class="win-actions">
                        <div class="default-wrapper">
                            <div class="collection-owner hide">
                                <div class="avatar">
                                    <img alt="" loading="lazy">
                                </div>
                                <span class="nickname"></span>
                            </div>
                            <div class="btn-action btn-copy a-tt a-primary -dissable" data-type="copy">
                                <span>
                                    <svg viewBox="0 0 640 640" aria-hidden="true">
                                        <use href="#i-copy"></use>
                                    </svg>
                                </span>
                                Скопировать
                            </div>
                            <div class="btn-action a-fill a-text a-tt -dissable -hide" data-type="edit">
                                Редактировать
                            </div>
                            <div class="btn-action a-primary a-fill a-text a-tt -dissable -hide" data-type="addanime">
                                Добавить аниме
                            </div>
                        </div>
                    </div>
                </div>
                <div class="safe-area-actions"></div>
            </div>
        </span>
    </span>
    <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
        <symbol id="i-xmark" viewBox="0 0 640 640">
            <path
                d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" />
        </symbol>
        <symbol id="i-share" viewBox="0 0 640 640">
            <path d="M416.5 88L416.5 160L352.5 160C273 160 208.5 224.5 208.5 304C208.5 397.4 291.3 438.8 309.1 446.6C311.3 447.6 313.7 448 316.2 448L318.7 448C328.5 448 336.5 440 336.5 430.2C336.5 421.9 330.6 414.7 323.7 409.9C314.8 403.7 304.5 391.7 304.5 369.4C304.5 324.4 341 287.9 386 287.9L416.5 287.9L416.5 359.9C416.5 369.6 422.3 378.4 431.3 382.1C440.3 385.8 450.6 383.8 457.5 376.9L593.5 240.9C602.9 231.5 602.9 216.3 593.5 207L457.5 71C450.6 64.1 440.3 62.1 431.3 65.8C422.3 69.5 416.5 78.3 416.5 88zM144.5 160C100.3 160 64.5 195.8 64.5 240L64.5 496C64.5 540.2 100.3 576 144.5 576L400.5 576C444.7 576 480.5 540.2 480.5 496L480.5 464C480.5 446.3 466.2 432 448.5 432C430.8 432 416.5 446.3 416.5 464L416.5 496C416.5 504.8 409.3 512 400.5 512L144.5 512C135.7 512 128.5 504.8 128.5 496L128.5 240C128.5 231.2 135.7 224 144.5 224L160.5 224C178.2 224 192.5 209.7 192.5 192C192.5 174.3 178.2 160 160.5 160L144.5 160z"/>
        </symbol>
        <symbol id="i-copy" viewBox="0 0 640 640">
            <path d="M288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448L480 448C515.3 448 544 419.3 544 384L544 183.4C544 166 536.9 149.3 524.3 137.2L466.6 81.8C454.7 70.4 438.8 64 422.3 64L288 64zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L352 496L352 512L160 512L160 256L176 256L176 192L160 192z"/>
        </symbol>
        <symbol id="i-loader" viewBox="0 0 640 640">
            <path
                d="M320 96C320 78.3 334.3 64 352 64C493.4 64 608 178.6 608 320C608 461.4 493.4 576 352 576C210.6 576 96 461.4 96 320C96 302.3 110.3 288 128 288C145.7 288 160 302.3 160 320C160 426.1 245.9 512 352 512C458.1 512 544 426.1 544 320C544 213.9 458.1 128 352 128C334.3 128 320 113.7 320 96z" />
        </symbol>
        <symbol id="i-shikimori" viewBox="0 0 24 24">
            <path
                d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 3.5c1.9 0 3.5 1.6 3.5 3.5S13.9 12.5 12 12.5 8.5 10.9 8.5 9 10.1 5.5 12 5.5zm0 13c-2.3 0-4.4-1.2-5.6-3 .1-1.8 3.7-2.8 5.6-2.8s5.5 1 5.6 2.8c-1.2 1.8-3.3 3-5.6 3z" />
        </symbol>
        <symbol id="i-box-archive" viewBox="0 0 640 640">
            <path
                d="M64 128C64 110.3 78.3 96 96 96L544 96C561.7 96 576 110.3 576 128L576 160C576 177.7 561.7 192 544 192L96 192C78.3 192 64 177.7 64 160L64 128zM96 240L544 240L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 240zM248 304C234.7 304 224 314.7 224 328C224 341.3 234.7 352 248 352L392 352C405.3 352 416 341.3 416 328C416 314.7 405.3 304 392 304L248 304z" />
        </symbol>
    </svg>
</span>
