import { $ANIME } from "./mod.resource.js";

export const DUB = new class {
    constructor() {
        this.el = $('.dub-controller');
    }

    select(dub, isFavor = false) {
        this.el.removeClass('-no-select', '-notify', '-favor');
        this.el.attr('data-type', dub.translation.type);
        this.el.find('.name').text(dub.translation.title);
        this.el.find('.dub-episodes').text(`${dub.last_episode} EP`);

        if (isFavor) {
            this.el.addClass('-favor');
        }

        this.canNotify(dub.episodes_count).then((can) => {
            if (can) {
                this.el.addClass('-notify');
            }
        })
    }

    async canNotify(episodes_count) {
        const anime = await $ANIME;
        const episodes = anime?.episodes ?? undefined;
        /**@type { 'anons' | 'ongoing' | 'released'} */
        const status = anime.status ?? 'ongoing';

        return status !== 'released' && episodes_count !== episodes ||
            status === 'released' && episodes_count !== episodes;
    }
}();