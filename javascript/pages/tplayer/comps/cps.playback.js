import Hls from '../../../library/hls.esm.js';
import { Player } from '../mod.tplayer.js';
import { Component } from '../utils/util.entity.js';

export class PlayButton extends Component {
    setup() {
        /**@type {HTMLDivElement} */
        this.btn = this.player.root.querySelector('#media-play-button');

        this.player.on(Player.Events.PLAY, this.handle(() => {
            this.btn.classList.add('-pause');
        }, "COMPONENT_LOW"));

        this.player.on(Player.Events.PAUSE, this.handle(() => {
            this.btn.classList.remove('-pause');
        }, "COMPONENT_LOW"));
    }

    init() {
        this.btn.addEventListener('click', this.handle(() => {
            this.error?.log(`Button "media-play-button" pressed. isPaused: ${this.video.paused}`, this.id);
            if (this.video.paused) {
                this.player.main.play();
            } else {
                this.video.pause();
            }
        }));
    }
}

export class Timer extends Component {
    setup() {
        this.current = this.player.root.querySelector('#media-current-time');
        this.duration = this.player.root.querySelector('#media-source-duration');
    }

    init() {
        this.player.on(Player.Events.TIME_UPDATE, this.handle(() => {
            this.current.textContent = this.formatTime(this.video.currentTime);
        }, "COMPONENT_LOW"));
        this.player.on(Player.Events.DURATION_CHANGE, this.handle(() => {
            this.duration.textContent = this.formatTime(this.video.duration);
        }, "COMPONENT_LOW"));
    }

    formatTime(seconds) {
        seconds = Math.floor(seconds); // отбрасываем дробную часть
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        const twoDigits = (num) => num.toString().padStart(2, '0');

        if (h > 0) {
            return `${h}:${twoDigits(m)}:${twoDigits(s)}`;
        } else {
            return `${twoDigits(m)}:${twoDigits(s)}`;
        }
    }
}

