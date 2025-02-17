import { History } from "../watch/mod_history.js";
import { Screenshots } from "../watch/mod_resource.js";
import { LTransition } from "../watch/mod_transition.js";

const url = "https://image.tmdb.org/t/p/original/rhkUlX7Ahod8sagYIZa21aHpglz.jpg";
let load_image = "https://image.tmdb.org/t/p/original/vaH4XdNBXwhOpyBQx9sXfnUu0BJ.jpg";

if (/Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent)) {
    load_image = "https://image.tmdb.org/t/p/original/wX1Ut2RMjqRQPnxvghjFpQU9SUf.jpg";
}

LTransition.Loading.Parameters([
    { name: "image", value: `url(${load_image})` },
    { name: "progress-color", value: `#ede618` },
    { name: "image-gradient", value: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.45))` }
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