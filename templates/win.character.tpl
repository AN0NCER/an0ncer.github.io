<span class="windowed window-character hide win-char-{{id}}" data-id="{{id}}" style="--z: {{z}};">
    <span class="hide-window"></span>
    <span class="window-content contecnt-character scroll-none hide">
        <span class="content-wrapper">
            <div class="wrapper">
                <div class="window-bar banner-character">
                    <div class="window-close">
                        <span class="icon">
                            <div class="ticon i-chevron-left"></div>
                        </span>
                        <span class="text">Назад</span>
                    </div>
                    <div class="window-title">
                        <div class="character-name"></div>
                        <div class="character-source">
                            <span class="val">0 Аниме</span>
                            <div class="point"></div>
                            <span class="val">0 Манги</span>
                        </div>
                    </div>
                    <div class="btn-character-favorite">
                        <div class="ticon i-heart-regular"></div>
                        <div class="ticon i-heart-solid"></div>
                    </div>
                </div>
                <div class="character-wrapper">
                    <div class="character-description-wrapper">
                        <div class="character-description-text -hide">
                            <div class="character-preview">
                                <img src="/images/noanime.png">
                            </div>
                            <p></p>
                            <div class="btn" id="all-description-character">Развернуть</div>
                        </div>
                    </div>
                    <div class="character-gallery-wrapper -hide">
                        <div class="title-wrapper">
                            Галерея
                        </div>
                        <div class="gallery-tips-wrapper">
                            <div class="gallery-wrapper-list scroll-none">
                                <div class="gallery-character">
                                </div>
                            </div>
                            <div class="select-character-tips-wrapper -disable">
                                <div class="select-character-tips">
                                    <div class="selector-character-preview">
                                        <div class="tips">
                                            <p class="main">Вы можете выбрать изображение персонажа.</p>
                                            <p class="text">Если персонаж уже в избранном, новое изображение применится
                                                после нажатия «Установить».</p>
                                        </div>
                                        <div class="image">
                                            <img src="/images/noanime.png"
                                                alt="">
                                        </div>
                                    </div>
                                    <div class="btn-install">Установить</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="character-role-selector-wrapper">
                        <div class="character-role-selector scroll-none">
                            <div class="role" data-type="main">
                                <span class="count">0</span>
                                Главные роли
                            </div>
                            <div class="role" data-type="supp">
                                <span class="count">0</span>
                                Второстепенные роли
                            </div>
                            <div class="role" data-type="pv">
                                <span class="count">0</span>
                                Проморолики
                            </div>
                        </div>
                    </div>
                    <div class="character-role-wrapper">
                        <div class="main-role-list scroll-none -hide" data-type="main">
                            <div class="main-role-character"></div>
                        </div>
                        <div class="sup-role-list scroll-none -hide" data-type="supp">
                            <div class="sup-role-character"></div>
                        </div>
                        <div class="pv-role-list scroll-none -hide" data-type="pv">
                            <div class="pv-role-character"></div>
                        </div>
                    </div>
                    <div class="marquee character-studios scroll-none">
                        <div class="marquee__track" id="track">
                        </div>
                    </div>
                </div>
            </div>
        </span>
    </span>
</span>