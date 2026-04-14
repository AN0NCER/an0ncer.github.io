import { History } from "../watch/mod_history.js";
import { IScreenshots } from "../watch/mod.resource.js";
import { LTransition } from "../watch/mod_transition.js";

const load_image = "https://image.tmdb.org/t/p/original/zjGluuOB0gr8PKGyT3V89X6D9pc.jpg";
const url = "https://image.tmdb.org/t/p/original/dQdz1Ih2KQ8aUw3eSN8XCq3pCkt.jpg";

LTransition.Loading.Parameters([
    { name: "image", value: `url(${load_image})` },
    { name: "progress-color", value: `#fffd6d` }
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