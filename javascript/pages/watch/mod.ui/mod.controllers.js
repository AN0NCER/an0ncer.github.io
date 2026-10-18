import { animate, remove, stagger } from "../../../library/anime.esm.min.js";
import { pressable } from "../../../modules/tun.animate.js";
import { Sleep } from "../../../modules/functions.js";
import { URate } from "../mod.urate.js";
import { ShowPlayer } from "../mod_ui.js";
import { ShowScoreWindow } from "../mod_wscore.js";

/** Статус Shikimori → грань кнопки. Ключи граней совпадают с настоящими
 *  значениями Shikimori, поэтому для записи обратная таблица не нужна */
const STATUS = new Map([
    ["planned", "planned"],
    ["watching", "watching"],
    ["rewatching", "watching"],
    ["on_hold", "watching"],
    ["completed", "completed"],
    ["dropped", "dropped"]
]);

// DOM: Elements

const list = document.querySelector('.am-list');
const backdrop = document.querySelector('.am-backdrop');
const addBtn = document.querySelector('.am-btn');
const wrap = document.querySelector('.am-wrap');
const playBtn = document.querySelector('.page-controllers .btn[data-action="player"]');
const box = document.querySelector('.am-box');
const stage = addBtn.querySelector('.am-stage');
const removeWrap = list.querySelector('.am-remove-wrapper');

/** Высота свёрнутой коробки: кнопка + рамка */
const BASE_H = 52;

/** Желаемая ширина раскрытого меню */
const MENU_W = 240;

/** Меньше — «Установка» мелькнёт и исчезнет */
const MIN_LOADING = 500;

const SIZE = { duration: 360, ease: 'inOutCubic' };
const SLIDE = { duration: 320, ease: 'outCubic' };

let isOpen = false;

/** Идёт своя смена статуса — внешние update не перебивают её */
let pending = false;

let running = [];
const run = (...a) => { running.forEach((x) => x.pause()); running = a; };

// ─── Грани ──────────────────────────────────────────────────────────

/** Грани по ключу: none, loading и статусы из пунктов списка */
const faces = new Map([...stage.querySelectorAll('.am-face')].map(f => [f.dataset.face, f]));

for (const item of list.querySelectorAll('.am-item[data-status]')) {
    const face = document.createElement('span');
    const color = [...item.classList].find(c => c.startsWith('i-'));

    face.className = `am-face ${color ?? ''}`;
    face.dataset.face = item.dataset.status;
    face.append(...item.querySelector('.am-item-wrapper').cloneNode(true).childNodes);

    stage.append(face);
    faces.set(item.dataset.status, face);
}

let current = stage.querySelector('.am-face.-current') ?? faces.get('none');

/** Какая грань у оценки: неизвестный статус и отсутствие записи — «Статус» */
const faceOf = (rate) => STATUS.get(rate?.status) ?? 'none';

// ─── Ширина ─────────────────────────────────────────────────────────

/** Что коробка добавляет к ширине грани: паддинги кнопки и рамка */
const chrome = (() => {
    const btn = getComputedStyle(addBtn);
    const border = box.offsetWidth - box.clientWidth;

    return parseFloat(btn.paddingLeft) + parseFloat(btn.paddingRight) + border;
})();

/** Ширина свёрнутой коробки под грань */
const fit = (face) => Math.ceil(face.offsetWidth) + chrome;

/**
 * Анимация как промис, который точно завершится. В anime.js новая
 * анимация того же свойства отменяет старую (composition: replace),
 * и у отменённой then не вызывается никогда — без запасного таймера
 * очередь смен встала бы навсегда
 */
const settle = (anim, ms) => Promise.race([anim, Sleep(ms + 50)]);

/** Коробка и место под неё в панели — всегда вместе */
const resize = (w, animated = true) => {
    if (!animated) {
        wrap.style.width = box.style.width = `${w}px`;
        return Promise.resolve();
    }

    return Promise.all([
        settle(animate(wrap, { width: w, ...SIZE }), SIZE.duration),
        settle(animate(box, { width: w, ...SIZE }), SIZE.duration)
    ]).then(() => {
        // Таймер мог обогнать анимацию (медленный кадр, скрытая вкладка) —
        // доводим до конца сами. Если меню успели открыть, ширина его
        if (isOpen) return;

        remove(wrap, undefined, 'width');
        remove(box, undefined, 'width');
        wrap.style.width = box.style.width = `${w}px`;
    });
};

