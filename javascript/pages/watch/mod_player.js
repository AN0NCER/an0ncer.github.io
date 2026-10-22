/**
 * Плеер страницы просмотра — слой совместимости.
 *
 * Логика живёт в ./player/ (WatchPlayer + PlayerView), источники — в providers/.
 * Этот файл сохраняет старый API (Player.CTranslation, CEpisodes, CMessage, PControl,
 * results/resultsVoice, selected, isOwner…), чтобы остальные модули работали без правок.
 *
 * Новый код — через ядро: `IPlayer.Init().core` (см. player/player.core.js).
 */
import { Providers } from "../../providers/registry.js";
import { KodikProvider } from "../../providers/kodik/kodik.provider.js";
import { WatchPlayer } from "./player/player.core.js";
import { PlayerView } from "./player/player.view.js";
import { Emitter } from "./player/player.emitter.js";
import { toLegacy } from "./player/player.legacy.js";
import { watchSequence } from "./mod.chronology.js";

Providers.register(KodikProvider);

/** @type {Player|undefined} */
let _player = undefined;

/** Старые имена событий CMessage → события Frame */
const MESSAGE_MAP = {
    pause: ['pause', (player) => player.VData],
    play: ['play', (player) => player.VData],
    error: ['error', (_, value) => ({ value })],
    next: ['next', (player) => player],
    fullscreen: ['fullscreen', (_, value) => ({ value })],
    switch: ['switch', (_, value) => ({ value })],
    time: ['time', (_, value) => ({ value })],
    seek: ['seek', (_, value) => ({ value })],
    skip_button: ['skip', (_, value) => ({ value })]
};

class Episodes {
    /**
     * @param {WatchPlayer} core
     * @param {PlayerView} view
     */
    constructor(core, view) {
        this.core = core;
        this.view = view;
    }

    get count() { return this.core.count; }

    get selected() { return this.core.episode; }
    set selected(value) { this.core.mark(value, { silent: true }); }

    get hasMenu() { return this.view.hasMenu; }
    get wrappers() { return this.view.wrappers; }

    /** Отметить эпизод без перезагрузки плеера */
    Select(episode) {
        this.core.mark(episode);
    }

    Revise() {
        this.view.revise();
    }

    /**
     * @param {'selected'} event
     * @param {(data:{episode:number, translation:number|string, user_handler:boolean}) => void} callback
     */
    on(event, callback) {
        if (event === 'selected') {
            return this.core.on('episode', ({ episode, voice, user }) => {
                callback({ episode, translation: voice?.id, user_handler: user });
            });
        }
        return () => { };
    }
}

class Translation {
    /**
     * @param {WatchPlayer} core
     * @param {Player} player
     */
    constructor(core, player) {
        this.core = core;
        this.Player = player;
    }

    get id() { return this.core.voice?.id; }
    get name() { return this.core.voice?.title; }
    get selected() { return Boolean(this.core.voice); }

    get lskey() { return this.core.favorites.key; }
    set lskey(value) { this.core.favorites.key = value; }

    get saved() { return this.core.favorites.set; }
    set saved(value) { this.core.favorites.set = value; }

    Favorites(id) {
        this.core.favorites.toggle(id);
    }

    /** @param {{id:number|string, user_handler?:boolean}} opts */
    Select({ id, user_handler = false } = {}) {
        this.core.selectVoice(id, { user: user_handler });
    }

    /**
     * @param {'selected'|'loaded'|'favorite'} event
     * @param {Function} callback
     */
    on(event, callback) {
        switch (event) {
            case 'selected':
                return this.core.on('voice', ({ voice, user }) => callback({ id: voice.id, user_handler: user }));
            case 'loaded':
                return this.core.on('ready', () => callback(this.Player));
            case 'favorite':
                return this.core.favorites.on('favorite', callback);
            default:
                return () => { };
        }
    }
}

class Message {
    /**
     * @param {WatchPlayer} core
     * @param {Player} player
     */
    constructor(core, player) {
        this.core = core;
        this.Player = player;
    }

