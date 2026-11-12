/**
 * Маскот на canvas: голова чёрного кота с мятными ушами и полосатым шарфом.
 * У каждой части тёмно-оливковый контур, глаза — кремовые кольца с чёрным зрачком.
 * Настроение задаёт выражение глаз, удар — отдельная короткая реакция.
 * Рот виден, только когда открыт, — бирюзовый треугольник.
 * От удара из-за кота выскакивает хэйсю — чёрная «булочка» с ушками; когда вышли все,
 * следующий удар зовёт их обратно.
 *
 * @typedef {'look' | 'cry' | 'dead' | 'bored'} TMood
 * look — осматривается и моргает; cry — зажмурился, слеза; dead — крестики; bored — веки полуопущены
 */

// Рисунок в своих координатах W×H, на canvas растянут в SCALE раз
const W = 260;
const H = 250;
const SCALE = 3;
// Кот нарисован вокруг CX и сдвинут на CAT_X, CAT_Y: по бокам место для хэйсю
const CX = 100;
const CAT_X = 30;
const CAT_Y = 30;
// Точка опоры для сжатия от удара — низ шарфа, для покачивания головы — шея
const PIVOT_Y = 192;
const NECK_Y = 160;

const FUR = '#08080A';
const OUTLINE = '#51482E';
const EAR = '#8ED08F';
const EYE = '#F3EFC9';
const MOUTH = '#4DB7C4';
const SCARF = '#2F86DE';
const SCARF_LIGHT = '#7BC0F7';
const SPARK = '#FFE35C';

const EYE_X = 31;
const EYE_Y = 108;
const EYE_RX = 28;
const EYE_RY = 34;
// Под полуопущенными веками глаза сидят выше, иначе видимая часть уезжает к шарфу
const LID_LIFT = 5;

// Откуда выскакивают хэйсю: из-за середины головы кота (координаты canvas)
const NEST = { x: CAT_X + CX, y: CAT_Y + 130 };
/**
 * Где хэйсю садятся: справа от кота, на макушке и слева.
 * peek — точка у края головы, где хэйсю показывается из-за кота; arc — высота дуги оттуда до места
 */
const SEATS = [
    { x: 238, y: 242, peek: { x: 232, y: 160 }, arc: 26 },
    { x: CAT_X + CX, y: CAT_Y + 43, peek: { x: CAT_X + CX, y: CAT_Y + 22 }, arc: 8 },
    { x: 22, y: 242, peek: { x: 28, y: 160 }, arc: 26 }
];
const SPAWN_MS = 620;
/** С какой доли полёта хэйсю рисуется перед котом, а не за ним */
const FRONT_FROM = 0.45;
/** Один прыжок сидящего хэйсю, мс */
const HOP_MS = 1400;

/** Сколько длится реакция на удар и сколько после неё кот ещё жмурится */
const HIT_MS = 450;
const HIT_FACE_MS = 700;
const BLINK_EVERY = 3600;
const BLINK_MS = 140;

/** @type {CanvasRenderingContext2D} */
let ctx;
/** @type {TMood} */
let mood = 'look';
let still = false;
let hitAt = -Infinity;
let hitTilt = 0;
/** @type {Array<{seat: number, bornAt: number, leaveAt?: number}>} */
let kids = [];

/** Рисует `draw` слева и зеркально справа */
function mirrored(draw) {
    for (const side of [1, -1]) {
        ctx.save();
        ctx.translate(CX, 0);
        ctx.scale(side, 1);
        ctx.translate(-CX, 0);
        draw();
        ctx.restore();
    }
}

function poly(points, color) {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function strokes(lines, color = EYE, width = 7.5) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const line of lines) {
        ctx.beginPath();
        line.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
    }
}

/**
 * Заливка с контуром
 * @param {() => void} path - строит путь
 * @param {string} [fill]
 * @param {number} [width] - толщина контура
 */
function outlined(path, fill = FUR, width = 2.4) {
    ctx.beginPath();
    path();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
}

/** @param {number} flat - насколько уши прижаты, радианы */
function ears(flat) {
    mirrored(() => {
        ctx.translate(58, 72);
        ctx.rotate(-flat);
        ctx.translate(-58, -72);

        // Широкое ухо с мягким кончиком, наклонено наружу
        outlined(() => {
            ctx.moveTo(30, 94);
            ctx.bezierCurveTo(23, 64, 26, 40, 36, 24);
            ctx.quadraticCurveTo(43, 14, 52, 22);
            ctx.lineTo(98, 54);
            ctx.closePath();
        });

        ctx.beginPath();
        ctx.moveTo(38, 86);
        ctx.bezierCurveTo(33, 64, 35, 46, 42, 33);
        ctx.lineTo(86, 60);
        ctx.closePath();
        ctx.fillStyle = EAR;
        ctx.fill();
    });
}

