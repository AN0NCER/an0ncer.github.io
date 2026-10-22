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
 *  - 'voices'  { voices, items }          список озвучек получен (до выбора)
 *  - 'ready'   { voices, items, voice }   загрузка завершена (replay)
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

    /** @returns {boolean} можно ли переключить тип плеера */
    get canSwitch() {
        return (this.provider?.players ?? []).some((kind) => kind !== this.#kind);
    }

    /**
     * Загружает озвучки и выбирает стартовую
     * @param {{aid?:string|number, voice?:number|string, episode?:number}} [opts]
     *  voice — предпочитаемая озвучка (из синхронизации), episode — стартовый эпизод
     * @returns {Promise<boolean>} false — загрузку перебил новый вызов
     */
    async load({ aid, voice, episode } = {}) {
        this.#abort?.abort();
        const ctrl = this.#abort = new AbortController();

        if (aid !== undefined && aid !== null) this.aid = String(aid);
        if (!this.aid) throw new Error('[player] aid is required');

        this.voice = undefined;
        this.count = 0;

        const start = Number(episode);
        if (Number.isInteger(start) && start > 0) this.#episode = start;

        const items = await Providers.voices({ aid: this.aid, signal: ctrl.signal });
        if (ctrl.signal.aborted) return false;

        this.items = items;
        this.voices = new Map();
        for (const item of items) this.voices.set(item.id, item);

        this.favorites.reload();
        this.trigger(WatchPlayer.Events.VOICES, { voices: this.voices, items });

        const pick = this.#pick(voice);
        if (pick) this.selectVoice(pick.id);

        this.trigger(WatchPlayer.Events.READY, { voices: this.voices, items, voice: this.voice }, { replay: true });
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
        this.count = Math.max(0, Number(voice.episodes) || 0);

        if (this.#episode > this.count) this.#episode = this.count;
        if (this.count > 0 && this.#episode < 1) this.#episode = 1;

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

        if (!this.voice || !Number.isInteger(n) || n < 1 || n > this.count) return false;
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
        if (this.voice && n > this.count) return false;

        this.#episode = n;
        if (!silent) this.trigger(WatchPlayer.Events.MARK, { episode: n });
        return true;
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