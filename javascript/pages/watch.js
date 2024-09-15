import { Kodik } from "../modules/Kodik.js";
import { Main } from "../modules/ShikiUSR.js";
import { LoadScreen } from "./watch/mod_load.js";
import { CheckID, LoadAnime } from "./watch/mod_resource.js";
import { Player } from "./watch/mod_player.js";
import { AutoScrollEpisodes } from "./watch/mod_scrolling.js";
import { Functional } from "./watch/mod_ui.js";
import { DifferenceInData, SaveLData, SetDifferenceData, Synch, SynchLData } from "./watch/mod_sdata.js";
import { UserRate } from "./watch/mod_urate.js";
import { Tunime } from "../modules/TunimeApi.js";
import { History } from "./watch/mod_history.js";
import { InitFranchiseVoices } from "./watch/mod_franchise.js";
import { ClearParams } from "../modules/functions.js";
import { Private } from "./watch/mod_private.js";

//ID ресурса из Shikimori
export const $ID = new URLSearchParams(window.location.search).get("id");
//Продолжение просмотра
export let $CONTINUE = new URLSearchParams(window.location.search).get("continue");
//Наведение на плеер
export const $SHOWPLAYER = new URLSearchParams(window.location.search).get("player");

ClearParams(['continue', 'player']);

export let $RULES = undefined;

import(`/javascript/pages/watch/mod_collection.js`);

//Авторизируем пользователя
Main(async (e) => {
    try {
        const data = await import(`/javascript/pages/anime/${$ID}.js`);
        $RULES = data.default;
        console.log(`[watch] - Custom RULES uploaded`);
    } catch { }
    //Проверка на существование такого ID
    const check = await CheckID($ID);

    if (!check) {
        //Аниме с такий ID не существует, перекидываем на страницу 404
        return document.location.replace('404a.html');
    }

    Functional();

    UserRate().Events.OnInit((res) => {
        SynchLData(res);
    });

    //Загрузка данных аниме плеера kodik
    Kodik.Search({ shikimori_id: $ID }, (response) => {
        Player().events.onalredy((e) => {
            //Начинает загрузку плеера после получения синхронизированных данных
            Synch.Init().On((data) => {
                if (data) {
                    Player().loadAnime(data.kodik_episode, data.kodik_dub);
                } else {
                    Player().update();
                }
                AutoScrollEpisodes();
            });
        });

        //Автоматически проскролит до выбраного эпизода
        Player().events.onloaded(async (i) => {
            if (i == 1) {
                AutoScrollEpisodes();
            }
        });

        Player().events.onerror((data) => {
            console.log(`Eror Tunime Player: ${data}`);
            //Убираем автомотический выбор плеера из за ошибки
            $PARAMETERS.player.standart = false;
            //Если ошибка Tunime плеера то переключаем на обычный плеер Kodik
            Player().update(false);
        })

        //Выполняем сохранение аниме если выбирается озвучка только первого эпизода
        Player().translation.events.onselected((id_translation, user) => {
            let e = Player().episodes.selected_episode;
            if (user && e == 1 && id_translation) {
                SaveLData(e, id_translation);
            }
        });

        //Событие отправки выбора озвучки первого просмотра 
        Player().events.onplayed((e) => {
            const data = DifferenceInData();
            if (!data[0] && !data[1])
                return;
            if (data[0] && !data[1]) {
                Tunime.OnActiv.Voice($ID, data[0].kodik_dub);
                SetDifferenceData(data[0]);
            } else if (data[0] && data[1]) {
                if (data[0].kodik_dub != data[1].kodik_dub) {
                    Tunime.OnActiv.Voice($ID, data[0].kodik_dub);
                    SetDifferenceData(data[0]);
                }
            }
        });

        //Подписываемся на обработчик событий выбора эпизода
        //Этот обработчик будет сохранять последние выбраное аниме аниме
        Player().episodes.events.onclicked((e, d) => {
            SaveLData(e, d);

            //Добавляем истоию просмотра
            History().add(false, 0, 0, e);
        });

        //Подписываемся на обработчик событий пауза плеера
        Player().events.onpause((d) => {
            History().add(true, d.time)
        });

        //Подписываемся на обрботчик событий
        Player().events.onplayed((e) => {
            const userRate = UserRate().Get();
            if (userRate != null) {
                if (userRate.episodes > e || userRate.status == "completed" || Private.INCOGNITO) {
                    return;
                }
                UserRate().Controls.Episode(Player().episodes.selected_episode)
            }
        });

        Player().events.onplayed((e) => {
            if ($CONTINUE != null && $CONTINUE != false) {
                //Получаем историю спика продолжение просмотра
                let history = History().get();
                //Находим ID елемента из истории
                let id = history.findIndex((x) => { return x.id == $ID });

                //Если найдено и совпадают текущии эпизоды
                if (id != -1 && Player().episodes.selected_episode == history[id].episode) {
                    //Воспроизводим с остановившегося момента
                    Player().functional.control("seek", { seconds: history[id].duration });
                    //Устанавливаем что продолжение было включено
                    $CONTINUE = false;
                }
            }
        });

        //Обработчик события следующего эпизода
        Player().events.onnext((e) => {
            if (e.episodes.episodes_count == e.episodes.selected_episode) return;
            const next_episode = e.episodes.selected_episode + 1;
            e.functional.control(e.functional.methods[10], { episode: next_episode });
            e.episodes.selected_episode = next_episode;
            e.episodes.AnimateSelect(next_episode);
            SaveLData(next_episode, e.translation.id);
            History().add(false, 0, 0, next_episode);
        });

        //Альтернативный полный экран видеоплеера
        Player().events.onfullscreen((e) => {
            if (e.full) {
                $('.player').addClass('fullscreen');
            } else {
                $('.player').removeClass('fullscreen');
            }
        });

        //Инициализируем плеер
        Player().init(response.results);
    });

    //Загружаем аниме
    LoadAnime(async (e) => {
        if ($RULES) {
            $RULES.OnLoad();
        }
        await LoadScreen.Loaded(() => {
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
        InitFranchiseVoices();
    }, e);
});