import { Tunime } from "../modules/api.tunime.js";
import { WindowApi } from "./tplayer/mod.api.js";
import { Player } from "./tplayer/mod.tplayer.js";
import { PlayButton, Timer, ProgressBar, Volume, Quality } from "./tplayer/comps/cps.playback.js";
import { Fullscreen, PictureInPicture, VisualFeedback, Loader } from "./tplayer/comps/cps.screen.js";
import { Keyboard, Touch, Skips } from "./tplayer/comps/cps.input.js";
import { Media, Switch } from "./tplayer/comps/cps.system.js";
import { ErrorHandler } from "./tplayer/mod.errors.js";
import { Meta, Source } from "./tplayer/utils/util.entity.js";
import { Logger } from "./tplayer/utils/util.log.js";


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

(() => {
    try {
        const components = player.components;

        if (!player.opts.defaultUIControls) {
            components.add('play', PlayButton);
            components.add('timer', Timer);
            components.add('prbar', ProgressBar, {
                preview: $PARAMETERS.player.previewseek ?? true
            });
            components.add('fs', Fullscreen);
            components.add('pip', PictureInPicture);
            components.add('quality', Quality);
            components.add('volume', Volume);
            components.add('vfeed', VisualFeedback);

            if ($PARAMETERS.player.videoupscale) {
                import('./tplayer/comps/cps.upscale.js').then(({ Upscale, UpscaleUI }) => {
                    components.add('upscale', Upscale, {
                        enabled: $PARAMETERS.player.videoupscale,
                        mode: $PARAMETERS.player.typeupscale
                    });

                    components.add('upscaleui', UpscaleUI, {
                        io: 'upscale'
                    });
                });
            }
        }

        if (player.opts.touchControls) {
            components.add('touch', Touch);
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
        error.throw('COMPONENT_ERROR', 'main', e);
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

        Logger.setMedia({
            animeId: meta.animeId,
            animeTitle: meta.titleAnime,
            mediaVoice: meta.titleVoice,
            mediaEpisode: meta.episode,
            kodikId: meta.id,
            kodikLink: url
        });

        player.attach(source);
    } catch (e) {
        error.throw('SOURCE_LOAD', 'main', e);
    }
})();