// ─── Смена грани ────────────────────────────────────────────────────

const slide = (from, to) => Promise.all([
    settle(animate(from, { translateY: ['0%', '-100%'], opacity: [1, 0], ...SLIDE }), SLIDE.duration),
    settle(animate(to, { translateY: ['100%', '0%'], opacity: [0, 1], ...SLIDE }), SLIDE.duration)
]);

/**
 * Расти → сменить → сузиться: текст никогда не упирается в край.
 * При открытом меню ширину держит меню, меняется только содержимое.
 * sized — ширину под эту грань уже ведёт closeMenu, второй анимацией
 * той же ширины её не перебиваем
 */
async function morph(key, animated, sized = false) {
    const to = faces.get(key) ?? faces.get('none');
    if (to === current) return;

    const from = current;
    current = to;

    addBtn.dataset.state = key;
    addBtn.setAttribute('aria-busy', String(key === 'loading'));

    if (!animated) {
        place(from, to);

        if (!isOpen) await resize(fit(to), false);
        return;
    }

    const grow = !sized && fit(to) > fit(from);

    // isOpen проверяем перед каждым шагом: меню могли открыть посреди
    // смены, и тогда ширина уже его
    if (grow && !isOpen) await resize(fit(to));
    await slide(from, to);
    place(from, to);

    if (!sized && !grow && !isOpen) await resize(fit(to));
}

/** Грань на место: без следов анимаций, положение задаёт только -current */
const place = (from, to) => {
    remove(from);
    remove(to);

    // Inline opacity: 0 от прошлой анимации перебил бы -current
    for (const f of [from, to]) f.style.transform = f.style.opacity = '';

    from.classList.remove('-current');
    to.classList.add('-current');
};

/** Смены идут по очереди: ответ сервера не должен стартовать поверх «Установки» */
let chain = Promise.resolve();

const show = (key, { animated = true, sized = false } = {}) => {
    chain = chain
        .then(() => morph(key, animated, sized))
        .catch((err) => console.error('[status] смена грани', err));

    return chain;
};

/** Подсветка пункта в списке и «Убрать» только когда есть что убирать */
const markSelected = () => {
    const key = faceOf(URate.uRate);

    for (const item of list.querySelectorAll('.am-item[data-status]')) {
        item.classList.toggle('-select', item.dataset.status === key);
    }

    if (removeWrap) removeWrap.style.display = key === 'none' ? 'none' : '';
};

// ─── Меню ───────────────────────────────────────────────────────────

function openMenu() {
    list.style.visibility = "visible";
    backdrop.style.display = "block";
    isOpen = true;
    addBtn.setAttribute("aria-expanded", "true");

    const room = wrap.getBoundingClientRect().right - playBtn.getBoundingClientRect().right - 20;
    const w = Math.max(fit(current), Math.min(MENU_W, room));

    // Высоту списка меряем уже на целевой ширине — подписи могут переноситься
    const cw = box.offsetWidth, ch = box.offsetHeight;
    box.style.width = w + "px";
    const target = BASE_H + list.offsetHeight + 12;
    box.style.width = cw + "px";
    box.style.height = ch + "px";

    run(
        animate(backdrop, { opacity: 1, duration: 250, ease: "outQuad" }),
        animate(wrap, { width: w, duration: 480, ease: "outQuart" }),
        animate(box, { height: target, width: w, duration: 480, ease: "outQuart" }),
        animate(list.querySelectorAll(".am-item, .am-line"), {
            opacity: [0, 1],
            translateY: [16, 0],
            delay: stagger(45, { start: 60, from: "last" }),   // снизу вверх
            duration: 340, ease: "outCubic",
        }),
    );
}

/** @param {HTMLElement} [target] - под какую грань сужаться */
function closeMenu(target = current) {
    if (!isOpen) return;
    isOpen = false;
    addBtn.setAttribute("aria-expanded", "false");

    const w = fit(target);

    run(
        animate(backdrop, {
            opacity: 0, duration: 220, ease: "inQuad",
            onComplete: () => { if (!isOpen) backdrop.style.display = "none"; },
        }),
        animate(list.querySelectorAll(".am-item, .am-line"), {
            opacity: 0, translateY: 10,
            delay: stagger(20, { from: "first" }),
            duration: 160, ease: "inQuad",
        }),
        animate(wrap, { width: w, ...SIZE, delay: 60 }),
        animate(box, {
            height: BASE_H, width: w, ...SIZE, delay: 60,
            onComplete: () => { if (!isOpen) list.style.visibility = "hidden"; },
        }),
    );
}

