import { GraphQl } from "../../../modules/api.shiki.js";
import { Sleep } from "../../../modules/functions.js";

/**
 * Ровно то, что просит `ACard.GenV2`: постер, название, год и оценка.
 * Лишние поля — лишний трафик на каждую сотню аниме
 */
const FIELDS = [
    'id', 'name', 'russian', 'score',
    { poster: ['mainUrl'] },
    { airedOn: ['year'] }
];

/** Shikimori не отдаёт больше 50 записей за раз */
const CHUNK = 50;

/**
 * Данные об аниме коллекции.
 *
 * Состав известен сразу, а карточек нет: коллекция бывает на сотни
 * аниме, поэтому тянем порциями по мере прокрутки.
 */
export function createSource() {
    /** @type {Map<number, Object>} */
    const cache = new Map();

    let abort = null;

    return {
        /** @param {number} id */
        get(id) {
            return cache.get(Number(id));
        },

        /**
         * Догрузить очередную порцию
         * @param {number[]} ids
         * @returns {Promise<{ok: boolean, missing: number[]}>} missing —
         *  чего не оказалось на Shikimori (аниме удалили)
         */
        async load(ids) {
            const need = ids.map(Number).filter(id => id > 0 && !cache.has(id));
            if (need.length === 0) return { ok: true, missing: [] };

            abort?.abort();
            abort = new AbortController();

            const signal = abort.signal;

            const ask = async (chunk, retry = true) => {
                const response = await GraphQl.animes(
                    { ids: `"${chunk.join(',')}"`, limit: chunk.length },
                    () => { },
                    signal
                ).POST(FIELDS);

                // Shikimori режет частые обращения: одна попытка после паузы
                if (response.failed && response.status === 429 && retry) {
                    await Sleep(1200);
                    return ask(chunk, false);
                }

                return response;
            };

            try {
                for (let i = 0; i < need.length; i += CHUNK) {
                    const response = await ask(need.slice(i, i + CHUNK));

                    if (signal.aborted) return { ok: false, missing: [] };
                    if (response.failed) return { ok: false, missing: [] };

                    for (const anime of response.data?.animes ?? []) {
                        cache.set(Number(anime.id), anime);
                    }
                }
            } catch (err) {
                return { ok: signal.aborted, missing: [] };
            }

            return { ok: true, missing: need.filter(id => !cache.has(id)) };
        },

        /** Оборвать запрос в пути — окно закрывают */
        destroy() {
            abort?.abort();
            abort = null;
            cache.clear();
        }
    };
}

export default createSource;
