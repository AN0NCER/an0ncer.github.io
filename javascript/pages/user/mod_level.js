import { User } from "../../modules/ShikiUSR.js";
import { $USER } from "../user.js";
import { LoadYaml, OnAchivements } from "./mod_achivements.js";
import { UserData } from "./mod_load.js";

const URL = "https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/animelist.yml";

export async function InitLeve() {
    let Data = {
        level: 0,
        progress: 0,
        next_level: 1,
        content: "Добро пожаловать!"
    };

    // console.log(User.authorized, UserData, $USER);

    if (User.authorized && UserData && UserData.id === $USER) {
        const data = JSON.parse(localStorage.getItem('user-level')) || undefined;
        // console.log(data);
        if (data !== undefined)
            Data = data;

        $(`.level-promotion > .current-promotion`).text(`${Data.progress}%`);
        $(`.level-progress-bar > .progress`).css('width', `${Data.progress}%`);
        $(`.next-level > .next-level-data`).text(Data.next_level);
        $(`.user-level-wrapper > .level-text`).text(Data.level);
        $(`.level-details > .level-content`).text(Data.content);
    }

    const Levels = await LoadYaml(URL);
    if (Levels != undefined) {
        OnAchivements((data) => {
            if (!data)
                return;
            let level = 0;
            const neko_id = 'animelist';
            let cl = undefined;

            data = data.filter(x => x.neko_id === neko_id);

            for (let i = 0; i < data.length; i++) {
                const achm = data[i];
                if (achm.level >= level) {
                    level = achm.level;
                    cl = achm;
                }
            }



            const index = Levels.findIndex(x => x.level === level);

            anime({
                targets: Data,
                level: level,
                progress: cl.progress,
                next_level: Levels[index + 1]?.level || Levels[Levels.length - 1].level,
                round: 1,
                easing: 'linear',
                update: function () {
                    $(`.level-promotion > .current-promotion`).text(`${Data.progress}%`);
                    $(`.level-progress-bar > .progress`).css('width', `${Data.progress}%`);
                    $(`.next-level > .next-level-data`).text(Data.next_level);
                    $(`.user-level-wrapper > .level-text`).text(Data.level);
                },
                complete: function () {
                    $(`.level-details > .level-content`).text(Levels[index].metadata.title_ru);
                    Data.content = Levels[index].metadata.title_ru;
                    if (User.authorized && UserData && UserData.id === $USER) {
                        localStorage.setItem('user-level', JSON.stringify(Data));
                    }
                }
            });
        });
    }

}