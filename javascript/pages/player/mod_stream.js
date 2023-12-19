/**
 * Файл:        mod_stream.js
 * Описание:    Мод отвечающий за загрузку ресурсов Медиа с сервера Tunime,
 *              а также устновки previe Image и название плеера
 * Возвращает:  LoadM3U8, LoadM3U8Episode
 */

import { ApiTunime } from "../../modules/TunimeApi.js";
import { Player } from "../player.js";
import { AUTOQUALITY, QUALITY } from "./mod_settings.js";

let STREAMS = undefined;
let KODIK_LINK = undefined;

export async function LoadM3U8(id, e) {
    const streams = await loadStreamTunime(id, e);
    return GenLink(streams);
}

export async function LoadM3U8Episode(id, e) {
    if (KODIK_LINK) {
        let kodik_link = KODIK_LINK + `?episode=${e}`;
        if (!kodik_link.includes("http")) {
            kodik_link = `https:${kodik_link}`;
        }
        const streams = await loadStreamTunime(id, e, kodik_link);
        return GenLink(streams);
    }
}

function GenLink(streams) {
    STREAMS = { 360: streams['360'], 480: streams['480'], 720: streams['720'] };
    fixStreamUrls(STREAMS);
    if (AUTOQUALITY) {
        if (Hls.isSupported()) {
            let resources = [];
            for (const key in STREAMS) {
                if (Object.hasOwnProperty.call(STREAMS, key)) {
                    const element = STREAMS[key];
                    let bandwidth = key == '360' ? 750 : key == '480' ? 1000 : 2500;
                    let resolution = key == '360' ? '640x360' : key == '480' ? '854x480' : '1280x720';
                    resources.push({ name: key, bandwidth, resolution, codecs: 'avc1.4d001f,mp4a.40.2', url: element[0].src });
                }
            }
            const blobUrl = generateBlobUrl(resources);
            return blobUrl;
        } else {
            if (QUALITY == '720') {
                return ApiTunime.link_file({ q720: STREAMS[720][0].src, q480: STREAMS[480][0].src, q360: STREAMS[360][0].src });
            } else if (QUALITY == '480') {
                return ApiTunime.link_file({ q480: STREAMS[480][0].src, q360: STREAMS[360][0].src });
            } else {
                return ApiTunime.link_file({ q360: STREAMS[360][0].src });
            }
        }
    } else {
        return STREAMS[QUALITY][0].src;
    }
}

function loadStreamTunime(id, e, kodik_link = undefined) {
    return new Promise(async (resolve) => {
        if (!kodik_link)
            kodik_link = await loadKodikLink(id, e);
        let tunime_data = await ApiTunime.stream(kodik_link);
        resolve(tunime_data);
        loadFirstSuccessfulImage(tunime_data.thumbinals)
            .then((successfulImage) => {
                if (successfulImage !== null) {
                    Player.setAttribute('poster', successfulImage);
                } else {
                    Player.setAttribute('poster', "/images/preview-image.png");
                }
            });
    });
}

function LoadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            resolve(url);
        };
        image.onerror = (e) => {
            console.log("Error loading image:", e);
            resolve(null); // Resolve with null in case of error
        };
        image.src = url;
    });
}

async function loadFirstSuccessfulImage(urls) {
    for (let url of urls) {
        url = url.indexOf("http") != -1 ? url : "https:" + url;
        const result = await LoadImage(url);
        if (result !== null) {
            return result; // Return the first successful image
        }
    }
    return null; // Return null if no successful image found
}

function loadKodikLink(id, e) {
    return new Promise((resolve) => {
        kodikApi.search({ id: id }, async (res) => {
            if (res.results.length == 0) {
                console.log('[plr] - No video');
                return;
            }
            let kodik_link = res.results[0].link;
            if (!kodik_link) {
                console.log('[plr] - No video');
                return;
            }
            KODIK_LINK = kodik_link;
            kodik_link += `?episode=${e}`;
            if (!kodik_link.includes("http")) {
                kodik_link = `https:${kodik_link}`;
            }
            resolve(kodik_link);

            //Стилизация плеера
            $(document).prop('title', res.results[0].title);
        });
    });
}

function fixStreamUrls(streams = {}) {
    for (const key in streams) {
        if (Object.hasOwnProperty.call(streams, key)) {
            const element = streams[key][0];
            if (element) {
                let url = element.src;
                if (!url.includes("http")) {
                    url = `https:${url}`;
                }
                streams[key][0].src = url;
            }
        }
    }
}

//Генерируем adaptive streaming для hls.js
function generateBlobUrl(qualityVariants = [{ bandwidth: 0, resolution: '0x0', codecs: 'avc1.4d001f,mp4a.40.2', url: '' }]) {
    var m3u8Content = '#EXTM3U\n';

    for (var i = 0; i < qualityVariants.length; i++) {
        var quality = qualityVariants[i];
        var variantLine = '#EXT-X-STREAM-INF:BANDWIDTH=' + quality.bandwidth +
            ',RESOLUTION=' + quality.resolution +
            ',CODECS="' + quality.codecs + '"' +
            ',NAME="' + quality.name + '"\n' +
            quality.url + '\n';
        m3u8Content += variantLine;
    }

    // Преобразуем строку M3U8 в Blob
    var blob = new Blob([m3u8Content], { type: 'application/vnd.apple.mpegurl' });

    // Создаем URL-объект для Blob
    var blobUrl = URL.createObjectURL(blob);

    return blobUrl;
}