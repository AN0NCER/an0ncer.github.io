import { Tunime } from "../modules/api.tunime.js";
import { WindowApi } from "./tplayer/mod.api.js";
import { Keyboard, Loader, Media, Player, ProgressBar, Skips, Switch, Volume } from "./tplayer/mod.tplayer.js";
import { Meta, Source } from "./tplayer/util.entity.js";
import { Fullscreen, PictureInPicture, PlayButton, Quality, Timer } from "./tplayer/mod.tplayer.js";
import { ErrorHandler } from "./tplayer/mod.errors.js";
import { err, log, logger } from "./tplayer/util.log.js";

const player = new Player(document.getElementById('player'), {
    requiredQuality: $PARAMETERS.player.quality,
    autoQualitySelect: $PARAMETERS.player.autoquality,
    defaultUIControls: $PARAMETERS.player.standart_controls,
    autoFullScreen: $PARAMETERS.player.full,
    autoEpisodeSwitch: $PARAMETERS.player.autonekst,
    enableMediaSession: $PARAMETERS.watch.previewbs
});

const api = new WindowApi(player);
const error = new ErrorHandler(player);

const query = (() => {
    const url = new URLSearchParams(window.location.search);

    const data = {
        id: url.get('id'),
        episode: url.get('e')
    }

    return {
        ...data,
        isset: () => {
            if (!data.id || !data.episode) return false;
            return true;
        }
    }
})();

logger.log('INFO', 'URLSearchParams loaded', query);

(() => {
    try {
        const components = player.components;

        if (!player.opts.defaultUIControls) {
            components.add('play', PlayButton);
            components.add('timer', Timer);
            components.add('progressbar', ProgressBar);
            components.add('fullscreen', Fullscreen);
            components.add('pip', PictureInPicture);
            components.add('quality', Quality);
            components.add('volume', Volume);
        }

        if (player.opts.autoEpisodeSwitch) {
            components.add('eswitch', Switch);
        }

        if (player.opts.enableMediaSession) {
            components.add('media', Media);
        }

        components.add('skips', Skips);
        components.add('keyboard', Keyboard);

        components.add('loader', Loader);
    } catch (e) {
        err(e);
    }
})();

(async () => {
    try {
        if (!query.isset()) return player.trigger(Player.Events.ERROR, 'a');

        const meta = new Meta(query.id, query.episode);
        const url = await meta.getLink();
        const src = await Tunime.video.source(url);
        const source = new Source(meta, src);
        player.attach(source);
    } catch (e) {
        err(e);
    }
})();

// const vSetup = {
//     quality: $PARAMETERS.player.quality,
//     autoQuality: $PARAMETERS.player.autoquality,
//     autoFullScreen: $PARAMETERS.player.full,
//     defaultPlayer: $PARAMETERS.player.standart,
//     defaultControls: $PARAMETERS.player.standart_controls,
//     alternativeFullScreen: $PARAMETERS.player.alternative_full
// };

// class TimeRange extends Component {
//     point = document.querySelector('.video-timeline-controller > .current-time');
//     all = document.querySelector('.vtime > .durration');
//     cur = document.querySelector('.vtime > .current-time');
//     init() {
//         this.duration = 0;
//         this.current = 0;
//         this.percent = 0;

//         this.video.addEventListener('durationchange', () => {
//             this.duration = this.video.duration;
//             this.all.textContent = this.formatTime(this.duration);
//         });

//         this.video.addEventListener('timeupdate', () => {
//             this.current = this.video.currentTime;
//             this.percent = (100 / this.duration) * this.current;
//             this.point.style.width = `${this.percent}%`;
//             this.cur.textContent = this.formatTime(this.current);
//         })
//     }

//     formatTime(seconds) {
//         seconds = Math.floor(seconds); // отбрасываем дробную часть
//         const h = Math.floor(seconds / 3600);
//         const m = Math.floor((seconds % 3600) / 60);
//         const s = seconds % 60;

//         const twoDigits = (num) => num.toString().padStart(2, '0');

//         if (h > 0) {
//             return `${h}:${twoDigits(m)}:${twoDigits(s)}`;
//         } else {
//             return `${twoDigits(m)}:${twoDigits(s)}`;
//         }
//     }
// }