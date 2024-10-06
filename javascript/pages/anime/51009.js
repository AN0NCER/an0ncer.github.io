import { Screenshots } from "../watch/mod_resource.js";

const url = "https://image.tmdb.org/t/p/original/fgPa2oJD8lbLaTanzlGDd32tqDE.jpg";

$(`.page-loading`).css("--image", `url(${url})`);

export default {
    OnLoad: () => {
        $('.galery-slider').prepend(`<div class="slide" data-id="${Screenshots.length}"><img src="${url}"></div>`);
        $(`.galery-slider > .slide[data-id="${Screenshots.length - 1}"]`).click();
        Screenshots.push({ original: url });
    }
}