export class ProgressBar extends Component {
    setup() {
        this.bar = document.getElementById('media-progress-bar');
        this.load = document.getElementById('media-load-bar');
        this.controller = document.querySelector('.video-timeline-controller');
        /**@type {HTMLDivElement} */
        this.container = document.querySelector('.progress-bar-wrapper');

        this.duration = 0;
        this.isDragging = false;
        this.isFocus = false;
        this.wasPlayingBeforeDrag = false;

        this.player.on(Player.Events.DURATION_CHANGE, this.handle(() => {
            this.log('Получено продолжительность видео. Блокировка progrssbar');
            this.duration = this.video.duration;
            this.container.classList.add('-hide');
            this.player.on(Player.Events.PLAY, () => {
                this.log('Разблокировка progrssbar');
                this.container.classList.remove('-hide');
            }, { once: true });
        }));

        //буферизация
        const onBuf = () => {
            const bufferedRanges = this.video.buffered;

            if (bufferedRanges.length > 0) {
                const loadedTime = bufferedRanges.end(bufferedRanges.length - 1);
                const percent = Math.min(Math.max(0, (loadedTime / this.duration)), 1);
                this.load.style.width = percent * 100 + '%';
            }
        }

        if (this.player.device.isHls) {
            this.player.hls.on(Hls.Events.BUFFER_APPENDED, this.handle(() => onBuf()));
        } else {
            this.player.on(Player.Events.PROGRESS, this.handle(() => onBuf()));
        }

        this.player.on(Player.Events.SOURCE_LOADED, this.handle(() => {
            const source = this.player.source;

            const thumb = document.getElementById('media-thumbinal-preview');
            const timestamp = document.getElementById('media-timestamp-preview');
            const preview = thumb.querySelector('.preview');
            const cache = document.getElementById('media-cache-thumbinals');

            this.tiles = {
                disable: (!source.tiles.pattern || !source.tiles.interval || !source.tiles.width) || !this.opts.preview,
                pattern: source.tiles?.pattern,
                interval: source.tiles?.interval,
                width: source.tiles?.width,
                height: 90,
                x: source.tiles?.x,
                y: source.tiles?.y
            };

            if (this.tiles.disable) {
                thumb.classList.add('-nopreview');
            } else {
                thumb.classList.remove('-nopreview');
            }

            const tiles = this.tiles;

            /**@type {Map<string,'loaded'|'loading'>} */
            const imageCache = new Map();

            /**
             * Очистка от старых кешей
             */
            function clearCache() {
                cache.innerHTML = '';
                imageCache.clear();
            }


            function preloadSheet(index) {
                if (index <= 0) return;

                const paddedIndex = String(index).padStart(4, '0');
                const url = tiles.pattern.replace('{index}', paddedIndex);

                if (imageCache.has(url)) return;

                imageCache.set(url, 'loading');

                const hiddenImg = document.createElement('img');
                hiddenImg.classList.add('tile-cache-item');
                hiddenImg.style.display = 'none';

                hiddenImg.onload = () => {
                    imageCache.set(url, 'loaded');
                };

                hiddenImg.onerror = () => {
                    // Убираем из Map чтобы можно было перепопробовать при необходимости
                    imageCache.delete(url);
                    hiddenImg.remove();
                };

                hiddenImg.src = url;
                cache.appendChild(hiddenImg);
            }

            clearCache();

            if (this.tiles.disable) {
                this.updateThumb = (seconds) => {
                    timestamp.textContent = this.formatTime(seconds);
                }
            } else {
                // Последний успешно отображённый стейт
                let lastLoadedSrc = null;
                let lastLoadedPos = { x: 0, y: 0 };

                this.updateThumb = (seconds) => {
                    //Математика кадров
                    const frameIndex = Math.floor(seconds / this.tiles.interval);
                    const framesPerSheet = this.tiles.x * this.tiles.y; // 25

                    // Номер файла (tiles0001, tiles0002...)
                    const fileIndex = Math.floor(frameIndex / framesPerSheet) + 1;
                    const paddedIndex = String(fileIndex).padStart(4, '0');
                    const currentUrl = this.tiles.pattern.replace('{index}', paddedIndex);

                    // Позиция внутри файла
                    const indexInSheet = frameIndex % framesPerSheet;
                    const col = indexInSheet % this.tiles.x;
                    const row = Math.floor(indexInSheet / this.tiles.x);

                    const posX = -(col * this.tiles.width);
                    const posY = -(row * this.tiles.height);

                    // Ставим URL только если он реально изменился (экономим ресурсы)
                    const newSrc = `url("${currentUrl}")`;

                    // Подгружаем соседние листы при смене файла
                    if (thumb.style.getPropertyValue('--src') !== newSrc) {
                        preloadSheet(fileIndex - 1);
                        preloadSheet(fileIndex);
                        preloadSheet(fileIndex + 1);
                    }

                    // Показываем кадр только если лист уже загружен
                    if (imageCache.get(currentUrl) === 'loaded') {
                        thumb.style.setProperty('--src', newSrc);
                        preview.style.backgroundPosition = `${posX}px ${posY}px`;

                        // Запоминаем последний удачный стейт
                        lastLoadedSrc = newSrc;
                        lastLoadedPos = { x: posX, y: posY };
                    } else {
                        // Лист ещё грузится — держим последний удачный кадр
                        if (lastLoadedSrc) {
                            thumb.style.setProperty('--src', lastLoadedSrc);
                            preview.style.backgroundPosition = `${lastLoadedPos.x}px ${lastLoadedPos.y}px`;
                        }
                    }

                    timestamp.textContent = this.formatTime(seconds);
                }
            }
        }));
    }

    init() {
        // Обновление прогресса при проигрывания
        this.player.on(Player.Events.TIME_UPDATE, this.handle(() => {
            if (!this.isDragging) {
                this.updateBarWidth(this.video.currentTime / this.duration);
            }
        }));

        // Показ/скрытие контроллера
        this.container.addEventListener('mouseenter', this.handle(() => this.openController()));
        this.container.addEventListener('mouseleave', this.handle(() => this.closeController()));
        this.container.addEventListener('touchstart', this.handle((event) => {
            event.stopPropagation();
            this.openController();
        }));

        // Логика перетаскивания
        // Десктопные события
        this.controller.addEventListener('mousedown', this.handle((e) => this.startDragging(e)));

        // Мобильные события
        this.controller.addEventListener('touchstart', this.handle((e) => this.startDragging(e)), { passive: false });

        // Общие обработчики (для удаления)
        this.moveHandler = this.handle((e) => this.drag(e));
        this.stopHandler = this.handle((e) => this.stopDragging(e));
        this.onTouchOut = this.handle((e) => this.handleOutsideTouch(e));
    }

