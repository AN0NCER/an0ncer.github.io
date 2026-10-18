/**
 * Статус выхода под сезоном: точка, слово и хвост.
 *
 * «Airing», а не «status»: статусом в коде уже называется статус в списке
 * пользователя («Посмотрю», «Смотрю») — см. mod.controllers.js и URate.
 */

/** Слово статуса. Неизвестный статус показываем как «Вышел» */
const WORD = {
    ongoing: 'Выходит',
    anons: 'Анонс',
    released: 'Вышел'
};

const WEEKDAYS = [
    'по воскресеньям', 'по понедельникам', 'по вторникам', 'по средам',
    'по четвергам', 'по пятницам', 'по субботам'
];

/** Родительный падеж: «с 6 октября», «с октября 2027» */
const MONTHS = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

/** Статус Shikimori → значение data-status */
export const airingStatus = (anime) => WORD[anime?.status] ? anime.status : 'released';

/**
 * Хвост после слова статуса.
 *
 * Онгоинг — день выхода серий, анонс — дата премьеры, фильм — длительность.
 * Пустая строка — хвоста нет, CSS прячет его сам (.status-tail:empty)
 *
 * @param {Object} anime - аниме из GraphQL Shikimori
 * @returns {string}
 */
export function airingTail(anime) {
    const status = airingStatus(anime);

    if (status === 'ongoing') {
        const next = anime.nextEpisodeAt ? new Date(anime.nextEpisodeAt) : null;
        return next && !Number.isNaN(next.getTime()) ? WEEKDAYS[next.getDay()] : '';
    }

    if (status === 'anons') {
        const { year, month, day } = anime.airedOn ?? {};
        if (!month) return '';

        // Год уже стоит в значении метрики — повторяем его, только когда
        // дня нет и дата звучит как «с октября»
        return day ? `с ${day} ${MONTHS[month - 1]}` : `с ${MONTHS[month - 1]}${year ? ` ${year}` : ''}`;
    }

    if (anime.kind === 'movie' && anime.duration > 0) {
        const h = Math.floor(anime.duration / 60);
        const m = anime.duration % 60;
        return [h ? `${h} ч` : '', m ? `${m} мин` : ''].filter(Boolean).join(' ');
    }

    return '';
}

/**
 * @param {HTMLElement} el - .status-sub
 * @param {Object} anime
 */
export function renderAiring(el, anime) {
    if (!el) return;

    const status = airingStatus(anime);

    el.dataset.status = status;
    el.querySelector('.status-word').textContent = WORD[status];
    el.querySelector('.status-tail').textContent = airingTail(anime);
}
