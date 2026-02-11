<span class="windowed window-rooms hide">
    <span class="hide-window"></span>
    <span class="window-content content-rooms scroll-none hide">
        <span class="content-wrapper">
            <div class="wrapper">
                <div class="window-bar rooms-bar">
                    <div class="window-title">Совместный просмотр</div>
                    <div class="window-close">
                        <div class="ticon i-xmark"></div>
                    </div>
                </div>

                <div class="rooms-list-wrapper">
                    <div class="grid-wrapper-list">
                        <div class="rooms-grid-list"></div>
                    </div>
                </div>
            </div>
            <span class="rooms-list-search">
                <div class="rooms-search-wrapper">
                    <div class="btn btn-reload">
                        <div class="ticon i-rotate-right"></div>
                        <span class="timer">30</span>
                    </div>
                    <input type="text" placeholder="Найти комнату">
                    <div class="btn btn-new">
                        <div class="ticon i-plus"></div>
                    </div>
                </div>
            </span>
        </span>
    </span>
    <template id="room-card-template">
        <div class="room-card">
            <div class="room-description">
                <div class="room-owner">
                    <div class="owner-wrapper">
                        <div class="owner-avatar" data-field="image" style="--img: url('/images/ava.jpeg')"></div>
                        <div class="owner-text-wrapper">
                            <div class="owner-type">Комната</div>
                            <div class="owner-nickname" data-field="name">Пользователь</div>
                        </div>
                    </div>
                    <span class="room-type" data-field="type">Доступ</span>
                </div>
                <div class="room-stats-wrapper">
                    <div class="room-stats">
                        <div class="stats-name">В озвучке:</div>
                        <div class="stats-value" data-field="voice">Нету</div>
                    </div>
                    <div class="vline"></div>
                    <div class="room-stats">
                        <div class="stats-name">Эпизод:</div>
                        <div class="stats-value" data-field="episode">0 из 0</div>
                    </div>
                    <div class="vline"></div>
                    <div class="room-connect-btn">
                        <svg viewBox="0 0 640 640" aria-hidden="true" data-field="id">
                            <use href="#i-right-to-bracket"></use>
                        </svg>
                        Войти
                    </div>
                </div>
            </div>
            <div class="room-small-info">
                <div class="left-wrapper">
                    <span class="small-block">
                        <svg viewBox="0 0 640 640" aria-hidden="true">
                            <use href="#i-users"></use>
                        </svg>
                        <span class="value" data-field="members">0</span>
                    </span>
                    <span class="small-block">
                        <svg viewBox="0 0 640 640" aria-hidden="true">
                            <use href="#i-link"></use>
                        </svg>
                        <span class="value" data-field="await">0</span>
                    </span>
                </div>
                <span class="small-block">
                    <svg viewBox="0 0 640 640" aria-hidden="true">
                        <use href="#i-clock"></use>
                    </svg>
                    <span class="value" data-field="livetime">0 Секунд</span>
                </span>
            </div>
        </div>
    </template>
    <template id="room-card-empty">
        <span class="empty-card">
            <div class="title">Список пуст</div>
            <div class="add">Создай комнату для просмотра аниме со своими друзьями</div>
        </span>
    </template>
    <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        <symbol id="i-link" viewBox="0 0 640 640">
            <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
            <path
                d="M451.5 160C434.9 160 418.8 164.5 404.7 172.7C388.9 156.7 370.5 143.3 350.2 133.2C378.4 109.2 414.3 96 451.5 96C537.9 96 608 166 608 252.5C608 294 591.5 333.8 562.2 363.1L491.1 434.2C461.8 463.5 422 480 380.5 480C294.1 480 224 410 224 323.5C224 322 224 320.5 224.1 319C224.6 301.3 239.3 287.4 257 287.9C274.7 288.4 288.6 303.1 288.1 320.8C288.1 321.7 288.1 322.6 288.1 323.4C288.1 374.5 329.5 415.9 380.6 415.9C405.1 415.9 428.6 406.2 446 388.8L517.1 317.7C534.4 300.4 544.2 276.8 544.2 252.3C544.2 201.2 502.8 159.8 451.7 159.8zM307.2 237.3C305.3 236.5 303.4 235.4 301.7 234.2C289.1 227.7 274.7 224 259.6 224C235.1 224 211.6 233.7 194.2 251.1L123.1 322.2C105.8 339.5 96 363.1 96 387.6C96 438.7 137.4 480.1 188.5 480.1C205 480.1 221.1 475.7 235.2 467.5C251 483.5 269.4 496.9 289.8 507C261.6 530.9 225.8 544.2 188.5 544.2C102.1 544.2 32 474.2 32 387.7C32 346.2 48.5 306.4 77.8 277.1L148.9 206C178.2 176.7 218 160.2 259.5 160.2C346.1 160.2 416 230.8 416 317.1C416 318.4 416 319.7 416 321C415.6 338.7 400.9 352.6 383.2 352.2C365.5 351.8 351.6 337.1 352 319.4C352 318.6 352 317.9 352 317.1C352 283.4 334 253.8 307.2 237.5z" />
        </symbol>
        <symbol id="i-users" viewBox="0 0 640 640">
            <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
            <path
                d="M320 80C377.4 80 424 126.6 424 184C424 241.4 377.4 288 320 288C262.6 288 216 241.4 216 184C216 126.6 262.6 80 320 80zM96 152C135.8 152 168 184.2 168 224C168 263.8 135.8 296 96 296C56.2 296 24 263.8 24 224C24 184.2 56.2 152 96 152zM0 480C0 409.3 57.3 352 128 352C140.8 352 153.2 353.9 164.9 357.4C132 394.2 112 442.8 112 496L112 512C112 523.4 114.4 534.2 118.7 544L32 544C14.3 544 0 529.7 0 512L0 480zM521.3 544C525.6 534.2 528 523.4 528 512L528 496C528 442.8 508 394.2 475.1 357.4C486.8 353.9 499.2 352 512 352C582.7 352 640 409.3 640 480L640 512C640 529.7 625.7 544 608 544L521.3 544zM472 224C472 184.2 504.2 152 544 152C583.8 152 616 184.2 616 224C616 263.8 583.8 296 544 296C504.2 296 472 263.8 472 224zM160 496C160 407.6 231.6 336 320 336C408.4 336 480 407.6 480 496L480 512C480 529.7 465.7 544 448 544L192 544C174.3 544 160 529.7 160 512L160 496z" />
        </symbol>
        <symbol id="i-clock" viewBox="0 0 640 640">
            <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
            <path
                d="M320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64zM296 184L296 320C296 328 300 335.5 306.7 340L402.7 404C413.7 411.4 428.6 408.4 436 397.3C443.4 386.2 440.4 371.4 429.3 364L344 307.2L344 184C344 170.7 333.3 160 320 160C306.7 160 296 170.7 296 184z" />
        </symbol>
        <symbol id="i-right-to-bracket" viewBox="0 0 640 640">
            <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
            <path
                d="M409 337C418.4 327.6 418.4 312.4 409 303.1L265 159C258.1 152.1 247.8 150.1 238.8 153.8C229.8 157.5 224 166.3 224 176L224 256L112 256C85.5 256 64 277.5 64 304L64 336C64 362.5 85.5 384 112 384L224 384L224 464C224 473.7 229.8 482.5 238.8 486.2C247.8 489.9 258.1 487.9 265 481L409 337zM416 480C398.3 480 384 494.3 384 512C384 529.7 398.3 544 416 544L480 544C533 544 576 501 576 448L576 192C576 139 533 96 480 96L416 96C398.3 96 384 110.3 384 128C384 145.7 398.3 160 416 160L480 160C497.7 160 512 174.3 512 192L512 448C512 465.7 497.7 480 480 480L416 480z" />
        </symbol>
    </svg>
</span>