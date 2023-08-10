import { Sleep } from "../../modules/funcitons.js";

//Обьект управляем анимацией загрузки страницы
const _loading_page = {
    query: ".page-loading",

    /**
     * Remove animation loading page
     * @param {Event} e The event call when loaded.
     */
    loaded: async function (e = () => { }) {
        $(this.query).css("opacity", 0);
        await Sleep(600);
        $("body").removeClass("loading");
        $(this.query).css("display", "none");
        e();
    },

    /**
     * Showing animtion loading page
     * @param {Event} e The event call when showed animation loading
     */
    show: async function (e = () => { }) {
        $(this.query).css("display", "block");
        $("body").addClass("loading");
        $(this.query).css("opacity", 1);
        await Sleep(600);
        e();
    },
};

export const LoadPage = () => { return _loading_page; }