import { $RULES } from "../watch.js";

class progress {
    #steps = 1

    constructor() {
        this.progress = 0;
        this.prcnt = 100 / this.#steps;
    }

    set steps(val) {
        this.#steps = val;
        this.prcnt = 100 / this.#steps;
    }

    get steps() {
        return this.#steps;
    }

    NewStep() {
        if (this.progress >= 100) {
            return;
        }
        this.progress += this.prcnt;
        $(`.page-loading > .load-content > .wrapper > .progress > .bar`).css("width", `${this.progress}%`);
    }
}

class lTransition {
    /**@type {lTransition} */
    static #class;

    /**
     * @returns {lTransition}
     */
    static Init() {
        if (this.#class === undefined) {
            this.#class = new lTransition();
        }
        return this.#class;
    }

    constructor() {
        this.Progress = new progress();
        this.Loading = {
            keys: {
                "point-events": { key: "--s-events", value: `all` },
                "image": { key: "--image", value: undefined },
                "image-gradient": { key: "--i-gradient", value: `linear-gradient(rgba(0, 0, 0, 0.5), rgb(0, 0, 0))` },
                "image-postion": { key: "--i-position", value: `center center` },
                "image-size": { key: "--i-size", value: `cover` },
                "image-repeat": { key: "--i-repeat", value: `no-repeat` },
                "progress-color": { key: "--p-bar", value: `#5fbff325` },
                "background": { key: "--background", value: `#101318` },
                "animation-display": { key: "--a-display", value: `none` },
                "animation-background": { key: "--a-background", value: `#000` },
            },

            /**
             * Устанавливает значение настройки для загрузки страницы
             * @param {"point-events" | "image" | "image-gradient" | "image-postion" | "image-size" | "image-repeat" | "progress-color" | "background" | "animation-display" | "animation-background" | Array<{name: "point-events" | "image" | "image-gradient" | "image-postion" | "image-size" | "image-repeat" | "progress-color" | "background" | "animation-display" | "animation-background", value: string}} name 
             * @param {string} value - значение
             */
            Parameters(name, value) {
                const element = $(`.page-loading`);
                if (Array.isArray(name)) {
                    // Если name является массивом, проходимся по каждому элементу
                    name.forEach(({ name, value }) => {
                        if (this.keys[name]) {
                            element.css(this.keys[name].key, value);
                        }
                    });
                } else {
                    // Если name - строка, устанавливаем одно значение
                    if (this.keys[name]) {
                        element.css(this.keys[name].key, value);
                    }
                }
            }
        }
        this.Image = {
            Load: (url, callback = () => { }) => {
                const image = new Image();
                image.onload = () => {
                    callback(url);
                };
                image.src = url
            }
        }
    }

    async Loaded(e = () => { }) {
        if ($RULES?.animation) {
            await new Promise(resolve => $RULES.animation(resolve));
            $("body").removeClass("loading");
            $(`.page-loading`).css("display", "none");
            e();
        } else {
            return new Promise((resolve) => {
                anime({
                    targets: '.page-loading',
                    opacity: 0,
                    easing: 'linear',
                    duration: 500,
                    complete: () => {
                        $("body").removeClass("loading");
                        $(`.page-loading`).css("display", "none");
                        e();
                        this.#Dispatch("loaded", {});
                        return resolve(true);
                    }
                });
            });
        }
    }

    #callbacks = {
        "loaded": [],
    };

    /**
    * Добавляет обработчик события.
    * @param { "loaded" } event - Название события.
    * @param {Function} callback - Функция обработчик события.
    */
    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
    }

    #Dispatch(event, data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(data));
    }
}

export const LTransition = lTransition.Init();