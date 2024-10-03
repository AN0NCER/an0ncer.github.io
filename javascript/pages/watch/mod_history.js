import { $ID, Player } from "../watch.js";
import { Private } from "./mod_private.js";
import { Screenshots } from "./mod_resource.js";

//Управление историей
const _history = {
    shikiData: undefined,
    screenData: undefined,
    key: "last-watch",
    maxItems: 5,
    idImage: 0,

    get() {
        return JSON.parse(localStorage.getItem(this.key)) ?? [];
    },

    set(history) {
        localStorage.setItem(this.key, JSON.stringify(history));
    },

    /**
     * Добавляет в историю последних просмотренных аниме для быстрого доступа
     * @param {Boolean} cnt - требуется ля продолжение просмотра
     * @param {Int} duration - текущий таймлайн эпизода
     * @param {Int} i - прибавка эпихода если необходимо (Для переклбчение следующего эпизода)
     * @param {Int} e - текущий эпизод
     */
    add(cnt = false, duration = 0, i = 0, e = Player.CEpisodes.selected) {
        if (!this.shikiData || Private.INCOGNITO) {
            return;
        }
        const history = this.get();
        const { russian, screenshots } = this.shikiData;
        const episode = cnt ? e + i : e + i;
        let image = "";
        this.screenData = Screenshots;
        if (this.screenData?.length > 0) {
            image = `${this.screenData[this.idImage].original}`;
        } else {
            image = `${screenshots[0].original}`;
        }
        const dub = Player.CTranslation.name;
        const type = this.shikiData.kind == "movie" ? "Фильм" : this.shikiData.kind == "ova" ? "OVA" : this.shikiData.kind == "ona" ? "ONA" : "Аниме";
        const item = {
            id: $ID,
            continue: cnt,
            duration,
            fullduration: Player.VData.duration,
            episode,
            name: russian,
            image,
            dub,
            type,
            idImg: this.idImage
        };

        const index = history.findIndex((item) => item.id === $ID);

        if (index !== -1) {
            history.splice(index, 1);
        }

        history.unshift(item);

        if (history.length > this.maxItems) {
            history.pop();
        }

        this.set(history);
    },

    //Индивидуальные функции
    custom: {
        /**
         * Инициализация после загрузки изображений slide
         */
        init: function () {
            let history = _history.get();
            //Находим ID елемента из списка
            let id = history.findIndex((x) => { return x.id == $ID });

            //Проверяем что есть елемент из истории
            if (history[id]) {
                this.have = true;
                //Получаем ID изображения или стандартное значение 0
                let count = history[id].idImg ? history[id].idImg : 0;
                //Устанавливаем значение в _history.idImage
                _history.idImage = count;
            }

            //Показываем выбор в визуале
            SetImage();

            //Записуемся на функционал клик по изображение изменение idImage
            $('.galery-slider > .slide').click((e) => {
                let idImage = $(e.currentTarget).data('id');
                _history.idImage = idImage ? idImage : 0;
                SetImage();
            });

            function SetImage() {
                $(`.galery-slider > .slide > .selected`).remove();
                $(`.galery-slider > .slide[data-id="${_history.idImage}"]`).append(`<div class="selected">
                    <span class="sel-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6h96 32H424c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"/></svg>
                    </span>
                </div>`);
            }
        }
    }
};

export const History = () => { return _history; }