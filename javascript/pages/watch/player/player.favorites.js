import { Emitter } from "./player.emitter.js";

const BASE_KEY = 'save-translations';

/** @param {string} key @returns {Array<number|string>} */
function read(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

/**
 * Избранные озвучки. Ключи localStorage совместимы со старой версией:
 *  - `save-translations` — общий список;
 *  - `save-translations-<aid>` — по франшизе (параметр dubanime), плюс подмешиваются связанные аниме.
 *
 * События: 'favorite' { type: 'save' | 'remove', id }
 */
export class Favorites extends Emitter {
    key = BASE_KEY;

    /** @type {Set<number|string>} */
    set = new Set();

    #aid
    #scoped;
    #related;

    /**
     * @param {{aid?:() => string|undefined, scoped?:() => boolean, related?:() => Array<string|number>}} [opts]
     */
    constructor({ aid = () => undefined, scoped = () => false, related = () => [] } = {}) {
        super();
        this.#aid = aid;
        this.#scoped = scoped;
        this.#related = related;
    }

    /** Перечитывает избранное из localStorage с учётом текущих настроек */
    reload() {
        const aid = this.#aid();
        const scoped = Boolean(this.#scoped()) && aid !== undefined && aid !== null;

        this.key = scoped ? `${BASE_KEY}-${aid}` : BASE_KEY;
        this.set = new Set(read(this.key));

        if (scoped) {
            for (const fid of this.#related() ?? []) {
                read(`${BASE_KEY}-${fid}`).forEach((id) => this.set.add(id));
            }
        }

        return this;
    }

    /** @param {number|string} id */
    has(id) {
        return this.set.has(id);
    }

    /**
     * Добавляет или убирает озвучку из избранного
     * @param {number|string} id
     * @returns {'save'|'remove'}
     */
    toggle(id) {
        const type = this.set.has(id) ? 'remove' : 'save';

        if (type === 'save') this.set.add(id);
        else this.set.delete(id);

        try {
            localStorage.setItem(this.key, JSON.stringify([...this.set]));
        } catch (err) {
            console.warn('[player] favorites not saved', err);
        }

        this.trigger('favorite', { type, id });
        return type;
    }
}