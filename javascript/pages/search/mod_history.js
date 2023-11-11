import { ACard } from "../../modules/AnimeCard.js";

export const SearchHistory = {
    key: 'search-history',
    data: [],

    /**
     * Загружает историю поиска из локального хранилища и передает ее в функцию обратного вызова (event).
     * @param {function} event - Функция обратного вызова, которой передается загруженная история.
     */
    loadHistory: function (event) {
        let data = localStorage.getItem(this.key);
        if (data)
            this.data = JSON.parse(data);
        event(this.data);
    },

    /**
     * Добавляет элемент в историю поиска.
     * @param {string} id - Идентификатор элемента, который нужно добавить в историю.
     */
    addHistory: function (id) {
        if (this.data == []) {
            this.data = localStorage.getItem(this.key) ? JSON.parse(localStorage.getItem(this.key)) : [];
        }
        // Check if the id already exists in the history
        let index = this.data.indexOf(id);
        if (index !== -1) {
            // If it does, move it to the first position
            this.data.splice(index, 1);
            this.data.unshift(id);
        } else {
            // If it doesn't, add it to the first position
            this.data.unshift(id);
            // And check if we have reached the maximum history length
            if (this.data.length > 10) {
                this.data.pop();
            }
        }
        localStorage.setItem(this.key, JSON.stringify(this.data));
        //Если это уже есть в списке перенести на первое место
        if ($(`.history > .content > a[data-id="${id}"]`).length > 0) {
            $(`.history > .content > a[data-id="${id}"]`).detach().prependTo($('.history > .content'));
        } else {
            if ($(`.history > .content > a`).length >= 10) {
                $(`.history > .content > a:last`).remove();
            }

            let element = $(`.result > .content > .card-anime[data-id="${id}"]`);

            let response = {
                id,
                image: element.find(`.card-content > img`).attr('src').trim(ACard.GetUrl()),
                russian: element.find(`.card-content > .title > span`).text(),
                score: element.find(`.card-information > .score`).text(),
                aired_on: element.find(`.card-information > .year`).text()
            };

            response.image = { original: response.image.substring(ACard.GetUrl().length) };
            response.score = response.score.trim();

            $(`.history > .content`).prepend(ACard.Gen({ response: response }));
        }
    },

    /**
     * Очищает историю поиска, удаляя все элементы из нее.
     */
    clearHistory: function () {
        this.data = [];
        localStorage.setItem(this.key, JSON.stringify(this.data));
    }
}