import tmpl from "../../library/tmpl.lib.js";
import { Kodik } from "../../modules/api.kodik.js";
import { $ID, $MOD, Player } from "../watch.js";

let inited = false;
/**@type {Map<string, tmpl>} */
const listChronology = new Map();
/**@type {Map<string, Map<number, boolean>>} */
const listVoiceAnimeAvailble = new Map();
const chrType = $PARAMETERS.watch.typefrc ?? ["TV Сериал", "Фильм", "ONA", "OVA"];
const allShow = false;

/** @type {[] | [number]} Последовательность просмотра */
export let watchSequence = [];

export const ChronologyBlock = new class {
    constructor() {
        this.modPromise = undefined;
        // Все системные блокировки
        this.blockList = new Set();
        // Блокировки от пользователя
        this.hideList = new Set();
    }

    /**
     * Блокировка определенных франщиз для аниме
     * @param {[string|number] | string | number} value 
     * @param {"user"|"system"} [type="user"] type 
     */
    block(value, type = "user") {
        const isArray = Array.isArray(value);
        const isSystem = type === "system";
        value = isArray ? value.map(id => String(id)) : String(value);

        const list = isSystem ? this.blockList : this.hideList;

        if (isArray) {
            value.forEach(id => {
                list.add(id);

                if (inited) {
                    if (isSystem) {
                        listChronology.get(id)?.remove();
                        listChronology.delete(id);
                    }
                }
            });
        } else {
            list.add(value);

            if (inited) {
                if (isSystem) {
                    listChronology.get(value)?.remove();
                    listChronology.remove(value);
                }
            }
        }
    }
}

export async function tChronology(data) {
    await $MOD;

    const tpl = tmpl('#tpl-chronology');

    data.forEach(({ id, russian, name, status, kind, airedOn: { year }, score, userRate }) => {
        kind = getLangKind(kind);
        watchSequence.push(id);

        let hideClass = "-show";

        if ($ID !== id) {
            if (!allShow && !chrType.includes(kind))
                hideClass = '-hide';

            if (ChronologyBlock.blockList.has(id))
                return;
        }

        const card = tpl.clone({
            title: russian ?? name,
            status: getLangStatus(status),
            kind, year, score, id,
            uStatus: userRate?.status
        });

        listChronology.set(id, card);
        listVoiceAnimeAvailble.set(id, new Map());

        card.appendTo(".list-franchise");
        card.el.classList.add(hideClass);
    });

    listVoiceAnimeAvailble.delete($ID);

    if (listChronology.size > 0) {
        $(`.list-franchise`).show();
        $(`.franchise-title`).show();
        listChronology.get($ID)?.el.classList.add('-select');
    }

    inited = true;
}

export async function tChronologyVoice() {
    tUpdate()
    Player.CTranslation.on("selected", () => {
        $('.container-l').show();
        $(`.icon-info > .voice`).addClass('none');
        tUpdate();
    })
}

export async function tReload(data) {
    const cache = new (await import('../../modules/tun.cache.js')).TCache();

    data.forEach(async ({ userRate, id }) => {
        const tpl = listChronology.get(id);
        const key = `anime-${id}`;

        if (tpl) {
            tpl.update({
                uStatus: userRate?.status
            });
        }

        const anime = await cache.get("metadata", key);

        if (anime) {
            anime["chronology"] = data;
            cache.put("metadata", key, anime, parseInt($PARAMETERS.anime.anicachlive) * 24 * 60 * 60 * 1000);
        }
    });

    console.log(`[mod.chronology] - reload`);
}

async function tUpdate() {
    const dubID = Player.CTranslation.id;

    if (!dubID) return;

    const ids = new Map(
        [...listVoiceAnimeAvailble]
            .filter(([k, v]) => !v.has(dubID))
    );

    const promise = [];

    ids.forEach((map, key) => {
        promise.push(new Promise(async (resolve) => {
            try {
                await Kodik.Search({ shikimori_id: key, translation_id: dubID }, ({ results }) => {
                    if (results <= 0)
                        map.set(dubID, false);
                    else
                        map.set(dubID, true);
                });
            } finally {
                resolve();
            }
        }))
    });

    Promise.all(promise).then(() => {
        hideLoad();
        updateDubUi(dubID);
    });
}

function updateDubUi(dubID) {
    const className = '-availble';

    listChronology.forEach((tpl, id) => {
        const dub = tpl.el.querySelector('.--dub-status');
        if (listVoiceAnimeAvailble.get(id)?.get(dubID))
            dub.classList.add(className);
        else
            dub.classList.remove(className)
    });

    listChronology.get($ID)?.
        el.querySelector('.--dub-status').
        classList.add(className);
}

function hideLoad() {
    $('.container-l').hide();
}

function getLangKind(kind) {
    const kinds_ru = {
        "tv": "TV Сериал",
        "movie": "Фильм",
        "ova": "OVA",
        "ona": "ONA",
        "special": "Спецвыпуск",
        "tv_special": "TV Спецвыпуск"
    };

    return kinds_ru[kind] ?? '';
}

function getLangStatus(status) {
    const status_ru = {
        "anons": "анонс",
        "ongoing": "онгоинг"
    }

    return status_ru[status] ?? '';
}