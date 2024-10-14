import { History } from "../watch/mod_history.js";
import { Screenshots } from "../watch/mod_resource.js";

const url = "https://image.tmdb.org/t/p/original/7uxQQUnHvPKc2LmvDXRszgfBka8.jpg";

$(`.page-loading`).css("--image", `url(${url})`);

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
    OnLoad: () => {
        const screenshots = Screenshots.Init();
        screenshots.on("init", callback);
        if (screenshots.init) {
            callback(screenshots);
        }
    }
}