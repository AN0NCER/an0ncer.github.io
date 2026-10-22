import { TEvents } from "../utils/util.event.js";

/**
 * TEvents, у которого:
 *  - on() возвращает функцию отписки (на это опираются комнаты);
 *  - ошибка одного слушателя не обрывает остальных.
 */
export class Emitter extends TEvents {
    /** @type {Map<string, Map<Function, Function>>} */
    #wrapped = new Map();

    /**
     * @param {string} event
     * @param {(...args:any[]) => void} callback
     * @param {{once?:boolean, replay?:boolean}} [options]
     *  replay — сразу получить последнее событие, если оно уже было вызвано с { replay: true }.
     *  Без этой опции поздний подписчик прошлое событие не получит
     * @returns {() => void}
     */
    on(event, callback, options = {}) {
        if (typeof callback !== 'function') return () => { };

        const safe = (...args) => {
            try {
                return callback(...args);
            } catch (err) {
                console.error(`[player] listener "${event}" failed`, err);
            }
        };

        let byEvent = this.#wrapped.get(event);
        if (!byEvent) this.#wrapped.set(event, byEvent = new Map());
        byEvent.set(callback, safe);

        super.on(event, safe, options);

        return () => this.off(event, callback);
    }

    /**
     * @param {string} event
     * @param {(...args:any[]) => void} [callback]
     */
    off(event, callback) {
        if (!callback) {
            this.#wrapped.delete(event);
            return super.off(event);
        }

        const byEvent = this.#wrapped.get(event);
        const safe = byEvent?.get(callback);
        if (safe) byEvent.delete(callback);

        super.off(event, safe ?? callback);
    }

    /**
     * @param {string} event
     * @param {(...args:any[]) => void} callback
     * @param {{replay?:boolean}} [options]
     */
    once(event, callback, options = {}) {
        return this.on(event, callback, { ...options, once: true });
    }
}