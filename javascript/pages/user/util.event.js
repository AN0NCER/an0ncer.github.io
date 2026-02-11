/**
 * Простая система событий с поддержкой одноразовых слушателей и replay.
 */
export class TEvents {
    /** @type {Record<string, Array<{callback: Function, once: boolean}>>} */
    #callbacks = {}

    /** @type {Record<string, any[]>} */
    #replayed = {}

    /**
     * Подписка на событие.
     *
     * @param {string} event - Имя события
     * @param {( ...args:any ) => void} callback - Обработчик события
     * @param {{
     *    once?: boolean,
     *    replay?: boolean
     * }} [options={}] - Опции слушателя
     *
     * @example
     * events.on("loaded", data => console.log(data));
     *
     * @example
     * events.on("ready", () => console.log("once"), { once: true });
     *
     * @example
     * // Поздний слушатель автоматически получит последнее состояние
     * events.on("user", u => console.log("late:", u), { replay: true });
     */
    on(event, callback, { once = false, replay = false } = {}) {
        if (!this.#callbacks[event]) {
            this.#callbacks[event] = [];
        }

        this.#callbacks[event].push({ callback, once });

        if (replay && this.#replayed.hasOwnProperty(event)) {
            callback(...this.#replayed[event]);
            if (once) this.off(event, callback);
        }
    }

    /**
     * Отписка от события.
     *
     * @param {string} event - Имя события
     * @param {( ...args:any ) => void} [callback] - Конкретный обработчик, если нужно удалить только его
     *
     * @example
     * events.off("loaded"); // удалить всех
     *
     * @example
     * function fn() {}
     * events.on("data", fn);
     * events.off("data", fn); // удалить только fn
     */
    off(event, callback) {
        if (!this.#callbacks[event]) return;

        if (!callback) {
            delete this.#callbacks[event];
        } else {
            this.#callbacks[event] = this.#callbacks[event].filter(
                listener => listener.callback !== callback
            );

            if (this.#callbacks[event].length === 0) {
                delete this.#callbacks[event];
            }
        }
    }

    /**
     * Вызов события.
     *
     * Последний аргумент может быть объектом `{ replay: true }`,
     * чтобы сохранить данные и автоматически отдавать их новым подписчикам.
     *
     * @param {string} event - Имя события
     * @param {...any} argsAndOptions - Аргументы обработчиков и необязательная опция `{ replay: true }`
     *
     * @example
     * events.trigger("loaded", 123);
     *
     * @example
     * // Храним last state:
     * events.trigger("user", { name: "Max" }, { replay: true });
     */
    trigger(event, ...argsAndOptions) {
        let replayFlag = false;
        let args = argsAndOptions;

        const last = argsAndOptions[argsAndOptions.length - 1];
        if (typeof last === 'object' && last !== null && 'replay' in last) {
            replayFlag = last.replay;
            args = argsAndOptions.slice(0, -1);
        }

        if (replayFlag) {
            this.#replayed[event] = args;
        }

        const listeners = this.#callbacks[event];
        if (!listeners) return;

        for (const listener of [...listeners]) {
            listener.callback(...args);
        }

        this.#callbacks[event] = listeners.filter(l => !l.once);

        if (this.#callbacks[event].length === 0) {
            delete this.#callbacks[event];
        }
    }
}