    //Управление отображением прогресс бара

    handleOutsideTouch(event) {
        if (!this.container.contains(event.target)) {
            event.stopPropagation();
            this.closeController();
        }
    }

    openController() {
        if (this.controller.classList.contains('-enter')) return; // Уже открыто — ничего не делаем

        this.isFocus = true;
        this.controller.classList.add('-enter');
        this.player.root.classList.add('--bar');
        // Вешаем слушатель на окно только сейчас
        window.addEventListener('touchstart', this.onTouchOut);
    }

    closeController() {
        this.isFocus = false;
        this.controller.classList.remove('-enter');
        this.player.root.classList.remove('--bar');
        // Удаляем слушатель, так как он больше не нужен
        window.removeEventListener('touchstart', this.onTouchOut);
    }

    //---------------------------------------

    getClientX(e) {
        return e.touches ? e.touches[0].clientX : e.clientX;
    }

    calculateProgress(clientX) {
        const rect = this.controller.getBoundingClientRect();
        const offset = clientX - rect.left;
        return Math.min(Math.max(0, offset / rect.width), 1);
    }

    updateBarWidth(ratio) {
        if (!ratio) return;
        this.controller.style.setProperty('--mouse-percent', `${ratio * 100}%`);
    }

    startDragging(e) {
        if (!this.duration) return;

        if (e.type === 'touchstart') e.preventDefault();

        this.isDragging = true;
        this.wasPlayingBeforeDrag = !this.video.paused;
        this.player.main.play();
        this.video.pause();

        this.controller.classList.add('-drag');
        const progress = this.calculateProgress(this.getClientX(e));
        this.updateBarWidth(progress);
        this.updateThumb(progress * this.duration);

        window.addEventListener('mousemove', this.moveHandler);
        window.addEventListener('touchmove', this.moveHandler, { passive: false });
        window.addEventListener('mouseup', this.stopHandler);
        window.addEventListener('touchend', this.stopHandler);
    }

    drag(e) {
        if (!this.isDragging) return;

        // Предотвращаем стандартное поведение
        if (e.cancelable) e.preventDefault();

        const progress = this.calculateProgress(this.getClientX(e));
        requestAnimationFrame(() => {
            this.updateBarWidth(progress)
            this.updateThumb(progress * this.duration);
        });
    }

    stopDragging(e) {
        if (!this.isDragging) return;
        this.isDragging = false;

        this.controller.classList.remove('-drag');
        const finalX = e.changedTouches ? e.changedTouches[0].clientX : this.getClientX(e);
        const progress = this.calculateProgress(finalX);

        this.video.currentTime = progress * this.duration;
        this.log(`(Пользователь) Перемотка видео на: ${this.video.currentTime}`);

        if (this.wasPlayingBeforeDrag) {
            this.player.main.play();
        }

        window.removeEventListener('mousemove', this.moveHandler);
        window.removeEventListener('touchmove', this.moveHandler);
        window.removeEventListener('mouseup', this.stopHandler);
        window.removeEventListener('touchend', this.stopHandler);
    }

    formatTime(seconds) {
        seconds = Math.floor(seconds); // отбрасываем дробную часть
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        const twoDigits = (num) => num.toString().padStart(2, '0');

        if (h > 0) {
            return `${h}:${twoDigits(m)}:${twoDigits(s)}`;
        } else {
            return `${twoDigits(m)}:${twoDigits(s)}`;
        }
    }
}

