import { Kodik } from '../../modules/api.kodik.js'

/**
 * Kodik — основной источник. id озвучек без префикса (translation.id),
 * чтобы не ломать избранное, синхронизацию, комнаты и уведомления.
 * @type {import('../registry.js').Provider}
 */
export const KodikProvider = {
    id: 'kodik',
    title: 'Kodik',
    priority: 0,
    namespace: false,
    version: 1,
    players: ['tunime', 'kodik'],
    features: { sync: true, mark: true, download: true, notify: true, rooms: true },

    canPlay() {
        return { ok: true };
    },

    /** Kodik и есть замена */
    fallback(voice) {
        return voice;
    },

    async voices({ aid, signal }) {
        const response = await Kodik.Search({ shikimori_id: aid }, undefined, signal);

        if (!response || response.failed || !Array.isArray(response.results)) {
            throw new Error(`Kodik: bad response for ${aid}`);
        }

        return response.results
            .filter((item) => item?.translation?.id !== undefined && item?.translation?.id !== null)
            .map((item) => ({
                id: item.translation.id,
                sourceId: item.id,
                title: item.translation.title,
                type: item.translation.type,
                episodes: item.last_episode,
                raw: item,
                legacy: item
            }));
    },

    url(voice, episode, kind) {
        if (kind === 'tunime') {
            return `tplayer.html?id=${encodeURIComponent(voice.sourceId)}&e=${episode}`;
        }

        const link = voice.raw?.link;
        if (!link) return null;

        return `${link}?hide_selectors=true&episode=${episode}`;
    }
}