//(Experemental)
import { Animes } from "../../modules/ShikiAPI.js";

const debug = true;

if (!/iPhone|iPad|iPod/.test(window.navigator.userAgent)) {

}

const viewport = window.visualViewport;
let height = viewport.height;
window.visualViewport.addEventListener("resize", resizeHandler);

function resizeHandler() {
    if (!/iPhone|iPad|iPod/.test(window.navigator.userAgent)) {
        height = viewport.height;
    }
    $('.helper-search').css({ 'bottom': `${height - viewport.height}px` });
}

let anime = [];
let intrv;
let init = false;

export function InitSerach(data = []) {
    if (!/iPhone|iPad|iPod/.test(window.navigator.userAgent)) {
        return;
    }
    for (let i = 0; i < data.length; i++) {
        const el = data[i];
        if (el.status != 'dropped' && el.status != 'completed') {
            anime.push(el.target_id);
        }
    }
    init = true;
    $('input[id="search-input"]').on('input', (e) => {
        clearInterval(intrv);
        intrv = setInterval(() => {
            clearInterval(intrv);
            const val = $(e.currentTarget).val();
            console.log(val);
            Animes.list({ ids: anime.toString(), search: val, limit: 3 }, (res) => {
                console.log(res);
            }).GET();
        }, 1000);
    });
}



$('input[id="search-input"]').on('focus', (e) => {
    if (init)
        $('.helper-search').css({ 'display': `flex` });
});
$('input[id="search-input"]').on('blur', (e) => {
    $('.helper-search').css({ 'display': `none` });
});