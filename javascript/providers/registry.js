/**
 * Реестр источников видео (Kodik, relay-CDN и т.д.).
 *
 * Провайдер — объект с контрактом {@link Provider}. Ядро плеера ничего не знает
 * о конкретных CDN: оно спрашивает у реестра озвучки и ссылку для iframe.
 *
 * Плагин подключается одной строкой и так же легко убирается:
 * @example
 * Providers.defer({
 *     id: 'cvh',
 *     enabled: () => $PARAMETERS.plugins?.cdnrelay === true,
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
 * @property {number|undefined} episodes - доступно эпизодов (undefined — фильм/неизвестно)
 * @property {Object} [raw] - исходный объект провайдера
 * @property {Object} [legacy] - объект в формате результата Kodik для старого API
 */

/**
 * @typedef {Object} Provider
 * @property {string} id - уникальный id (используется как префикс озвучек)
 * @property {string} [title]
 * @property {number} [priority=100] - порядок в списке озвучек (меньше — выше)
 * @property {boolean} [namespace=true] - добавлять ли префикс `${id}:` к id озвучек
 * @property {PlayerKind[]} [players=['tunime']] - какими плеерами умеет играть
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
     * Озвучки от всех включённых провайдеров. Упавший провайдер не ломает остальных.
     * @param {{aid:string, signal?:AbortSignal}} ctx
     * @returns {Promise<Voice[]>} все озвучки (возможны дубликаты id — решает потребитель)
     */
    async voices({ aid, signal = new AbortController().signal }) {
        await this.ready();

        const providers = this.active();
        const settled = await Promise.allSettled(providers.map((provider) => provider.voices({ aid, signal })));

        /** @type {Voice[]} */
        const out = [];

        settled.forEach((result, i) => {
            const provider = providers[i];

            if (result.status !== 'fulfilled') {
                if (!signal.aborted) console.warn(`${LOG} "${provider.id}" voices failed`, result.reason);
                return;
            }

            if (!Array.isArray(result.value)) return;

            for (const item of result.value) {
                const voice = normalize(item, provider);
                if (voice) out.push(voice);
            }
        });

        return out;
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
        type: item.type ?? 'voice'
    };
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