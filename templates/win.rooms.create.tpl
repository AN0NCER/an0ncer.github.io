<span class="windowed window-users-search hide">
    <span class="hide-window"></span>
    <span class="window-content content-users-search scroll-none hide">
        <span class="content-wrapper">
            <div class="wrapper">
                <div class="window-bar users-search-bar">
                    <div class="window-title">Создание комнаты</div>
                    <div class="window-close">
                        <div class="ticon i-xmark"></div>
                    </div>
                </div>

                <div class="users-search-list-wrapper">
                    <div class="grid-wrapper-list">
                        <div class="users-search-grid-list"></div>
                    </div>
                </div>

                <div class="rooms-config-wrapper">
                    <div class="config-wrapper-list">
                        <div class="config-btn-wrapper">
                            <input type="checkbox" name="allow-pause" id="allow-pause">
                            <label for="allow-pause">
                                <svg class="icon" viewBox="0 0 640 640" aria-hidden="true">
                                    <use href="#i-pause"></use>
                                </svg>
                                <div class="config-info-wrapper">
                                    <div class="config-name">Совместные Паузы</div>
                                    <div class="type-value -enable">Включены</div>
                                    <div class="type-value -disable">Отключены</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <span class="users-search-list-search">
                <div class="users-search-search-wrapper">
                    <input type="text" placeholder="Выбрано 0 пользователей" disabled>
                    <div class="btn-cancel">
                        Отменить
                    </div>
                    <div class="btn btn-new">
                        <div class="ticon i-check"></div>
                    </div>
                </div>
            </span>
        </span>
    </span>
    <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        <symbol id="i-pause" viewBox="0 0 640 640">
            <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
            <path d="M176 96C149.5 96 128 117.5 128 144L128 496C128 522.5 149.5 544 176 544L240 544C266.5 544 288 522.5 288 496L288 144C288 117.5 266.5 96 240 96L176 96zM400 96C373.5 96 352 117.5 352 144L352 496C352 522.5 373.5 544 400 544L464 544C490.5 544 512 522.5 512 496L512 144C512 117.5 490.5 96 464 96L400 96z" />
        </symbol>
    </svg>
    <template id="tpl-card-empty">
        <span class="empty-card">
            <div class="title">Список пуст</div>
            <div class="add">Найдите друга на странице пользователя и добавьте в друзья чтобы смотреть в совместном
                просмотре</div>
        </span>
    </template>
    <template id="tpl-user-card">
        <div class="user-card">
            <div class="user-profile-wrapper">
                <div class="img-wrapper" data-field="image" style="--img: url(/images/ava.jpeg)">
                </div>
                <div class="user-profile-info">
                    <div class="user-profile-name" data-field="usertags">
                        <div class="user-name" data-field="username">Пользователь</div>
                    </div>
                    <div class="user-profile-status">
                        <div class="user-profile-type" data-field="tuntype">Shiki Пользователь</div>
                        <div class="user-profile-online" data-field="useronline">Оффлайн</div>
                    </div>
                </div>
            </div>
            <div class="user-control-wrapper">
                <div class="btn btn-select">
                    <div class="ticon i-plus"></div>
                    <div class="ticon i-minus"></div>
                </div>
            </div>
        </div>
    </template>
</span>