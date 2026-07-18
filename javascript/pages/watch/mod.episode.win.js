import { TWindow } from "../../core/window.core.js"
import { Template } from "../../modules/tun.template.js";
import { PullToClose, WindowIntercator } from "../../modules/win.module.js";

const config = {
    tpl: "win.episode.tpl",
    css: "win.episode.css",
    ell: () => '.window-episode'
};

const value = {
    count: 1,
    current: 1,
    onselect: () => { }
}

// const { promise: $MOD, resolve: modResolver } = Promise.withResolvers();
/**@type {undefined || Promise<TWindow>} */
let windowPromise = undefined;
let win = undefined;
let selected = undefined;

export function WEpisodes(count, current, { dom = 'body', onselect = () => { } } = {}) {
    value.count = count;
    value.current = current;
    value.onselect = onselect;

    if (windowPromise) return windowPromise;
    if (win) return win.show();

    windowPromise = new Promise(async (resolve) => {
        const $dom = await (async () => {
            $(dom).append((await Template(config.tpl))
                .html()
                .css(config.css, '/style/win/css')
                .text());
            return $(config.ell());
        })();

        let destroyTimeout = undefined;
        let showed = 0;

        win = new TWindow({
            oninit: () => {
                const input = $('#episode-jump-bar > input');

                input.on('input', (e) => {
                    if (!e.target.value) {
                        return e.target.classList.remove('-error');
                    }

                    const val = Number(e.target.value);

                    if (CheckEpisodeBad(val, value.count)) {
                        e.target.classList.add('-error');
                    } else {
                        e.target.classList.remove('-error');
                    }
                });

                input.on('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!input[0].value || CheckEpisodeBad(Number(input[0].value), value.count)) return;
                        SelectEpisode(input[0].value);
                        GlobalSelect(input[0].value, value.onselect, win);
                    }
                });

                $('#go-episode').on('click', () => {
                    if (!input[0].value || CheckEpisodeBad(Number(input[0].value), value.count)) return;

                    SelectEpisode(input[0].value);
                    GlobalSelect(input[0].value, value.onselect, win);
                })

                $('.episode-grid-list').on('click', '.episode', (e) => {
                    const raw = $(e.currentTarget)?.attr('data-index');
                    if (!raw) return;
                    const episode = Number(raw ?? 0);
                    SelectEpisode(episode);
                    GlobalSelect(episode, value.onselect, win);
                });

                $('.episode-bar > .window-close').on('click', () => {
                    win.hide();
                });
            },
            onshow: () => {
                clearTimeout(destroyTimeout);
                const dom = $('.episode-grid-list');

                if (showed === value.count) {
                    //Установить выбор эпизода
                    SelectEpisode(value.current);
                    return;
                }

                dom.empty();

                for (let i = 1; i < value.count + 1; i++) {
                    const html = `<div class="episode" data-index="${i}"><div class="episode-wrapper">${i}<span class="ep-name">EP</span></div></div>`;
                    dom.append(html);
                }

                SelectEpisode(value.current);
            },
            onhide: () => {
                clearTimeout(destroyTimeout);

                //Уничтожение окна после бездействия
                destroyTimeout = setTimeout(() => {
                    win.destroy();
                    win = undefined;
                    windowPromise = undefined;
                }, 2000);
            },
            animate: {
                animshow: () => {
                    SelectEpisode(value.current);
                }
            }
        }, config.ell());

        win.module.add(WindowIntercator);
        win.module.add(PullToClose, { scroll: '.episode-list-wrapper > .grid-wrapper-list' })
        win.show();

        windowPromise = undefined;
    });
}

function CheckEpisodeBad(episode, count) {
    return episode <= 0 || episode > count
}

function SelectEpisode(episode) {
    if (selected) {
        selected.removeClass('-select');
    }

    selected = $(`.episode-grid-list > .episode[data-index="${episode}"]`).addClass('-select');

    selected[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function GlobalSelect(episode, callback, win) {
    if (episode && callback){
        callback(episode, win);
    }
}