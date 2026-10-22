import { Emitter } from "./player.emitter.js";

/**
 * Сообщения iframe → события Frame.
 * Протокол общий для Kodik и Tunime плеера (tplayer/mod.api.js).
 * @type {Record<string, (frame:Frame, value:any) => void>}
 */
const MESSAGES = {
    kodik_player_duration_update: (frame, value) => {
        frame.state.duration = value;
        frame.trigger('duration', value);
    },
    kodik_player_time_update: (frame, value) => {
        frame.state.time = value;
        frame.trigger('timeupdate', value);
    },
    kodik_player_play: (frame) => frame.trigger('play', frame.state),
    kodik_player_pause: (frame) => frame.trigger('pause', frame.state),
    kodik_player_seek: (frame, value) => frame.trigger('seek', value),
    kodik_player_time: (frame, value) => frame.trigger('time', value),
    kodik_player_skip_button: (frame, value) => frame.trigger('skip', value),
    tunime_error: (frame, value) => frame.trigger('error', value),
    tunime_next: (frame, value) => frame.trigger('next', value),
    tunime_fullscreen: (frame, value) => frame.trigger('fullscreen', value),
    tunime_switch: (frame, value) => frame.trigger('switch', value)
};

/**
 * Iframe плеера: навигация, команды и входящие сообщения.
 *
 * События:
 *  - 'loading' { url }, 'loaded' { count, url }
 *  - 'play' / 'pause' (state), 'timeupdate', 'duration', 'seek', 'time', 'skip',
 *    'error', 'next', 'fullscreen', 'switch' (value из iframe)
 */
export class Frame extends Emitter {
    /** Текущие данные видео (живой объект — не пересоздаётся) */
    state = { duration: 0, time: 0 };

    loaded = false;
    count = 0;

    /** @type {string|undefined} */
    url = undefined;

    #selector;
    /** @type {(() => void) | undefined} */
    #pending = undefined;

    /** @param {string} [selector]  */
    constructor(selector = '#kodik-player') {
        super();
        this.#selector = selector;
        window.addEventListener('message', (event) => this.#onMessage(event));
    }

    /** @returns {HTMLIFrameElement|null} */
    get el() {
        return document.querySelector(this.#selector);
    }

    /** @returns {Window|null} */
    get window() {
        return this.el?.contentWindow ?? null;
    }

    /**
     * Открывает плеер по ссылке (без записи в history)
     * @param {string} url
     * @returns {boolean}
     */
    open(url) {
        const el = this.el;
        if (!el?.contentWindow || !url) return false;

        this.#pending?.();

        this.url = url;
        this.loaded = false;
        this.state.time = 0;
        this.state.duration = 0;

        let target = null;
        try {
            target = new URL(url, window.location.href);
        } catch { }

        const sameOrigin = target?.origin === window.location.origin;

        const cleanup = () => {
            el.removeEventListener('load', onLoad);
            this.#pending = undefined;
        };

        const onLoad = () => {
            // Свой origin — убеждаемся, что загрузилась именно наша страница,
            // а не заглушка (iframe стартует с 404.html)

            if (sameOrigin) {
                try {
                    if (el.contentWindow.location.pathname !== target.pathname) return;
                } catch { }
            }

            cleanup();
            this.loaded = true;
            this.count++;
            this.trigger('loaded', { count: this.count, url });
        };

        el.addEventListener('load', onLoad);
        this.#pending = cleanup;

        this.trigger('loading', { url });
        el.contentWindow.location.replace(url);
        return true;
    }

    /**
     * Команда плееру (kodik_player_api). До загрузки игнорируется.
     * @param {string} method
     * @param {Object} [data]
     * @returns {boolean} отправлена ли команда
     */
    exec(method, data = {}) {
        if (!this.loaded) return false;

        const target = this.window;
        if (!target) return false;

        target.postMessage({ key: 'kodik_player_api', value: { method, ...data } }, '*');
        return true;
    }

    /**
     * Сообщение пришло из нашего iframe (или вложенного в него окна)
     * @param {MessageEventSource|null} source
     */
    #isOwn(source) {
        const target = this.window;
        if (!target || !source) return false;

        let current = source;
        for (let depth = 0; depth < 5 && current; depth++) {
            if (current === target) return true;

            let parent;
            try {
                parent = current.parent;
            } catch {
                return false;
            }

            if (!parent || parent === current) return false;
            current = parent;
        }

        return false;
    }

    /** @param {MessageEvent} event */
    #onMessage(event) {
        const data = event.data;
        if (!data || typeof data !== 'object' || typeof data.key !== 'string') return;

        const handler = MESSAGES[data.key];
        if (!handler || !this.#isOwn(event.source)) return;

        handler(this, data.value);
    }
}