import { ApiTunime } from "../../modules/TunimeApi.js";
import { Sleep } from "../../modules/funcitons.js";
import { $ID } from "../watch.js";

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

    error(message) {
        $(`${this.query} > .wrapper`).append(`<div class="text-error">Ошибка: ${message}. Попробуйте перезапустить страницу</div>`);
    },

    step(prcnt) {
        $(`${this.query} > .wrapper > .progress > .bar`).css("width", `${prcnt}%`);
    }
};

export const LoadPage = () => { return _loading_page; }

export class LoadPageLogs {

    constructor(count) {
        this.timeout;
        this.history = { list: [], ms: 0 };
        this.inprocess = [];
        this.step = 100 / count;
        this.prcnt = 0;
    }

    #add(id, type, data) {
        if (this.inprocess.findIndex(x => x.id === id && x.type === type) != -1) {
            return;
        }
        this.inprocess.push(data);
    }

    get add() {
        return {
            request: (id) => {
                const type = 'request';
                const start = Date.now();
                const ms = 0;
                this.#add(id, type, { id, type, start, ms, count: 0, message: '' });
            },
            imageload: (id) => {
                const type = 'imageload';
                const start = Date.now();
                const ms = 0;
                this.#add(id, type, { id, type, start, ms });
            },
            synch: (id) => {
                const type = 'synchron';
                const start = Date.now();
                const ms = 0;
                this.#add(id, type, { id, type, start, ms });
            },
            data: (id) => {
                const type = 'setdata';
                const start = Date.now();
                const ms = 0;
                this.#add(id, type, { id, type, start, ms });
            }
        }
    }

    get update() {
        return {
            request: (id, count = 1) => {
                const type = 'request';
                const index = this.inprocess.findIndex(x => x.id === id && x.type === type);
                if (index === -1) {
                    return;
                }
                this.inprocess[index].count += count;
            }
        }
    }

    #error(id, type) {
        const index = this.inprocess.findIndex(x => x.id === id && x.type === type);
        if (index === -1) {
            return;
        }
        this.inprocess[index].message = 'ERR';
        this.inprocess[index].ms = Date.now() - this.inprocess[index].start;
        for (let i = 0; i < this.inprocess.length; i++) {
            const element = this.inprocess[i];
            this.history.list.push({
                name: element.id,
                message: element.message,
                ms: element.ms,
                type: element.type,
                count: element.count
            });
        }
        ApiTunime.loadpage(this.history, $ID);
    }

    get error() {
        return {
            request: (id) => {
                this.#error(id, 'request');
            },

            imageload: (id) => {
                this.#error(id, 'imageload');
            }
        }
    }

    #end(id, type) {
        const index = this.inprocess.findIndex(x => x.id === id && x.type === type);
        if (index === -1) {
            return;
        }
        this.inprocess[index].message = 'OKK';
        this.inprocess[index].ms = Date.now() - this.inprocess[index].start;
        this.prcnt += this.step;
        _loading_page.step(this.prcnt);
    }

    #get(id, type) {
        const index = this.inprocess.findIndex(x => x.id === id && x.type === type);
        if (index === -1) {
            return;
        }
        return this.inprocess[index];
    }

    #remove(id, type) {
        const index = this.inprocess.findIndex(x => x.id === id && x.type === type);
        if (index === -1) {
            return;
        }
        this.history.ms += this.inprocess[index].ms;
        this.inprocess.splice(index, 1);
    }

    get end() {
        return {
            request: (id) => {
                const type = 'request';
                this.#end(id, type)
                const data = this.#get(id, type);
                if (!data) {
                    return;
                }

                this.history.list.push({
                    name: id,
                    message: data.message,
                    ms: data.ms,
                    type: type,
                    count: data.count
                });
                this.#remove(id, type);
            },
            imageload: (id) => {
                const type = 'imageload';
                this.#end(id, type);
                const data = this.#get(id, type);
                if (!data) {
                    return;
                }

                this.history.list.push({
                    name: id,
                    message: data.message,
                    ms: data.ms,
                    type: type,
                });
                this.#remove(id, type);
            },
            synch: (id) => {
                const type = 'synchron';
                this.#end(id, type);
                const data = this.#get(id, type);
                if (!data) {
                    return;
                }
                this.history.list.push({
                    name: id,
                    message: data.message,
                    ms: data.ms,
                    type: type,
                });
                this.#remove(id, type);
            },
            data: (id) => {
                const type = 'setdata';
                this.#end(id, type);
                const data = this.#get(id, type);
                if (!data) {
                    return;
                }
                this.history.list.push({
                    name: id,
                    message: data.message,
                    ms: data.ms,
                    type: type,
                });
                this.#remove(id, type);
            }
        }
    }

    complete() {
        if (this.inprocess.length != 0) {
            for (let i = 0; i < this.inprocess.length; i++) {
                const element = this.inprocess[i];
                this.#end(element.id, element.type);
            }
        }
        if (this.history.ms >= 10000) {
            ApiTunime.loadpage(this.history, $ID);
        }
    }
}