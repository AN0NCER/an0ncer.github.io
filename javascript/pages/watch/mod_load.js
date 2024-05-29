class Progress {
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

//Класс управляем анимацией загрузки страницы
export class LoadScreen {
    static query = ".page-loading";
    static loaded = false;
    static #onLoaded = [];

    constructor(steps = 1) {
        this.progress = new Progress(steps);
    }

    static Loaded(e = () => { }) {
        return new Promise(async (resolve) => {
            anime({
                targets: this.query,
                opacity: 0,
                easing: 'linear',
                duration: 500,
                complete: () => {
                    this.loaded = true;
                    $("body").removeClass("loading");
                    $(this.query).css("display", "none");
                    e();
                    this.#onLoaded.forEach((val) => val());
                    return resolve(true);
                }
            })
        });
    }

    /**
    * 
    * @param {'loaded'} name 
    * @param {function} event 
    */
    static On(name, event = () => { }) {
        if (name === 'loaded') {
            if (this.loaded) {
                event();
            }
            this.#onLoaded.push(event);
        }
    }
}