/**
 * Класс для обработки событий свайпа.
 * @class
 */
export class SwipePrototype {
    #callbacks = {};

    constructor({ dom, title, size = 85, dLeft = ".reveal-left", dRight = ".reveal-right", not = { id: [] } } = {}) {
        this.dom = dom; // DOM элемент, на котором будет происходить свайп
        this.title = title; // Имя события
        this.swipeElement; // Элемент, на котором происходит свайп
        this.isSwiping = false;
        this.startX = 0;
        this.swiped = false;
        this.isClick = true;
        this.onPress = false;

        this.blockSize = size; // Размер блока, на котором происходит свайпp
        this.dLeft = dLeft; // Класс элемента, который показывается при свайпе влево
        this.dRight = dRight; // Класс элемента, который показывается при свайпе вправо

        this.left = false;
        this.right = false;
        this.not = not;
    }

    OnSwipe() {
        const start = (event) => {
            this.swipeElement = $(event.currentTarget);

            const elementWidth = this.swipeElement.width();
            const touchX = event.clientX || event.originalEvent.touches[0].clientX;
            const edgeThreshold = 200;
            this.isClick = true;

            if (this.swipeElement.attr('swiped') == 'true') return;
            if (!this.not.id.includes(this.swipeElement.attr('id'))) {
                if (touchX < this.swipeElement.offset().left + edgeThreshold || touchX > this.swipeElement.offset().left + elementWidth - edgeThreshold) {
                    this.isSwiping = true;
                    event.preventDefault()
                    this.#Dispatch('pre', event);
                    this.swipeElement.css({ 'transition': '' });
                }
            }

            this.startX = touchX;
            this.leftElement = this.swipeElement.children(this.dLeft);
            this.rightElement = this.swipeElement.children(this.dRight);
        }

        const swipe = (event) => {
            if (!this.isSwiping || !this.swipeElement) {
                return;
            }

            let currentX = event.clientX || event.originalEvent.touches[0].clientX;
            let swipeDistance = currentX - this.startX;

            // Коэффициент замедления (например, 0.8)
            const decelerationFactor = 0.1;

            if (this.swiped) {
                // Применяем замедление только если элемент уже свайпнут
                let overSwipe = Math.abs(swipeDistance) - this.blockSize;
                if (overSwipe > 0 && this.left) {
                    swipeDistance = this.blockSize + overSwipe * decelerationFactor * (swipeDistance > 0 ? 1 : -1);
                } else if (overSwipe > 0 && this.right) {
                    swipeDistance = -this.blockSize + overSwipe * decelerationFactor * (swipeDistance > 0 ? 1 : -1);
                }
            }

            this.swipeElement.css({ 'transform': `translateX(${swipeDistance}px)` });

            if (swipeDistance >= 0 && swipeDistance > this.blockSize && !this.swiped) {
                this.swiped = true;
                this.left = true;
                this.right = false;
                this.isClick = false;
                // Логика для правого свайпа
            } else if (swipeDistance < 0 && swipeDistance < -this.blockSize && !this.swiped) {
                this.swiped = true;
                this.right = true;
                this.left = false;
                this.isClick = false;
                // Логика для левого свайпа
            } else if (swipeDistance > 0 && swipeDistance < this.blockSize || swipeDistance < 0 && swipeDistance > -this.blockSize) {
                this.swiped = false;
                this.swipeElement.css({ 'transition': '' });
                this.left = false;
                this.right = false;
                this.isClick = false;
            }
        }


        const end = (event) => {
            if (!this.swipeElement) return;
            event.preventDefault();
            if (this.isClick) this.#Dispatch('click', { element: this.swipeElement, swiped: this.swipeElement.attr('swiped') ? true : false });

            if (!this.isSwiping) return this.swipeElement = undefined;
            event.preventDefault()
            this.isSwiping = false;
            this.swipeElement.css({ 'transition': '.1s ease-in-out' });

            if (this.left) {
                this.swipeElement.css({ 'transform': `translateX(${this.blockSize}px)` });
                this.swipeElement.attr('swiped', 'true');
            } else if (this.right) {
                this.swipeElement.css({ 'transform': `translateX(-${this.blockSize}px)` });
                this.swipeElement.attr('swiped', 'true');
            } else {
                this.swipeElement.css({ 'transform': `translateX(0px)` });
                this.swipeElement.attr('swiped', '');
            }

            this.#Dispatch('after', event);

            this.swipeElement = undefined;
            this.swiped = false;
            this.left = false;
            this.right = false;
        }

        $(this.dom).on(`touchstart.${this.title} mousedown.${this.title} `, start);
        $(document).on(`touchmove.${this.title} mousemove.${this.title} `, swipe);
        $(document).on(`touchend.${this.title} mouseup.${this.title} `, end);
    }

    OffSwipe() {
        $(this.dom).off(`touchstart.${this.title} mousedown.${this.title} `);
        $(document).off(`touchmove.${this.title} mousemove.${this.title} `);
        $(document).off(`touchend.${this.title} mouseup.${this.title} `);
    }

    Reload() {
        this.OffSwipe();
        this.OnSwipe();
        this.#Dispatch('reload');
    }

    Clear() {
        const lists = $(`${this.dom}[swiped]`);
        lists.attr('swiped', '');
        lists.css({ 'transform': `translateX(0px)` });
    }

    /**
     * Добавляет обработчик события.
     * @param { "click" | "pre" | "after" | "reload" } event - Название события.
     * @param {Function} callback - Функция обработчик события.
     */
    on(event, callback) {
        if (typeof callback !== "function") return;
        if (this.#callbacks[event] === undefined) {
            this.#callbacks[event] = [];
        }
        this.#callbacks[event].push(callback);
    }

    #Dispatch(event, data) {
        if (this.#callbacks[event] === undefined) return;
        this.#callbacks[event].forEach(callback => callback(data));
    }
}