// ─── Выбор статуса ──────────────────────────────────────────────────

async function pick(item) {
    if (!URate.isLogged) return closeMenu();

    const remove = item.dataset.action === 'remove';
    const key = item.dataset.status;
    const was = faceOf(URate.uRate);

    // Та же группа — ничего не меняем: иначе rewatching и on_hold
    // молча перезапишутся обычным watching
    if (!remove && key === was) return closeMenu();
    if (remove && was === 'none') return closeMenu();

    pending = true;

    // Ширину под «Установку» ведёт closeMenu — грань меняем без своей
    closeMenu(faces.get('loading'));
    show('loading', { sized: true });

    try {
        await Promise.all([
            remove ? URate.remove(true) : URate.setStatus(key, true),
            Sleep(MIN_LOADING)
        ]);
    } finally {
        pending = false;

        // Истина — в URate: при ошибке там прежний статус, и кнопка
        // вернётся к нему без отдельного отката
        show(faceOf(URate.uRate));
        markSelected();
    }
}

// ─── Скрытие над плеером ────────────────────────────────────────────

/** Где плашка мешает: телефоны и небольшие планшеты */
const COMPACT = window.matchMedia('(max-width: 900px)');

/**
 * Какая доля блока плеера (эпизоды, плеер, озвучки) должна быть на
 * экране, чтобы плашка уехала. На телефоне блок невысокий, и половина
 * на экране — уже признак того, что человек смотрит, а не листает мимо
 */
const VISIBLE = 0.5;

const hideOverPlayer = () => {
    const controllers = document.querySelector('.page-controllers');
    const area = document.querySelector('.landscape-player');
    if (!controllers || !area) return;

    let observer = null;

    const set = (hidden) => {
        // Список статусов уехал бы вместе с плашкой, а затемнение осталось
        if (hidden && isOpen) closeMenu();

        controllers.classList.toggle('-hidden', hidden);
        controllers.toggleAttribute('inert', hidden);   // и без фокуса с клавиатуры
    };

    const watch = () => {
        observer?.disconnect();
        observer = null;

        // Большой экран — плашка всегда на месте
        if (!COMPACT.matches) return set(false);

        observer = new IntersectionObserver(
            ([entry]) => set(entry.intersectionRatio >= VISIBLE),
            { threshold: [0, VISIBLE] }
        );
        observer.observe(area);
    };

    // Повернули планшет или изменили окно — правило пересчитывается
    COMPACT.addEventListener('change', watch);
    watch();
};

// ─── Старт ──────────────────────────────────────────────────────────

(() => {
    list.style.visibility = "hidden";

    // Ширина по текущей грани вместо --width из CSS
    resize(fit(current), false);

    // Manrope может приехать позже первого замера
    document.fonts?.ready.then(() => { if (!isOpen) resize(fit(current), false); });

    URate.on('init', (rate) => {
        show(faceOf(rate), { animated: false });
        markSelected();
    }, { replay: true });

    // Статус меняется и не через кнопку: серия, синхронизация
    URate.on('update', () => {
        if (pending) return;

        show(faceOf(URate.uRate));
        markSelected();
    });

    // Отклик на нажатие, как в окнах коллекций — только круглые кнопки
    // панели: у коробки статуса своя анимация
    pressable(document.querySelectorAll('.page-controllers .btn'));

    hideOverPlayer();

    // Действия круглых кнопок. Список статусов закрываем: действие ведёт
    // в другое место страницы, и открытое меню осталось бы висеть поверх
    const ACTIONS = { player: ShowPlayer, score: ShowScoreWindow };

    for (const el of document.querySelectorAll('.page-controllers .btn[data-action]')) {
        el.addEventListener('click', () => {
            closeMenu();
            ACTIONS[el.dataset.action]?.();
        });
    }

    addBtn.addEventListener("click", () => (isOpen ? closeMenu() : openMenu()));
    backdrop.addEventListener("click", () => closeMenu());

    list.addEventListener("click", (e) => {
        const item = e.target.closest('.am-item');
        if (item) pick(item);
    });
})();
