import { Player } from "./mod.tplayer.js";
import { log } from "./utils/util.log.js";

export class WindowApi {
    /**
     * @param {Player} player 
     */
    constructor(player) {
        this.player = player;
        this.player.services['api'] = this;

        this.#init();
        this.#messages();
    }

    #init() {
        const post = (key, value) => {
            window.parent.postMessage({ key, value }, '*');
        }

        const video = this.player.video;

        /**@type {[{type:string,from:string,value: () => Object}]} */
        const kodik_api = [
            { type: 'kodik_player_play', from: Player.Events.PLAY, value: () => undefined },
            { type: 'kodik_player_pause', from: Player.Events.PAUSE, value: () => undefined },
            { type: 'kodik_player_seek', from: Player.Events.SEEKED, value: () => { return { time: video.currentTime } } },
            { type: 'kodik_player_duration_update', from: Player.Events.DURATION_CHANGE, value: () => video.duration },
            // { type: 'kodik_player_video_started', from: Player.Events.DURATION_CHANGE, value: () => video.duration },
            // { type: 'kodik_player_video_ended', from: Player.Events.DURATION_CHANGE, value: () => video.duration },
            { type: 'kodik_player_volume_change', from: Player.Events.VOLUME_CHANGE, value: () => { return { muted: video.muted, volume: video.volume } } },
            // { type: 'kodik_player_current_episode', from: Player.Events.VOLUME_CHANGE, value: () => {return { muted: video.muted, volume: video.volume }} },
            { type: 'kodik_player_speed_change', from: Player.Events.RATE_CHANGE, value: () => { return { speed: video.playbackRate } } },
            { type: 'kodik_player_skip_button', from: Player.Events.SKIP, value: (value) => value.end },
            { type: 'kodik_player_enter_pip', from: Player.Events.ENTER_PIP, value: () => undefined },
            { type: 'kodik_player_exit_pip', from: Player.Events.EXIT_PIP, value: () => undefined }
        ];

        kodik_api.forEach(({ type, from, value }) => {
            this.player.on(from, () => post(type, value()));
        });

        /**@type {[{type:string, from:string, value:() => Object}]} */
        const tunime_api = [
            { type: 'tunime_error', from: Player.Events.ERROR, value: (e) => e },
            { type: 'tunime_fullscreen', from: Player.Events.ALTERNATIVE_FULLSCREEN, value: (e) => e },
            { type: 'tunime_next', from: Player.Events.TUNIM_CHANGE_EPISODE, value: (e) => e },
            // { type: 'tunime_switch', from}
        ];

        tunime_api.forEach(({ type, from, value }) => {
            this.player.on(from, (e) => post(type, value(e)));
        });

        ((last = null) => {
            this.player.on(Player.Events.TIME_UPDATE, () => {
                const current = Math.floor(video.currentTime);

                if (last !== current) {
                    last = current;
                    post('kodik_player_time_update', current);
                }
            });
        })();

        log('Слушатели инициализированы', 'api');
    }

    #messages() {
        const video = this.player.video;

        const handlers = {
            'play': () => { video.play().catch(() => {}); },
            'pause': () => { video.pause(); },
            'seek': ({ seconds } = {}) => { video.currentTime = seconds; },
            'volume': ({ volume } = {}) => { video.volume = volume; },
            'mute': () => { video.muted = true; },
            'unmute': () => { video.muted = false; },
            'change_episode': () => { }, // Пустышка
            'speed': ({ speed } = {}) => { video.playbackRate = Math.min(Math.max(speed, 0.25), 2); },
            'enter_pip': () => { }, // Пустышка
            'exit_pip': () => { }, // Пустышка
            'get_time': () => {
                window.parent.postMessage({ key: 'kodik_player_time', value: video.currentTime }, '*');
            },
            'set_episode': ({ episode } = {}) => {
                this.player.trigger(Player.Events.TUNIM_NEXT_EPISODE, episode);
            }
        };

        window.addEventListener('message', function (event) {
            let key = event.data.key;
            if (key && key === 'kodik_player_api') {
                const value = event.data.value;
                if (handlers[value.method]) {
                    handlers[value.method](value);
                }
            }
        })
    }
}