import tmpl from "../../../library/tmpl.lib.js";

const TEMPLATE = '#anime-card-item';

const KINDS = {
    tv: 'TV', movie: 'Фильм', ova: 'OVA', ona: 'ONA',
    special: 'Спешл', tv_special: 'TV Спешл',
    music: 'Клип', pv: 'Промо', cm: 'Реклама'
};

const SEASONS = { winter: 'Зима', spring: 'Весна', summer: 'Лето', fall: 'Осень' };

const STATUSES = { anons: 'Анонс', ongoing: 'Онгоинг', released: 'Вышло' };

const EPISODES = { one: 'Эпизод', few: 'Эпизода', many: 'Эпизодов' };

const plural = new Intl.PluralRules('ru-RU');

const kind = (value) => KINDS[String(value).toLowerCase()] ?? value ?? '';

const status = (value) => STATUSES[String(value).toLowerCase()] ?? value ?? '';

const episodes = (count = 0) => `${count} ${EPISODES[plural.select(count)]}`;

/** `summer_2026` → `Лето 2026`; иначе год выхода */
const season = (value, year = null) => {
    if (!value) return year ? String(year) : '';

    const [name, y] = String(value).split('_');
    return SEASONS[name] ? `${SEASONS[name]} ${y}` : value;
};

/** 310696 → 310.696 */
const dots = (num = 0) => String(num).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Сколько людей держит аниме у себя в списках */
const personen = (stats = []) => stats.reduce((sum, x) => sum + (x.count ?? 0), 0);

/**
 * Карточка аниме из шаблона окна.
 *
 * Разметка живёт в `#anime-card-item`, здесь только подстановка значений.
 * Тексты переведены так же, как в поиске на сайте, чтобы одно и то же
 * аниме выглядело одинаково в обоих местах.
 *
 * @param {Object} anime - ответ Shikimori
 * @returns {HTMLElement}
 */
export function createCard(anime) {
    const el = tmpl(TEMPLATE).el;

    const set = (selector, value) => {
        const node = el.querySelector(selector);
        if (node) node.textContent = value ?? '';
    };

    el.dataset.id = anime.id;

    const img = el.querySelector('.img-wrapper img');
    if (img) {
        img.src = anime.poster?.main2xUrl || '/images/noanime.png';
        img.alt = anime.russian || anime.name || '';
    }

    set('.title', anime.russian || anime.name);
    set('.season-type .type', kind(anime.kind));
    set('.season-type .seas', season(anime.season, anime.airedOn?.year));

    // У вышедшего показываем полное число серий, у онгоинга — сколько уже вышло
    set('.video-info .episodes span', episodes(
        anime.status === 'released' ? anime.episodes : anime.episodesAired
    ));
    set('.video-info .status', status(anime.status));

    set('.in-list .val', dots(personen(anime.statusesStats)));
    set('.anime-score .shikimori span', anime.score ?? 0);

    // Статус в списке пользователя. Без авторизации userRate не приходит
    // вовсе, поэтому и кнопка остаётся в нейтральном состоянии
    const btn = el.querySelector('.btn-status');
    if (btn) {
        btn.dataset.state = anime.userRate?.status ?? 'undefined';
        if (anime.userRate?.id) btn.dataset.rate = anime.userRate.id;
    }

    return el;
}

export default createCard;
