import { TDownload } from "../../modules/TDownload.js";
import { WindowManagement } from "../../modules/Windows.js"
import { countVideo, formatBytes } from "./mod_utils.js";

let r = undefined;

const _RVoice = async function (dub) {

    const _uiSetVoice = (id) => {
        $(`.voices-list > .voice.select`).removeClass('select');
        $(`.voices-list > .voice[data-id="${id}"]`).addClass('select');

    }

    const _uiVoiceDelete = (id) => {
        $(`.voice[data-id="${id}"]`).remove();
    }

    const _uiCardUpdate = () => {
        $(`.card-anime[data-id="${this.anime.id}"] > .card-information > .score > .val`).text(countVideo(this.anime.video));
        $(`.card-anime[data-id="${this.anime.id}"] > .card-information > .year`).text(formatBytes(this.anime.size));
    }

    const selectVoice = () => {
        const keys = Object.keys(this.anime.video);
        const voice = this.anime.video[keys.find(x => this.anime.video[x].episodes.length > 0)].id;
        return voice;
    }

    const deleteByHistory = async (vIds = []) => {
        const name = "history";
        const history = await this.db.getAll(name);
        for (let i = 0; i < vIds.length; i++) {
            const vId = vIds[i];
            const id = history.find(e => e.vId === vId)?.id;
            if (id) {
                await this.db.delete(name, { id });
            }
        }

    }

    const deleteByVideo = async (vId) => {
        const name = "video";
        console.log(`Удаление видео ${vId}`);
        await this.db.delete(name, { id: vId });
    }

    const deleteVoice = async (id, dub) => {
        const name = "anime";
        const name1 = "task";

        const anime = await this.db.get(name, { id });
        const task = await this.db.getAll(name1);

        const index = task.findIndex(x => x.vId.startsWith(id) && x.vId.endsWith(dub));
        const size = anime.video[dub].episodes.map(x => x.size).reduce((partialSum, a) => partialSum + a, 0);
        anime.size -= size;

        const vIds = anime.video[dub].episodes.map(x => x.vId);

        for (let i = 0; i < vIds.length; i++) {
            const vId = vIds[i];
            await deleteByVideo(vId);
        }
        await deleteByHistory(vIds);

        if (index === -1) {
            //Нет задач загрузок
            delete anime.video[dub];
            console.log(anime);
        } else {
            //есть незавершенная загрузка аниме
            anime.video[dub].episodes = [];
        }

        await this.db.set(name, { id }, anime);
        this.anime = anime;
    };

    const voiceAvailble = () => {
        const keys = Object.keys(this.anime.video);
        let count = 0;
        keys.forEach(key => {
            if (this.anime.video[key].episodes.length >= 1) {
                count++;
            }
        });
        if (count > 1) {
            return true;
        }
        return false;
    }
    //Доступность других озвучек
    const dubAvaible = voiceAvailble();
    console.log(`dub: ${dub}\ndubAvaible: ${dubAvaible}\n`);
    await deleteVoice(this.anime.id, dub);
    _uiVoiceDelete(dub);

    if (dubAvaible) {
        // Если доступны другие озвучки
        if (dub === this.selected)
            this.selected = selectVoice();

        _uiSetVoice(this.selected);
        //Обновить размер аниме в списке
        _uiCardUpdate();
    } else {
        this.selected = -1;
        this.hide();
        //Загрыть окно и удалить аниме со списков
        $(`.card-anime[data-id="${this.anime.id}"]`).remove();
    }

}

const Voice = {
    selected: undefined,
    anime: undefined,
    db: undefined,

    init: function () {
        $(`.bar-voices > .window-close`).on('click', () => {
            this.hide();
        });
    },
    show: function () {
        $(`.voices-list > .voice`).on('click', (e) => {
            if ($(e.target).hasClass('remove'))
                return;
            e = $(e.currentTarget);
            this.selected = parseInt(e.attr('data-id'));
            $(`.voices-list > .voice.select`).removeClass('select');
            e.addClass('select');
        });

        (() => {
            //Удаление озвучки
            let onDelete = false;
            let element = undefined;

            const disable = () => {
                if (!element)
                    return;

                element.rmstep = 0;
                $(element).removeClass("state-1");
                onDelete = false;
            }

            const enable = () => {
                if (!element)
                    return;

                element.rmstep = 1;
                $(element).addClass("state-1");
                onDelete = true;
            }

            $(".voice > .btn.remove").on("click", function (e) {
                this.rmstep = this.rmstep || 0;

                if (element && element !== this) {
                    disable();
                } else if (element && element === this) {
                    const id = parseInt($(this).parent('.voice').attr('data-id'));
                    _RVoice.bind(Voice)(id);
                }

                element = this;

                enable();
            });

            $(window).on("click", function (e) {
                const target = e.target;

                if (target === element || !onDelete)
                    return;

                disable();
            });
        })();
    },
    hide: function () {
        if (r)
            r(this.selected);
        r = undefined;
        _window.hide();
    },
    verif: () => { return true; },
}

const _window = new WindowManagement(Voice, '.window-voices');

function showVoices(video, voiceId) {
    const voiceSize = (key) => {
        let size = 0
        video[key].episodes.forEach((e) => size += e.size);
        return size;
    }

    const voiceCount = (key) => {
        return video[key].episodes.length;
    }

    const keys = Object.keys(video);


    $(`.voices-list`).empty();

    keys.forEach((key) => {
        const voice = video[key];
        const name = voice.name;
        const count = voiceCount(key);
        const size = formatBytes(voiceSize(key));
        const id = voice.id;
        console.log(`Voice:\nname: ${name}\ncount: ${count}\nsize: ${size}\nid: ${id}`);

        $(`.voices-list`).append(`<div class="voice" data-id="${id}"><div class="voice-wrapper"><div class="nummer">${name}</div><div class="info-wrapper"><div class="duartion">${count} Episodes</div><div class="size">${size}</div></div></div><div class="btn remove"><div class="ticon i-trash"></div></div></div>`);
    });

    $(`.voices-list > .voice[data-id="${voiceId}"]`).addClass('select');
    this.selected = voiceId;
}

export function SelectVoice(anime, voiceId) {
    return new Promise(async (resolve) => {
        r = resolve;
        Voice.anime = anime;
        Voice.db = (await TDownload.Manager()).db;
        showVoices.bind(Voice)(anime.video, voiceId);
        _window.click();
    });
}