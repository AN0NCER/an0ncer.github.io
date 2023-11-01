export const ButtonPlay = {
    play: function () {
        $('.wrapper-full').css({ 'pointer-events': 'none' });
        anime({
            targets: '.btn-play',
            scale: 0,
            duration: 300,
            easing: 'easeInBack',
            complete: () => {
                $('.wrapper-full').css({ display: 'none' });
            }
        });
    }
}

export const LoadAnimation = {
    html: `<div class="spinner-wrapper"><div class="spinner"><div class="sk-folding-cube"><div class="sk-cube1 sk-cube"></div><div class="sk-cube2 sk-cube"></div><div class="sk-cube4 sk-cube"></div><div class="sk-cube3 sk-cube"></div></div></div></div>`,
    loaded: false,
    start: function () {
        this.loaded = false;
        if ($('.spinner-wrapper').length == 0)
            $('body').append(this.html);
        const tl = anime
            .timeline({
                loop: true,
                delay: 0,
                easing: "linear",
                opacity: 1,
                duration: 300,
                loopComplete: () => {
                    if (!this.loaded) return;
                    tl.pause();
                    this.end();
                }
            })
            .add({
                targets: ".sk-cube1",
                rotateY: "90deg",
                opacity: 0,
                delay: 300
            })
            .add({
                targets: ".sk-cube2",
                rotateX: "90deg",
                transformOrigin: ["100% 100%", "100% 100%"],
                opacity: 0
            })
            .add({
                targets: ".sk-cube3",
                rotateY: "90deg",
                opacity: 0
            })
            .add({
                targets: ".sk-cube4",
                rotateX: "90deg",
                transformOrigin: ["0% 0%", "0% 0%"],
                opacity: 0
            })
            .add({
                targets: ".sk-cube1",
                rotateX: ["90deg", "0deg"],
                rotateY: ["0deg", "0deg"],
                opacity: 1
            })
            .add({
                targets: ".sk-cube2",
                rotateY: ["90deg", "0deg"],
                transformOrigin: ["0% 0%", "0% 0%"],
                rotateX: ["0deg", "0deg"],
                opacity: 1
            })
            .add({
                targets: ".sk-cube3",
                rotateX: ["90deg", "0deg"],
                rotateY: ["0deg", "0deg"],
                opacity: 1
            })
            .add({
                targets: ".sk-cube4",
                rotateY: ["90deg", "0deg"],
                rotateX: ["0deg", "0deg"],
                transformOrigin: ["100% 100%", "100% 100%"],
                opacity: 1
            });
    },
    end: function () {
        $('.wrapper-full').css({ display: '', opacity: '', 'pointer-events': '' });
        $('.btn-play').css({ display: '', opacity: '', transform: '' });
        anime.timeline({
            easing: "linear",
            duration: 200,
            delay: 0
        }).add({
            targets: ".sk-folding-cube",
            rotateZ: ["45deg", "0deg"],
            complete: () => {
                $('.spinner-wrapper').css({ 'pointer-events': 'none' })
                anime({
                    easing: "spring(1, 80, 10, 0)",
                    targets: ".btn-play",
                    opacity: 1,
                    scale: [0.5, 1]
                });
                anime({
                    targets: ".sk-folding-cube",
                    easing: "spring(1, 80, 10, 0)",
                    opacity: 0,
                    scale: [1, 0.5]
                });
            }
        });
        anime({
            targets: ".spinner-wrapper",
            background: "rgba(16, 19, 24, 0)",
            complete: () => {
                $('.spinner-wrapper').hide();
                $('.spinner-wrapper').remove();
            }
        });
    }
}

export const PlayAnimation = {
    play: function () {
        anime({
            easing: "linear",
            targets: ".btn-play-pause > .play",
            opacity: 0,
            duration: 200,
            scale: [1, 0.5]
        });
        anime({
            easing: "linear",
            targets: ".btn-play-pause > .pause",
            opacity: 1,
            duration: 200,
            scale: [0.5, 1]
        });
    },
    pause: function () {
        anime({
            easing: "linear",
            targets: ".btn-play-pause > .pause",
            opacity: 0,
            duration: 200,
            scale: [1, 0.5]
        });
        anime({
            easing: "linear",
            targets: ".btn-play-pause > .play",
            opacity: 1,
            duration: 200,
            scale: [0.5, 1]
        });
    }
}