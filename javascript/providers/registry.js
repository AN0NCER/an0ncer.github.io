/**
 * Реестр источников видео (Kodik, relay-CDN и т.д.).
 *
 * Провайдер — объект с контрактом {@link Provider}. Ядро плеера ничего не знает
 * о конкретных CDN: оно спрашивает у реестра озвучки и ссылку для iframe.
 *
 * Плагин подключается одной строкой и так же легко убирается:
 * @example
 * Providers.defer({
 *     id: 'thd',
 *     enabled: () => $PARAMETERS.plugins?.thd === true,
 *     load: () => import('/javascript/plugins/cdn/relay/manifest.js')
 * });
 */

/**
 * @typedef {'tunime' | 'kodik'} PlayerKind
 */

/**
 * Озвучка в общем для всех провайдеров виде.
 * @typedef {Object} Voice
 * @property {number|string} id - ключ озвучки. У Kodik — translation.id (без префикса, ради совместимости), у остальных — `${provider}:${id}`
 * @property {string} provider - id провайдера
 * @property {string|number} sourceId - id материала у провайдера (Kodik: item.id)
 * @property {string} title - название озвучки
 * @property {'voice'|'subtitles'|string} type
 * @property {number|undefined} episodes - номер последнего эпизода (undefined — фильм/неизвестно)
 * @property {number[]} [list] - номера доступных эпизодов, если есть пропуски (AnimeVost: [1, 3]); без него — подряд 1..episodes
 * @property {Features} features - что сайт может делать с этой озвучкой (из провайдера)
 * @property {Object} [raw] - исходный объект провайдера
 * @property {Object} [legacy] - объект в формате результата Kodik для старого API
 */

/**
 * Что сайт может делать с озвучкой. Модули смотрят сюда, а не на формат id.
 * Не указанное провайдером — false.
 * @typedef {Object} Features
 * @property {boolean} sync - писать прогресс в заметку Shikimori ([tunime-sync:…] понимает только числовой id)
 * @property {boolean} mark - отправлять выбор озвучки в статистику (Tunime.mark.voice)
 * @property {boolean} download - загрузчик эпизодов
 * @property {boolean} notify - уведомления о новых эпизодах
 * @property {boolean} rooms - совместный просмотр
 */

/**
 * @typedef {{ok:true} | {ok:false, reason:string, action?:string}} PlayCheck
 *  reason — код причины (login, episode, provider, error…), action — что предложить пользователю
 */

/**
 * @typedef {Object} Provider
 * @property {string} id - уникальный id (используется как префикс озвучек)
 * @property {string} [title]
 * @property {number} [version=1] - версия провайдера (сверяется в комнатах)
 * @property {Partial<Features>} [features] - возможности его озвучек
 * @property {(voice:Voice, ctx:{episode?:number}) => PlayCheck} [canPlay] - можно ли смотреть сейчас (вход, лимиты, наличие эпизода)
 * @property {(voice:Voice, voices:Voice[]) => Voice|null} [fallback] - замена у Kodik; по умолчанию — озвучка Kodik с тем же названием
 * @property {number} [priority=100] - порядок в списке озвучек (меньше — выше)
 * @property {boolean} [namespace=true] - добавлять ли префикс `${id}:` к id озвучек
 * @property {PlayerKind[]} [players=['tunime']] - какими плеерами умеет играть
 * @property {number} [timeout] - сколько мс ждать voices(), по умолчанию Providers.timeout
 * @property {() => boolean} [enabled] - включён ли (настройки, авторизация)
 * @property {(ctx:{aid:string, signal:AbortSignal}) => Promise<Array<Partial<Voice>>>} voices - список озвучек аниме
 * @property {(voice:Voice, episode:number, kind:PlayerKind) => string|null} url - ссылка для iframe плеера
 */

/**
 * Видео для tplayer: карта качеств (Kodik через hub) или master m3u8 (relay).
 * @typedef {{kind:'qualities', qualities:Object<string, Array<{src:string, type:string}>>, skips?:Array, thumbnails?:string[], tiles?:Object}
 *         | {kind:'hls', url:string, skips?:Array, thumbnails?:string[]}} MediaSource
 */

