/**
 * Озвучка → объект в формате результата Kodik API (старый формат).
 * У Kodik это исходный объект, у остальных провайдеров — собранный.
 * Объект кэшируется: results и resultsVoice отдают одну и ту же ссылку.
 */

/** @type {WeakMap<Object, Object>} */
const cache = new WeakMap();

/**
 * @param {import('../../../providers/registry.js').Voice|undefined} voice
 * @returns {Object|undefined}
 */
export function toLegacy(voice) {
    if (!voice) return undefined;
    if (voice.legacy) return voice.legacy;

    let item = cache.get(voice);
    if (item) return item;

    const raw = voice.raw ?? {};

    item = {
        ...raw,
        id: voice.sourceId,
        provider: voice.provider,
        translation: {
            ...(raw.translation ?? {}),
            id: voice.id,
            title: voice.title,
            type: voice.type
        },
        last_episode: voice.episodes
    };

    cache.set(voice, item);
    return item;
}
