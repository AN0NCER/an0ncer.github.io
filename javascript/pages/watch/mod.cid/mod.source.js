import { GraphQl } from "../../../modules/api.shiki.js";
import { Sleep } from "../../../modules/functions.js";

/** Поля карточки в ленте: постер, название, год и число эпизодов */
const FIELDS = [
    'id', 'name', 'russian', 'episodes', 'episodesAired', 'status',
    { poster: ['mainUrl'] },
    { airedOn: ['year'] }
];

/** Shikimori не отдаёт больше 50 записей за раз */
const CHUNK = 50;

const KEY = (cid) => `tun:cid:${cid}`;

/** Сколько коллекций держим в сессии, чтобы не забить квоту блужданием */
const KEEP = 5;

const INDEX = 'tun:cid:index';

/** Хранилище может быть недоступно: приватный режим, переполнение квоты */
const safe = (fn, fallback = null) => {
    try {
        return fn();
    } catch {
        return fallback;
    }
};

/** Список коллекций в сессии, свежая последней */
const index = {
    read: () => safe(() => JSON.parse(sessionStorage.getItem(INDEX)) ?? [], []),

    touch(cid) {
        const list = [...this.read().filter(x => x !== cid), cid];

        // Вытесняем самые старые: их карточки перекачаются, если
        // пользователь вернётся, а квота не кончится
        for (const old of list.slice(0, -KEEP)) {
            safe(() => sessionStorage.removeItem(KEY(old)));
        }

        safe(() => sessionStorage.setItem(INDEX, JSON.stringify(list.slice(-KEEP))));
    }
};

/**
 * Карточки аниме коллекции с кэшем на сессию.
 *
 * Ключ кэша — ревизия коллекции (`updatedAt`): она меняется при любой
 * правке, так что расходиться с сервером кэшу нечем. Не совпала —
 * запись сносится целиком и набирается заново.
 *
 * Живёт в `sessionStorage`: данные нужны, пока человек ходит по этой
 * коллекции, и не должны переживать закрытие вкладки.
 *
 * @param {string} cid
 * @param {string} rev - `updatedAt` коллекции
 */
export function createSource(cid, rev) {
    /** @type {Map<number, Object>} */
    const cache = new Map();

    // Читаем сохранённое, но только если ревизия та же
    const stored = safe(() => JSON.parse(sessionStorage.getItem(KEY(cid))));

    if (stored?.rev === rev) {
        for (const [id, anime] of Object.entries(stored.animes ?? {})) {
            cache.set(Number(id), anime);
        }
    } else if (stored) {
        safe(() => sessionStorage.removeItem(KEY(cid)));
    }

    /** Сохраняем пачкой после догрузки, а не по карточке */
    const save = () => {
        const animes = Object.fromEntries(cache);

        const ok = safe(() => {
            sessionStorage.setItem(KEY(cid), JSON.stringify({ rev, animes }));
            return true;
        }, false);

        // Квота кончилась — работаем дальше без кэша, лента от этого
        // не ломается, просто каждый переход будет ходить к Shikimori
        if (!ok) safe(() => sessionStorage.removeItem(KEY(cid)));
        else index.touch(cid);
    };

    const ask = async (ids, retry = true) => {
        const response = await GraphQl
            .animes({ ids: `"${ids.join(',')}"`, limit: ids.length })
            .POST(FIELDS);

        // Shikimori режет частые обращения: одна попытка после паузы
        if (response.failed && response.status === 429 && retry) {
            await Sleep(1200);
            return ask(ids, false);
        }

        return response;
    };

    return {
        /** @param {number} id */
        get(id) {
            return cache.get(Number(id));
        },

        /** @param {number[]} ids */
        has(ids = []) {
            return ids.every(id => cache.has(Number(id)));
        },

        /**
         * Догрузить недостающие. Уже лежащие в кэше не запрашиваются,
         * поэтому при переходах внутри коллекции запроса обычно нет вовсе
         *
         * @param {number[]} ids
         * @returns {Promise<boolean>} удалось ли получить всё
         */
        async load(ids = []) {
            const need = [...new Set(ids.map(Number).filter(id => id > 0 && !cache.has(id)))];
            if (need.length === 0) return true;

            for (let i = 0; i < need.length; i += CHUNK) {
                const response = await ask(need.slice(i, i + CHUNK));

                if (response.failed || response.errors) return false;

                for (const anime of response.data?.animes ?? []) {
                    cache.set(Number(anime.id), anime);
                }
            }

            save();
            return true;
        }
    };
}

export default createSource;
