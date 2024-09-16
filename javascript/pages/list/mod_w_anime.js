import { ACard } from "../../modules/AnimeCard.js";
import { arraysAreEqual, Sleep } from "../../modules/functions.js";
import { GraphQl } from "../../modules/ShikiAPI.js";
import { WindowManagement } from "../../modules/Windows.js";

class Anime {
    constructor(ids = []) {
        this.ids = ids;
        this.page = 1;
        this.limit = 16;
        this.loaded = false;
    }

    Load(byList = false) {
        if (this.loaded) return new Promise((resolve) => { resolve() });

        let tempIds = [];

        if (byList) {
            tempIds = [...new Set(this.ids)];
            tempIds = tempIds.splice((this.page - 1) * this.limit, this.limit);
        }

        const load = () => {
            return new Promise((resolve) => {
                const param = {
                    ids: `"${this.ids.toString()}"`,
                    limit: this.limit,
                }

                if (byList) {
                    param.ids = `"${tempIds.toString()}"`;
                    param.limit = tempIds.length;
                } else {
                    param.page = this.page;
                }

                if (param.limit == 0) {
                    this.loaded = true;
                    return resolve();
                }

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

                    this.page++;

                    if (response.data.animes.length < this.limit) {
                        this.loaded = true;
                    }
                    if (!byList) {
                        for (let i = 0; i < response.data.animes.length; i++) {
                            const anime = response.data.animes[i];
                            $(`#window-anime > .list-anime`).append(ACard.GenV2({ anime, data: { score: anime?.userRate?.score }, exclude: ["score"] }));
                        }
                    } else {
                        for (let i = 0; i < tempIds.length; i++) {
                            const anime = response.data.animes.find(a => parseInt(a.id) == tempIds[i]);
                            $(`#window-anime > .list-anime`).append(ACard.GenV2({ anime, data: { score: anime?.userRate?.score }, exclude: ["score"] }));
                        }
                    }

                    resolve();
                }).POST(["id", "russian", "name", "score", { airedOn: ["year"] }, { poster: ["mainUrl"] }, "kind", { userRate: ["id", "status", "score", "updatedAt"] }], true);
            });
        }

        return load();
    }
}

const _anime_window = new WindowManagement({
    anime: undefined,
    init: function () {
        $(`.bar-anime > .close-btn`).click(() => {
            this.hide();
        });

        const $element = $('.content-anime');
        $element.on('scroll.closeWindow', function () {
            const scrollTop = $(this).scrollTop();
            if(scrollTop < 0 && scrollTop < -80){
                _anime_window.target.hide();
            }
        })
    },
    show: function () {
    },
    hide: function () {
        _anime_window.hide();
    },
    verif: function () {
        return true;
    },
    setup: function (list = []) {
        if (typeof this.anime === "undefined") {
            this.anime = new Anime(list);
            $(`#window-anime > .list-anime`).empty();
            return this.anime.Load(true);
        } else {
            if (arraysAreEqual(this.anime.ids, list)) {
                return new Promise((resolve) => { resolve() });
            } else {
                this.anime = new Anime(list);
                $(`#window-anime > .list-anime`).empty();
                return this.anime.Load(true);
            }
        }
    }
}, '.window-anime');

export const AnimeWindow = ({ list = [], title } = {}) => {
    
    return new Promise((resolve) => {
        const $element = $('.content-anime');
        _anime_window.target.setup(list).then(() => {
            $(`.bar-anime > .window-title`).text(title);
            _anime_window.click();
            resolve();
        });

        let lastScrollTop = 0;
        let load = false;
        $element.off('scroll.loadanime');
        $element.on('scroll.loadanime', function () {
            const scrollTop = $(this).scrollTop();
            if (scrollTop < lastScrollTop) {
                return;
            }
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
            if (scrollTop + 200 + $(this).innerHeight() >= $(this)[0].scrollHeight && !load) {
                load = true;
                _anime_window.target.anime.Load(true).then(() => {
                    load = false;
                });
            }
        });
    });
}