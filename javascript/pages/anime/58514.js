import { History } from "../watch/mod_history.js";
import { IScreenshots } from "../watch/mod.resource.js";
import { LTransition } from "../watch/mod_transition.js";

const load_image = "https://image.tmdb.org/t/p/original/sDvhBOJoduJYeA9uliyXB3EI66Q.jpg";
const url = "https://image.tmdb.org/t/p/original/f7bkHYEzdpH9ceGtuOfrQEpcpCA.jpg";

LTransition.Loading.Parameters([
    { name: "image", value: `url(${load_image})` },
    { name: "progress-color", value: `#578b5c` }
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
        }
    }
}