/** Голова шире книзу — со щеками */
function head() {
    outlined(() => {
        ctx.moveTo(100, 42);
        ctx.bezierCurveTo(150, 42, 174, 76, 172, 112);
        ctx.bezierCurveTo(170, 146, 140, 160, 100, 160);
        ctx.bezierCurveTo(60, 160, 30, 146, 28, 112);
        ctx.bezierCurveTo(26, 76, 50, 42, 100, 42);
    });
}

/** @param {number} flap - отклонение конца шарфа, радианы */
function scarf(flap) {
    // Свисающий конец
    ctx.save();
    ctx.translate(62, 170);
    ctx.rotate(0.25 - flap);
    outlined(() => ctx.roundRect(-22, 0, 22, 36, 5), SCARF);
    ctx.beginPath();
    ctx.roundRect(-22, 0, 22, 36, 5);
    ctx.clip();
    ctx.fillStyle = SCARF_LIGHT;
    ctx.fillRect(-22, 8, 22, 7);
    ctx.fillRect(-22, 23, 22, 7);
    ctx.restore();

    // Повязка под головой
    const band = () => {
        ctx.moveTo(52, 150);
        ctx.quadraticCurveTo(CX, 170, 148, 150);
        ctx.lineTo(152, 170);
        ctx.quadraticCurveTo(CX, 192, 48, 170);
        ctx.closePath();
    };
    ctx.save();
    ctx.beginPath();
    band();
    ctx.fillStyle = SCARF;
    ctx.fill();
    ctx.clip();
    for (let x = 38; x < 165; x += 22) {
        poly([[x, 146], [x + 9, 146], [x + 2, 194], [x - 7, 194]], SCARF_LIGHT);
    }
    ctx.restore();

    ctx.beginPath();
    band();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.stroke();
}

/**
 * @param {'open' | 'lidded' | 'squint' | 'cross' | 'wide'} kind
 * @param {number} open - 0…1, для моргания
 * @param {{x: number, y: number}} [gaze] - смещение зрачков
 */
function eyes(kind, open, gaze = { x: 0, y: 0 }) {
    const ey = kind === 'lidded' ? EYE_Y - LID_LIFT : EYE_Y;
    // От испуга глаза шире, а зрачки сжимаются
    const grow = kind === 'wide' ? 1.06 : 1;
    const pupil = kind === 'wide' ? 0.45 : 1;

    for (const side of [-1, 1]) {
        const ex = CX + side * EYE_X;

        // «> <»: остриё смотрит к носу
        if (kind === 'squint') {
            strokes([[[ex + side * 14, ey - 14], [ex - side * 12, ey], [ex + side * 14, ey + 14]]]);
            continue;
        }
        if (kind === 'cross') {
            strokes([
                [[ex - 13, ey - 13], [ex + 13, ey + 13]],
                [[ex + 13, ey - 13], [ex - 13, ey + 13]]
            ]);
            continue;
        }

        const white = () => ctx.ellipse(ex, ey, EYE_RX * grow, Math.max(1.5, EYE_RY * grow * open), 0, 0, Math.PI * 2);
        ctx.save();
        outlined(white, EYE);
        ctx.beginPath();
        white();
        ctx.clip();
        // Зрачок сдвинут к носу и вниз: кремовое кольцо толще сверху и снаружи
        outlined(() => ctx.ellipse(ex - side * 2 + gaze.x, ey + 3 + gaze.y, 17 * pupil, 23 * pupil, 0, 0, Math.PI * 2), FUR, 1.6);
        ctx.restore();

        if (kind === 'lidded') {
            // Веко — ровный срез, чуть опущенный к носу. Обрезка — по глазу вместе с контуром:
            // веко закрывает верхнюю дугу контура и не торчит за края глаза
            const outer = ex + side * (EYE_RX + 6);
            const inner = ex - side * (EYE_RX + 6);
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(ex, ey, EYE_RX + 1.3, Math.max(1.5, EYE_RY * open) + 1.3, 0, 0, Math.PI * 2);
            ctx.clip();
            poly([[outer, ey - 44], [inner, ey - 44], [inner, ey - 3], [outer, ey - 10]], FUR);
            strokes([[[inner, ey - 3], [outer, ey - 10]]], OUTLINE, 2.4);
            ctx.restore();
        }
    }
}

/** Открытый рот. Закрытый не рисуется: на чёрной морде его не видно */
function mouth() {
    outlined(() => {
        ctx.moveTo(CX - 6, 144);
        ctx.lineTo(CX + 6, 144);
        ctx.lineTo(CX, 154);
        ctx.closePath();
    }, MOUTH, 1.6);
}