/**
 * Адаптер источника — сторона провайдера внутри tplayer (iframe).
 * Провайдер на watch отдаёт озвучки и ссылку, адаптер в tplayer — само видео.
 * Пока не используется: tplayer переводится на адаптеры в пунктах 13–16 плана.
 * @typedef {Object} SourceAdapter
 * @property {string} id - тот же id, что у провайдера (p= в URL tplayer)
 * @property {() => Promise<{animeId:string, title:string, voice:string, episode:number, list?:number[], screenshots?:string[]}>} meta
 * @property {(ctx:{signal:AbortSignal}) => Promise<MediaSource>} load - первая загрузка
 * @property {(reason:string) => Promise<MediaSource|null>} refresh - ссылки протухли (410, простой, фатал сети)
 * @property {() => (() => void)} [keepAlive] - держать сессию источника, возвращает функцию остановки
 * @property {boolean} canSwitchToKodik - можно ли при фатальной ошибке уйти в iframe Kodik
 * @property {() => void} [destroy]
 */

const LOG = '[providers]';

export const Providers = new class {
    /** Сколько мс ждать voices() провайдера, если у него нет своего timeout */
    timeout = 8000;

    /** @type {Map<string, Provider>} */
    #list = new Map()

    /** @type {Map<string, {enabled:() => boolean, load:() => Promise<any>, state:'idle'|'loading'|'done'|'failed', promise?:Promise<void>}>} */
    #deferred = new Map();

    /**
     * Регистрирует провайдера. Повторная регистрация с тем же id заменяет старого.
     * @param {Provider} provider
     * @returns {() => void} функция удаления
     */
    register(provider) {
        if (!provider || typeof provider.id !== 'string' || !provider.id) {
            console.warn(`${LOG} provider without id`, provider);
            return () => { };
        }

        if (typeof provider.voices !== 'function' || typeof provider.url !== 'function') {
            console.warn(`${LOG} "${provider.id}" must implement voices() and url()`);
            return () => { };
        }

        this.#list.set(provider.id, provider);
        return () => this.unregister(provider.id);
    }

    /** @param {string} id */
    unregister(id) {
        this.#list.delete(id);
        this.#deferred.delete(id);
    }

    /**
     * Ленивый провайдер: модуль грузится только если enabled() === true.
     * Модуль либо сам вызывает Providers.register, либо экспортирует провайдера (default / provider).
     * @param {{id:string, enabled?:() => boolean, load:() => Promise<any>}} entry
     */
    defer({ id, enabled = () => true, load }) {
        if (!id || typeof load !== 'function') return;
        this.#deferred.set(id, { enabled, load, state: 'idle' });
    }

    /** @param {string} id @returns {Provider|undefined} */
    get(id) {
        return this.#list.get(id);
    }

    /**
     * Можно ли смотреть озвучку сейчас
     * @param {Voice|undefined} voice
     * @param {{episode?:number}} [ctx]
     * @returns {PlayCheck}
     */
    canPlay(voice, ctx = {}) {
        const provider = this.get(voice?.provider);
        if (!provider) return { ok: false, reason: 'provider' };
        if (typeof provider.canPlay !== 'function') return { ok: true };

        try {
            return provider.canPlay(voice, ctx) ?? { ok: true };
        } catch (err) {
            console.warn(`${LOG} "${provider.id}" canPlay() threw`, err);
            return { ok: false, reason: 'error' };
        }
    }

    /**
     * Замена озвучки у Kodik (namespace: false), если её нельзя смотреть
     * @param {Voice|undefined} voice
     * @param {Voice[]} voices - все озвучки аниме
     * @returns {Voice|null}
     */
    fallback(voice, voices) {
        const provider = this.get(voice?.provider);
        if (!provider) return null;

        if (typeof provider.fallback === 'function') {
            try {
                return provider.fallback(voice, voices) ?? null;
            } catch (err) {
                console.warn(`${LOG} "${provider.id}" fallback() threw`, err);
                return null;
            }
        }

        // По умолчанию — та же студия у провайдера без префикса
        const title = sameTitle(voice.title);
        return voices.find((item) => this.get(item.provider)?.namespace === false && sameTitle(item.title) === title) ?? null;
    }

    /** @returns {Provider[]} все включённые провайдеры по priority */
    active() {
        return [...this.#list.values()]
            .filter((provider) => isEnabled(provider.enabled, provider.id))
            .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
    }

    /** Догружает включённые ленивые провайдеры */
    async ready() {
        const tasks = [];

        for (const [id, entry] of this.#deferred) {
            if (entry.state === 'done' || entry.state === 'failed') continue;
            if (!isEnabled(entry.enabled, id)) continue;

            if (!entry.promise) {
                entry.state = 'loading';
                entry.promise = (async () => {
                    try {
                        const mod = await entry.load();
                        const provider = mod?.default ?? mod?.provider;
                        if (provider?.id && !this.#list.has(provider.id)) this.register(provider);
                        entry.state = 'done';
                    } catch (err) {
                        entry.state = 'failed';
                        console.warn(`${LOG} "${id}" failed to load`, err);
                    }
                })();
            }

            tasks.push(entry.promise);
        }

        await Promise.all(tasks);
    }

    /**
     * Озвучки от всех включённых провайдеров. Упавший или зависший провайдер
     * не ломает и не задерживает остальных: у каждого свой timeout.
     * @param {{aid:string, signal?:AbortSignal, onChunk?:(voices:Voice[], provider:Provider) => void}} ctx
     *  onChunk — вызывается для каждого провайдера сразу, как он ответил, упал или вышло время
     *  (тогда voices пустой); не вызывается после отмены signal
     * @returns {Promise<Voice[]>} все озвучки по priority провайдеров (возможны дубликаты id — решает потребитель)
     */
    async voices({ aid, signal = new AbortController().signal, onChunk } = {}) {
        await this.ready();

        const providers = this.active();
        /** @type {Voice[][]} по индексу провайдера — итог в порядке priority, а не ответов */
        const chunks = providers.map(() => []);

        await Promise.all(providers.map(async (provider, i) => {
            const items = await this.#ask(provider, { aid, signal });
            if (signal.aborted) return;

            chunks[i] = items.map((item) => normalize(item, provider)).filter(Boolean);

            try {
                onChunk?.(chunks[i], provider);
            } catch (err) {
                console.error(`${LOG} onChunk failed for "${provider.id}"`, err);
            }
        }));

        return chunks.flat();
    }

    /**
     * voices() одного провайдера со своим timeout и отменой
     * @param {Provider} provider
     * @param {{aid:string, signal:AbortSignal}} ctx
     * @returns {Promise<Array<Partial<Voice>>>} пустой массив, если упал или вышло время
     */
    async #ask(provider, { aid, signal }) {
        // Свой контроллер: по timeout отменяем запрос только этого провайдера
        const ctrl = new AbortController();
        const abort = () => ctrl.abort();
        if (signal.aborted) abort();
        else signal.addEventListener('abort', abort, { once: true });

        const ms = provider.timeout ?? this.timeout;
        let timer;
        const timeout = new Promise((_, reject) => {
            timer = setTimeout(() => {
                ctrl.abort();
                reject(new Error(`timeout ${ms} ms`));
            }, ms);
        });

        try {
            const items = await Promise.race([provider.voices({ aid, signal: ctrl.signal }), timeout]);
            return Array.isArray(items) ? items : [];
        } catch (err) {
            if (!signal.aborted) console.warn(`${LOG} "${provider.id}" voices failed`, err);
            return [];
        } finally {
            clearTimeout(timer);
            signal.removeEventListener('abort', abort);
        }
    }
}

/**
 * @param {Partial<Voice>} item
 * @param {Provider} provider
 * @returns {Voice|null}
 */
function normalize(item, provider) {
    if (!item || item.id === undefined || item.id === null) return null;

    const prefix = provider.namespace !== false;
    const id = prefix ? `${provider.id}:${item.id}` : item.id;

    return {
        ...item,
        id,
        provider: provider.id,
        sourceId: item.sourceId ?? item.id,
        title: item.title ?? String(item.id),
        type: item.type ?? 'voice',
        list: episodeList(item.list),
        features: { ...NO_FEATURES, ...provider.features }
    };
}

/**
 * Номера эпизодов: целые > 0, без повторов, по возрастанию
 * @param {unknown} list
 * @returns {number[]|undefined} undefined — пропусков нет, эпизоды подряд
 */
function episodeList(list) {
    if (!Array.isArray(list)) return undefined;

    const numbers = list.map(Number).filter((n) => Number.isInteger(n) && n > 0);
    return [...new Set(numbers)].sort((a, b) => a - b);
}

/** @type {Features} */
const NO_FEATURES = Object.freeze({ sync: false, mark: false, download: false, notify: false, rooms: false });

/** Название студии для сравнения: без регистра, пробелов и знаков (AniLibria.TV ≈ anilibria tv) */
function sameTitle(title) {
    return String(title ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

function isEnabled(fn, id) {
    if (typeof fn !== 'function') return true;
    try {
        return fn() !== false;
    } catch (err) {
        console.warn(`${LOG} "${id}" enabled() threw`, err);
        return false;
    }
}