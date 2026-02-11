<div class="update-wrapper unselectable">
    <span class="tun-update" style="--progress: {{progress}}%;">
        <div class="tun-update-content">
            <div class="icon-update {{icon}}">
                <div class="icon download">
                    <div class="ticon i-ios-download"></div>
                </div>
                <div class="icon install">
                    <div class="ticon i-gear"></div>
                </div>
                <div class="icon complete">
                    <div class="ticon i-check"></div>
                </div>
            </div>
            <div class="update-text">
                <span class="update-title">{{title}} <span>{{version}}</span></span>
                <span class="update-info">Загружено: <span>{{progress}}%</span> из {{total}}</span>
            </div>
            <div class="tun-update-controls-wrapper">
                <div class="tun-update-controls">
                    <div class="btn-cancel">
                        <div class="ticon i-xmark"></div>Отмена
                    </div>
                </div>
            </div>
            <span class="tun-mouse"></span>
        </div>
    </span>
</div>