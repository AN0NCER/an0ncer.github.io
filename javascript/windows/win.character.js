import { TWindow } from "../core/window.core.js";
import { Jikan } from "../modules/api.jikan.js";
import { ACard } from "../modules/AnimeCard.js";
import { GraphQl } from "../modules/api.shiki.js";
import { Template } from "../modules/tun.template.js"
import { WindowIntercator } from "../modules/win.module.js";
import { Sleep } from "../modules/functions.js";
import { Popup } from "../modules/tun.popup.js";

const config = {
    tpl: 'win.character.tpl',
    css: 'win.character.css',
    ell: (id) => `.win-char-${id}`,
}

const list = {
    z: 300
};

export function WCharacter(id = 151295, { dom = 'body' } = {}) {
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
                    $dom.find('.window-title > .character-name').text(character.russian ? character.russian : data.name);
                    if (character.poster?.mainUrl) {
                        $dom.find('.character-preview > img').attr('src', character.poster?.mainUrl);
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
                    const $ell = $dom.find(`.gallery-wrapper-list > .gallery-character`);
                    for (const { jpg } of data) {
                        $ell.append(`<img src="${jpg.image_url}" loading="lazy">`)
                    }
                }).GET();
            }).GET();

            const window = new TWindow({
                oninit: () => {
                    $dom.find(`.window-close`).on('click', function () {
                        window.hide();
                    });

                    $dom.find(`.character-description-text > p`).on('click', 'a', function () {
                        const id = $(this).attr('data-id');
                        WCharacter(id);
                    });

                    $dom.find(`#all-description-character`).on('click', () => $dom.find('.character-description-text').removeClass('-hide'));
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