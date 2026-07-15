import { History } from "../watch/mod_history.js";
import { IScreenshots } from "../watch/mod.resource.js";
import { LTransition } from "../watch/mod_transition.js";

const load_image = "https://image.tmdb.org/t/p/original/nUd2N42uwOeWHvdWjE5YKavNi32.jpg";
const bg = "https://image.tmdb.org/t/p/original/3lFnubNLyUpmcy9qKPSftFXV5qe.jpg";

LTransition.Loading.Parameters([
    { name: "image", value: `url(${load_image})` },
    { name: "progress-color", value: `#00c3b3` }
]);

const callback = (screenshots) => {
    try {
        screenshots.add({ type: "afterbegin", url: load_image, id: screenshots.list.length });
        screenshots.list.push({ originalUrl: load_image });
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