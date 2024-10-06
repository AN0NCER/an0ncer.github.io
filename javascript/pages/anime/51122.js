import { Screenshots } from "../watch/mod_resource.js";

let load_image = "https://image.tmdb.org/t/p/original/Ao8SbtYJbxBuzFTQFSdHF7lLmDE.jpg";

if (/Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent)) {
    load_image = "https://image.tmdb.org/t/p/original/mLeSPsGauvBQpOroqusBsrvffGd.jpg";
}


const url = "https://image.tmdb.org/t/p/original/Ao8SbtYJbxBuzFTQFSdHF7lLmDE.jpg";
const bg = "https://image.tmdb.org/t/p/original/iCqaGYVQw9MYZap5pNgTRkdPBWf.jpg";

$(`.page-loading`).css("--image", `url(${load_image})`);

export default {
    OnLoad: () => {
        $('.galery-slider').prepend(`<div class="slide" data-id="${Screenshots.length}"><img src="${url}"></div>`);
        $(`.galery-slider > .slide[data-id="${Screenshots.length - 1}"]`).click();
        Screenshots.push({ original: url });
        
        $('img.main').attr('src', bg);
        $('img.bg').attr('src', bg);
    }
}