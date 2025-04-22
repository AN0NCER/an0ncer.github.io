import { md5 } from "../../library/md5.wasm.min.js";
import { ScrollElementWithMouse } from "../../modules/functions.js";
import { Kodik } from "../../modules/Kodik.js";
import { TCache } from "../../modules/tun.cache.js";
import { TSearchType, TTSearch } from "./mod_search.js";

export async function LoadVoiceList() {
    const data = await loadVoice();

    requestAnimationFrame(() => {
        for (let i = 0; i < data.results.length; i++) {

            const voice = data.results[i];
            const html = `<div class="voice" data-id="${voice.id}" data-val="${voice.title}">${voice.title}<div class="count">${voice.count}</div></div>`;

            // Получаем все три линии
            const lines = [".voice-list > .line-1", ".voice-list > .line-2", ".voice-list > .line-3"];

            // Определяем линию с наименьшей шириной
            let minLine = lines.reduce((min, line) => {
                return $(line).width() < $(min).width() ? line : min;
            }, lines[0]);


            $(minLine).append(html);
            if (i < 25)
                anime({
                    targets: $(`.voice[data-id="${voice.id}"]`)[0],
                    opacity: [0, 1],
                    translateX: [50, 0],
                    duration: 800,
                    easing: "easeOutQuad",
                    delay: i * 50, // Поочередная задержка
                });
        }
    });

    $(`.voice-list`).on('click', '.voice', (e) => {
        const el = $(e.currentTarget);

        const id = el.attr('data-id');
        const val = el.attr('data-val');

        new TTSearch(TSearchType.voice({ id, val })).search();
    });

    ScrollElementWithMouse('.voice-list');
}

function loadVoice() {
    return new Promise(async (resolve) => {
        const parameters = { types: 'anime-serial', translation_type: 'voice', sort: 'count' };
        const cache = new TCache();
        const path = await md5(JSON.stringify(parameters));

        cache.get('requests', path).then(val => {
            if (val !== null)
                return resolve(val);

            Kodik.Translations({
                types: 'anime-serial',
                translation_type: 'voice',
                sort: 'count'
            }, (response) => {
                if (response.failed)
                    return;

                cache.put('requests', path, response).finally(() => {
                    return resolve(response);
                });
            });
        })
    });
}