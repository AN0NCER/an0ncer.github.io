const url = "https://nyaa.shikimori.me/";

const icon_score = `<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.73196 0.745728C4.65834 0.595337 4.50279 0.499634 4.33196 0.499634C4.16112 0.499634 4.00696 0.595337 3.93196 0.745728L3.0389 2.55452L1.04446 2.84436C0.877789 2.86897 0.7389 2.98381 0.687511 3.14104C0.636122 3.29827 0.677789 3.4719 0.797233 3.58811L2.24446 4.99768L1.90279 6.98967C1.87501 7.15374 1.94446 7.32053 2.08196 7.4176C2.21946 7.51467 2.4014 7.52698 2.5514 7.44905L4.33334 6.51252L6.11529 7.44905C6.26529 7.52698 6.44723 7.51604 6.58473 7.4176C6.72223 7.31917 6.79168 7.15374 6.7639 6.98967L6.42084 4.99768L7.86807 3.58811C7.98751 3.4719 8.03057 3.29827 7.97779 3.14104C7.92501 2.98381 7.78751 2.86897 7.62084 2.84436L5.62501 2.55452L4.73196 0.745728Z" fill="#FFE600"/></svg>`;

// export function GenerateDivCard(response) {
//     return `<div class="card-anime" data-id="${response.id}">
//                 <div class="card-content">
//                     <img src="${url}${response.image.original}">
//                     <div class="title">
//                         <span>${response.russian}</span>
//                     </div>
//                 </div>
//                 <div class="card-information">
//                     <div class="year">${new Date(response.aired_on).getFullYear()}</div>
//                     <div class="score">
//                         <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.73196 0.745728C4.65834 0.595337 4.50279 0.499634 4.33196 0.499634C4.16112 0.499634 4.00696 0.595337 3.93196 0.745728L3.0389 2.55452L1.04446 2.84436C0.877789 2.86897 0.7389 2.98381 0.687511 3.14104C0.636122 3.29827 0.677789 3.4719 0.797233 3.58811L2.24446 4.99768L1.90279 6.98967C1.87501 7.15374 1.94446 7.32053 2.08196 7.4176C2.21946 7.51467 2.4014 7.52698 2.5514 7.44905L4.33334 6.51252L6.11529 7.44905C6.26529 7.52698 6.44723 7.51604 6.58473 7.4176C6.72223 7.31917 6.79168 7.15374 6.7639 6.98967L6.42084 4.99768L7.86807 3.58811C7.98751 3.4719 8.03057 3.29827 7.97779 3.14104C7.92501 2.98381 7.78751 2.86897 7.62084 2.84436L5.62501 2.55452L4.73196 0.745728Z" fill="#FFE600"/>
//                         </svg>
//                         ${response.score}
//                     </div>
//                 </div>
//             </div>`;
// }

// export function GenerateACard(response) {
//     return `<a href="/watch.html?id=${response.id}"  class="card-anime" data-id="${response.id}">
//                 <div class="card-content">
//                     <img src="${url}${response.image.original}">
//                     <div class="title">
//                         <span>${response.russian}</span>
//                     </div>
//                 </div>
//                 <div class="card-information">
//                     <div class="year">${new Date(response.aired_on).getFullYear()}</div>
//                     <div class="score">
//                         <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.73196 0.745728C4.65834 0.595337 4.50279 0.499634 4.33196 0.499634C4.16112 0.499634 4.00696 0.595337 3.93196 0.745728L3.0389 2.55452L1.04446 2.84436C0.877789 2.86897 0.7389 2.98381 0.687511 3.14104C0.636122 3.29827 0.677789 3.4719 0.797233 3.58811L2.24446 4.99768L1.90279 6.98967C1.87501 7.15374 1.94446 7.32053 2.08196 7.4176C2.21946 7.51467 2.4014 7.52698 2.5514 7.44905L4.33334 6.51252L6.11529 7.44905C6.26529 7.52698 6.44723 7.51604 6.58473 7.4176C6.72223 7.31917 6.79168 7.15374 6.7639 6.98967L6.42084 4.99768L7.86807 3.58811C7.98751 3.4719 8.03057 3.29827 7.97779 3.14104C7.92501 2.98381 7.78751 2.86897 7.62084 2.84436L5.62501 2.55452L4.73196 0.745728Z" fill="#FFE600"/>
//                         </svg>
//                         ${response.score}
//                     </div>
//                 </div>
//             </a>`;
// }

export function Card() {
    return {
        removeElements: false,
        Link: function (response = {}) {
            return `<a href="/watch.html?id=${response.id}"  class="card-anime" data-id="${response.id}">
                        <div class="card-content">
                            <img src="${url}${response.image.original}">
                            <div class="title">
                                <span>${response.russian}</span>
                            </div>
                        </div>
                        <div class="card-information">
                            <div class="year">${new Date(response.aired_on).getFullYear()}</div>
                            <div class="score">
                                ${icon_score}
                                ${response.score}
                            </div>
                        </div>
                    </a>`
        },

        Div: function(response = {}){
            return `<div class="card-anime" data-id="${response.id}">
                        <div class="card-content">
                            <img src="${url}${response.image.original}">
                            <div class="title">
                                <span>${response.russian}</span>
                            </div>
                        </div>
                        <div class="card-information">
                            <div class="year">${new Date(response.aired_on).getFullYear()}</div>
                            <div class="score">
                                ${icon_score}
                                ${response.score}
                            </div>
                        </div>
                    </div>`
        }
    }
}


//Добавить генерацию пустышек и потом загрузку к ним контента
//Добавить загрузку UserRates и выставлять значки просмотренный если отмеченно в параметрах