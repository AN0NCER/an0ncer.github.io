import { Main } from "../modules/ShikiUSR.js";
import { LTransition } from "./watch/mod_transition.js";
import { tLoad } from "./watch/mod.resource.js";
import { IPlayer } from "./watch/mod_player.js";
import { AutoScrollEpisodes } from "./watch/mod_scrolling.js";
import { Functional } from "./watch/mod_ui.js";
import { ASynch } from "./watch/mod_dbanime.js";
import { UserRate } from "./watch/mod_urate.js";
import { Tunime } from "../modules/TunimeApi.js";
import { History } from "./watch/mod_history.js";
import { tChronologyVoice } from "./watch/mod.chronology.js";
import { ClearParams } from "../modules/functions.js";
import { Private } from "./watch/mod_private.js";

//ID ресурса из Shikimori
export const $ID = new URLSearchParams(window.location.search).get("id");
//Продолжение просмотра
export let $CONTINUE = new URLSearchParams(window.location.search).get("continue");
//Наведение на плеер
export const $SHOWPLAYER = new URLSearchParams(window.location.search).get("player");

export const Player = IPlayer.Init({ standart: $PARAMETERS.player.standart });

ClearParams(['continue', 'player', 'iss']);

export let $RULES = undefined;

//Авторизируем пользователя
Main(async (e) => {
    if ($PARAMETERS.anime.customstyle) {
        try {
            const start = Date.now();
            const data = await import(`/javascript/pages/anime/${$ID}.js`);
            $RULES = data.default;
            console.log(`[mod.${$ID}] - load: ${Date.now() - start}ms.`);
        } catch (err) {
            console.log(`[mod.${$ID}] - ${err}`);
        }
    }

    Functional();

    const aSynch = ASynch.Init();

    UserRate().Events.OnInit((res) => {
        aSynch.Synch(res);
    });

    //Автоматически проскролит до выбраного эпизода
    Player.on('loaded', ({ count }) => {
        if (count == 1) {
            AutoScrollEpisodes();
        }
    });

    Player.CMessage.on('error', (data) => {
        console.log(`Eror Tunime Player:`, data);
        //Если ошибка Tunime плеера то переключаем на обычный плеер Kodik
        Player.Switch();
    })

    //Выполняем сохранение аниме если выбирается озвучка только первого эпизода
    Player.CTranslation.on('selected', ({ id, user_handler }) => {
        const episode = Player.CEpisodes.selected;
        if (user_handler && episode == 1 && id) {
            aSynch.Save(episode, id);
        }
    });

    //Событие отправки выбора озвучки первого просмотра 
    Player.CMessage.on('play', () => {
        const data = aSynch.Diff;
        if (!data[0] && !data[1])
            return;
        if (data[0] && !data[1]) {
            Tunime.OnActiv.Voice($ID, data[0].kodik_dub);
            aSynch.difference = data[0];
        } else if (data[0] && data[1]) {
            if (data[0].kodik_dub != data[1].kodik_dub) {
                Tunime.OnActiv.Voice($ID, data[0].kodik_dub);
                aSynch.difference = data[0];
            }
        }
    });

    //Подписываемся на обработчик событий выбора эпизода
    //Этот обработчик будет сохранять последние выбраное аниме
    Player.CEpisodes.on('selected', ({ episode, translation, user_handler }) => {
        if (user_handler) {
            aSynch.Save(episode, translation);

            //Добавляем истоию просмотра
            History().add(false, 0, 0, episode);
        }
    });

    //Подписываемся на обработчик событий пауза плеера
    Player.CMessage.on('pause', ({ time }) => {
        History().add(true, time)
    });

    //Подписываемся на обрботчик событий
    Player.CMessage.on('play', ({ time, duration }) => {
        const userRate = UserRate().Get();
        if (userRate != null) {
            if (userRate.episodes > Player.CEpisodes.selected || userRate.status == "completed" || Private.INCOGNITO) {
                return;
            }
            UserRate().Controls.Episode(Player.CEpisodes.selected);
        }
    });

    Player.CMessage.on('play', () => {
        if ($CONTINUE != null && $CONTINUE != false) {
            //Получаем историю спика продолжение просмотра
            let history = History().get();
            //Находим ID елемента из истории
            let id = history.findIndex((x) => { return x.id == $ID });

            //Если найдено и совпадают текущии эпизоды
            if (id != -1 && Player.CEpisodes.selected == history[id].episode) {
                //Воспроизводим с остановившегося момента
                Player.PControl.Exec("seek", { seconds: history[id].duration })
                //Устанавливаем что продолжение было включено
                $CONTINUE = false;
            }
        }
    });

    //Обработчик события следующего эпизода
    Player.CMessage.on('next', (e) => {
        if (Player.CEpisodes.count == Player.CEpisodes.selected) return;
        const next_episode = Player.CEpisodes.selected + 1;
        Player.PControl.Exec("set_episode", { episode: next_episode });
        Player.CEpisodes.Select(next_episode);
        aSynch.Save(next_episode, Player.CTranslation.id);
        History().add(false, 0, 0, next_episode);
    });

    //Альтернативный полный экран видеоплеера
    Player.CMessage.on("fullscreen", ({ value }) => {
        if (value.full) {
            $('.player').addClass('fullscreen');
        } else {
            $('.player').removeClass('fullscreen');
        }
    });

    //Переключение плеера через Tunime player
    Player.CMessage.on("switch", () => {
        Player.Switch();
    })

    //Начинает загрузку плеера после получения синхронизированных данных
    aSynch.on("inited", (data) => {
        if (data) {
            Player.Init(data);
        } else {
            Player.Init();
        }
    });

    //Загружаем аниме
    tLoad(async (e) => {
        if ($RULES) {
            $RULES.on.load();
        }
        await LTransition.Loaded(() => {
            if ($SHOWPLAYER) {
                const element = document.querySelector(".landscape-player");
                element.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "nearest",
                });
            }
            Tunime.OnActiv.Anime($ID);
        });
        History().shikiData = e;
        History().custom.init();
        tChronologyVoice();
    }, { logged: e }).catch((err) => {
        if (err.message.startsWith('mod.resource.e.'))
            return document.location.replace('404a.html');
        console.log(err);
    });
});