/**
 * Хэйсю — «булочка»: плоский снизу, шире всего в нижней трети, макушка у́же.
 * Ушки уголками, глаза-кольца, хвоста нет
 * @param {number} x
 * @param {number} y - низ
 * @param {number} size - 0…1
 * @param {number} ky - растяжение по высоте (меньше 1 — сплющен); ширина меняется в обратную сторону
 * @param {boolean} shut - глаза закрыты, рот открыт
 */
function heixiu(x, y, size, ky, shut) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size * ky ** -0.7, size * ky);
    ctx.translate(0, -14);

    for (const side of [-1, 1]) {
        outlined(() => {
            ctx.moveTo(side * 6, -12);
            ctx.quadraticCurveTo(side * 9, -19, side * 13, -17);
            ctx.quadraticCurveTo(side * 14, -13, side * 16, -8);
            ctx.closePath();
        }, FUR, 2);
    }
    outlined(() => {
        ctx.moveTo(0, -14);
        ctx.bezierCurveTo(12, -14, 20, -8, 21.5, 3);
        ctx.bezierCurveTo(22.5, 11, 14, 14, 0, 14);
        ctx.bezierCurveTo(-14, 14, -22.5, 11, -21.5, 3);
        ctx.bezierCurveTo(-20, -8, -12, -14, 0, -14);
    }, FUR, 2);

    if (shut) {
        // Зажмурился: глаза-чёрточки, рот — капля
        strokes([[[-12, -4], [-4, -2]], [[4, -2], [12, -4]]], OUTLINE, 2);
        outlined(() => ctx.ellipse(0, 5, 2.8, 4.4, 0, 0, Math.PI * 2), MOUTH, 1.2);
    } else {
        for (const side of [-1, 1]) {
            outlined(() => ctx.ellipse(side * 8.8, -1, 8.2, 9.4, 0, 0, Math.PI * 2), EYE, 1.5);
            outlined(() => ctx.ellipse(side * 8.8, 0, 4.7, 5.9, 0, 0, Math.PI * 2), FUR, 1.2);
        }
    }
    ctx.restore();
}

/**
 * Прыжок сидящего хэйсю: присел и сплющился, вытянулся в прыжке, сплющился при приземлении
 * @param {number} t
 * @returns {{lift: number, ky: number}}
 */
function hopPose(t) {
    const p = (t % HOP_MS) / HOP_MS;
    if (p < 0.15) return { lift: 0, ky: 1 - 0.22 * Math.sin(Math.PI / 2 * p / 0.15) };
    if (p < 0.55) {
        const k = (p - 0.15) / 0.4;
        return { lift: Math.sin(Math.PI * k) * 13, ky: 1 + 0.24 * Math.cos(Math.PI * k) ** 2 };
    }
    if (p < 0.75) {
        const k = (p - 0.55) / 0.2;
        return { lift: 0, ky: 1 - 0.26 * Math.sin(Math.PI * k) * (1 - 0.3 * k) };
    }
    return { lift: 0, ky: 1 + 0.03 * Math.sin((p - 0.75) / 0.25 * Math.PI * 2) };
}

/**
 * Все хэйсю, что сейчас снаружи: летят к месту, сидят и прыгают или возвращаются за кота
 * @param {number} t
 * @param {number} hop - общий прыжок от удара, 0…1
 * @param {boolean} behind - слой: true — те, кто ещё за котом, false — те, кто уже перед ним
 */
function crowd(t, hop, behind) {
    for (const kid of kids) {
        const seat = SEATS[kid.seat];
        const back = Boolean(kid.leaveAt);
        // 0 — за котом, 1 — на месте
        let k = Math.min(1, Math.max(0, (t - (back ? kid.leaveAt : kid.bornAt)) / SPAWN_MS));
        if (back) k = 1 - k;
        if (still) k = 1;
        // Начало полёта проходит за головой кота, дальше хэйсю выходит на передний план
        if ((k < FRONT_FROM) !== behind) continue;

        const lift = hop * 10;
        if (k < FRONT_FROM) {
            // За котом: из-за головы к её краю, с замедлением в конце
            const a = 1 - (1 - k / FRONT_FROM) ** 2;
            heixiu(NEST.x + (seat.peek.x - NEST.x) * a, NEST.y + (seat.peek.y - NEST.y) * a - lift, 0.6 + 0.4 * a, 1.15, true);
            continue;
        }
        if (k < 1) {
            // Перед котом: дугой от края головы на своё место
            const b = (k - FRONT_FROM) / (1 - FRONT_FROM);
            const arc = Math.sin(Math.PI * b) * seat.arc;
            heixiu(seat.peek.x + (seat.x - seat.peek.x) * b, seat.peek.y + (seat.y - seat.peek.y) * b - arc - lift, 1, 1 + 0.2 * Math.sin(Math.PI * b), true);
            continue;
        }
        // Каждый прыгает со своим сдвигом, отсчёт — с приземления
        const pose = still ? { lift: 0, ky: 1 } : hopPose(t - kid.bornAt - SPAWN_MS + HOP_MS * 0.55);
        heixiu(seat.x, seat.y - lift - pose.lift, 1, pose.ky + hop * 0.2, hop > 0);
    }
}