export class Volume extends Component {
    setup() {
        this.dom = {
            btns: document.querySelectorAll('[data-type="volume-btn"]'),
            bars: document.querySelectorAll('[data-type="volume-slider"]'),
            value: document.querySelectorAll('[data-source="volume"]'),
            tags: document.querySelectorAll('[data-type="volume-tag"]'),
            close: document.getElementById('media-close-volume'),
            presets: document.getElementById('media-presets-volume')
        };

        this.interact = document.getElementById('media-volume-interactive');
        this.container = document.getElementById('media-volume-container');
        this.btn = document.getElementById('media-volume-btn');

        this.classList = ['v-100', 'v-50', 'v-0'];

        this.player.on(Player.Events.PLAY, this.handle(() => {
            this.updateMute();
        }, 'COMPONENT_MEDIUM'));

        this.player.on(Player.Events.VOLUME_CHANGE, this.handle(() => {
            this.updateMute();

            requestAnimationFrame(() => this.updateBarWidth(this.video.volume));

            this.dom.btns.forEach(element => {
                element.classList.remove(...this.classList);

                if (this.video.muted) {
                    element.classList.add('-mute');
                } else {
                    element.classList.remove('-mute');
                }

                if (this.video.volume < 0.2) {
                    element.classList.add(this.classList[2]);
                } else if (this.video.volume > 0.2 && this.video.volume < 0.5) {
                    element.classList.add(this.classList[1]);
                } else {
                    element.classList.add(this.classList[0]);
                }
            });
        }, 'COMPONENT_MEDIUM'));

        this.isDragging = false;
        this.dragElement = null;

        // Общие обработчики (для удаления)
        this.moveHandler = (e) => this.drag(e);
        this.stopHandler = (e) => this.stopDragging(e);

        this.updateBarWidth(this.video.volume);

        this.dom.bars.forEach(target => {
            // Логика перетаскивания
            // Десктопные события
            target.addEventListener('mousedown', this.handle((e) => this.startDragging(e), 'COMPONENT_LOW'));
            // Мобильные события
            target.addEventListener('touchstart', this.handle((e) => this.startDragging(e), 'COMPONENT_LOW'));
        });

        // Состояния громкости
        (() => {
            // Константы ключей
            const SESSION_KEY = 'tvolume_default';
            const LOCAL_KEY = 'tvolume_presets';

            // Загружаем данные
            const sessionVal = JSON.parse(sessionStorage.getItem(SESSION_KEY));
            const localPresets = JSON.parse(localStorage.getItem(LOCAL_KEY)) || {
                speakers: 0.5,
                headphones: 0.3
            };

            // Определяем, какой тип был выбран последним
            const currentType = sessionStorage.getItem('tvolume_active_type') ?? 'default';

            this.state = {
                type: currentType,
                value: currentType === 'default'
                    ? (sessionVal ?? 1)
                    : (localPresets[currentType] ?? 0.5)
            };

            this.log('Установка пресета для ролика:', this.state);

            // Метод для смены типа
            this.setPreset = (type) => {
                this.dom.presets.querySelector('.-select')?.classList.remove('-select');
                this.state.type = type;
                if (type === 'default') {
                    this.state.value = JSON.parse(sessionStorage.getItem(SESSION_KEY)) ?? 1;
                } else {
                    this.state.value = localPresets[type] ?? 0.5;
                }
                this.video.volume = this.state.value;
                sessionStorage.setItem('tvolume_active_type', type);
                this.dom.presets.querySelector(`.btn[data-id="${type}"]`)?.classList.add('-select');
            };

            let updateHandler = null;

            this.setPreset(this.state.type);

            this.player.on(Player.Events.VOLUME_CHANGE, this.handle(() => {
                clearTimeout(updateHandler);

                updateHandler = setTimeout(() => {
                    this.state.value = this.video.volume;
                    if (this.state.type === 'default') {
                        sessionStorage.setItem(SESSION_KEY, this.video.volume);
                    } else {
                        localPresets[this.state.type] = this.video.volume;
                        localStorage.setItem(LOCAL_KEY, JSON.stringify(localPresets));
                    }
                }, 400);
            }, 'COMPONENT_MEDIUM'));

            this.dom.presets.addEventListener('click', this.handle((e) => {
                /**@type {HTMLDivElement} */
                const btn = e.target.closest('.btn[data-id]');
                if (btn) {
                    const id = btn.dataset.id;
                    if (id === this.state.type) {
                        return this.setPreset('default');
                    }
                    return this.setPreset(id);
                }
            }, 'COMPONENT_MEDIUM'))
        })();
    }

