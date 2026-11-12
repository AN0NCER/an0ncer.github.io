const WORDS = ['БАМ!', 'БАЦ!', 'ПАФ!', 'ХРЯСЬ!', 'БДЫЩ!', 'ТЫЦ!', 'БУМ!', 'ШМЯК!', 'НЯ!', 'КЬЯ!'];

/** Цвет букв и цвет «взрыва» под ними */
const INKS = [
    ['#101318', '#FFD700'],
    ['#FFFFFF', '#2393F1'],
    ['#101318', '#FFFFFF'],
    ['#FFFFFF', '#FF5D5D']
];

/** Длительность анимации надписи в стилях, с запасом */
const LIFE_MS = 800;
const MAX_ON_SCREEN = 6;
/** Отступ от краёв, чтобы надпись не обрезало */
const PAD_X = 44;
const PAD_Y = 28;

let count = 0;

/**
 * Надпись как в комиксе в точке нажатия: выскакивает, уплывает вверх и гаснет
 * @param {number} x
 * @param {number} y
 */
export function pow(x, y) {
    const shown = document.querySelectorAll('.pow');
    if (shown.length >= MAX_ON_SCREEN) shown[0].remove();

    const [ink, burst] = INKS[count % INKS.length];
    const el = document.createElement('span');
    el.className = 'pow';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = WORDS[count++ % WORDS.length];

    el.style.left = `${Math.min(Math.max(x, PAD_X), innerWidth - PAD_X)}px`;
    el.style.top = `${Math.min(Math.max(y, PAD_Y), innerHeight - PAD_Y)}px`;
    el.style.setProperty('--ink', ink);
    el.style.setProperty('--burst', burst);
    el.style.setProperty('--tilt', `${Math.round(Math.random() * 30 - 15)}deg`);

    document.body.appendChild(el);
    // По таймеру, а не по animationend: при prefers-reduced-motion анимации нет
    setTimeout(() => el.remove(), LIFE_MS);
}
