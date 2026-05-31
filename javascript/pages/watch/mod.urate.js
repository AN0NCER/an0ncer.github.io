import { OAuth } from "../../core/main.core.js";
import { UserRates } from "../../modules/api.shiki.js";
import { Sleep } from "../../modules/functions.js";
import { $ID } from "../watch.js";
import { TEvents } from "./utils/util.event.js";

/**
 * @typedef {Object}
 */

export const URate = new class extends TEvents {
    #uRate = null;

    set uRate(value) {
        this.#uRate = value ?? null;
    }

    get uRate() {
        return this.#uRate ? { ...this.#uRate } : null;
    }

    constructor() {
        super();
        this.isLogged = false;
        this.isInited = false;
    }

    /**
     * Инициализация UserRate управления на странице аниме
     * @param {null | Object} obj - user_rate данные из запроса shikimori
     * @param {boolean} isLogged - авторизирован ли пользователь
     */
    init(obj, isLogged) {
        this.isLogged = isLogged;
        this.uRate = obj;
        this.isInited = true;
        this.trigger('init', this.uRate, { replay: true });
    }

    async #patch(fields, user_handler = false) {
        if (!this.isLogged || !this.isInited) return;

        const attempt = async () => {
            let response;
            const prev = this.#uRate ? { ...this.#uRate } : null; // snapshot до запроса

            if (this.#uRate === null) {
                // Создаем новую запись
                response = await UserRates.list().POST({
                    user_rate: {
                        target_id: $ID,
                        target_type: "Anime",
                        user_id: OAuth.user.id,
                        ...fields
                    }
                });
            } else {
                response = await UserRates.show(this.#uRate.id).PATCH({
                    user_rate: fields
                });
            }

            if (response.failed) {
                if (response.status === 429) {
                    await Sleep(1000);
                    return attempt();
                }
                console.error(`[urate]: request error`, response);
                return {};
            }

            const changed = diffURate(prev, response);

            this.uRate = response;
            this.trigger('update', this.uRate, { changed, user_handler });
            return response;
        }

        return attempt();
    }

    /**
     * Устанавливает статус. Если записи нет — создаёт её.
     * @param {"planned" | "watching" | "rewatching" | "on_hold" | "completed" | "dropped"} [status='planned']
     */
    async setStatus(status = 'planned', user_handler = false) {
        return this.#patch({ status }, user_handler);
    }

    /**
     * Устанавливает просмотренный эпизод
     * @param {number} episode
     * @param {"planned"|"watching"|"rewatching"|"on_hold"|"completed"|"dropped"} [status]
     */
    async setEpisode(episode, status = undefined, user_handler = false) {
        const fields = { episodes: episode };
        if (status !== undefined) fields.status = status;
        else if (this.#uRate) fields.status = this.#uRate.status; // сохраняем текущий
        return this.#patch(fields, user_handler);
    }

    /**
     * Устанавливает оценку
     * @param {number} score
     */
    async setScore(score, user_handler = false) {
        return this.#patch({ score }, user_handler);
    }

    /**
     * Устанавливает заметку
     * @param {string} text
     */
    async setNote(text, user_handler = false) {
        return this.#patch({ text }, user_handler);
    }

    /**
     * Удаляет запись из списка пользователя
     */
    async remove(user_handler = false) {
        if (!this.isLogged || !this.isInited || this.#uRate === null) return;

        const attempt = async () => {
            const prev = { ...this.#uRate }; // snapshot до удаления
            const response = await UserRates.show(this.#uRate.id).DELETE();

            if (response.failed) {
                if (response.status === 429) {
                    await Sleep(1000);
                    return attempt();
                }

                console.error(`[urate]: remove error`, response);
                return {};
            }
            const changed = diffURate(prev, null);

            this.uRate = null;
            this.trigger('update', null, { changed, user_handler });
        };

        return attempt();
    }
}();


/**
 * Сравнивает старый и новый uRate, возвращает массив изменённых ключей
 * @param {Object|null} prev
 * @param {Object|null} next
 * @returns {string[]}
 */
function diffURate(prev, next) {
    if (!prev && !next) return [];
    if (!prev) return ['created'];
    if (!next) return ['removed'];

    const trackedKeys = ['status', 'score', 'episodes', 'volumes', 'chapters', 'rewatches', 'text'];
    return trackedKeys.filter(key => prev[key] !== next[key]);
}