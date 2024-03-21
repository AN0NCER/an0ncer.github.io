import { $ID } from "../watch.js";
import { Player } from "./mod_player.js";
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
    add(cnt = false, duration = 0, i = 0, e = Player().episodes.selected_episode) {
        if (!this.shikiData) {
            return;
        }
        const history = this.get();
        const { russian, screenshots } = this.shikiData;
        const episode = cnt ? e + i : e + i;
        let image = "";
        this.screenData = Screenshots;
        if (this.screenData?.length > 0) {
            image = `${this.screenData[this.idImage].original}`;
        }else{
            image = `${screenshots[0].original}`;
        }
        const dub = Player().translation.name;
        const type = this.shikiData.kind == "movie" ? "Фильм" : this.shikiData.kind == "ova" ? "OVA" : this.shikiData.kind == "ona" ? "ONA" : "Аниме";

        const item = {
            id: $ID,
            continue: cnt,
            duration,
            fullduration: Player().video_data.duration,
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
                $(`.galery-slider > .slide.select`).removeClass('select');
                $(`.galery-slider > .slide[data-id="${_history.idImage}"]`).addClass('select');
            }
        }
    }
};

export const History = () => { return _history; }