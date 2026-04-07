import Hls from "../../library/hls.esm.js";
import { Player } from "./mod.tplayer.js";
import { log } from "./util.log.js";

// this.hls.on(Hls.Events.ERROR, function (event, data) {
//     if (data.fatal) {
//         switch (data.type) {
//             case Hls.ErrorTypes.NETWORK_ERROR:
//                 console.error("Проблема с сетью на уровне:", data.context.level);
//                 hls.startLoad(); // Пробуем перезагрузить
//                 break;
//             case Hls.ErrorTypes.MEDIA_ERROR:
//                 console.error("Ошибка медиа (битый файл?), пытаемся восстановить...");
//                 hls.recoverMediaError();
//                 break;
//             default:
//                 hls.destroy();
//                 break;
//         }
//     }
//     console.warn("Тихая ошибка HLS:", data.details);
// });

// this.hls.on(Hls.Events.ERROR, (event, data) => {
//     if (data.details === Hls.ErrorDetails.FRAG_LOOP_LOADING_ERROR) {
//         console.warn('Обнаружена петля сегментов! Пытаюсь протолкнуть...');
//         // Сдвигаем видео на 0.1 сек вперед, чтобы выйти из затыка
//         this.player.video.currentTime += 0.1;
//         hls.startLoad();
//     }
// });

class PlayerError {
    /**
     * @param {ErrorHandler} handler 
     */
    constructor(handler) {
        this.handler = handler;
        this.player = handler.player;

        this.#on();
    }

    #on() {
        log('error_hls_frag_load:loaded');
        const blacklistedLevels = new Set();
        let recoveryTimeout = null;

        // Функция для поиска ближайшего рабочего уровня
        const getSafeLevel = () => {
            // Пробуем найти первый уровень, которого нет в черном списке
            for (let i = this.player.hls.levels.length - 1; i >= 0; i--) {
                if (!blacklistedLevels.has(i)) return i;
            }
            return 0; // Если всё плохо, откатываемся на самый низкий (0)
        };

        this.player.hls.on(Hls.Events.ERROR, (event, data) => {
            const failedLevel = data.frag ? data.frag.level : (data.context ? data.context.level : null);
            if (failedLevel !== null && (data.details === Hls.ErrorDetails.FRAG_PARSING_ERROR || data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR)) {
                console.warn(`Уровень ${failedLevel} временно заблокирован из-за ошибки: ${data.details}`);

                blacklistedLevels.add(failedLevel);

                // Переключаем на безопасный уровень
                const nextSafe = getSafeLevel();
                player.hls.currentLevel = nextSafe;
                player.hls.loadLevel = nextSafe;
            }
        });

        this.player.hls.on(Hls.Events.FRAG_BUFFERED, (event, data) => {
            // Если мы успешно загрузили сегмент на текущем уровне, 
            // значит плеер "ожил". Можем дать заблокированным уровням второй шанс.

            if (blacklistedLevels.size > 0) {
                console.log("Есть успешная загрузка! Очищаю список исключений...");

                // Очищаем черный список
                blacklistedLevels.clear();
            }
        });
    }
}

class ErrorHlsFragLoad extends PlayerError {
    /**
     * @param {ErrorHandler} handler 
     */
    constructor(handler) {
        super(handler);
    }
}

export class ErrorHandler {
    /**
     * @param {Player} plr 
     * @param {*} opts 
     */
    constructor(plr, opts = {}) {
        this.player = plr;

        this.opts = {
            error_hls_frag_load: opts?.error_hls_frag_load ?? true
        };

        this.#init();
    }

    #init() {
        if (this.opts.error_hls_frag_load) {
            new ErrorHlsFragLoad(this);
        }
    }
}