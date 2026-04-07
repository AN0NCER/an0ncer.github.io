import { Tunime } from "../../modules/api.tunime.js";

export const log = console.log.bind(console, '[tplayer] ->');
export const err = console.error.bind(console, `[tplayer] ->`);
export const warn = console.warn.bind(console, `[tplayer] ->`);

export const logger = new class {
    constructor(limit = 1000) {
        this.logs = [];
        this.limit = limit
    }

    log(level, message, details = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...details
        };

        this.logs.push(entry);

        // Ограничиваем размер буфера
        if (this.logs.length > this.limit) {
            this.logs.shift();
        }
    }

    getLogFile() {
        const content = JSON.stringify(this.logs, null, 2);
        return new Blob([content], { type: 'application/json' });
    }

    clear() {
        this.logs = [];
    }

    send() {
        Tunime.api.device.log().POST({ file: this.getLogFile() });
    }
}();