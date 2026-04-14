import { Tunime } from "../modules/api.tunime.js";
import { WindowApi } from "./tplayer/mod.api.js";
import { Keyboard, Loader, Media, Player, ProgressBar, Skips, Switch, Touch, VisualFeedback, Volume } from "./tplayer/mod.tplayer.js";
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
            components.add('progressbar', ProgressBar, { 
                preview: $PARAMETERS.player.previewseek ?? true
            });
            components.add('fullscreen', Fullscreen);
            components.add('pip', PictureInPicture);
            components.add('quality', Quality);
            components.add('volume', Volume);
            components.add('visualfeedback', VisualFeedback);

            if (player.opts.touchControls) {
                components.add('touch', Touch);
            }
        }

        if (player.opts.autoEpisodeSwitch) {
            components.add('eswitch', Switch);
        }

        if ($PARAMETERS.player.skipmoments) {
            components.add('skips', Skips, { 
                seeking: $PARAMETERS.player.skipmomentsseek ?? false
            });
        }

        components.add('media', Media);
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

        player.trigger(Player.Events.KODIK_LOADED, meta);
        
        const src = await Tunime.video.source(url);
        const source = new Source(meta, src);
        player.attach(source);
    } catch (e) {
        err(e);
    }
})();