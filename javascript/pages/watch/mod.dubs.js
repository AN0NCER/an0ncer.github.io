import { TNotifi } from "../../modules/tun.notification.js";
import { DBAnime } from "./mod.db.js";
import { $ANIME } from "./mod.resource.js";

export const DUB = new class {
    constructor() {
        this.el = $('.dub-controller');
    }

    #current = undefined;

    select(dub, isFavor = false) {
        this.#current = dub;
        const isNotifi = [0, 1].includes(TNotifi.getUIState());
        // Массивом: removeClass берёт только первый аргумент
        this.el.removeClass(['-no-select', '-notify', '-favor']);
        this.el.attr('data-type', dub.translation.type);
        this.el.find('.name').text(dub.translation.title);
        this.el.find('.dub-episodes').text(`${dub.last_episode || 1} EP`);

        if (isFavor) {
            this.el.addClass('-favor');
        }

        if (isNotifi) {
            const save = DBAnime.get("notifications");
            this.el.toggleClass('-on-notify', save.includes(dub.id));
        }

        this.canNotify(dub.episodes_count).then((can) => {
            // Пока ждали $ANIME, могли выбрать другую озвучку
            if (this.#current !== dub) return;
            if (can && isNotifi) {
                this.el.addClass('-notify');
            }
        })
    }

    async canNotify(episodes_count) {
        if(typeof episodes_count === 'undefined') return false;

        const anime = await $ANIME;
        const episodes = anime?.episodes ?? undefined;
        /**@type { 'anons' | 'ongoing' | 'released'} */
        const status = anime.status ?? 'ongoing';

        return status !== 'released' && episodes_count !== episodes ||
            status === 'released' && episodes_count !== episodes;
    }
}();