/** Слеза под глазом, съезжает вниз и гаснет */
function tear(t) {
    const k = (t % 1700) / 1700;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.translate(CX - EYE_X - 19, EYE_Y + 24 + k * 18);
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.quadraticCurveTo(6, 2, 0, 5);
    ctx.quadraticCurveTo(-6, 2, 0, -7);
    ctx.fillStyle = MOUTH;
    ctx.fill();
    ctx.restore();
}

/** Искры от удара возле уха */
function sparks(k) {
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = SPARK;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (const angle of [-1.25, -0.75, -0.25]) {
        const from = 12 + k * 10;
        const to = 22 + k * 14;
        ctx.beginPath();
        ctx.moveTo(170 + Math.cos(angle) * from, 44 + Math.sin(angle) * from);
        ctx.lineTo(170 + Math.cos(angle) * to, 44 + Math.sin(angle) * to);
        ctx.stroke();
    }
    ctx.restore();
}

/** @param {number} t - время кадра, мс */
function draw(t) {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const since = t - hitAt;
    const hit = since < HIT_MS ? 1 - since / HIT_MS : 0;
    // Затухающее колебание: сжатие, уши и шарф пружинят после удара
    const spring = hit * hit * Math.cos(since / 55);
    const jump = since < 300 ? Math.sin(Math.PI * since / 300) * 14 : 0;
    const move = still ? 0 : 1;

    let angle = hitTilt * hit;
    if (mood === 'look') angle += Math.sin(t / 700) * 0.06 * move;
    else if (mood === 'dead') angle += Math.sin(t / 500) * 0.05 * move;
    const bob = Math.sin(t / 900) * 1.5 * move;

    kids = kids.filter((kid) => !kid.leaveAt || t - kid.leaveAt < SPAWN_MS);
    crowd(t, jump / 14, true);

    ctx.translate(CAT_X, CAT_Y);
    ctx.translate(CX, PIVOT_Y - jump);
    ctx.scale(1 + 0.1 * spring, 1 - 0.16 * spring);
    ctx.translate(-CX, -PIVOT_Y);

    ctx.translate(CX, NECK_Y + bob);
    ctx.rotate(angle);
    ctx.translate(-CX, -NECK_Y);

    ears(0.4 * hit + 0.2 * Math.max(0, spring));
    head();
    scarf(Math.sin(t / 600) * 0.12 * move + spring * 0.5);

    const blink = t % BLINK_EVERY;
    const open = !still && blink < BLINK_MS ? Math.abs(blink - BLINK_MS / 2) / (BLINK_MS / 2) : 1;

    if (since < HIT_FACE_MS) eyes(mood === 'cry' ? 'wide' : 'squint', 1);
    else if (mood === 'cry') eyes('squint', 1);
    else if (mood === 'dead') eyes('cross', 1);
    else if (mood === 'bored') eyes('lidded', open, { x: 0, y: 5 });
    // Зрачки бегают в такт покачиванию — кот ищет серии
    else eyes('open', open, { x: Math.sin(t / 700) * 4 * move, y: Math.cos(t / 1400) * 2 * move });

    if (mood === 'cry' && since >= HIT_FACE_MS && !still) tear(t);

    // Рот открыт от удара, в плаче и в обмороке
    if (since < HIT_FACE_MS || mood === 'cry' || mood === 'dead') mouth();

    if (since < 300) sparks(since / 300);

    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    crowd(t, jump / 14, false);
}

/** @param {TMood} value */
export function setMood(value) {
    mood = value;
    if (still && ctx) draw(performance.now());
}

/** Реакция на удар: кот подпрыгивает, сжимается и жмурится, из-за него выскакивает хэйсю */
export function bonk() {
    const now = performance.now();
    hitAt = now;
    hitTilt = (Math.random() < 0.5 ? -1 : 1) * (0.12 + Math.random() * 0.1);

    const out = kids.filter((kid) => !kid.leaveAt);
    if (out.length < SEATS.length) kids.push({ seat: out.length, bornAt: now });
    else if (still) kids = [];
    else out.forEach((kid) => { kid.leaveAt = now; });

    if (!still) return;
    // Без анимаций — только смена выражения и возврат
    hitAt -= HIT_MS;
    draw(performance.now());
    setTimeout(() => draw(performance.now()), HIT_FACE_MS - HIT_MS + 20);
}

export function initMascot() {
    const canvas = document.querySelector('.mascot');
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    ctx = canvas.getContext('2d');
    still = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (still) return draw(performance.now());
    const frame = (t) => {
        draw(t);
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
}
