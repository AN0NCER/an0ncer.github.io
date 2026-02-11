import { OAuth } from "../core/main.core.js";
import { TWindow } from "../core/window.core.js";
import { Users } from "../modules/api.shiki.js";
import { Tunime } from "../modules/api.tunime.js";
import { Sleep } from "../modules/functions.js";
import { Popup } from "../modules/tun.popup.js";
import { Template } from "../modules/tun.template.js"
import { WindowIntercator } from "../modules/win.module.js";

const config = {
    tpl: 'win.rooms.create.tpl',
    css: 'win.rooms.create.css',
    ell: '.window-users-search',
    /**@type {TWindow} */
    win: null
}

const event = {
    onCreate: () => { }
}

let idsMap = new Map();

export function WUsers({ dom = 'body',
    oncreate = () => { }
} = {}) {
    event.onCreate = oncreate;

    if (config.win) {
        document.querySelector(config.ell).querySelector('.users-search-search-wrapper > input').value = "";
        document.querySelector(config.ell).querySelectorAll('.-select').forEach(e => {
            e.classList.remove('-select');
        });
        idsMap = new Map();
        return config.win.show();
    };

    return new Promise(async (resolve) => {
        const $dom = await (async () => {
            $(dom).append((await Template(config.tpl)).css(config.css, '/style/win/css').text());
            return $(config.ell)[0];
        })();

        const parameters = {
            canPause: $dom.querySelector('#allow-pause')
        }

        parameters.canPause.checked = $PARAMETERS.rooms.roomsautopause;

        const host = $dom.querySelector('.users-search-grid-list');
        const tplCard = $dom.querySelector('#tpl-user-card');
        const tplEmpty = $dom.querySelector('#tpl-card-empty');

        await Load(host, { tplCard, tplEmpty, dom: $dom });

        config.win = new TWindow({
            oninit: () => {
                $dom.querySelector('.btn-new').addEventListener('click', () => {
                    let access = 'public';

                    if (idsMap.size > 0) {
                        access = 'friends';
                    }

                    event.onCreate(idsMap, access, {
                        canPause: parameters.canPause.checked
                    });

                    config.win.hide();
                });

                $dom.querySelector('.btn')
            }
        }, config.ell);
        config.win.module.add(WindowIntercator);
        config.win.show();
    });
}

async function Load(host, { tplCard, tplEmpty, dom }) {
    const fetch = async () => {
        const response = Users.friends(OAuth.user.id, { limit: 100 }).GET();
        if (response.failed) {
            if (response.status === 426) {
                await Sleep(1000);
                return fetch();
            }
            new Popup('fetch', 'Проихошла ошибка при получение друзей');
            return [];
        }
        return response;
    };

    const input = dom.querySelector('.users-search-search-wrapper > input');

    const update = async () => {
        if (idsMap.size > 0) {
            input.value = `Выбрано ${idsMap.size} пользователей`;
        } else {
            input.value = '';
        }
    }

    const users = await fetch();

    if (!users || users.length === 0) {
        /**@type {HTMLTemplateElement} Копированный шаблон */
        const fragment = tplEmpty.content.cloneNode(true);
        host.append(fragment);
    }

    for (const user of users) {
        if (!user || user.id === OAuth.user.id) continue;

        /**@type {HTMLTemplateElement} Копированный шаблон */
        const fragment = tplCard.content.cloneNode(true);
        /**@type {HTMLDivElement} Редактируеммый элемент */
        const root = fragment.firstElementChild;

        root.setAttribute('data-id', user.id);
        root.querySelector('[data-field="username"]').textContent = user.nickname;
        root.querySelector('[data-field="image"]').style.setProperty('--img', `url(${user.image['x64']})`);

        root.querySelector('.btn-select')
            .addEventListener('click', (e) => {
                if (idsMap.has(user.id)) {
                    idsMap.delete(user.id);
                    e.currentTarget.classList.remove('-select');
                } else {
                    idsMap.set(user.id, {
                        id: user.id,
                        image: user.image['x64'],
                        nickname: user.nickname
                    });
                    e.currentTarget.classList.add('-select');
                }
                update();
            });

        host.append(fragment);
    }


    if (users.length > 0) {
        const type = {
            'user': { i: 'tunime', c: 'app' },
            'dev': { i: 'code', c: 'dev' },
        }

        Tunime.api.users((response) => {
            if (!response.complete || !response.parsed) return;

            const { data } = response.value;

            for (const id in data) {
                /**@type {HTMLDivElement} */
                const card = host.querySelector(`.user-card[data-id="${id}"]`);
                if (!card) continue;

                const uo = card.querySelector('[data-field="useronline"]');
                uo.classList.add('-app');
                card.classList.add('-app', `-${data[id].type}`);

                if (data[id].state) {
                    uo.classList.add('-online');
                    uo.textContent = 'В сети';
                }

                const t = type[data[id].type];
                if (t) {
                    card.querySelector('[data-field="usertags"]').insertAdjacentHTML('afterbegin', `<div class="tag -${data[id].type}" data-field="usertags"><div class="ticon i-${t.i}"></div> ${t.c}</div>`);
                }

                card.querySelector('[data-field="tuntype"]').textContent = data[id].tag;
            }
        }).GET(users.map(x => x.id));
    }
}