import { animate, createDraggable } from "../../../library/anime.esm.min.js";

/**
 * Свайп по строкам списка: тянешь влево или вправо — открываются кнопки
 * действий под строкой.
 *
 * Создаётся на каждый список отдельно (а не одним экземпляром на
 * приложение): у каждого свой набор строк и свой слушатель на документе,
 * который снимается в `destroy()`.
 */

const OPEN = 130;        // 100px кнопка + 20px отступ
const CLOSE_DUR = 200;
const RUBBER = 0.92;     // насколько туго тянутся особые строки (0.85 — мягче, 0.95 — жёстче)
const THRESHOLD = 4;     // сдвиг в пикселях, после которого жест считается протяжкой

/** Коллекции без действий: свайп только «пружинит» */
const STATIC = new Set(['shikimori', 'recommend', 'featured']);

/**
 * @param {HTMLElement} root - контейнер списка
 * @param {{onTap?: (item: HTMLElement) => void}} [opts]
 */
export function createSwipe(root, { onTap = () => { } } = {}) {
    const drags = [];

    function animateTo(d, target, duration = CLOSE_DUR) {
        d.stop();
        animate({ v: d.x }, {
            v: target,
            duration,
            ease: 'out(3)',
            onUpdate: self => {
                const x = self.targets[0].v;
                d.setX(x);
                d.item.style.setProperty('--procent', Math.abs(x) / OPEN);
            }
        });
    }

    function close(d) {
        if (!d.opened) return;
        d.opened = false;
        d.item.classList.remove('is-open');
        animateTo(d, 0);
    }

    function closeOthers(except) {
        drags.forEach(d => d !== except && close(d));
    }

    /** Подключить свайп к одной строке */
    function bind(item) {
        if (item.__d) return item.__d;

        const el = item.querySelector('.item-wrapper');
        const isStatic = STATIC.has(item.dataset.kind);

        let d;

        const base = {
            y: false,
            releaseStiffness: 300,
            releaseDamping: 30,
            velocityMultiplier: 0,
            onGrab: () => {
                d.startX = d.x;
                d.moved = false;
                closeOthers(d);
            },
            onDrag: s => {
                // порог: мелкое дрожание пальца тапом быть не перестаёт
                if (Math.abs(s.x - d.startX) > THRESHOLD) d.moved = true;
            }
        };

        d = createDraggable(el, isStatic ? {
            ...base,
            container: [0, 0, 0, 0],        // бортики в нуле — открывать нечего
            containerFriction: RUBBER,      // но палец чувствует отклик
            releaseContainerFriction: 1,    // отпустил — вернулось, как ни тяни
            x: { snap: 0 },
            onRelease: () => { d.opened = false; }
        } : {
            ...base,
            container: [0, OPEN, 0, -OPEN],
            containerFriction: 0.8,
            releaseContainerFriction: 1,
            x: { snap: [-OPEN, 0, OPEN] },
            onRelease: s => {
                d.opened = Math.abs(s.x) > 1;
                item.classList.toggle('is-open', d.opened);
            },
            onUpdate: s => {
                item.style.setProperty('--procent', Math.abs(s.x) / OPEN);
            }
        });

        d.item = item;
        d.static = isStatic;
        d.opened = false;
        d.moved = false;
        d.startX = 0;
        item.__d = d;
        drags.push(d);

        el.addEventListener('click', e => {
            // фантомный клик после протяжки
            if (d.moved) {
                d.moved = false;
                e.stopPropagation();
                e.preventDefault();
                return;
            }

            // строка открыта свайпом — клик её закрывает, выбор не трогаем
            if (d.opened) {
                e.stopPropagation();
                e.preventDefault();
                close(d);
                return;
            }

            e.stopPropagation();
            onTap(item, d);
        }, true);

        return d;
    }

    /** Отключить перед удалением строки из DOM */
    function unbind(item) {
        const d = item.__d;
        if (!d) return;

        d.revert?.();

        const i = drags.indexOf(d);
        if (i !== -1) drags.splice(i, 1);

        delete item.__d;
    }

    function bindAll(scope = root) {
        scope.querySelectorAll('.item[data-cid]').forEach(bind);
    }

    function unbindAll(scope = root) {
        scope.querySelectorAll('.item[data-cid]').forEach(unbind);
    }

    /** Закрыть все открытые строки */
    function closeAll() {
        closeOthers(null);
    }

    // тап вне строки закрывает открытое
    const onPointerDown = (e) => {
        drags.forEach(d => {
            if (d.opened && !d.item.contains(e.target)) close(d);
        });
    };

    document.addEventListener('pointerdown', onPointerDown);

    /** Снять всё: слушатель документа и обработчики строк */
    function destroy() {
        document.removeEventListener('pointerdown', onPointerDown);
        unbindAll();
    }

    return { bind, unbind, bindAll, unbindAll, closeAll, destroy };
}

export default createSwipe;
