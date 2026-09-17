import { GraphQl } from "../../modules/api.shiki.js";
import Collections from "../../modules/tun.collections.js";

/**
 * Поиск на странице коллекций.
 *
 * Работает в две волны, и это важно для отрисовки: по названиям
 * коллекций ищем локально и отдаём сразу, а поиск по составу требует
 * Shikimori — на клиенте лежат только id аниме, названий нет. Поэтому
 * результат приходит дважды, и вторая волна не должна задерживать первую.
 */

/** Пауза в наборе перед обращением к Shikimori */
const DEBOUNCE = 600;

/** Сколько аниме просим у Shikimori: ищем не аниме, а коллекции с ним */
const LIMIT = 10;

/** Пустой результат — им же сбрасываем выдачу */
const empty = (query = '') => ({
    query,
    titles: [],
    inside: [],
    loading: false,
    failed: false
});

/**
 * @typedef {Object} TSearchResult
 * @property {string} query - что искали
 * @property {Array<Object>} titles - коллекции, чьи названия совпали
 * @property {Array<{collection: Object, matches: string[]}>} inside -
 *  коллекции, внутри которых нашлось аниме, и что именно нашлось
 * @property {boolean} loading - вторая волна ещё в пути
 * @property {boolean} failed - Shikimori не ответил
 */

/**
 * @param {Object} opts
 * @param {() => Array<Object>} opts.source - где искать по названиям:
 *  свои коллекции из фасада или чужие из памяти страницы
 * @param {boolean} [opts.inside] - искать ли по составу. У чужих
 *  коллекций состава нет вовсе: сервер отдаёт их без `items`
 * @param {(result: TSearchResult) => void} [opts.onResult]
 */
export function createSearch({ source = () => [], inside = true, onResult = () => { } } = {}) {
    let timer = null;
    let abort = null;

    /** Последний отданный запрос — повторно тот же не гоняем */
    let last = null;

    const stop = () => {
        clearTimeout(timer);
        abort?.abort();

        timer = null;
        abort = null;
    };

    /** Первая волна: названия коллекций, без запросов */
    const byTitle = (query) => {
        const value = query.toLowerCase();

        return source().filter(collection =>
            String(collection.title ?? '').toLowerCase().includes(value)
        );
    };

    /**
     * Вторая волна: сперва узнаём у Shikimori, какие аниме подходят
     * под запрос, и только потом смотрим, в каких коллекциях они лежат
     */
    const byAnime = async (query, signal) => {
        const response = await GraphQl
            .animes({ search: `"${query}"`, limit: LIMIT, censored: $PARAMETERS.censored }, () => { }, signal)
            .POST(['id', 'russian', 'name']);

        if (response.failed) return null;

        /** @type {Map<string, {collection: Object, matches: string[]}>} */
        const found = new Map();

        for (const anime of response.data?.animes ?? []) {
            const title = anime.russian || anime.name;

            for (const cid of Collections.find(anime.id)) {
                if (!found.has(cid)) {
                    const collection = Collections.get(cid);
                    if (!collection) continue;

                    found.set(cid, { collection, matches: [] });
                }

                found.get(cid).matches.push(title);
            }
        }

        return [...found.values()];
    };

    /**
     * Ввод из шапки. Локальная часть отдаётся тут же, запрос к Shikimori
     * уходит после паузы в наборе
     *
     * @param {string} value
     */
    const input = (value) => {
        const query = String(value ?? '').trim();

        if (query === last) return;
        last = query;

        stop();

        if (!query) return onResult(empty());

        const titles = byTitle(query);

        // Первую волну показываем немедленно: она ничего не ждёт
        onResult({ ...empty(query), titles, loading: inside });

        if (!inside) return;

        timer = setTimeout(async () => {
            abort = new AbortController();
            const signal = abort.signal;

            const result = await byAnime(query, signal).catch(() => null);

            // Оборвали или запрос успел смениться — решать уже не нам
            if (signal.aborted || query !== last) return;

            onResult({
                ...empty(query),
                titles,
                inside: result ?? [],
                failed: result === null
            });
        }, DEBOUNCE);
    };

    /** Enter: ждать паузу незачем, спрашиваем сразу */
    const submit = async (value) => {
        const query = String(value ?? '').trim();
        if (!query) return;

        clearTimeout(timer);
        timer = null;

        const titles = byTitle(query);

        onResult({ ...empty(query), titles, loading: inside });

        if (!inside) return;

        abort?.abort();
        abort = new AbortController();

        const signal = abort.signal;
        const result = await byAnime(query, signal).catch(() => null);

        if (signal.aborted) return;

        last = query;

        onResult({
            ...empty(query),
            titles,
            inside: result ?? [],
            failed: result === null
        });
    };

    return {
        input,
        submit,

        /** Сбросить выдачу и оборвать запрос в пути */
        clear() {
            stop();
            last = '';
            onResult(empty());
        },

        destroy: stop,

        /** Для `THeader.init({ events })` — он ждёт именно эти имена */
        get events() {
            return {
                oninput: (value) => input(value),
                onsearch: (value) => submit(value)
            };
        }
    };
}

export default createSearch;
