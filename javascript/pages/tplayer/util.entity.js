import { Kodik } from "../../modules/api.kodik.js";
import { Tunime } from "../../modules/api.tunime.js";
import { err } from "./util.log.js";

export class TError extends Error {
    constructor(code, msg, crit = false) {
        super(msg);
        this.code = code;
        this.crit = crit;
    }
}

export class Meta {
    static KODIK_PLAYER_DOMAIN = 'kodik.info';

    #link = undefined;

    constructor(id, episode) {
        this.id = String(id);
        this.episode = Number(episode);
    }

    async getLink(episode) {
        const gen = (episode) => {
            if (typeof this.#link !== "undefined") {
                this.episode = episode;
                return `${this.#link}?episode=${episode}`
            }
        }

        if (typeof this.#link !== "undefined") {
            return gen(episode ? episode : this.episode);
        }

        try {
            /**@type {{results:[{link:string}],total:number}} */
            const response = await Kodik.Search({ id: this.id, with_material_data: true });
            if (response.total < 1) throw new TError('KODIK_BAD_RESPONSE', `Response results length is 0 in ${this.id}`);
            if (!response.results[0].link) throw new TError('KODIK_BAD_RESPONSE', `Connot get link from ${this.id}`);
            this.lastEpisode = response.results[0].last_episode;
            this.animeId = response.results[0].shikimori_id;
            this.titleAnime = response.results[0].title;
            this.titleVoice = response.results[0].translation.title;
            this.#link = this.#normalizeKodikLink(response.results[0].link);
            return gen(episode ? episode : this.episode);
        } catch (e) {
            err(`fetch kodik link`, e);
        }
    }

    #normalizeKodikLink(input) {
        if (input.startsWith('//')) return `https:${input}`;
        if (!input.startsWith('http')) return new URL(input, `https://${Meta.KODIK_PLAYER_DOMAIN}`).toString();
        return input;
    }
}

export class Source {
    /**
     * @param {Meta} meta 
     * @param {Object} payload 
     */
    constructor(meta, payload) {
        this.meta = meta;
        this.episode = meta.episode;

        this.qualitiesData = payload?.qualities || {};
        this.thumbinals = payload?.thumbinals || [];
        this.skips = payload?.skips || [];
        this.tiles = payload?.tiles || {};
        this.cached = payload?.cache || false;
    }

    /**
     * Возвращает только список доступных разрешений (например, ["360", "480", "720"])
     */
    getAvailableLabels() {
        return Object.keys(this.qualitiesData);
    }

    /**
     * Получает ссылка на ресур видеоролика
     * @param {number} q - Желаемое разрешение (напр. 1080)
     * @param {{auto:boolean}} [opts] 
     * @returns 
     */
    getSource(q = 720, opts = {}) {
        if (opts.auto) {
            return Tunime.video.genLink(this.getQualityMap());
        }
        return this.getBestMatch(q);
    }

    /**
     * Возвращает простой объект вида { "360": "url", "480": "url" }
     * @returns {Object.<string, string>}
     */
    getQualityMap() {
        return Object.entries(this.qualitiesData).reduce((acc, [label, sources]) => {
            // Берем [0], так как в вашем JSON ссылки лежат в массиве
            if (sources.length > 0) {
                acc[label] = sources[0].src;
            }
            return acc;
        }, {});
    }

    /**
     * Возвращает ссылку на качество, максимально близкое к заданному
     * @param {number|string} target - Желаемое разрешение (напр. 1080)
     * @returns {string|null} - Ссылка на видео
     */
    getBestMatch(target) {
        const targetRes = parseInt(target);
        const availableLabels = Object.keys(this.qualitiesData).map(Number);

        if (availableLabels.length === 0) return null;

        // Сортируем разрешения по возрастанию [360, 480, 720]
        availableLabels.sort((a, b) => a - b);

        // Ищем подходящее: либо точно такое же, либо ближайшее меньшее
        // Если target 1080, а макс 720, вернет 720.
        const bestFit = availableLabels.reduce((prev, curr) => {
            return (curr <= targetRes) ? curr : prev;
        }, availableLabels[0]); // По умолчанию берем самое маленькое, если всё остальное больше

        // Если target был 1080, а в списке [360, 480, 720], вернет 720
        // Если target был 144, а в списке [360, 480], вернет 360 (минимальное)

        const finalLabel = bestFit.toString();
        return this.qualitiesData[finalLabel][0].src;
    }
}