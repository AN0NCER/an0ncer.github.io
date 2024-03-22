import { Sleep } from "../../modules/funcitons.js";

//Класс управляем анимацией загрузки страницы
export class LoadScreen {
    static query = ".page-loading";

    /**
     * Завершает анимацию загрузки страницы
     * @param {Function} e 
     * @returns {true}
     */
    static loaded(e = () => { }) {
        return new Promise(async (resolve) => {
            $(this.query).css("opacity", 0);
            await Sleep(600);
            $("body").removeClass("loading");
            $(this.query).css("display", "none");
            e();
            return resolve(true);
        });
    }

    constructor(steps = 1) {
        this.progress = 0;
        this.steps = steps;
        this.prcnt = 100 / steps;
    }

    Step() {
        if (this.progress >= 100) {
            return;
        }
        this.progress += this.prcnt;
        $(`${LoadScreen.query} > .wrapper > .progress > .bar`).css("width", `${this.progress}%`);
    }
}