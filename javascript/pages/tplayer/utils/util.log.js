import { $PWA } from "../../../core/pwa.core.js";

export let LOG_PROCESS = 'global';
export let LOG_LIMIT = 1000;

/**
 * @typedef Log 
 * @property {number} ts - время
 * @property {'INFO'|'WARN'|'ERROR'} lvl - уровень логирования
 * @property {string} lib - библиотека лога **lib**
 * @property {string} msg - сообщение лога
 * @property {Error} [err] - ошибка
 * @property {{}} [details] - дополнительные значения
 * */

export const Logger = new class {
    constructor() {
        /**@type {[Log]} @private */
        this.list = [];
        /**@private */
        this.session = {
            startedAt: new Date(),
            environment: getEnvironment()
        }
    }


    /**Основные функции */

    info(msg, lib, { details, error } = {}) {
        this._push('INFO', msg, lib, { details, error });
    }
    warn(msg, lib, { details, error } = {}) {
        this._push('WARN', msg, lib, { details, error });
    }
    error(msg, lib, { details, error } = {}) {
        this._push('ERROR', msg, lib, { details, error });
    }

    /**Вспомогательные функции */

    setOpts({ opts = {}, device = {} } = {}) {
        this.session.options = opts;
        this.session.device = device;
    }

    setMedia({ animeId, animeTitle, mediaVoice, mediaEpisode, kodikId, kodikLink } = {}) {
        this.session.media = {
            animeId,
            animeTitle,
            mediaVoice,
            mediaEpisode,
            kodikId,
            kodikLink
        };
    }

    getReport() {
        let log = this.__header();

        const maxLibLen = this.list.reduce((max, log) =>
            Math.max(max, log.lib.length), 0
        );

        const maxLvlLen = this.list.reduce((max, log) =>
            Math.max(max, log.lvl.length), 0
        );

        this.list.forEach(({ ts, lib, lvl, msg, details, err }) => {
            const _mod_space = " ".repeat(maxLibLen + 1 - lib.length);
            const _lvl_space = " ".repeat(maxLvlLen + 1 - lvl.length);

            log += `${ts} ${lvl}${_lvl_space}[${lib}]${_mod_space}${msg}`;

            if (details && typeof details === 'object' && Object.keys(details).length > 0) {
                log += " ";
                const pairs = Object.entries(details).map(([key, value]) => `${key}=${value}`);


                for (let i = 0; i < pairs.length; i++) {
                    const pair = pairs[i];
                    log += `${pair}${i < pairs.length - 1 ? " | " : ""}`;
                }
            }

            log += `\n`;

            if (err) {
                if (err.message) {
                    log += `${" ".repeat(ts.length + 1)}${lvl}${_lvl_space}[${lib}]${_mod_space}${err.message}`;
                    if (err.stack) {
                        log += `\n`;
                    }
                }

                if (err.stack) {
                    log += `\n${err.stack}\n\n`
                }

                if (err.reason) {
                    log += `${" ".repeat(ts.length + 1)}${lvl}${_lvl_space}[${lib}]${_mod_space}${err.reason}`;
                    if (err.reason.stack) {
                        log += `\n${err.reason.stack}\n\n`
                    }
                }
            }
            console.log(ts, lib, lvl, msg, details, err);
        });

        log += this.__footer();
        console.log(log);
        return log;
    }

    getLogFile() {
        const content = this.getReport();
        return new Blob([content], { type: 'text/plain' });
    }

    async send() {
        const { Tunime } = await import("../../../modules/api.tunime.js");
        return Tunime.api.device.log('tplayer').POST({ file: this.getLogFile(), source: window.location.href });
    }

    /**Приватные функции */

    /**
     * Получить текущее время
     * @returns {string} Время в ISO формате
     * @private
     */
    _ts() {
        return new Date().toISOString();
    }

    /**
     * Добавление лога
     * @param {'INFO'|'WARN'|'ERROR'} lvl 
     * @param {string} msg 
     * @param {string} lib
     * @private
     */
    _push(lvl, msg, lib = 'io', { details = {}, error } = {}) {
        /**@type {Log} */
        const log = {
            ts: this._ts(),
            lib, lvl, msg
        };

        if (details) {
            log.details = details;
        }

        if (error) {
            log.err = error;
        }

        if (this.list.length > LOG_LIMIT) {
            this.list.pop();
        }

        this.list.push(log);
    }

    /**
     * Заголовок для log файла
     * @returns {string} Заготовка шапки лога
     * @private
    */
    __header() {
        let log = `▶ SESSION STARTED — ${this.session.startedAt.toISOString()}\n`
            + `──────────────────────────────────────────────────────────────\n`
            + `  app.version       ${$PWA.meta.version}\n`
            + `  app.build         ${$PWA.meta.hash}\n`;

        if (this.session.device) {
            log += `  app.install       ${this.session.device?.isPWA}\n`;
        }

        log += `  device.os         ${this.session.environment.os}\n`
            + `  device.type       ${this.session.environment.deviceType}\n`
            + `  device.locale     ${this.session.environment.language}\n`;

        if (this.session.device) {
            log += `  device.ios        ${this.session.device?.isIOS}\n`
                + `  hls.support       ${this.session.device?.isHls}\n`;
        }

        log += `  browser           ${this.session.environment.browser}\n`
            + `  browser.version   ${this.session.environment.browserVersion}\n`
            + `  browser.engine    ${this.session.environment.engine}\n`
            + `──────────────────────────────────────────────────────────────\n`
            + `  iframe.referrer   ${document?.referrer ?? 'no'} \n`
            + `  iframe.href       ${window.location.href} \n`;

        if (this.session.media) {
            log += `──────────────────────────────────────────────────────────────\n`
                + `  anime.id          ${this.session.media?.animeId}\n`
                + `  anime.title       ${this.session.media?.animeTitle}\n`
                + `  media.voice       ${this.session.media?.mediaVoice}\n`
                + `  media.episode     ${this.session.media?.mediaEpisode}\n`
                + `  kodik.id          ${this.session.media?.kodikId}\n`
                + `  kodik.link        ${this.session.media?.kodikLink}\n`;
        }

        if (this.session.options) {
            log += `──────────────────────────────────────────────────────────────\n`
                + `  quality.set       ${this.session.options?.requiredQuality}\n`
                + `  quality.auto      ${this.session.options?.autoQualitySelect}\n`
                + `  fullscreen.auto   ${this.session.options?.autoFullScreen}\n`
                + `  default.ui        ${this.session.options?.defaultUIControls}\n`
                + `  switch.auto       ${this.session.options?.autoEpisodeSwitch}\n`
                + `  media.enable      ${this.session.options?.enableMediaSession}\n`
                + `  touch.enable      ${this.session.options?.touchControls}\n`;
        }

        log += `──────────────────────────────────────────────────────────────\n\n`;

        return log;
    }

    /**
     * Футер для log файла
     * @returns {string} Заготовка футер лога
     * @private
     */
    __footer() {
        const elapsed = new Date() - this.session.startedAt; // миллисекунды

        const totalSeconds = Math.floor(elapsed / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const duration = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

        const log = `\n──────────────────────────────────────────────────────────────\n\n`
            + `◼ SESSION ENDED — ${this._ts()}\n`
            + `   duration         ${duration}\n`;
        return log;
    }

}();

function getEnvironment() {
    const ua = navigator.userAgent;

    // Определяем движок
    const engine =
        /Gecko\//.test(ua) && !/like Gecko/.test(ua) ? 'Gecko' :
            /AppleWebKit\//.test(ua) ? 'WebKit/Blink' :
                /Trident\//.test(ua) ? 'Trident' : 'Unknown';

    // Определяем браузер
    const browser =
        /Edg\//.test(ua) ? 'Edge' :
            /OPR\//.test(ua) ? 'Opera' :
                /Chrome\//.test(ua) ? 'Chrome' :
                    /Firefox\//.test(ua) ? 'Firefox' :
                        /Safari\//.test(ua) ? 'Safari' : 'Unknown';

    const browserVersion = (
        ua.match(/(?:Chrome|Firefox|Edg|OPR|Safari)\/(\d+\.\d+)/) || []
    )[1] ?? 'Unknown';

    // Тип устройства
    const isMobile = /Mobi|Android|iPhone|iPad/.test(ua);
    const isTablet = /iPad|Android(?!.*Mobile)/.test(ua);
    const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

    return {
        engine,
        browser,
        deviceType,
        browserVersion,
        language: navigator.language,
        os: getOS(ua),
    }

    function getOS(ua) {
        if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
        if (/Windows NT/.test(ua)) return 'Windows';
        if (/Mac OS X/.test(ua)) return 'macOS';
        if (/Android/.test(ua)) return 'Android';
        if (/iPhone|iPad/.test(ua)) return 'iOS';
        if (/Linux/.test(ua)) return 'Linux';
        return 'Unknown';
    }
}

export const log = Logger.info.bind(Logger);
export const err = Logger.error.bind(Logger);
export const warn = Logger.warn.bind(Logger);