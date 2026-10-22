import { Providers } from "../../../providers/registry.js";
import { Emitter } from "./player.emitter.js";
import { Favorites } from "./player.favorites.js";
import { Frame } from "./player.iframe.js";

/**
 * @typedef {import('../../../providers/registry.js').Voice} Voice
 * @typedef {import('../../../providers/registry.js').Provider} Provider
 * @typedef {import('../../../providers/registry.js').PlayerKind} PlayerKind
 */

/**
 * Ядро плеера страницы просмотра: озвучки, эпизоды, выбор плеера.
 * Без DOM — разметкой занимается PlayerView.
 *
 * События:
 *  - 'voices'  { voices, items, provider } ответил очередной провайдер, список пополнился
 *  - 'ready'   { voices, items, voice }   выбрана стартовая озвучка, медленные провайдеры ещё могут прийти (replay)
 *  - 'settled' { voices, items }          ответили все провайдеры или вышло их время (replay)
 *  - 'voice'   { voice, user }            выбрана озвучка
 *  - 'episode' { episode, voice, user }   выбран эпизод → плеер перезагружается
 *  - 'mark'    { episode }                эпизод отмечен без перезагрузки плеера
 *  - 'kind'    { kind }                   сменился тип плеера (tunime / kodik)
 *
 * 'ready' сохраняется для повтора, но повтор получает только подписчик,
 * который сам его запросил. Подписка после load() без опции событие пропустит:
 * @example
 * core.on(WatchPlayer.Events.READY, ({ voice }) => { }, { replay: true });
 */
export class WatchPlayer extends Emitter {
    static Events = Object.freeze({
        VOICES: 'voices',
        READY: 'ready',
        SETTLED: 'settled',
        VOICE: 'voice',
        EPISODE: 'episode',
        MARK: 'mark',
        KIND: 'kind'
    });

    /** @type {Map<number|string, Voice>} уникальные озвучки */
    voices = new Map();

    /** @type {Voice[]} все записи провайдеров (с дубликатами) */
    items = [];

    /** @type {Voice|undefined} */
    voice = undefined;

    /** Количество эпизодов выбранной озвучки */
    count = 0;

    /** false — управление у владельца комнаты */
    owner = true;

    /** @type {string|undefined} */
    aid = undefined;

    #episode = 1;
    /** @type {PlayerKind} */
    #preferred;
    /** @type {PlayerKind} */
    #kind;
    /** @type {AbortController|undefined} */
    #abort = undefined;


    /**
     * @param {{
     *   aid?: string|number,
     *   kind?: PlayerKind,
     *   frame?: string,
     *   favorites?: {scoped?:() => boolean, related?:() => Array<string|number>}
     * }} [opts]
     */
    constructor({ aid, kind = 'tunime', frame = '#kodik-player', favorites = {} } = {}) {
        super();

        this.aid = aid !== undefined && aid !== null ? String(aid) : undefined;
        this.#preferred = kind;
        this.#kind = kind;

        this.frame = new Frame(frame);
        this.favorites = new Favorites({ aid: () => this.aid, ...favorites });
    }

    /** Текущий эпизод */
    get episode() {
        return this.#episode;
    }

    /** @returns {PlayerKind} фактический тип плеера */
    get kind() {
        return this.#kind;
    }

    /** @returns {Provider|undefined} провайдер выбранной озвучки */
    get provider() {
        return this.voice ? Providers.get(this.voice.provider) : undefined;
    }

    /**
     * Умеет ли озвучка feature (sync, mark, download, notify, rooms)
     * @param {keyof import('../../../providers/registry.js').Features} feature
     * @param {number|string} [id] - озвучка; по умолчанию выбранная
     * @returns {boolean}
     */
    can(feature, id) {
        const voice = id === undefined ? this.voice : this.find(id);
        return voice?.features?.[feature] === true;
    }

