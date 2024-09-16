import { GraphQl } from "../../modules/ShikiAPI.js"
import { ACard } from "../../modules/AnimeCard.js";
import { Sleep } from "../../modules/functions.js";

export class AList {
    constructor({ core, status, limit = 10, dom } = {}) {
        this.page = 1;
        this.loaded = false;
        this.sort = undefined;

        this.list = [];

        this.core = core;
        this.status = status;
        this.limit = limit;
        this.$element = $(dom);

        this.inc = typeof inc !== "undefined" ? inc : [];

        this.history = {
            order: this.core.ORDER,
            sort: this.core.SORT
        }
    }

    /**
     * 
     * @param {{ins: "prepend" | "append", sort: {order: "year" | "score" | "serial"}, order: "asc" | "desc"}} param0 
     */
    Load({ ins, sort, order } = { ins: "prepend", order: "asc", sort: undefined }) {
        if (typeof sort === "undefined") {
            if (typeof this.sort !== "undefined") {
                this.sort = undefined;
                this.page = 1;
                this.loaded = false;
            }
            if (this.loaded) return this.Blank();
            return this.GetByUserRate(ins, order);
        } else {
            if (typeof this.sort === "undefined") {
                this.sort = { order: "none" };
            }
            if (this.sort.order !== sort.order) {
                this.sort = sort;
                this.page = 1;
                this.loaded = false;
            }
            if (this.loaded) return this.Blank();
            return this.GetByAnime(sort.order);
        }
    }

    GetByUserRate(ins, order) {
        const param = {
            page: this.page,
            limit: this.limit,
            targetType: "Anime",
            status: this.status,
            order: `{ field: updated_at, order: ${order} }`
        };

        this.history.sort = this.core.SORT;
        this.history.order = order;

        const load = () => {
            return new Promise((resolve) => {
                GraphQl.user_rate(param, async (response) => {
                    if (response.failed) {
                        if (response.status == 429) {
                            await Sleep(1000);
                            return load();
                        }
                        resolve();
                        return console.log('Не удалось загрузить список аниме');
                    }

                    if (response.errors) {
                        resolve();
                        return console.log('Не удалось загрузить список аниме');
                    }

                    if (this.page === 1) {
                        this.Empty();
                    }

                    this.page++;

                    if (response.data.userRates.length < this.limit) {
                        this.loaded = true;
                    }

                    if (order == "asc" && ins == "prepend") {
                        if (ins == "prepend") {
                            response.data.userRates.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                        } else {
                            response.data.userRates.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
                        }
                    } else if (order == "desc") {
                        if (ins == "append") {
                            response.data.userRates.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                        } else {
                            response.data.userRates.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
                        }
                    }

                    if (ins == "prepend") {
                        for (let i = 0; i < response.data.userRates.length; i++) {
                            const anime = response.data.userRates[i].anime;
                            const userRate = response.data.userRates[i];

                            this.$element.prepend(ACard.GenV2({ anime, data: { score: userRate.score, kind: anime.kind }, exclude: ["score"] }));
                            this.list.unshift(userRate);
                        }
                    } else if (ins == "append") {
                        for (let i = 0; i < response.data.userRates.length; i++) {
                            const anime = response.data.userRates[i].anime;
                            const userRate = response.data.userRates[i];

                            this.$element.append(ACard.GenV2({ anime, data: { score: userRate.score, kind: anime.kind }, exclude: ["score"] }));
                            this.list.push(userRate);
                        }
                    }
                    resolve();
                }).POST(["id", "status", "score", "updatedAt", { anime: ["id", "russian", "name", "score", { airedOn: ["year"] }, { poster: ["mainUrl"] }, "kind"] }]);
            });
        }

        return load();
    }

    GetByAnime(order) {
        const param = {
            page: this.page,
            limit: this.limit,
            mylist: `"${this.status}"`,
            order: "ranked"
        };

        this.history.sort = { order };
        this.history.order = this.core.ORDER;

        if (order == "year") {
            param.order = "aired_on";
        } else if (order == "popul") {
            param.order = "popularity";
        }

        const load = () => {
            return new Promise((resolve) => {
                GraphQl.animes(param, async (response) => {
                    if (response.failed) {
                        if (response.status == 429) {
                            await Sleep(1000);
                            return load();
                        }
                        resolve();
                        return console.log('Не удалось загрузить список аниме');
                    }

                    if (response.errors) {
                        resolve();
                        return console.log('Не удалось загрузить список аниме');
                    }

                    if (this.page === 1) {
                        this.Empty();
                    }

                    this.page++;

                    if (response.data.animes.length < this.limit) {
                        this.loaded = true;
                    }

                    for (let i = 0; i < response.data.animes.length; i++) {
                        const userRate = response.data.animes[i].userRate;
                        delete response.data.animes[i].userRate;
                        const anime = response.data.animes[i];
                        userRate.anime = anime;

                        this.list.push(userRate);
                        this.$element.append(ACard.GenV2({ anime, data: { score: userRate.score, kind: anime.kind }, exclude: ["score"] }));

                    }

                    resolve();
                }).POST(["id", "russian", "name", "score", { airedOn: ["year"] }, { poster: ["mainUrl"] }, "kind", { userRate: ["id", "status", "score", "updatedAt"] }], true);
            });
        }

        return load();
    }

    Empty() {
        for (let i = 0; i < this.list.length; i++) {
            $(`.card-anime[data-id="${this.list[i].anime.id}"]`).remove();
        }
        this.page = 1;
        this.loaded = false;
        this.list = [];
    }

    Hide() {
        for (let i = 0; i < this.list.length; i++) {
            $(`.card-anime[data-id="${this.list[i].anime.id}"]`).remove();
        }
    }

    Show(ins = "prepend") {
        if (this.core.SORT?.order !== this.history.sort?.order) {
            return this.Update({ order: this.core.ORDER, sort: this.core.SORT });
        } else if (this.core.ORDER !== this.history.order) {
            return this.Update({ order: this.core.ORDER, sort: this.core.SORT });
        }

        if (ins == "prepend") {
            for (let i = 0; i < this.list.length; i++) {
                this.$element.prepend(ACard.GenV2({ anime: this.list[i].anime, data: { score: this.list[i].score, kind: this.list[i].anime.kind }, exclude: ["score"] }));
            }
        } else {
            for (let i = 0; i < this.list.length; i++) {
                this.$element.append(ACard.GenV2({ anime: this.list[i].anime, data: { score: this.list[i].score, kind: this.list[i].anime.kind }, exclude: ["score"] }));
            }
        }
    }

    Blank() {
        return new Promise((resolve) => {
            resolve();
        });
    }

    Update({ sort, order } = {}) {
        if (this.loaded) {
            this.Hide();

            if (typeof sort !== "undefined") {
                if (sort.order == "year") {
                    this.list.sort((a, b) => new Date(a.anime.airedOn.year) - new Date(b.anime.airedOn.year));
                } else {
                    this.list.sort((a, b) => a.anime.score - b.anime.score);
                }
            } else {
                if (order == "asc") {
                    this.list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                } else {
                    this.list.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
                }
            }

            this.history.sort = sort;
            this.history.order = order;

            this.Show();
            return this.Blank();
        } else {
            this.Empty();
            return this.Load({ ins: "prepend", sort, order });
        }
    }
}