    init() {
        this.btn.addEventListener('contextmenu', this.handle((e) => {
            e.preventDefault();
            if (this.player.device.isIOS) return;
            this.interact.classList.remove('-hide');
        }, 'COMPONENT_LOW'));

        (() => {
            let t;

            const cancel = () => {
                clearTimeout(t);
                window.removeEventListener('touchend', cancel);
            }

            this.btn.addEventListener('touchstart', this.handle(() => {
                if (this.player.device.isIOS) return;

                t = setTimeout(() => {
                    this.interact.classList.remove('-hide');
                    cancel();
                }, 1000);

                window.addEventListener('touchend', cancel);
            }, 'COMPONENT_LOW'));
        })();


        this.dom.btns.forEach(target => {
            target.addEventListener('click', this.handle(() => {
                if (this.video.muted) {
                    this.video.muted = false;
                } else {
                    this.video.muted = true;
                }
            }, 'COMPONENT_LOW'));
        });

        this.container.addEventListener('mouseenter', this.handle(() => {
            if (document.body.offsetWidth > 700 && !this.player.device.isIOS) {
                this.container.classList.add('-show');
            }
        }, 'COMPONENT_MEDIUM'));

        this.container.addEventListener('mouseleave', this.handle(() => {
            this.container.classList.remove('-show');
        }, 'COMPONENT_MEDIUM'));

        this.dom.close.addEventListener('click', this.handle(() => {
            this.interact.classList.add('-hide');
        }, 'COMPONENT_LOW'));
    }

    updateMute() {
        if (this.video.muted) {
            this.btn.classList.add('-mute');

            if (this.player.audioLocked) {
                this.dom.tags.forEach(el => {
                    el.textContent = 'live';
                    el.classList.add('-show');
                });
            } else {
                this.dom.tags.forEach(el => {
                    el.textContent = 'mute';
                    el.classList.add('-show');
                });
            }

        } else {
            this.dom.tags.forEach(el => {
                el.classList.remove('-show');
            });
        }
    }

    startDragging(e) {
        if (e.type === 'touchstart') e.preventDefault();

        this.isDragging = true;

        this.dragElement = e.currentTarget;
        this.video.volume = this.calculateProgress(this.getClientX(e));

        window.addEventListener('mousemove', this.moveHandler);
        window.addEventListener('mouseup', this.stopHandler);
    }

    drag(e) {
        if (!this.isDragging) return;

        // Предотвращаем стандартное поведение
        if (e.cancelable) e.preventDefault();

        const progress = this.calculateProgress(this.getClientX(e));
        this.video.volume = progress;
    }

    stopDragging(e) {
        if (!this.isDragging) return;
        this.isDragging = false;

        const finalX = e.changedTouches ? e.changedTouches[0].clientX : this.getClientX(e);
        const progress = this.calculateProgress(finalX);

        this.video.volume = progress;

        window.removeEventListener('mousemove', this.moveHandler);
        // window.removeEventListener('touchmove', this.moveHandler);
        window.removeEventListener('mouseup', this.stopHandler);
        // window.removeEventListener('touchend', this.stopHandler);
    }

    updateBarWidth(ratio) {
        this.video.volume = ratio;
        this.dom.value.forEach(el => {
            el.style.width = `${ratio * 100}%`;
        });
    }

    calculateProgress(clientX) {
        const rect = this.dragElement.getBoundingClientRect();
        const offset = clientX - rect.left;
        return Math.min(Math.max(0, offset / rect.width), 1);
    }

    getClientX(e) {
        return e.touches ? e.touches[0].clientX : e.clientX;
    }
}

export class Quality extends Component {
    static Events = {
        QUALITY_SELECT: 'qualityselected'
    }

    setup() {
        this.isAuto = false;
        this.quality = this.player.opts.requiredQuality;
        this.availbleQuality = [];

        this.template = {
            btn: document.getElementById('quality-btn'),
        };

        this.dom = {
            container: document.getElementById('media-quality-selectors'),
            values: document.querySelectorAll('[data-source="quality"]'),
            button: document.getElementById('media-qiality-button'),
            interact: document.querySelector('.interactive.quality-selector'),
            close: document.getElementById('media-close-quality')
        };

        this.auto(this.player.opts.autoQualitySelect);
    }

