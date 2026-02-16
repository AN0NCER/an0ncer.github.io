import { TWindow } from "../core/window.core.js";
import { Jikan } from "../modules/api.jikan.js";
import { ACard } from "../modules/AnimeCard.js";
import { Favorites, GraphQl } from "../modules/api.shiki.js";
import { Template } from "../modules/tun.template.js"
import { WindowIntercator } from "../modules/win.module.js";
import { ScrollElementWithMouse, Sleep } from "../modules/functions.js";
import { Popup } from "../modules/tun.popup.js";
import { animate } from "../library/anime.esm.min.js";
import { Tunime } from "../modules/api.tunime.js";
import { OAuth } from "../core/main.core.js";

const config = {
    key: "user-favorites",
    tpl: 'win.character.tpl',
    css: 'win.character.css',
    ell: (id) => `.win-char-${id}`,
}

const list = {
    z: 300
};

export function WCharacter(id, { dom = 'body', onadd = (id, { x = 0, y = 0, img }) => { }, onremove = () => { }, onhide = () => { } } = {}) {
    const img = {
        is_default: true,
        default: '/images/noimage/character.png',
        selected: null
    }

    let favorite = false;
    let name = "Персонаж";
    id = parseInt(id);

    return new Promise(async (resolve) => {
        try {
            if (list[id]) {
                list[id].show();
                return resolve(id);
            }

            const $dom = await (async (id) => {
                list.z = list.z + 1;
                $(dom).append((await Template(config.tpl)).html({ id, z: list.z }).css(config.css, '/style/win/css').text());
                return $(config.ell(id));
            })(id);

            Jikan.characters.getCharacterFullById(id, async ({ data }) => {
                characterCount($dom, {
                    anime: data.anime.length,
                    manga: data.manga.length,
                });

                const list = {
                    main: data.anime.filter(x => x.role === "Main").map(x => x.anime.mal_id),
                    ids: data.anime.map(x => x.anime.mal_id)
                }

                Load(id, list.ids).then(({ animes, characters }) => {
                    if (characters.length === 0) {
                        throw new Error('Герой не найден')
                    }

                    const character = characters[0];
                    name = character.russian ? character.russian : data.name;
                    $dom.find('.window-title > .character-name').text(name);
                    if (character.poster?.mainUrl) {
                        img.default = character.poster?.mainUrl;
                        $dom.find('.character-preview > img').attr('src', img.default);
                    }

                    if (character.description || data.about) {
                        $dom.find('.character-description-text > p').append(render(parseBB(character.description || data.about)));
                        descriptionUpdiate($dom);
                    } else {
                        $dom.find('.character-description-text').removeClass('-hide');
                    }

                    showAnimes($dom, { animes, main: list.main });
                    showStudios($dom, { animes })

                    resolve(id);
                    window.show();
                })

                Jikan.characters.getCharacterPictures(id, async ({ data }) => {
                    if (data.length <= 1) return;

                    const $ell = $dom.find(`.gallery-wrapper-list > .gallery-character`);
                    for (const { jpg } of data) {
                        $ell.append(`<div class="gallery-img"><img src="${jpg.image_url}" loading="lazy"><span>Выбрано</span></div>`);
                    }

                    $dom.find(`.character-gallery-wrapper`).removeClass('-hide');
                }).GET();
            }).GET();

            const window = new TWindow({
                oninit: () => {
                    (({ process = false } = {}) => {
                        $dom.find('.btn-character-favorite').on('click', () => {
                            if (process) return;
                            else process = true;

                            let handler = openWindowEditor;

                            if (favorite) {
                                handler = removeFromFavorites;
                            }

                            handler($dom).then(() => {
                                process = false;
                            });
                        });

                        $dom.find(`.btn-install`).on('click', function () {
                            if (process || !favorite) return;
                            else process = true;

                            openWindowEditor($dom).then(() => {
                                process = false;
                            });
                        });
                    })();


                    $dom.find(`.window-close`).on('click', function () {
                        window.hide();
                    });

                    $dom.find(`.character-description-text > p`).on('click', 'a', function () {
                        const id = $(this).attr('data-id');
                        WCharacter(id);
                    });

                    $dom.find(`#all-description-character`).on('click', () => $dom.find('.character-description-text').removeClass('-hide'));

                    ScrollElementWithMouse($dom.find('.gallery-wrapper-list'));
                    ScrollElementWithMouse($dom.find('.main-role-list'));
                    ScrollElementWithMouse($dom.find('.sup-role-list'));
                    ScrollElementWithMouse($dom.find('.pv-role-list'));
                    ScrollElementWithMouse($dom.find('.character-studios'));

                    (() => {
                        let isBlocked = !$SHADOW.state.permissions.includes('acc');

                        Tunime.help.hasAccount().then((value) => {
                            isBlocked = !value;
                        })

                        // Константы
                        const MOBILE_BREAKPOINT = 725;
                        const SCROLL_OFFSET = 400; // 400 + 10
                        const ANIMATION_DURATION = 300;
                        const SCROLL_THRESHOLD = 540;

                        // Состояние компонента
                        const state = {
                            isMobile: false,
                            isSelected: false,
                            isTipShown: false
                        };

                        // DOM элементы
                        const elements = {
                            gallery: $dom.find('.gallery-wrapper-list'),
                            galleryWrapper: $dom.find('.character-gallery-wrapper'),
                            previewImg: $dom.find('.selector-character-preview > .image > img'),
                            tipsWrapper: $dom.find('.select-character-tips-wrapper'),
                            contentWrapper: $dom.find('.content-wrapper')
                        };

                        /**
                         * Проверяет, является ли текущий экран мобильным
                         */
                        function updateMobileState() {
                            state.isMobile = elements.contentWrapper.width() <= MOBILE_BREAKPOINT;
                        }

                        /**
                         * Скроллит галерею в указанном направлении
                         */
                        function scrollGallery(direction) {
                            const currentScroll = elements.gallery.scrollLeft();
                            const scrollDelta = direction === 'right' ? SCROLL_OFFSET : -SCROLL_OFFSET;

                            elements.gallery[0].scrollTo({
                                left: currentScroll + scrollDelta,
                                behavior: 'smooth'
                            });
                        }

                        /**
                         * Показывает подсказку с анимацией
                         */
                        function showTips() {
                            // Получаем размеры подсказки
                            elements.tipsWrapper.css('display', 'block');
                            const { width, height } = elements.tipsWrapper[0].getBoundingClientRect();
                            elements.tipsWrapper.css('display', '');

                            // Настройки анимации
                            const animationConfig = {
                                duration: ANIMATION_DURATION,
                                easing: 'easeInOutQuad',
                                onBegin: () => {
                                    elements.tipsWrapper.css('display', 'block');
                                },
                                onComplete: () => {
                                    elements.tipsWrapper.css({ width: '', height: '' });
                                }
                            };

                            // Анимируем по ширине или высоте в зависимости от размера экрана
                            animationConfig[state.isMobile ? 'height' : 'width'] =
                                `${state.isMobile ? height : width}px`;

                            animate(elements.tipsWrapper[0], animationConfig);
                            elements.galleryWrapper.addClass('-tip');

                            // Включаем или отключаем кнопку "Установить"
                            if (favorite) {
                                elements.tipsWrapper.removeClass('-disable');
                            } else {
                                elements.tipsWrapper.addClass('-disable');
                            }
                        }

                        /**
                         * Скрывает подсказку с анимацией
                         */
                        function hideTips() {
                            const animationConfig = {
                                duration: ANIMATION_DURATION,
                                easing: 'easeInOutQuad',
                                onComplete: () => {
                                    elements.galleryWrapper.removeClass('-tip');
                                    elements.tipsWrapper.css({ display: '', width: '', height: '' });
                                }
                            };

                            animationConfig[state.isMobile ? 'height' : 'width'] = '0px';
                            animate(elements.tipsWrapper[0], animationConfig);
                        }

                        /**
                         * Обрабатывает выбор изображения
                         */
                        function selectImage($clickedImg) {
                            const imgSrc = $clickedImg.find('img').attr('src');

                            img.selected = imgSrc;
                            img.is_default = false;
                            elements.previewImg.attr('src', imgSrc);
                            $clickedImg.addClass('-sel');

                            state.isSelected = true;
                        }

                        /**
                         * Снимает выбор изображения
                         */
                        function deselectImage() {
                            img.selected = img.default;
                            img.is_default = true;
                            state.isSelected = false;
                        }

                        /**
                         * Обрабатывает необходимость скролла при выборе
                         */
                        function handleScrollOnSelect($clickedImg) {
                            const { left, width } = $clickedImg[0].getBoundingClientRect();

                            if (left > SCROLL_THRESHOLD && !state.isMobile) {
                                const scrollLeft = elements.gallery.scrollLeft();
                                elements.gallery[0].scrollTo({
                                    left: scrollLeft + left + width - (elements.gallery.width() - SCROLL_OFFSET),
                                    behavior: 'smooth'
                                });
                            }
                        }

                        /**
                         * Обрабатывает необходимость скролла при отмене выбора
                         */
                        function handleScrollOnDeselect() {
                            const currentScroll = elements.gallery.scrollLeft();

                            if (currentScroll > SCROLL_THRESHOLD && !state.isMobile) {
                                scrollGallery('left');
                            }
                        }

                        /**
                         * Главный обработчик клика по изображению
                         */
                        function handleImageClick() {
                            if (isBlocked) return;
                            const $clickedImg = $(this);
                            const wasSelected = $clickedImg.hasClass('-sel');

                            updateMobileState();

                            // Убираем выделение со всех изображений
                            $dom.find('.gallery-img').removeClass('-sel');

                            // Если кликнули на уже выбранное изображение - снимаем выбор
                            if (wasSelected) {
                                deselectImage();
                            } else {
                                selectImage($clickedImg);
                            }

                            // Управление подсказкой
                            if (!state.isTipShown && state.isSelected) {
                                showTips();
                                handleScrollOnSelect($clickedImg);
                                state.isTipShown = true;
                            } else if (!state.isSelected && state.isTipShown) {
                                hideTips();
                                handleScrollOnDeselect();
                                state.isTipShown = false;
                            }
                        }

                        // Инициализация обработчика событий
                        $dom.find('.gallery-character').on('click', '.gallery-img', handleImageClick);
                    })();
                },
                onhide,
                onshow: () => {
                    const local = JSON.parse(localStorage.getItem(config.key) || '{}');
                    const $btn = $dom.find('.btn-character-favorite');
                    favorite = local?.Character && local.Character[id];

                    if (favorite) {
                        $btn.addClass('-fav');
                    }
                },
                animate: {
                    animhide: () => {
                        window.destroy();
                        delete list[id];
                    }
                }
            }, config.ell(id));

            window.module.add(WindowIntercator);
            list[id] = window;
        } catch (err) {
            new Popup('wcharacter_error', 'Ошибка загрузки персонажа');
            console.log(err);
            delete list[id];
            resolve(null);
        }
    });

    async function addToFavorites($dom, { x = 0, y = 0 } = {}) {
        const raw = await Favorites.favorites("Character", id).POST();

        if (raw.failed) {
            if (raw.status == 429) {
                await Sleep(1000);
                return addToFavorites($dom);
            }
            new Popup('favorites', 'Произошла ошибка.', list.z + 1);
            return false;
        }

        if (raw.success) {
            favorite = true;

            try {
                $dom.find('.btn-character-favorite').addClass('-fav');

                const local = JSON.parse(localStorage.getItem(config.key) || '{}');
                local.Character = { ...local.Character, [id]: { date: new Date().toISOString() } };
                localStorage.setItem(config.key, JSON.stringify(local));
            } catch (err) {
                console.log(err);
            }

            onadd(id, { img: img.selected, x, y });
            return true;
        }

        return false;
    }

    async function removeFromFavorites($dom) {
        const raw = await Favorites.favorites("Character", id).DELETE();

        if (raw.failed) {
            if (raw.status == 429) {
                await Sleep(1000);
                return removeFromFavorites($dom);
            }
            new Popup('favorites', 'Произошла ошибка...', list.z + 1);
            return false;
        }

        if (raw.success) {
            favorite = false;

            try {
                $dom.find('.btn-character-favorite').removeClass('-fav');

                const local = JSON.parse(localStorage.getItem(config.key) || '{}');
                delete local.Character?.[id];
                localStorage.setItem(config.key, JSON.stringify(local));

                Tunime.help.hasAccount().then((value) => {
                    if (value) {
                        Tunime.api.user(OAuth.user.id).DELETE({ character: [id] });
                    }
                })

            } catch (err) {
                console.log(err);
            }

            onremove(id);
        }

        new Popup('favorites', raw.notice, list.z + 1);
    }

    function openWindowEditor($dom) {
        const handlers = {
            close: async (value) => {
                await addToFavorites($dom);
                $dom.find('.gallery-img.-sel').click()
            },

            complete: async (value) => {
                const isAdded = await addToFavorites($dom, value);

                if (!isAdded) return;

                const body = {
                    character: { id, ...value }
                };

                if (!img.is_default) {
                    body.character.img = img.selected;
                }

                if (value.x === 0 && value.y === 0) {
                    delete body.character.x;
                    delete body.character.y;
                }

                $dom.find('.gallery-img.-sel').click()

                if ((!body.character.x && !body.character.y) && !body.character.img) return;

                const raw = await Tunime.api.user(OAuth.user.id).PATCH(body);

                if (raw.parsed && raw.value.data.error.count > 0) {
                    new Popup('character_edit', 'Произошла ошибка.', list.z + 1);
                }
            },

            cancel: async (value) => {
                $dom.find('.gallery-img.-sel').click();
            }
        }

        if (img.selected === null) {
            //Если не присутсвует изображение для персонажа
            if (img.default === '/images/noimage/character.png') {
                return handlers.disable();;
            }

            img.selected = img.default;
        }

        return new Promise((resolve) => {
            import('../windows/win.editor.character.js').then(({ WCharacterEditor }) => {
                WCharacterEditor(img.selected, { z: list.z + 1, title: name }).then(({ type, value }) => {
                    if (handlers[type]) {
                        return resolve(handlers[type](value));
                    }
                    resolve();
                });
            }).catch((err) => {
                // $dom.find('.gallery-img.-sel').click();
                console.log(err);
                resolve();
            });
        });
    }

    function selectTable($dom, type) {
        return $dom.find(`.character-role-wrapper > div[data-type="${type}"]`);
    }

    function characterCount($dom, { anime, manga } = {}) {
        const $ell = $dom.find('.window-title > .character-source').empty();
        $ell.append(`<span class="val">${anime} Аниме</span>`).append(`<div class="point"></div>`).append(`<span class="val">${manga} ${manga == 1 ? "Манга" : "Манги"}</span>`);
    }

    function descriptionUpdiate($dom) {
        $dom.css('display', 'block');
        const $a = $dom.find('.window-content');
        $a.css('display', 'block');
        const height = $dom.find(`.character-description-text`).height();
        $dom.css('display', '');
        $a.css('display', '');

        if (height < 350) {
            $dom.find('.character-description-text').removeClass('-hide');
        }
    }

    function showAnimes($dom, { animes, main } = {}) {

        const criteria = (anime) => anime.kind === "pv";

        const { suitable, unsuitable } = animes.reduce((acc, currentItem) => {
            if (criteria(currentItem)) {
                acc.suitable.push(currentItem); // Добавляем в подходящие
            } else {
                acc.unsuitable.push(currentItem); // Добавляем в неподходящие
            }
            return acc;
        }, { suitable: [], unsuitable: [] });

        const count = ((count = { supp: 0, main: 0, pv: 0 }) => {
            const $main = $dom.find('.main-role-character');
            const $sup = $dom.find('.sup-role-character');
            const $pv = $dom.find('.pv-role-character');

            for (const anime of unsuitable) {
                if (main.includes(Number(anime.id))) {
                    count.main++;
                    $main.append(ACard.GenV2({ type: "a", anime }));
                } else {
                    count.supp++;
                    $sup.append(ACard.GenV2({ type: "a", anime }))
                }
            }

            for (const anime of suitable) {
                $pv.append(ACard.GenV2({ type: "a", anime }));
            }

            return count;
        })({ supp: 0, main: 0, pv: suitable.length });

        $dom.find(`.role[data-type="main"] > .count`).text(count.main);
        $dom.find(`.role[data-type="supp"] > .count`).text(count.supp);
        $dom.find(`.role[data-type="pv"] > .count`).text(count.pv);

        (() => {
            if (count.main === 0 && count.supp === 0 && count.pv === 0) {
                return $dom.find('.character-role-selector-wrapper').remove();
            }

            const type = count.main > 0 ? "main" : count.supp > 0 ? "supp" : "pv";

            const $current = selectTable($dom, type);
            $dom.find(`.character-role-selector`).on('click', '.role', function () {
                const $ell = $(this);
                const type = $ell.attr('data-type');

                if (count[type] === 0) {
                    return;
                }

                const $current = selectTable($dom, type);
                $dom.find(`.character-role-wrapper > div`).addClass('-hide');
                $current.removeClass('-hide');
                $dom.find(`.character-role-selector > div`).removeClass('-sel');
                $ell.addClass('-sel');
            });

            $current.removeClass('-hide');
            $dom.find(`.character-role-selector > div[data-type="${type}"]`).addClass('-sel');
        })();
    }

    function showStudios($dom, { animes } = {}) {
        const map = new Map();

        animes.forEach(({ studios }) => {
            for (const studio of studios) {
                if (map.has(studio.id)) {
                    map.get(studio.id).count++;
                } else {
                    map.set(studio.id, { ...studio, count: 1 });
                }
            }
        });

        const $ell = $dom.find('.character-studios > .marquee__track').empty();
        const items = [];

        map.forEach(({ id, imageUrl, name, count }) => {
            items.push(`<a href="search.html?s=${id}">${imageUrl ? `<img src="${imageUrl}" alt="${name}">` : ""}<span><div class="name">${name}</div><div class="count">${count} Аниме</div></span></a>`);
        });

        $ell.append(items.join('<span class="line"></span>'));
    }
}

