import { History } from "../watch/mod_history.js";
import { Screenshots } from "../watch/mod_resource.js";
import { LTransition } from "../watch/mod_transition.js";

let load_image = "https://image.tmdb.org/t/p/original/uzp513qTcHsAavlCJ58x5d73bzy.jpg";

if (/Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent)) {
    load_image = "https://image.tmdb.org/t/p/original/tBt5LUvnt1aUL64EXUbZebkENqC.jpg";
}

const url = "https://image.tmdb.org/t/p/original/uzp513qTcHsAavlCJ58x5d73bzy.jpg";
const bg = "https://image.tmdb.org/t/p/original/qIJZpiKZfGYC9GpfX2jBSTOW1Dl.jpg";

LTransition.Loading.Parameters([
    { name: "image", value: `url(${load_image})` },
    { name: "progress-color", value: `#a1685e` }
]);

const callback = (screenshots) => {
    try {
        screenshots.Add({ type: 'prepend', url, id: screenshots.list.length, shikiurl: false });
        screenshots.list.push({ original: url });
        const have = History().custom.have
        if (!have) {
            History().custom.init(screenshots.list.length - 1);
        } else {
            History().custom.click(screenshots.list.length - 1);
        }
    } catch {
        console.log('Error complete script');
    }

};

export default {
    on: {
        load: () => {
            const screenshots = Screenshots.Init();
            screenshots.on("init", callback);
            if (screenshots.init) {
                callback(screenshots);
            }

            $('img.main').attr('src', bg);
            $('img.bg').attr('src', bg);
        }
    }
}