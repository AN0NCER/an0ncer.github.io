let CAROUSEL = undefined;

export class Carousel {
    #callbacks = {
        "select": [],
        "click": [],
    };

    /**
     * Инициализация карусели.
     * @returns {Carousel}
     */
    static Init() {
        if (CAROUSEL === undefined) {
            CAROUSEL = new Carousel();
        }
        return CAROUSEL;
    }

    constructor() {
        this.id = '1';
        this.enabled = true;

        this.$carouselSelect = $('.carousel > .block-select');
        this.$item = $('.carousel  > .item-wrapper.select');
        this.$carouselSelect.css({ 'left': $('.carousel').scrollLeft() + this.$item.position().left, 'width': this.$item.width() });

        this.$Selector = {
            hide: () => {
                this.$carouselSelect.css({ 'opacity': 0 });
                this.$item.find('.item').css({ 'font-weight': 'normal', color: '#A4A4A4' });
            },
            show: () => {
                this.$carouselSelect.css({ 'opacity': '' });
                this.$item.find('.item').css({ 'font-weight': '', color: '' });
            }
        }

        $('.carousel > .item-wrapper').on('click', (e) => {
            this.Select($(e.currentTarget));
        });
    }

    Select($element) {
        if (!this.enabled) return;
        if ($element.attr("data-id") === this.id) { 
            this.#Dispatch("click", this);
            return;
        }
        this.$item.removeClass('select');
        this.$item = $element;
        this.$item.addClass('select');
        this.$carouselSelect.css({ 'left': $('.carousel').scrollLeft() + this.$item.position().left, 'width': this.$item.width() });
        this.id = this.$item.attr("data-id");
        this.#Dispatch("select", this);
    }

    /**
     * Добавляет обработчик события.
     * @param { "select", "click" } event - Название события.
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