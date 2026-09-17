/**
 * Коллаж превью коллекции.
 *
 * Раскладку выбирает CSS по `data-count`, здесь только плитки и картинки.
 * Постеров всегда столько, сколько нашлось: пустых мест в коллаже не
 * остаётся, а один постер занимает весь квадрат.
 */

/** Больше четырёх коллаж не показывает */
const MAX = 4;

/** Когда постера нет — заглушка вместо пустого прямоугольника */
const NOIMAGE = '/images/noanime.png';

/**
 * Какие аниме показывать на обложке.
 *
 * Берём `cover` коллекции, а не первые из состава: у коллекций с ручной
 * обложкой это разные наборы, и показывать надо выбранное человеком
 *
 * @param {Object} collection
 * @returns {number[]}
 */
export const coverIds = (collection) => {
    const cover = Array.isArray(collection?.cover) ? collection.cover : [];

    const ids = cover.length > 0
        ? cover
        : (Array.isArray(collection?.list)
            ? collection.list
            : Object.keys(collection?.items ?? {}));

    return ids.map(Number).filter(Boolean).slice(0, MAX);
};

/**
 * Нарисовать коллаж.
 *
 * @param {HTMLElement} root - `.collection-preview`
 * @param {Array<string | null>} urls - ссылки на постеры по порядку.
 *  `null` там, где постер ещё не приехал — встанет заглушка
 */
export const drawPreview = (root, urls = []) => {
    if (!root) return;

    // Пустая коллекция — одна заглушка: квадрат с четырьмя серыми
    // плитками выглядел бы как незагрузившийся коллаж
    const list = urls.slice(0, MAX);
    const count = Math.max(list.length, 1);

    root.dataset.count = String(count);
    root.innerHTML = '';

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
        const anime = document.createElement('div');
        const img = document.createElement('img');

        anime.className = 'anime';

        img.loading = 'lazy';
        img.alt = '';
        img.src = list[i] || NOIMAGE;

        // Битая ссылка — та же заглушка: пустая плитка в коллаже
        // выглядит поломкой
        img.addEventListener('error', () => { img.src = NOIMAGE; }, { once: true });

        anime.append(img);
        fragment.append(anime);
    }

    root.append(fragment);
};

/**
 * Коллаж по коллекции: сам достанет id обложки и превью из кэша
 *
 * @param {HTMLElement} root
 * @param {Object} collection
 * @param {(id: number) => string | null | undefined} poster - откуда
 *  брать ссылку на постер по id аниме
 */
export const drawFor = (root, collection, poster) => {
    const ids = coverIds(collection);

    drawPreview(root, ids.map(id => poster(id) ?? null));
};

export default drawPreview;
