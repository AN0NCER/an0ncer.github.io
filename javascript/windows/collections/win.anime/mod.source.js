import { OAuth } from "../../../core/main.core.js";
import { GraphQl } from "../../../modules/api.shiki.js";
import { Sleep } from "../../../modules/functions.js";

/** Поля карточки. userRate приезжает только с bearer-заголовком */
const FIELDS = [
    'id', 'name', 'russian', 'kind', 'season', 'status',
    'episodes', 'episodesAired', 'score',
    { poster: ['main2xUrl'] },
    { statusesStats: ['status', 'count'] },
    { airedOn: ['year'] }
];

const RATE = { userRate: ['id', 'status'] };

/** Shikimori не отдаёт больше 50 записей за раз */
const CHUNK = 50;

/** Сколько находок показываем за страницу поиска */
const PAGE = 20;

const chunks = (list, size) => {
    const out = [];
    for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
    return out;
};

/**
 * Данные об аниме для окна: запросы к Shikimori и кэш ответов.
 *
 * Кэш — то, что позволяет вернуться к выбранным после сброса поиска без
 * единого запроса: всё, что проехало через окно, остаётся здесь до его
 * закрытия. Данные снятых с выбора аниме не выбрасываем — повторный
 * выбор того же аниме должен быть бесплатным.
 */
export function createSource() {
    /** @type {Map<number, Object>} */
    const cache = new Map();

    let abort = null;

    const fields = () => OAuth.auth ? [...FIELDS, RATE] : FIELDS;

    const remember = (list = []) => {
        for (const anime of list) cache.set(Number(anime.id), anime);
        return list;
    };

    /**
     * Запрос с одной повторной попыткой на 429: Shikimori режет частые
     * обращения, и без паузы поиск при быстром вводе просто отваливается
     */
    const ask = async (args, signal, retry = true) => {
        const response = await GraphQl.animes(args, () => { }, signal)
            .POST(fields(), OAuth.auth);

        if (response.failed && response.status === 429 && retry) {
            await Sleep(1200);
            return ask(args, signal, false);
        }

        return response;
    };

    return {
        /** @param {number} id */
        get(id) {
            return cache.get(Number(id));
        },

        /** @param {number[]} ids */
        has(ids) {
            return ids.every(id => cache.has(Number(id)));
        },

        /**
         * Догрузить данные о выбранных аниме — их id известны, а карточек
         * ещё нет. Пачками и последовательно: параллельные запросы ловят
         * 429, а порядок всё равно задаёт вызывающий код.
         *
         * @param {number[]} ids
         * @param {(loaded: Object[]) => void} [onChunk] - пачка приехала;
         *  список можно дорисовывать, не дожидаясь остальных
         * @returns {Promise<{ok: boolean, missing: number[]}>} missing —
         *  чего не оказалось на Shikimori (аниме удалили)
         */
        async preload(ids, onChunk = () => { }) {
            const need = ids.map(Number).filter(id => id > 0 && !cache.has(id));
            if (need.length === 0) return { ok: true, missing: [] };

            for (const chunk of chunks(need, CHUNK)) {
                const response = await ask({
                    ids: `"${chunk.join(',')}"`,
                    limit: chunk.length
                });

                if (response.failed) return { ok: false, missing: [] };

                onChunk(remember(response.data?.animes ?? []));
            }

            return { ok: true, missing: need.filter(id => !cache.has(id)) };
        },

        /**
         * Поиск по названию. Прошлый запрос обрывается: пока ждали ответ
         * на «нару», пользователь уже дописал «наруто», и старый результат
         * лёг бы поверх нового.
         *
         * @param {string} query
         * @param {number} [page]
         * @returns {Promise<{aborted: boolean, failed: boolean, ids: number[]}>}
         */
        async search(query, page = 1) {
            abort?.abort();
            abort = new AbortController();

            const signal = abort.signal;

            try {
                const response = await ask({
                    search: `"${query}"`,
                    limit: PAGE,
                    page,
                    censored: $PARAMETERS.censored
                }, signal);

                if (signal.aborted) return { aborted: true, failed: false, ids: [] };
                if (response.failed) return { aborted: false, failed: true, ids: [] };

                const animes = remember(response.data?.animes ?? []);
                return { aborted: false, failed: false, ids: animes.map(a => Number(a.id)) };
            } catch (err) {
                // Обрыв — наш же следующий запрос, показывать тут нечего
                if (err?.name === 'AbortError' || signal.aborted) {
                    return { aborted: true, failed: false, ids: [] };
                }

                return { aborted: false, failed: true, ids: [] };
            }
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