    init() {
        this.dom.values.forEach(element => {
            element.textContent = `${this.quality}p`
        });

        this.player.on(Player.Events.SOURCE_LOADED, this.handle((source) => {
            // Очистка dom от старых ресурсов качеств
            this.dom.container.replaceChildren();
            this.availbleQuality = source.getAvailableLabels();
            this.availbleQuality = this.availbleQuality.map(x => Number(x));

            this.tplCreateQuality('auto', -1, this.isAuto);

            this.log(`Доступны качества: ${JSON.stringify(this.availbleQuality)}`);

            this.availbleQuality.forEach((q) => {
                this.tplCreateQuality(`${q}p`, q);
            });
        }));

        this.dom.button.addEventListener('click', this.handle(() => {
            this.dom.interact.classList.remove('-hide');
        }));

        this.video.addEventListener('resize', this.handle(() => {
            if (this.isAuto) {
                const quality = this.detectQuality(this.video);

                this.log(`(Авто) Выбор качество: ${quality}`);

                this.dom.values.forEach(element => {
                    element.textContent = `${quality}p`
                });
            }
        }));

        this.dom.container.addEventListener('click', this.handle((e) => {
            /**@type {HTMLDivElement} */
            const btn = e.target.closest('.btn-quality');
            if (btn) {
                const value = Number(btn.dataset.id);
                this.changeQuality(value);
                this.dom.interact.classList.add('-hide');
            }
        }));

        this.dom.close.addEventListener('click', this.handle(() => {
            this.dom.interact.classList.add('-hide');
        }));
    }

    auto(value) {
        this.isAuto = value;

        if (this.isAuto) {
            this.dom.button.classList.add('-auto');
        } else {
            this.dom.button.classList.remove('-auto');
        }
    }

    tplCreateQuality(label, id, selected = false) {
        const clone = this.template.btn.content.cloneNode(true);
        const btn = clone.querySelector('.btn-quality');
        btn.querySelector('.text').textContent = label;
        btn.dataset.id = id;
        this.dom.container.appendChild(clone);

        if (selected) {
            btn.classList.add('-select');
        }
    }

    changeQuality(quality) {
        const isAuto = quality === -1;
        this.auto(isAuto);

        this.log(`(Пользовател) Выбор качество: ${quality}`);

        if (this.player.device.isHls) {
            if (this.player.opts.autoQualitySelect) {
                this.setPreferredQuality(this.player.hls, quality);
            } else {
                const time = this.video.currentTime;
                const onpaused = this.video.paused;

                this.player.on(Player.Events.LOAD_META_DATA, this.handle(() => {
                    this.video.currentTime = time;
                    if (!onpaused) this.player.main.play();
                }, 'COMPONENT_LOW'), { once: true });

                this.player.hls.loadSource(this.player.source.getBestMatch(quality));
            }
        } else {
            const time = this.video.currentTime;
            const onpaused = this.video.paused;

            this.player.on(Player.Events.LOAD_META_DATA, this.handle(() => {
                this.video.currentTime = time;
                if (!onpaused) this.player.main.play();
            }, 'COMPONENT_LOW'), { once: true });

            if (isAuto) {
                this.video.src = this.player.source.getSource(this.availbleQuality[0], { auto: true });
            } else {
                this.video.src = this.player.source.getBestMatch(quality);
            }
        }

        if (!isAuto) {
            this.dom.values.forEach(element => {
                element.textContent = `${quality}p`
            });
        }

        this.dom.container.querySelector('.-select')?.classList?.remove('-select');
        this.dom.container.querySelector(`[data-id="${quality}"]`).classList.add('-select');
    }

    setPreferredQuality(hls, targetHeight) {
        if (!hls.levels || !hls.levels.length) return;

        // авто режим
        if (targetHeight === -1) {
            hls.currentLevel = -1;
            return;
        }

        const levels = hls.levels;

        const sorted = levels
            .map((l, i) => ({ index: i, height: l.height }))
            .sort((a, b) => a.height - b.height);

        let selected = sorted[0];

        for (const level of sorted) {
            if (level.height <= targetHeight) {
                selected = level;
            } else {
                break;
            }
        }

        hls.currentLevel = selected.index;
    }

    detectQuality(video) {
        const h = video.videoHeight;
        let closest = this.availbleQuality[0];

        for (const q of this.availbleQuality) {
            if (Math.abs(q - h) < Math.abs(closest - h)) {
                closest = q;
            }
        }

        return closest;
    }
}