async function Load(id, anime_ids = []) {
    const root = {
        characters: {
            args: { ids: [id], limit: 1 },
            fields: ["id", "russian", "description", { poster: ["mainUrl"] }]
        }
    }

    if (anime_ids.length !== 0) {
        root.animes = {
            args: { ids: anime_ids, limit: anime_ids.length },
            fields: ["id", "russian", "score", "kind", { poster: ["mainUrl"] }, { airedOn: ["year", "date"] }, { studios: ["id", "imageUrl", "name"] }]
        }
    }

    const response = await GraphQl.query(root).POST();

    if (response.failed) {
        if (response.status === 429) {
            await Sleep(1000);
            return Load(id, anime_ids);
        }

        return null;
    }

    if (!response.data.animes) {
        response.data.animes = [];
    }

    return response.data;
}

function parseBB(text) {
    let i = 0;

    function parseNodes(stopTag) {
        const nodes = [];

        while (i < text.length) {
            // Закрывающий тег
            if (text.startsWith('[/',
                i)) {
                const end = text.indexOf(']', i);
                const name = text.slice(i + 2, end);
                if (name === stopTag) {
                    i = end + 1;
                    break;
                }
            }

            // Открывающий тег
            if (text[i] === '[') {
                const end = text.indexOf(']', i);
                const raw = text.slice(i + 1, end);

                const [name, attr] = raw.split('=');
                i = end + 1;

                const children = parseNodes(name);

                nodes.push({
                    type: 'tag',
                    name,
                    attr: attr ?? null,
                    children
                });

                continue;
            }

            // Текст
            let start = i;
            while (i < text.length && text[i] !== '[') i++;

            nodes.push({
                type: 'text',
                value: text.slice(start, i)
            });
        }

        return nodes;
    }

    return parseNodes(null);
}

const handlers = {
    character: ({ attr, content }) =>
        `<a class="character" data-id="${attr}">${content}</a>`,

    spoiler: ({ attr, content }) =>
        `<details class="spoiler">
            <summary>${attr ?? 'Спойлер'}</summary>
            ${content}
         </details>`
};

function render(nodes,) {
    return nodes.map(node => {
        if (node.type === 'text') return node.value;

        const inner = render(node.children, handlers);

        const handler = handlers[node.name];
        if (!handler) return inner;

        return handler({
            attr: node.attr,
            content: inner
        });
    }).join('');
}