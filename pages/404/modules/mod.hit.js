import { say } from "./mod.state.js";
import { bonk } from "./mod.mascot.js";
import { pow } from "./mod.pow.js";
const REPLIES = [
    'Критический удар! Эффекта нет',
    'Плеер использовал «Уклонение»',
    'Сила дружбы так не работает',
    'Урон 9999. Результат прежний',
    'Сенпай не заметил',
    'Нужно больше тренировок',
    'Это была лишь первая форма',
    'Приберегите силы на финальную арку',
    'Ещё немного — и откроется банкай',
    'Нани?!'
];

/** Длительность анимаций удара в стилях */
const HIT_MS = 450;

/** Удар по экрану: нажатие дёргает картинку, достаётся маскоту, подпись меняется на следующую реплику */
export function initHit() {
    const root = document.documentElement;
    let hits = 0;
    let timer;

    document.addEventListener('pointerdown', (e) => {
        if (e.target.closest('a')) return;
        say(REPLIES[hits++ % REPLIES.length]);
        bonk();
        pow(e.clientX, e.clientY);

        root.classList.remove('hit');
        void root.offsetWidth;
        root.classList.add('hit');
        clearTimeout(timer);
        timer = setTimeout(() => root.classList.remove('hit'), HIT_MS);
    });
}
