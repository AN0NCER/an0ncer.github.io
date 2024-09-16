import { WindowManagement } from "../../modules/Windows.js";

const _windowFilter = new WindowManagement({
    callbacks: {},
    init: function () {
        $(`.bar-filter > .close-btn`).on("click", () => {
            this.hide();
        });
        $(`.bar-filter > .clear-btn`).on("click", () => {
            this.Dispatch('clear', this);
        });
        $(`.content-filter > .content-wraper > .btn-accept`).on("click", () => {
            this.hide();
        })
    },
    show: function () {
        _windowFilter.show();
    },
    hide: function () {
        _windowFilter.hide();
        this.Dispatch('hide', this);
    },
    verif: function () {
        return true;
    },
    anim: {
        showed: function () { },
        hided: function () { },
    },

    Dispatch(event, data) {
        if (this.callbacks[event] === undefined) return;
        this.callbacks[event].forEach(callback => callback(data));
    },

    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.callbacks[event] === undefined) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }
}, '.window-filter');

export class AFilter {
    #sorts = [
        { order: "year" },
        { order: "score" },
        { order: "popul" }
    ];

    #orders = [
        "asc",
        "desc"
    ];

    constructor({ core } = {}) {
        this.core = core;
        this.data = this.default;

        $('.btn-filter').on('click', () => {
            _windowFilter.click();
        });

        $('.item-filter').on('click', (e) => {
            const el = $(e.currentTarget)
            if (el.hasClass("select")) {
                if (el.attr("id") === "sort-update") {
                    const i = this.#orders.findIndex(x => x !== el.attr("data-order"));
                    this.data.order = this.#orders[i];
                    this.Visual();
                }
                return;
            }

            const i = this.#sorts.findIndex(x => x.order === el.attr("id"));
            if (i === -1) {
                this.data.sort = undefined;
                return this.Visual();
            }
            this.data.sort = this.#sorts[i];
            this.Visual();
        });

        _windowFilter.target.on('hide', (e) => {
            this.core.NewSort(this.data);
        });

        _windowFilter.target.on('clear', (e) => {
            this.data = this.default;
            this.Visual();
            this.core.NewSort(this.data);
        })

        this.Visual();
    }

    get default() {
        return {
            sort: undefined,
            order: 'desc'
        }
    }

    Visual() {
        if (typeof this.data.sort === "undefined") {
            $('.item-filter').removeClass("select");
            const e = $('#sort-update');
            e.addClass("select");
            e.attr('data-order', this.data.order);
        } else {
            const order = this.data.sort.order;
            if (this.#sorts.findIndex(x => x.order === order) !== -1) {
                $('.item-filter').removeClass("select");
                $(`#${order}`).addClass("select");
            }
        }
    }
}