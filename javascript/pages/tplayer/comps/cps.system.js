import { Player } from '../mod.tplayer.js';
import { Component, Source } from '../utils/util.entity.js';

export class Switch extends Component {
    setup() {
        this.player.on(Player.Events.ENDED, this.handle(() => {
            this.player.trigger(Player.Events.TUNIM_CHANGE_EPISODE, undefined);
        }, 'COMPONENT_LOW'));

        this.player.on(Player.Events.TUNIM_NEXT_EPISODE, this.handle(async (episode) => {
            this.log(`(Авто) Переключение на эпизод: ${episode}`);
            const { Tunime } = await import('../../../modules/api.tunime.js');

            const meta = this.player.source.meta;
            meta.episode = episode;

            const url = await meta.getLink();
            const src = await Tunime.video.source(url);
            const source = new Source(meta, src);

            this.player.on(Player.Events.DURATION_CHANGE, () => {
                this.player.main.play();
            }, { once: true });

            this.player.attach(source);
        }, 'COMPONENT_LOW'));
    }
}

export class Media extends Component {
    setup() {
        if ("mediaSession" in navigator && this.player.opts.enableMediaSession) {
            this.player.on(Player.Events.SOURCE_LOADED, this.handle(async () => {
                this.log('Загрузка MediaMetadata для аниме');
                // const response = await fetch(`https://api.jikan.moe/v4/anime/${this.player.source.meta.animeId}/full`); //TODO: Переделать
                const response = await fetch(`https://tunime-hub.tail304be1.ts.net/v4/anime/${this.player.source.meta.animeId}/full`);

                if (!response.ok)
                    return;

                const raw = await response.json();

                if (!raw?.data?.images?.jpg?.large_image_url)
                    return;

                let metadata = {
                    title: this.player.source.meta.titleAnime,
                    artist: this.player.source.meta.titleVoice,
                    album: "Tunime",
                    artwork: [
                        {
                            src: raw.data.images.jpg.large_image_url,
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
            }, 'COMPONENT_LOW'));
        }
    }
    init() {
        this.player.on(Player.Events.SOURCE_LOADED, this.handle(() => {
            this.clearPreview();

            const thumbnails = this.player.source.thumbinals;
            if (thumbnails && thumbnails.length > 0) {
                this.startAutoPreview(thumbnails);
            }
        }, 'COMPONENT_LOW'));

        this.player.on(Player.Events.PLAY, this.handle(() => {
            this.clearPreview();
        }, 'COMPONENT_LOW'));
    }

    startAutoPreview(images) {
        if(this.player.opts.defaultUIControls) return;

        const container = this.player.root;

        const previewWrapper = document.createElement('div');
        previewWrapper.classList.add('preview-animation-wrapper');

        const imageElements = images.map((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            img.classList.add('preview-img');
            if (index === 0) img.classList.add('active');
            previewWrapper.appendChild(img);
            return img;
        });

        container.appendChild(previewWrapper);

        let currentIndex = 0;

        // Запускаем бесконечный цикл
        this.previewInterval = setInterval(() => {
            imageElements[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % imageElements.length;
            imageElements[currentIndex].classList.add('active');
        }, 5000);
    }

    clearPreview() {
        // Останавливаем таймер
        if (this.previewInterval) {
            clearInterval(this.previewInterval);
            this.previewInterval = null;
        }
        // Удаляем старую обертку из DOM
        const oldWrapper = this.player.root.querySelector('.preview-animation-wrapper');
        if (oldWrapper) {
            oldWrapper.remove();
        }
    }
}