import { User } from "../../modules/ShikiUSR.js";
import { WindowManagement } from "../../modules/Windows.js"
import { LoadNotifycation } from "./mod_notify.js";

const WindowNotify = {
    loaded: false,
    init: function () {
        //Функция нажатие на кнопку закрыть окно
        $('.content-notify > .content-wraper > .title-content > .btn-window-close').click(() => {
            _windowNotify.hide();
            this.hide();
        });

        //Нажатие на фильтр непрочитанные
        $('.notify-filter > #unread').click(function () {
            $('.content-notifycation').addClass('unread');
            $('.notify-filter > .selected').removeClass('selected');
            $(this).addClass('selected');
        });
        //Нажатие на фильтр все
        $('.notify-filter > #all').click(function () {
            $('.content-notifycation').removeClass('unread');
            $('.notify-filter > .selected').removeClass('selected');
            $(this).addClass('selected');
        });
    },
    show: function () {
        if (!this.loaded)
            LoadNotifycation({
                e: () => {
                    this.loaded = true;
                }
            });
    },
    hide: () => { },
    verif: () => { return User.authorized; }
}

const _windowNotify = new WindowManagement(WindowNotify, '.window-notify');

export const ShowNotifyWindow = () => { _windowNotify.click(); }