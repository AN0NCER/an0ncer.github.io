import { SHIKIURL } from "../../modules/Settings.js";
import { LoadYaml, OnAchivements } from "./mod_achivements.js";

const URL = "https://raw.githubusercontent.com/shikimori/neko-achievements/master/priv/rules/_franchises.yml";

export async function Franchises() {
    const data = await LoadYaml(URL);

    let ids = [];

    for (let i = 0; i < data.length; i++) {
        const element = data[i];
        if (!ids.includes(element.neko_id))
            ids.push(element.neko_id);
    }

    OnAchivements((achivements) => {
        if (achivements === undefined)
            return;
        achivements = achivements.filter(x => ids.includes(x.neko_id));
        let unfinished = achivements.filter(x => x.level === 0 && achivements.findIndex(e => e.neko_id === x.neko_id && e.level === 1) === -1);
        unfinished = unfinished.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        if(unfinished.length !== 0){
            $(`[id="unfinished"]`).removeClass('hide');
        }

        for (let i = 0; i < unfinished.length; i++) {
            const element = unfinished[i];
            const index = data.findIndex(x => x.neko_id === element.neko_id && x.level === 1);
            if (index !== -1) {
                $(`.wrapper-achivements-unfinished > .list`).append(`<div class="achivement"><span class="title">${data[index].metadata.title_ru}</span><div class="wrapper"><div class="progress"><div class="current-progress">${element.progress}%</div><div class="to-next-level">${data[index]?.generator?.threshold || data[index].threshold}</div><div class="value" style="width:${element.progress}%;"></div></div></div></div>`)
            }
        }

        let finished = achivements.filter(x => x.level === 1);
        finished = finished.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        if(finished.length !== 0){
            $(`[id="franchises"]`).removeClass('hide');
        }

        for (let i = 0; i < finished.length; i++) {
            const element = finished[i];
            const index = data.findIndex(x => x.neko_id === element.neko_id && x.level === 1);
            if (index !== -1) {
                $(`.wrapper-achivements > .list`).append(`<div class="achivement"><div class="title"><span>${data[index].metadata.title_ru}</span></div><div class="image"><img src="${SHIKIURL.url}${data[index].metadata.image}"></div></div>`);
            }
        }

    })
}