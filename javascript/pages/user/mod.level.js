import { TCache } from "../../modules/tun.cache.js";

class RulesList {
    #data = undefined;

    constructor() {
        this.cache = new TCache();
        this.url = "https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/animelist.yml";
        this.key = "level-rules";
    }

    async getList() {
        if (this.#data) return this.#data;
        try {
            this.#data = await this.#load();
        } catch (err) {
            console.log(err);
        }
        return this.#data;
    }

    async #load() {
        const value = await this.cache.get("metadata", this.key);
        if (value)
            return jsyaml.load(value);
        const response = await fetch(this.url)
        if (!response.ok) return undefined;
        const raw = await response.text();
        this.cache.put("metadata", this.key, raw, 14 * 24 * 60 * 60 * 1000)
        return jsyaml.load(raw)
    }
}

export const TLevel = new class {
    constructor() {
        this.source = new RulesList();

        this.data = {
            level: 0,
            level_next: 1,
            title_ru: "Добро пожаловать!",
            progress: 0,
            threshold: 15
        }
    }

    init(data) {
        const id = data.stats.full_statuses.anime.findIndex(x => x.id === 2);
        const completed = data.stats.full_statuses.anime[id].size;

        this.source.getList().then((value) => {
            if (value === undefined) return;

            const id_yaml = value.findIndex(x => x.threshold > completed);
            const yaml = value[id_yaml];

            this.data = {
                level: yaml.level - 1,
                level_next: yaml.level,
                title_ru: value[id_yaml <= 0 ? 0 : id_yaml - 1].metadata.title_ru,
                progress: completed * 100 / yaml.threshold,
                threshold: yaml.threshold
            }

            const { level, level_next, title_ru, progress } = this.data;

            $(`#current-level`).text(level);
            $(`#metadata-level`).text(title_ru);
            $(`#level-progress`).css('width', `${progress}%`);
            $(`#level-progress-num`).text(`${progress.toFixed(0)}%`);
            $(`#next-level`).text(`${level_next} Уровень`);
        });
    }
}();