<span class="windowed window-collection-editor unselectable hide">
    <span class="hide-window"></span>
    <span class="window-content content-collection-editor scroll-none hide">
        <span class="content-wrapper">
            <div class="wrapper">
                <div class="window-bar collection-editor-bar">
                    <div class="window-title">Создание | Редактирование коллекции</div>
                    <div class="window-bar-wrapper">
                        <div class="win-bar-btn window-close">
                            <svg class="icon" viewBox="0 0 640 640" aria-hidden="true">
                                <use href="#i-xmark"></use>
                            </svg>
                        </div>
                    </div>
                </div>

                <div class="gitter-wrapper">
                    <div class="editor-wrapper">
                        <div class="editor-title">
                            <label>Название</label>
                            <div class="description"></div>
                        </div>
                        <div class="editor-input">
                            <input type="text" placeholder="Коллекция: [ Введите название ]">
                        </div>
                    </div>

                    <div class="editor-wrapper">
                        <div class="anime-selector">
                            <div class="btn">
                                <span>
                                    <svg viewBox="0 0 10 10" aria-hidden="true">
                                        <use href="#i-ios-search"></use>
                                    </svg>
                                </span>
                                Выбрать аниме
                            </div>
                            <div class="select-value">
                                0 Аниме
                            </div>
                        </div>
                    </div>
                </div>

                <div class="gitter-wrapper mt-10">
                    <div class="editor-wrapper">
                        <div class="editor-title">
                            <label>Тип</label>
                            <div class="description">Уровень доступа</div>
                        </div>
                        <div class="editor-type-selector">
                            <div class="bg-selector">
                                <div class="selector"></div>
                            </div>
                            <div class="type-items">
                                <div class="item -select" data-value="private">
                                    <span>
                                        <svg viewBox="0 0 640 640" aria-hidden="true">
                                            <use href="#i-lock"></use>
                                        </svg>
                                    </span>
                                    Приватная
                                </div>
                                <div class="item" data-value="public">
                                    <span>
                                        <svg viewBox="0 0 640 640" aria-hidden="true">
                                            <use href="#i-globe"></use>
                                        </svg>
                                    </span>
                                    Публичная
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="win-actions-wrapper">
                    <div class="win-actions">
                        <div class="default-wrapper">
                            <div class="btn-action a-fill a-tt a-danger hide" data-type="remove">
                                <span>
                                    <svg viewBox="0 0 640 640" aria-hidden="true">
                                        <use href="#i-trash"></use>
                                    </svg>
                                </span>
                            </div>
                            <div class="btn-action a-fill a-text a-tt" data-type="cancel">Отменить</div>
                            <div class="btn-action a-fill a-text a-tt a-primary -dissable" data-type="accept">Создать коллекцию</div>
                        </div>
                    </div>
                </div>
                <div class="safe-area-actions mt-10"></div>
            </div>
        </span>
    </span>
    <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
        <symbol id="i-xmark" viewBox="0 0 640 640">
            <path
                d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" />
        </symbol>
        <symbol id="i-globe" viewBox="0 0 640 640">
            <path
                d="M415.9 344L225 344C227.9 408.5 242.2 467.9 262.5 511.4C273.9 535.9 286.2 553.2 297.6 563.8C308.8 574.3 316.5 576 320.5 576C324.5 576 332.2 574.3 343.4 563.8C354.8 553.2 367.1 535.8 378.5 511.4C398.8 467.9 413.1 408.5 416 344zM224.9 296L415.8 296C413 231.5 398.7 172.1 378.4 128.6C367 104.2 354.7 86.8 343.3 76.2C332.1 65.7 324.4 64 320.4 64C316.4 64 308.7 65.7 297.5 76.2C286.1 86.8 273.8 104.2 262.4 128.6C242.1 172.1 227.8 231.5 224.9 296zM176.9 296C180.4 210.4 202.5 130.9 234.8 78.7C142.7 111.3 74.9 195.2 65.5 296L176.9 296zM65.5 344C74.9 444.8 142.7 528.7 234.8 561.3C202.5 509.1 180.4 429.6 176.9 344L65.5 344zM463.9 344C460.4 429.6 438.3 509.1 406 561.3C498.1 528.6 565.9 444.8 575.3 344L463.9 344zM575.3 296C565.9 195.2 498.1 111.3 406 78.7C438.3 130.9 460.4 210.4 463.9 296L575.3 296z" />
        </symbol>
        <symbol id="i-ios-search" viewBox="0 0 10 10">
            <path
                d="M8 4C8 6.20914 6.20914 8 4 8C1.79086 8 0 6.20914 0 4C0 1.79086 1.79086 0 4 0C6.20914 0 8 1.79086 8 4ZM1.25895 4C1.25895 5.51384 2.48616 6.74105 4 6.74105C5.51384 6.74105 6.74105 5.51384 6.74105 4C6.74105 2.48616 5.51384 1.25895 4 1.25895C2.48616 1.25895 1.25895 2.48616 1.25895 4Z"
                fill="white" />
            <rect x="6.85144" y="5.7688" width="4.11406" height="1.63503" rx="0.817516"
                transform="rotate(45 6.85144 5.7688)" fill="white" />
        </symbol>
        <symbol id="i-trash" viewBox="0 0 640 640">
            <path
                d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z" />
        </symbol>
        <symbol id="i-lock" viewBox="0 0 640 640">
            <path
                d="M256 160L256 224L384 224L384 160C384 124.7 355.3 96 320 96C284.7 96 256 124.7 256 160zM192 224L192 160C192 89.3 249.3 32 320 32C390.7 32 448 89.3 448 160L448 224C483.3 224 512 252.7 512 288L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 288C128 252.7 156.7 224 192 224z" />
        </symbol>
    </svg>
</span>