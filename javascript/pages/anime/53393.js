import { History } from "../watch/mod_history.js";
import { Screenshots } from "../watch/mod_resource.js";
import { LTransition } from "../watch/mod_transition.js";

let load_image = "https://image.tmdb.org/t/p/original/gQpPiPkmQeZNhTzLlUfHdRGbLqm.jpg";

if (/Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent)) {
    load_image = "https://image.tmdb.org/t/p/original/p3NtYk9lW1O1gidnfDaIB2NtpNc.jpg";
}

const url = "https://image.tmdb.org/t/p/original/gQpPiPkmQeZNhTzLlUfHdRGbLqm.jpg";
const bg = "https://image.tmdb.org/t/p/original/eNLAoqkDA3KdqKDAWQb2l8EPFU8.jpg";

LTransition.Loading.Parameters([
    { name: "image", value: `url(${load_image})` },
    { name: "progress-color", value: `#e2e3df` }
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