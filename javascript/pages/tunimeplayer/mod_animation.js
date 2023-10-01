let loadedData = false;

export const SiteAnimation = {
    complete: {
        loadedData: false,
        completeLoad: false,
    },
    loadData: function () {
        const tl = anime
            .timeline({
                loop: true,
                delay: 0,
                easing: "linear",
                duration: 300,
                loopComplete: () => {
                    if (!loadedData) return;
                    tl.pause();
                    this.complete.loadedData = true;
                    this.completeLoad();
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

    completeLoad: function () {
        anime.timeline({
            easing: "linear",
            duration: 200,
            delay: 0
        }).add({
            targets: ".sk-folding-cube",
            rotateZ: ["45deg", "0deg"],
            complete: () => {
                this.complete.completeLoad = true;
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
            background: "rgba(16, 19, 24, 0.20)"
        });
    },

    playAnimation: function (e) {
        anime({
            targets: '.btn-play',
            scale: 0,
            duration: 300,
            easing: 'easeInBack',
            complete: () => {
                e();
                $('.wrapper').css({ display: 'none' });
            }
        });
        anime({
            targets: ".spinner-wrapper",
            background: "rgba(16, 19, 24, 0)",
            duration: 300,
            complete: () => {
                $('.spinner-wrapper').css({ display: 'none' });
            }
        });
    },

    fullScreen: function (e) {
        anime({
            targets: '.fullscreen-wrapper .fk-cube',
            easing: "spring(1, 80, 10, 0)",
            duration: 1000,
            opacity: [0, 0.5, 0, 0.5, 0],
            complete: () => {
                $(`.fullscreen-wrapper`).css({ display: 'none' });
                e();
                anime({
                    targets: '.controls',
                    easing: 'easeInBack',
                    translateY: [40, 0],
                    duration: 500
                });
            }
        });
    }
}

export function SetLoaded() {
    loadedData = true;
}