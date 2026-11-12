import { setMood } from "./mod.mascot.js";

/**
 * Состояния заглушки. Задаются хэшем: 404.html#empty.
 * Без хэша: в iframe — loading, отдельной страницей — notfound.
 *
 * @typedef {Object} TState
 * @property {string} pill - плашка над знаком
 * @property {import("./mod.mascot.js").TMood} mood - настроение маскота
 * @property {string} title
 * @property {string[]} sub - подписи, сменяются по кругу
 * @property {string[]} news - фразы бегущей строки
 */

/** @type {Record<'loading' | 'empty' | 'error' | 'notfound', TState>} */
const STATES = {
    loading: {
        pill: 'ищем серии',
        mood: 'look',
        title: 'Загружаем плеер',
        sub: ['Спрашиваем у Kodik, где серии', 'Сэйю распеваются', 'Главный герой ещё спит', 'Перематываем опенинг', 'Копим силу дружбы'],
        news: ['Загружаем плеер', 'Ищем озвучки', 'Опенинг вот-вот начнётся', 'Пропускать его не обязательно']
    },
    empty: {
        pill: 'плеер пуст',
        mood: 'cry',
        title: 'Серий пока нет',
        sub: ['Kodik не нашёл ни одной озвучки этого аниме'],
        news: ['Серий пока нет', 'Озвучка ещё в пути', 'Сэйю учат текст', 'Загляните позже']
    },
    error: {
        pill: 'плеер не ответил',
        mood: 'dead',
        title: 'Плеер не отвечает',
        sub: ['Kodik молчит. Попробуйте обновить страницу'],
        news: ['Плеер не отвечает', 'Kodik ушёл на филлер', 'Обновите страницу чуть позже']
    },
    notfound: {
        pill: 'ошибка 404',
        mood: 'bored',
        title: 'Такой страницы нет',
        sub: ['Похоже, она переродилась в другом мире'],
        news: ['404', 'Страница не найдена', 'Она переродилась в другом мире', 'Грузовик-кун передаёт привет']
    }
};

/** Загрузка дольше этого — подпись говорит, что плеер отвечает медленно */
const SLOW_AFTER = 12000;
const SUB_EVERY = 3200;

const root = document.documentElement;
const $ = (id) => document.getElementById(id);

let subs = [];
let subIndex = 0;
let subTimer;
let slowTimer;

/** Страница открыта внутри iframe */
export const framed = (() => {
    try {
        return window.self !== window.top;
    } catch {
        return true;
    }
})();

/**
 * Меняет подпись под заголовком
 * @param {string} text
 */
export function say(text) {
    const sub = $('sub');
    sub.textContent = text;
    sub.classList.remove('pop');
    void sub.offsetWidth;
    sub.classList.add('pop');
}

/** @param {keyof typeof STATES} name */
function setState(name) {
    const state = STATES[name];
    if (!state || root.dataset.state === name) return;
    root.dataset.state = name;

    $('pill').textContent = state.pill;
    $('title').textContent = state.title;

    setMood(state.mood);

    // Набор повторяется, чтобы сдвиг на -50% зацикливался без шва
    const row = state.news.map((text) => `<span>${text}</span>`).join('');
    $('tk').innerHTML = row.repeat(4);

    clearInterval(subTimer);
    clearTimeout(slowTimer);
    subs = state.sub;
    subIndex = 0;
    say(subs[0]);
    subTimer = setInterval(() => {
        if (subs.length > 1) say(subs[++subIndex % subs.length]);
    }, SUB_EVERY);

    if (name === 'loading') {
        slowTimer = setTimeout(() => {
            $('pill').textContent = 'всё ещё ищем';
            subs = ['Kodik отвечает дольше обычного'];
            say(subs[0]);
        }, SLOW_AFTER);
    }
}

function fromHash() {
    const name = location.hash.slice(1);
    setState(STATES[name] ? name : framed ? 'loading' : 'notfound');
}

export function initState() {
    root.classList.toggle('framed', framed);
    window.addEventListener('hashchange', fromHash);
    fromHash();
}
