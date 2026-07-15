import { History } from "../watch/mod_history.js";
import { IScreenshots } from "../watch/mod.resource.js";
import { LTransition } from "../watch/mod_transition.js";

const load_image = "https://image.tmdb.org/t/p/original/7PHPHljB5zFifId9UspF2VHZBJ5.jpg";
const url = "https://image.tmdb.org/t/p/original/ytEulw6EdyQZE5T6DPMT4IviOMI.jpg";
const bg = "https://image.tmdb.org/t/p/original/hkTzWvpq1Vo0wQWegoAyA20iupV.jpg";

LTransition.Loading.Parameters([
    { name: "image", value: `url(${load_image})` },
    { name: "progress-color", value: `#e80087` }
]);

const callback = (screenshots) => {
    try {
        screenshots.add({ type: "afterbegin", url, id: screenshots.list.length });
        screenshots.list.push({ originalUrl: url });
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
            const screenshots = new IScreenshots();
            screenshots.on("init", callback);
            if (screenshots.init) {
                callback(screenshots);
            }

            $('img.main').attr('src', bg);
            $('img.bg').attr('src', bg);
        }
    }
}