    /** @returns {boolean} можно ли переключить тип плеера */
    get canSwitch() {
        return (this.provider?.players ?? []).some((kind) => kind !== this.#kind);
    }

    /**
     * Загружает озвучки и выбирает стартовую. Озвучки приходят по мере ответа
     * провайдеров ('voices'); стартовая выбирается, как только ответил главный
     * провайдер (первый по priority) и, если запрошенной озвучки ещё нет, — её провайдер.
     * @param {{aid?:string|number, voice?:number|string, episode?:number}} [opts]
     *  voice — предпочитаемая озвучка (из синхронизации), episode — стартовый эпизод
     * @returns {Promise<boolean>} false — загрузку перебил новый вызов; true — ответили все провайдеры
     */
    async load({ aid, voice, episode } = {}) {
        this.#abort?.abort();
        const ctrl = this.#abort = new AbortController();

        if (aid !== undefined && aid !== null) this.aid = String(aid);
        if (!this.aid) throw new Error('[player] aid is required');

        this.voice = undefined;
        this.count = 0;
        this.items = [];
        this.voices = new Map();

        const start = Number(episode);
        if (Number.isInteger(start) && start > 0) this.#episode = start;

        this.favorites.reload();

        await Providers.ready();
        if (ctrl.signal.aborted) return false;

        const providers = Providers.active();
        /** @type {Map<string, Voice[]>} ответы провайдеров */
        const chunks = new Map();
        const first = providers[0]?.id;
        const owners = ownersOf(voice, providers);
        let picked = false;

        const pick = (final = false) => {
            if (picked) return;
            if (!final) {
                if (!chunks.has(first)) return;
                if (!this.find(voice) && owners.some((id) => !chunks.has(id))) return;
            }
            picked = true;

            const initial = this.#pick(voice);
            if (initial) this.selectVoice(initial.id);

            this.trigger(WatchPlayer.Events.READY, { voices: this.voices, items: this.items, voice: this.voice }, { replay: true });
        };

        await Providers.voices({
            aid: this.aid,
            signal: ctrl.signal,
            onChunk: (voices, provider) => {
                chunks.set(provider.id, voices);

                // Порядок по priority провайдеров, а не по скорости ответа
                this.items = providers.flatMap((p) => chunks.get(p.id) ?? []);
                this.voices = new Map(this.items.map((item) => [item.id, item]));

                this.trigger(WatchPlayer.Events.VOICES, { voices: this.voices, items: this.items, provider });
                pick();
            }
        });
        if (ctrl.signal.aborted) return false;

        pick(true);
        this.trigger(WatchPlayer.Events.SETTLED, { voices: this.voices, items: this.items }, { replay: true });
        return true;
    }

    /**
     * Ищет озвучку; терпим к number/string (id из синхронизации может прийти строкой)
     * @param {number|string|undefined|null} id
     * @returns {Voice|undefined}
     */
    find(id) {
        if (id === undefined || id === null || id === '') return undefined;

        return this.voices.get(id)
            ?? this.voices.get(Number(id))
            ?? this.voices.get(String(id));
    }

    /**
     * Выбирает озвучку и открывает плеер
     * @param {number|string} id
     * @param {{user?:boolean}} [opts] user — выбор сделал пользователь
     * @returns {boolean}
     */
    selectVoice(id, { user = false } = {}) {
        const voice = this.find(id);

        if (!voice) {
            console.warn('[player] voice not found', id);
            return false;
        }

        if (voice === this.voice) return false;

        this.voice = voice;
        this.count = Math.max(0, Number(voice.episodes) || 0, ...(voice.list ?? []));
        this.#episode = this.#closest(this.#episode);

        this.#syncKind();

        this.trigger(WatchPlayer.Events.VOICE, { voice, user });
        this.trigger(WatchPlayer.Events.EPISODE, { episode: this.#episode, voice, user: false });

        this.reload();
        return true;
    }

    /**
     * Выбирает эпизод и перезагружает плеер
     * @param {number|string} episode
     * @param {{user?:boolean, force?:boolean}} [opts] force — перезагрузить даже тот же эпизод
     * @returns {boolean}
     */
    selectEpisode(episode, { user = false, force = false } = {}) {
        const n = Number(episode);

        if (!this.has(n)) return false;
        if (n === this.#episode && !force) return false;

        this.#episode = n;
        this.trigger(WatchPlayer.Events.EPISODE, { episode: n, voice: this.voice, user });

        this.reload();
        return true;
    }

    /**
     * Отмечает эпизод без перезагрузки плеера
     * (плеер сам переключился, комната, предустановка до загрузки)
     * @param {number|string} episode
     * @param {{silent?:boolean}} [opts] silent — без события 'mark'
     * @returns {boolean}
     */
    mark(episode, { silent = false } = {}) {
        const n = Number(episode);

        if (!Number.isFinite(n)) return false;
        if (this.voice && !this.has(n)) return false;

        this.#episode = n;
        if (!silent) this.trigger(WatchPlayer.Events.MARK, { episode: n });
        return true;
    }

    /**
     * Есть ли эпизод у выбранной озвучки (с учётом пропусков voice.list)
     * @param {number|string} episode
     * @returns {boolean}
     */
    has(episode) {
        const n = Number(episode);
        if (!this.voice || !Number.isInteger(n) || n < 1 || n > this.count) return false;

        return !this.voice.list || this.voice.list.includes(n);
    }

    /**
     * Следующий доступный эпизод после from (пропуски перескакиваются)
     * @param {number} [from] - по умолчанию текущий
     * @returns {number|undefined} undefined — дальше эпизодов нет
     */
    nextEpisode(from = this.#episode) {
        for (let n = Number(from) + 1; n <= this.count; n++) {
            if (this.has(n)) return n;
        }
        return undefined;
    }

    /**
     * Открывает плеер для текущей озвучки и эпизода
     * @returns {boolean}
     */
    reload() {
        const voice = this.voice;
        const provider = this.provider;

        if (!voice || !provider) return false;

        let url = null;
        try {
            url = provider.url(voice, this.#episode, this.#kind);
        } catch (err) {
            console.error(`[player] "${provider.id}" url() failed`, err);
        }

        if (!url) return false;

        return this.frame.open(url);
    }

    /**
     * Предпочитаемый тип плеера (если провайдер его не умеет — берётся доступный)
     * @param {PlayerKind} kind
     */
    prefer(kind) {
        this.#preferred = kind;
        this.#syncKind();
    }

    /**
     * Переключает tunime ↔ kodik, если провайдер умеет оба
     * @returns {boolean}
     */
    switch() {
        const next = (this.provider?.players ?? []).find((kind) => kind !== this.#kind);
        if (!next) return false;

        this.prefer(next);
        this.reload();
        return true;
    }

    /**
     * Команда плееру
     * @param {string} method
     * @param {Object} [data]
     */
    exec(method, data = {}) {
        return this.frame.exec(method, data);
    }

    #syncKind() {
        const players = this.provider?.players ?? [this.#preferred];
        const kind = players.includes(this.#preferred) ? this.#preferred : players[0];

        if (kind && kind !== this.#kind) {
            this.#kind = kind;
            this.trigger(WatchPlayer.Events.KIND, { kind });
        }
    }

    /**
     * Эпизод для выбранной озвучки: тот же → ближайший меньший → первый доступный.
     * У фильма (count = 0) — 0, как раньше
     * @param {number} episode
     * @returns {number}
     */
    #closest(episode) {
        if (this.count <= 0) return 0;
        if (this.has(episode)) return episode;

        for (let n = Math.min(episode, this.count + 1) - 1; n >= 1; n--) {
            if (this.has(n)) return n;
        }
        for (let n = 1; n <= this.count; n++) {
            if (this.has(n)) return n;
        }
        return 1;
    }

    /**
     * Стартовая озвучка: запрошенная → первая из избранного → первая в списке
     * @param {number|string|undefined} preferred
     * @returns {Voice|undefined}
     */
    #pick(preferred) {
        const voices = [...this.voices.values()];

        return this.find(preferred)
            ?? voices.find((voice) => this.favorites.has(voice.id))
            ?? voices[0];
    }
}

/**
 * Провайдеры, которым может принадлежать озвучка: по префиксу `${provider}:`,
 * без префикса — провайдеры с namespace: false (Kodik)
 * @param {number|string|undefined|null} id
 * @param {Provider[]} providers
 * @returns {string[]}
 */
function ownersOf(id, providers) {
    if (id === undefined || id === null || id === '') return [];

    const str = String(id);
    const prefixed = providers.filter((p) => p.namespace !== false && str.startsWith(`${p.id}:`));
    const owners = prefixed.length > 0 ? prefixed : providers.filter((p) => p.namespace === false);

    return owners.map((p) => p.id);
}