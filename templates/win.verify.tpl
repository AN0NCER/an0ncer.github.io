<span class="windowed verify-action hide" id="verify-{{id}}">
    <span class="hide-window"></span>
    <span class="window-content hide">
        <span class="content-wrapper">
            <div class="verify-task-wrapper">
                <div class="verify-task">
                    <div class="icon">
                        <div class="ticon i-microchip"></div>
                    </div>
                    <div class="content">
                        <div class="title">{{title}}</div>
                        <div class="description">Подтвердить действие</div>
                    </div>
                </div>
            </div>
            <div class="verify-image-wrapper">
                <div class="verify-image">
                    <img src="/images/verify.action.png" alt="{{title}}">
                </div>
            </div>
            <div class="access-footer">
                <span class="detail">
                    {{warning}}
                </span>
                <div class="access-swiper">
                    <div class="pin" id="pin-{{id}}">
                        <div class="ticon i-angles-right"></div>
                    </div>
                    <span id="swipeText-{{id}}">Проведите</span>
                </div>
                <div id="cancel-{{id}}" class="btn">
                    Отменить действие
                </div>
            </div>
        </span>
    </span>
</span>