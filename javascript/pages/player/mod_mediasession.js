/**
 * Файл:        mod_mediasession.js
 * Описание:    Мод управляющий метадаными воспроизведения
 * Возвращает:  InitMediaSession
 */

/**
 * @param {{time: string, results:[{screenshots:[string], title:string, translation: {title: string}, shikimori_id: number}]}} data 
 */
export function InitMediaSession(data) {
    if ("mediaSession" in navigator && $PARAMETERS.watch.previewbs) {
        fetch(`https://api.jikan.moe/v4/anime/${data.results[0].shikimori_id}/full`).then((response) => {
            if (!response.ok)
                return;
            return response.json();
        }).then((json) => {
            let metadata = {
                title: data.results[0].title,
                artist: data.results[0].translation.title,
                album: "Tunime",
                artwork: [
                    {
                        src: json.data.images.jpg.large_image_url,
                        sizes: "512x512",
                        type: "image/png"
                    },
                    {
                        src: './images/icons/logo-x256-o.png',
                        sizes: "256x256",
                        type: "image/png"
                    }
                ]
            };
            navigator.mediaSession.metadata = new MediaMetadata(metadata);
        }).catch((err) => {

        });
    }
}