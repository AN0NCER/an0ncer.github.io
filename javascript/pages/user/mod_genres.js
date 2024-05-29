import { LoadYaml, OnAchivements } from "./mod_achivements.js";

const LIST = [
    { neko_id: 'fantasy', title: 'Фэнтези', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/fantasy.yml' },
    { neko_id: 'comedy', title: 'Комедиа', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/comedy.yml' },
    { neko_id: 'dementia_psychological', title: 'Психологическое', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/comedy.yml' },
    { neko_id: 'drama', title: 'Драма', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/drama.yml' },
    { neko_id: 'historical', title: 'Исторический', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/historical.yml' },
    { neko_id: 'horror_thriller', title: 'Хоррор', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/horror_thriller.yml' },
    { neko_id: 'mecha', title: 'Меха', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/mecha.yml' },
    { neko_id: 'military', title: 'Военное', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/military.yml' },
    { neko_id: 'music', title: 'Музыка', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/music.yml' },
    { neko_id: 'mystery', title: 'Детектив', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/mystery.yml' },
    { neko_id: 'police', title: 'Полиция', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/police.yml' },
    { neko_id: 'romance', title: 'Романтика', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/romance.yml' },
    { neko_id: 'slice_of_life', title: 'Повседневность', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/slice_of_life.yml' },
    { neko_id: 'space', title: 'Космос', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/space.yml' },
    { neko_id: 'sports', title: 'Спорт', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/sports.yml' },
    { neko_id: 'supernatural', title: 'Сверхъестественное', url: 'https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/supernatural.yml' }
];

export function Genres() {
    OnAchivements(achivements => {
        const ids = [];
        let genres = {};
        for (let i = 0; i < achivements.length; i++) {
            const element = achivements[i];
            const index = LIST.findIndex(x => x.neko_id === element.neko_id);
            if (index !== -1) {
                if (!genres[element.neko_id]) {
                    genres[element.neko_id] = {
                        id: element.neko_id,
                        index: index,
                        name: LIST[index].title,
                        level: element.level,
                        threshold: 0,
                        count: 0
                    }
                    ids.push(element.neko_id);
                } else if (genres[element.neko_id].level < element.level) {
                    genres[element.neko_id].level = element.level;
                }
            }
        }

        if (ids.length === 0)
            return;

        $(`[id="genres"]`).removeClass('hide');

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            LoadYaml(LIST[genres[id].index].url).then((value) => {
                if (value !== undefined) {
                    genres[id].count = value.length;
                    const index = value.findIndex(x => x.level === genres[id].level);
                    if (index !== -1)
                        genres[id].threshold = value[index].threshold;

                    $(`.wrapper-genres > .list`).append(`<div class="genr">
                    <div class="icon-title">
                        <span class="icon" style="opacity:${(100 / genres[id].count) * genres[id].level}%">
                            <img src="images/genres/${genres[id].id}.svg"/>
                        </span>
                        <span class="title">${genres[id].name}</span>
                    </div>
                    <div class="details">
                        <div class="level">${genres[id].level} Уровень</div>
                        <div class="count">${genres[id].threshold} аниме</div>
                    </div>
                </div>`)
                }
            })
        }
    });
}
