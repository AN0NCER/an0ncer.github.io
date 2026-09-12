import Collections from "../../../modules/tun.collections.js";

/**
 * Черновик коллекции: то, что пользователь набрал в окне, но ещё не
 * сохранил. Хранится отдельно от самой коллекции — пока не нажата кнопка
 * подтверждения, ничего меняться не должно.
 *
 * @param {'create' | 'edit'} mode
 * @param {string | null} cid
 */
export function createDraft(mode, cid) {
    /** Исходное состояние: у создания пустое, у редактирования — коллекция */
    const source = mode === 'edit' ? Collections.get(cid) : null;

    const start = {
        title: source?.title ?? '',
        visibility: source?.visibility ?? 'private',
        anime: source ? Object.keys(source.items ?? {}).map(Number) : []
    };

    const value = { ...start, anime: [...start.anime] };

    /** Сравнение составов без оглядки на порядок */
    const sameAnime = (a, b) => a.length === b.length && a.every(id => b.includes(id));

    return {
        get title() { return value.title; },
        set title(next) { value.title = String(next ?? '').trim(); },

        get visibility() { return value.visibility; },
        set visibility(next) { value.visibility = next; },

        get anime() { return [...value.anime]; },
        set anime(next) { value.anime = [...new Set(next.map(Number).filter(Boolean))]; },

        /** Нашлась ли коллекция при открытии редактирования */
        get exists() { return mode === 'create' || source !== null; },

        /** Название обязательно — без него сохранять нечего */
        get valid() { return value.title.length > 0; },

        /** Отличается ли от исходного состояния */
        get dirty() {
            if (mode === 'create') return this.valid;

            return value.title !== start.title
                || value.visibility !== start.visibility
                || !sameAnime(value.anime, start.anime);
        },

        /**
         * Что именно поменялось — для сохранения отправляем только это,
         * а не весь состав заново
         */
        get changes() {
            return {
                title: value.title !== start.title ? value.title : undefined,
                visibility: value.visibility !== start.visibility ? value.visibility : undefined,
                add: value.anime.filter(id => !start.anime.includes(id)),
                remove: start.anime.filter(id => !value.anime.includes(id))
            };
        }
    };
}

export default createDraft;
