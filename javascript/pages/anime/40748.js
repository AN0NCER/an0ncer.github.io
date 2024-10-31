import { History } from "../watch/mod_history.js";
import { Screenshots } from "../watch/mod_resource.js";
import { LTransition } from "../watch/mod_transition.js";

const url = "https://image.tmdb.org/t/p/original/wwTjrRb0HG9sd87EDAn6ZbvxQGX.jpg";

LTransition.Loading.Parameters([
    { name: "image", value: `url(${url})` },
    { name: "progress-color", value: `#a9575b` }
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
        }
    }
}