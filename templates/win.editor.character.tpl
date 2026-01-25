<span class="windowed window-character-edit hide" style="--z: {{z}};">
    <span class="hide-window"></span>
    <span class="window-content content-character-edit hide">
        <span class="content-wrapper scroll-none">
            <div class="wrapper">
                <div class="window-bar character-edit-bar">
                    <div class="window-title">Редактор песронажа</div>
                    <div class="window-close">
                        <div class="ticon i-xmark"></div>
                    </div>
                </div>
                <div class="character-edit-wrapper">
                    <div class="character-editor">
                        <div class="character-wrapper-show-box">
                            <svg id="hexagon" width="174" height="200" viewBox="0 0 174 200">
                                <defs>
                                    <clipPath id="hexClip">
                                        <path
                                            d="M82.0172 1.32985C85.1024 -0.443295 88.8976 -0.443291 91.9828 1.32986L168.983 45.5827C172.087 47.3665 174 50.6731 174 54.2529V142.679C174 146.259 172.087 149.566 168.983 151.35L91.9828 195.602C88.8976 197.376 85.1024 197.376 82.0172 195.602L5.01715 151.35C1.91348 149.566 0 146.259 0 142.679V54.2529C0 50.6731 1.91348 47.3665 5.01716 45.5827L82.0172 1.32985Z" />
                                    </clipPath>
                                </defs>
                                <g clip-path="url(#hexClip)">
                                    <image id="mainImage"
                                        href="/images/noanime.png"
                                        x="0" y="0" width="174" preserveAspectRatio="xMidYMid slice" />
                                </g>
                                <path
                                    d="M82.1172 1.50327C85.1406 -0.234211 88.8594 -0.234211 91.8828 1.50327L168.883 45.7562C171.924 47.5042 173.8 50.7451 173.8 54.2533V142.679C173.8 146.187 171.924 149.428 168.883 151.176L91.8828 195.429C88.8594 197.167 85.1406 197.167 82.1172 195.429L5.11719 151.176C2.07558 149.428 0.200195 146.187 0.200195 142.679V54.2533C0.200195 50.7451 2.07558 47.5042 5.11719 45.7562L82.1172 1.50327Z"
                                    stroke="white" stroke-opacity="0.8" stroke-width="0.4" fill="none" />
                            </svg>
                            <div class="img-wrapper">
                                <img src="/images/noanime.png"
                                    alt="">
                            </div>
                        </div>
                        <div class="loading">
                            <div class="ticon i-circle-notch"></div>
                        </div>
                        <canvas style="display: none;" id="grid-editor"></canvas>
                    </div>
                    <div class="banner-descripton">
                        <span class="d">Сдвиньте изображение вверх или вниз для лучшего отображения персонажа.<br/> Здесь вы также можете изменить выбранного персонажа или удалить его со страницы.</span>
                    </div>
                </div>
            </div>
        </span>
        <span class="character-edit-input">
            <div class="character-edit-input-wrapper">
                <div class="input">{{title}}</div>
                <div class="btn btn-character-cancel">
                    Отменить
                </div>
                <div class="btn btn-character-add">
                    <div class="ticon i-check"></div>
                </div>
            </div>
        </span>
    </span>
</span>