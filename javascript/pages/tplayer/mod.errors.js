import Hls from "../../library/hls.esm.js";
import { Player } from "./mod.tplayer.js"
import { Logger, warn, log } from "./utils/util.log.js";

export class ErrorHandler {
    static Severity = {
        LOW: 'low',       // предупреждения, не мешают воспроизведению
        MEDIUM: 'medium', // требуют внимания, но можно продолжить
        FATAL: 'fatal'    // воспроизведение невозможно
    }

    static Codes = {
        // Ошибки компонентов
        COMPONENT_LOW: { severity: ErrorHandler.Severity.LOW, message: 'Незначительная ошибка в работе компоненте. Работа продолжается' },
        COMPONENT_MEDIUM: { severity: ErrorHandler.Severity.MEDIUM, message: 'Ошибка в работе компоненте. Работа продолжается' },
        COMPONENT_FATAL: { severity: ErrorHandler.Severity.FATAL, message: 'Ошибка в работе компонента. Продолжение не возможно.' },

        // Ошибки HLS — сеть
        HLS_NETWORK: { severity: ErrorHandler.Severity.MEDIUM, message: 'Ошибка сети HLS. Попытка восстановления...' },
        HLS_NETWORK_FATAL: { severity: ErrorHandler.Severity.FATAL, message: 'Фатальная ошибка сети HLS. Воспроизведение невозможно.' },

        // Ошибки HLS — медиа
        HLS_MEDIA: { severity: ErrorHandler.Severity.MEDIUM, message: 'Ошибка медиа HLS. Попытка восстановления...' },
        HLS_MEDIA_FATAL: { severity: ErrorHandler.Severity.FATAL, message: 'Фатальная ошибка медиа HLS. Воспроизведение невозможно.' },

        // Ошибки HLS — прочее
        HLS_OTHER: { severity: ErrorHandler.Severity.LOW, message: 'Прочая ошибка HLS.' },
        HLS_OTHER_FATAL: { severity: ErrorHandler.Severity.FATAL, message: 'Фатальная прочая ошибка HLS.' },
    }

    /**
     * @param {Player} player
     * @param {{}} [opts={}] 
     */
    constructor(player, opts = {}) {
        this.player = player;
        this.player.services['error'] = this;

        this._handling = false;

        window.addEventListener('error', (event) => {
            this.throw('UNHANDLED', 'global', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.log('UNHANDLED', 'global', { reason: event.reason })
            this.throw('UNHANDLED', 'global', { reason: event.reason });
        });

        if (this.player.device.isHls) {
            this._initHlsErrors();
        } else {
            this._initVideoErrors();
        }
    }

    _initHlsErrors() {
        const module = 'hls.js';
        const video = this.player.video;

        // Защита от шторма ретраев: если сеть сыпет не-фатальными ошибками
        // подряд (протухшая ссылка -> 403 на каждый фрагмент, ~15 попыток/сек)
        const STORM_LIMIT = 5;
        const STORM_WINDOW_MS = 10000;
        let networkErrors = [];

        this.player.hls.on(Hls.Events.ERROR, (event, data) => {
            const { type, fatal } = data;

            if (!fatal) {
                if (type === Hls.ErrorTypes.NETWORK_ERROR) {
                    const now = Date.now();
                    networkErrors = networkErrors.filter(t => now - t < STORM_WINDOW_MS);
                    networkErrors.push(now);

                    if (networkErrors.length >= STORM_LIMIT) {
                        networkErrors = [];
                        this.throw('HLS_NETWORK_FATAL', module, data.error);
                        return;
                    }
                }

                const code = nonFatalCode(type);
                this.throw(code, module, data.error, { currentTime: video.currentTime, paused: video.paused });
                return;
            }

            const code = fatalCode(type);
            this.throw(code, module, data.error);
        });

        function nonFatalCode(type) {
            switch (type) {
                case Hls.ErrorTypes.NETWORK_ERROR: return 'HLS_NETWORK';
                case Hls.ErrorTypes.MEDIA_ERROR: return 'HLS_MEDIA';
                default: return 'HLS_OTHER';
            }
        }

        function fatalCode(type) {
            switch (type) {
                case Hls.ErrorTypes.NETWORK_ERROR: return 'HLS_NETWORK_FATAL';
                case Hls.ErrorTypes.MEDIA_ERROR: return 'HLS_MEDIA_FATAL';
                default: return 'HLS_OTHER_FATAL';
            }
        }
    }

    _initVideoErrors() {
        const video = this.player.video;

        video.addEventListener('error', () => {
            const error = video.error;

            if (!error) return;

            const MESSAGE = {
                1: 'MEDIA_ERR_ABORTED',
                2: 'MEDIA_ERR_NETWORK',
                3: 'MEDIA_ERR_DECODE',
                4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
            };

            const code = MESSAGE[error.code] ?? `UNKNOWN_${error.code}`;
            const message = error.message || code;

            this.throw(code, 'video', error, message);
        })
    }

    #freshAttempts = 0;
    #lastFreshAt = 0;

    /**
     * Восстановление после сетевого фатала
     * @returns {Promise<boolean>}
     */
    async #tryFreshSource() {
        if (this.#freshAttempts >= 2) return false;
        if (Date.now() - this.#lastFreshAt < 30000) return false;

        this.#freshAttempts++;
        this.#lastFreshAt = Date.now();

        try {
            log('Попытка восстановления свежим источником (без кэша)', 'api');
            return await this.player.refreshSource();
        } catch (e) {
            warn('Восстановление свежим источником не удалось', 'api', { details: { error: String(e) } });
            return false;
        }
    }

    /**
     * @param {string} code - ключ из ErrorHandler.Codes
     * @param {string} module - тип откуда произошла ошибка
     * @param {Error|Event} [e] - оригинальное событие/ошибка
     */
    throw(code, module, e = null, details = null) {
        this._handling = true;

        try {
            const descriptor = ErrorHandler.Codes[code] ?? {
                severity: ErrorHandler.Severity.MEDIUM,
                message: `Неизвестный код ошибки: ${code}`
            };

            const error = {
                code,
                severity: descriptor.severity,
                message: descriptor.message,
                original: e,
                timestamp: Date.now()
            };

            const type = descriptor.severity === ErrorHandler.Severity.FATAL ? 'error' : 'warn';

            console[type](
                `[plr][${descriptor.severity}] -> ${descriptor.message}`, e ?? ''
            );

            Logger[type](descriptor.message, module, { details, error: error.original });

            if (descriptor.severity === ErrorHandler.Severity.FATAL) {
                (async () => {
                    // Сетевой фатал чаще всего = протухшая CDN-ссылка
                    // (кэшированный источник). Прежде чем сдаваться в
                    // Kodik-iframe — пробуем получить свежий источник
                    // без кэша и продолжить с того же места.
                    if (code === 'HLS_NETWORK_FATAL' && await this.#tryFreshSource()) {
                        log('Восстановлено свежим источником, Kodik не понадобился', 'api');
                        Logger.send();
                        return;
                    }

                    log('Переключение на Kodik плеер', 'api');
                    await Logger.send();
                    this.player.trigger(Player.Events.ERROR, error);
                })();
            } else if (code === 'UNHANDLED') {
                Logger.send();
            } else {
                this.player.trigger(Player.Events.ERROR, error);
            }
        } finally {
            this._handling = false;
        }
    }

    log(message, module, details = {}) {
        log(message, module, details);
    }
}