    /**
     * @param {keyof typeof MESSAGE_MAP | string} event
     * @param {Function} callback
     */
    on(event, callback) {
        const map = MESSAGE_MAP[event];
        if (!map) return this.core.frame.on(event, callback);

        const [name, payload] = map;
        return this.core.frame.on(name, (value) => callback(payload(this.Player, value)));
    }
}

class Control {
    /** @param {WatchPlayer} core */
    constructor(core) {
        this.core = core;
    }

    /**
     * @param {'play'|'pause'|'seek'|'volume'|'mute'|'unmute'|'change_episode'|'enter_pip'|'exit_pip'|'get_time'|'set_episode'} method
     * @param {Object} [data]
     */
    Exec(method, data = {}) {
        this.core.exec(method, data);
    }
}

class Player {
    #events = new Emitter();

    /** @type {Map<string|number, Object>} id материала → результат (Kodik формат) */
    results = new Map();

    /** @type {Map<number|string, Object>} id озвучки → результат (Kodik формат) */
    resultsVoice = new Map();

    /** Список озвучек загружен (Init) — на него смотрят комнаты */
    inited = false;

    constructor({ standart = false } = {}) {
        this.core = new WatchPlayer({
            aid: new URLSearchParams(window.location.search).get('id') ?? undefined,
            kind: standart ? 'tunime' : 'kodik',
            favorites: {
                scoped: () => $PARAMETERS.watch.dubanime,
                related: () => watchSequence
            }
        });

        this.view = new PlayerView(this.core);

        this.CMessage = new Message(this.core, this);
        this.PControl = new Control(this.core);
        this.CTranslation = new Translation(this.core, this);
        this.CEpisodes = new Episodes(this.core, this.view);

        this.core.on('voices', ({ voices, items }) => {
            this.results = new Map(items.map((voice) => [voice.sourceId, toLegacy(voice)]));
            this.resultsVoice = new Map([...voices].map(([id, voice]) => [id, toLegacy(voice)]));
        });

        this.core.on('ready', () => {
            this.inited = true;
            this.#events.trigger('inited', { results: this.results, resultsVoice: this.resultsVoice }, { replay: true });
        });

        this.core.frame.on('loaded', ({ count }) => {
            this.#events.trigger('loaded', { count, name: this.core.kind });
        });
    }

    /** Выбранная озвучка в формате Kodik */
    get selected() { return toLegacy(this.core.voice); }

    get loaded() { return this.core.frame.loaded; }

    get isOwner() { return this.core.owner; }
    set isOwner(value) { this.core.owner = Boolean(value); }

    /** { duration, time } — живой объект */
    get VData() { return this.core.frame.state; }

    get name() { return this.core.kind; }
    set name(value) { this.core.prefer(value); }

    /**
     * @param {{kodik_episode?:number, kodik_dub?:number|string}} [data]
     * @returns {Promise<Map<string|number, Object>>}
     */
    Init({ kodik_episode = undefined, kodik_dub = undefined } = {}) {
        return this.core
            .load({ voice: kodik_dub, episode: kodik_episode })
            .then(() => this.results);
    }

    Load() {
        this.core.reload();
    }

    /** @returns {boolean} удалось ли переключить */
    Switch() {
        return this.core.switch();
    }

    /**
     * @param {'inited'|'loaded'} event
     * @param {Function} callback
     */
    on(event, callback) {
        return this.#events.on(event, callback, { replay: event === 'inited' });
    }

    static Construct({ standart = false } = {}) {
        if (_player) _player.name = standart ? 'tunime' : 'kodik';
    }

    /**
     * Singleton плеера
     * @param {{standart?:boolean}} [param]
     * @returns {Player}
     */
    static Init(param) {
        if (_player === undefined) {
            _player = new Player(param);
        } else if (param) {
            Player.Construct(param);
        }
        return _player;
    }
}

export const IPlayer = Player;
