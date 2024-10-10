import { SHIKIURL } from "./Settings.js";

const icon_score = `<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.73196 0.745728C4.65834 0.595337 4.50279 0.499634 4.33196 0.499634C4.16112 0.499634 4.00696 0.595337 3.93196 0.745728L3.0389 2.55452L1.04446 2.84436C0.877789 2.86897 0.7389 2.98381 0.687511 3.14104C0.636122 3.29827 0.677789 3.4719 0.797233 3.58811L2.24446 4.99768L1.90279 6.98967C1.87501 7.15374 1.94446 7.32053 2.08196 7.4176C2.21946 7.51467 2.4014 7.52698 2.5514 7.44905L4.33334 6.51252L6.11529 7.44905C6.26529 7.52698 6.44723 7.51604 6.58473 7.4176C6.72223 7.31917 6.79168 7.15374 6.7639 6.98967L6.42084 4.99768L7.86807 3.58811C7.98751 3.4719 8.03057 3.29827 7.97779 3.14104C7.92501 2.98381 7.78751 2.86897 7.62084 2.84436L5.62501 2.55452L4.73196 0.745728Z" fill="#FFE600"/></svg>`;

//Добавить генерацию пустышек и потом загрузку к ним контента
//Добавить загрузку UserRates и выставлять значки просмотренный если отмеченно в параметрах


/// New update

const _url = SHIKIURL.suburl('nyaa');

const _animeCards = [];

export const ACard = {
    GetUrl: function () {
        return _url;
    },
    /**
     * Генерация карточки аниме
     * @returns DOM елемента 
     */
    Gen: function ({ id, response, link = true } = {}) {
        let genLoad = false;
        if (id && !(response)) {
            genLoad = true;
        }

        //Сделаит пустышку
        if (genLoad) {
            if (link) {
                return `<a href="/watch.html?id=${id}"  class="card-anime" data-id="${id}"></a>`;
            } else {
                return `<div  class="card-anime" data-id="${id}"></div>`;
            }
        }

        if (!response) {
            console.log('Нету данных');
            return;
        }

        _animeCards.push(response.id);

        let { image, russian, score, aired_on } = response;

        if (link) {
            return `<a href="/watch.html?id=${response.id}"  class="card-anime" data-id="${response.id}">
            <div class="card-content">
                <img src="${_url}${image.original}" class="blur">
                <img src="${_url}${image.original}">
                <div class="title">
                    <span>${russian}</span>
                </div></div>
            <div class="card-information">
                <div class="year">${new Date(aired_on).getFullYear()}</div>
                <div class="score">
                    ${icon_score}
                    ${score}
                </div></div></a>`
        } else {
            return `<div class="card-anime" data-id="${response.id}">
            <div class="card-content">
                <img src="${_url}${image.original}" class="blur">
                <img src="${_url}${image.original}">
                <div class="title">
                    <span>${russian}</span>
                </div></div>
            <div class="card-information">
                <div class="year">${new Date(aired_on).getFullYear()}</div>
                <div class="score">
                    ${icon_score}
                    ${score}
            </div></div></div>`
        }
    },

    /**
     * Генерация карточки аниме
     * @param {{ type: "a" | "div", anime: {id:string, poster: {mainUrl:string}, russian:string, airedOn: {year:number}, score:number}, data: {key:value}, exclude: [string] }} data - Данные аниме
     * @returns DOM елемента 
     */
    GenV2: function ({ type = 'a', anime, data, exclude = [] } = {}) {
        if (type == 'a') {
            return `<a href="/watch.html?id=${anime.id}" class="card-anime" data-id="${anime.id}" ${Data()}>${Gen()}</a>`;
        } else {
            return `<div class="card-anime" data-id="${anime.id}" ${Data()}>${Gen()}</div>`;
        }

        function Gen() {
            return `<div class="card-content">
                        <img src="${anime.poster.mainUrl}" class="blur">
                        <img src="${anime.poster.mainUrl}">
                        <div class="title"><span>${anime.russian}</span></div>
                        ${data?.score ? `<div class="score">${data.score}</div>` : ''}
                    </div>
                    <div class="card-information">
                        <div class="year">${anime.airedOn.year}</div>
                        <div class="score">${icon_score}${anime.score}</div>
                    </div>`;
        }

        function Data() {
            if (!data) return '';

            let str = '';
            for (const key in data) {
                if (exclude.includes(key)) continue;
                str += `data-${key}="${data[key]}"`;
            }

            return str;
        }
    },

    /**
     * Генерация загрузочной карточки аниме
     * @param {{type: "a" | "div"}} data - Данные загрузки
     * @returns 
     */
    LoadV2: function ({ type = 'a', id = 0 } = {}) {
        if(type == 'a'){
            return `<a class="card-anime" data-id="${id}"></a>`;
        }else{
            return `<div class="card-anime" data-id="${id}"></div>`
        }
    }
};