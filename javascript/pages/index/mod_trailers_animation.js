import { GetLoadedTrailers } from "./mod_trailers.js";

export function AnimePlayPlayer(key) {
    anime({
        targets: `.btn-play[data-key="${key}"] > .play`,
        opacity: [0, 1],
        scale: [0.5, 1],
    })
    anime({
        targets: `.btn-play[data-key="${key}"] > .pause`,
        opacity: [1, 0],
        scale: [1, 0.8]
    });
}

export function AnimePausePlayer(key) {
    anime({
        targets: `.btn-play[data-key="${key}"] > .play`,
        opacity: [1, 0],
        scale: [1, 0.8]
    })
    anime({
        targets: `.btn-play[data-key="${key}"] > .pause`,
        opacity: [0, 1],
        scale: [0.5, 1],
    });
}

export function AnimeHidePreview(key) {
    anime({
        targets: `a[data-key="${key}"]`,
        opacity: [1, 0],
        complete: () => {
            $(`a[data-key="${key}"]`).hide();
        }
    });
}

export function AnimeShowPreview(key){
    anime({
        targets: `a[data-key="${key}"]`,
        opacity: [0, 1],
        begin: () => {
            $(`a[data-key="${key}"]`).show();
        }
    });
}

export function AnimeLoadedPlayer(key) {
    anime({
        targets: `.btn-play[data-key="${key}"] > .load`,
        opacity: [1, 0],
        scale: [1, 0.8]
    })
    anime({
        targets: `.btn-play[data-key="${key}"] > .pause`,
        opacity: [0, 1],
        scale: [0.8, 1]
    })
}

export function AnimeLoadingPlayer(key) {
    anime({
        targets: `.btn-play[data-key="${key}"] > .play`,
        opacity: [1, 0]
    });
    anime({
        targets: `.btn-play[data-key="${key}"] > .load`,
        opacity: [0, 1],
        scale: [0.8, 1]
    });
    let loopanime = anime({
        targets: `.btn-play[data-key="${key}"] > .load`,
        easing: 'linear',
        rotate: 360,
        loop: true,
        loopComplete: () => {
            let trailers = GetLoadedTrailers()
            if (trailers.includes(key)) {
                loopanime.pause();
                AnimeLoadedPlayer(key);
            }
        }
    });
}