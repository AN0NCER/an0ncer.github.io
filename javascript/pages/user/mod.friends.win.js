import { OAuth } from "../../core/main.core.js";
import { TWindow } from "../../core/window.core.js";
import { Friends, Users } from "../../modules/api.shiki.js";
import { Sleep } from "../../modules/functions.js";
import { LazyLoad, PullToClose, WindowIntercator } from "../../modules/win.module.js";
import { IOFriends } from "./io.friends.js";
import { TAppFriends, TFriends, timeAgo } from "./mod.friends.js";

const _window = {
    oninit: function () {
        $('.friends-bar').on('click', '.window-close', () => {
            TFriends.win.window.hide();
        });

        $('.friends-search-wrapper > .btn').on('click', () => {
            const value = $('.friends-search-wrapper > input').val();
            if (value.length > 0) {
                $('.friends-search-wrapper > input').val('')
                TFriends.win.f.clear();
                TFriends.win.clearsearch();
            } else {
                TFriends.win.search(value);
            }
        })

        $('.friends-search-wrapper > input').on('keyup', (e) => {
            let value = e.currentTarget.value;
            if (e.which == 13) {
                if (value.length <= 0) {
                    return;
                }
                TFriends.win.newsearch(value);
            }
            if (value.length > 0) {
                TFriends.win.f.filter(value);
            } else {
                TFriends.win.f.clear();
                TFriends.win.clearsearch();
            }
        });

        const $group = $(`.friends-list, .friends-results-list`)
        $group.on('click', '.friend-wrapper', function () {
            const id = $(this).attr('data-id');
            window.location.href = `user.html?id=${id}`;
        });

        $group.on('click', '.btn-control.-rem', function () {
            const id = $(this).attr('data-id');
            Friends.friends(id, (response) => {
                IOFriends.removeFriend(Number(id));
                if (TFriends.userId !== null) {
                    TFriends.cache.delete("requests", `user-${OAuth.user.id}-friends`);
                }

                $(this).removeClass('-rem').addClass('-add');
            }).DELETE();
        })

        $group.on('click', '.btn-control.-add', function () {
            const $btn = $(this);
            const id = $btn.attr('data-id');

            Friends.friends(id, () => {
                IOFriends.addFriend(Number(id));
                $btn.removeClass('-add').addClass('-rem');

                //Если он в списке .friends-results-list то нужно перенести его в .friends-list
                if ($btn.closest('.friends-results-list').length) {
                    //Удалить пользователя если он есть в списке друзей
                    $('.friends-wrapper > .friends-list').find(`.friend-wrapper[data-id="${id}"]`).closest('.friend').remove();
                    const $friendElement = $btn.closest('.friend');
                    $friendElement.appendTo('.friends-wrapper > .friends-list');
                }
            }).POST();
        });
    },
    onshow: function () {
    }
}

class UserFilter {
    constructor() {
        this.isFilter = false;
        this.query = '';
    }

    filter(query) {
        query = query.toLowerCase();
        if (this.query === query || query.length === 0) return;
        this.clear();
        this.query = query;

        const $list = $('.friends-wrapper > .friends-list');

        //Нужно получить все имена которые уже отображаются в списке друзей и скрыть те которые не подходят под фильтр
        $list.children('.friend').each((index, element) => {
            const $element = $(element);
            const name = $element.find('.friend-wrapper .title-wrapper .title').text().toLowerCase();

            if (name.includes(this.query)) {
                $element.removeClass('-hide');
            } else {
                $element.addClass('-hide');
            }
        });
    }

    clear() {
        $('.friends-wrapper > .friends-list > .friend.-hide').removeClass('-hide');
    }
}

class UserSearch {
    constructor() {
        this.isSearch = false;
        this.query = '';
        this.page = 1;
        this.end = false;
    }

    search(query) {
        if (this.query === query || query.length === 0) return;
        this.isSearch = true;
        this.query = query;
        this.page = 1;
        this.end = false;

        return new Promise((resolve) => {
            this.#request().then((data) => {
                resolve(data);
            });
        });
    }

    clear() {
        this.isSearch = false;
        this.query = '';
        this.page = 1;
        this.end = false;
    }

    #request() {
        const $btn = $('.friends-search-wrapper > .btn');
        return new Promise((resolve) => {
            $btn.addClass('-load');
            Users.list({ search: this.query, page: this.page, limit: 20 }, async (response) => {
                if (response.error) {
                    if (response.code === 426) {
                        await Sleep(1000);
                        return this.#request();
                    }
                    console.error('Error User Search:', response);
                    $btn.removeClass('-load');
                    return resolve([]);
                }
                if (response.length < 20) {
                    this.end = true;
                }
                $btn.removeClass('-load');
                resolve(response);
            }).GET();
        });
    }

    async next() {
        if (this.end) {
            return Promise.resolve([[], this.page, this.end]);
        }

        this.page += 1;
        const data = await this.#request();
        return [data, this.page, this.end];
    }
}

export const WFriends = class {
    constructor() {
        this.inited = false;
        this.window = new TWindow(_window, '.window-friends');
        this.search = new UserSearch();
        this.f = new UserFilter();

        (() => {
            //Подгрузка модулей окна
            this.window.module.add(WindowIntercator);
            this.window.module.add(PullToClose, { scroll: '.content-friends > .content-wrapper' });
            this.window.module.add(LazyLoad, { sentinel: '.friends-sentinel', callback: this.onload.bind(this) })
        })();
    }

    clearsearch() {
        this.search.clear();
        const $list = $('.friends-result-wrapper > .friends-results-list');
        $('.friends-result-wrapper').addClass('-hide');
        $('.friends-search-wrapper > .btn').removeClass('-rem');

        $list.empty();
    }

    newsearch(query) {
        this.search.search(query).then(async (value) => {
            if (value.length === 0) {
                return;
            }
            $('.friends-search-wrapper > .btn').addClass('-rem');
            const $list = $('.friends-result-wrapper > .friends-results-list');
            $list.empty();

            this.#user_status(value.map(v => v.id), '.friends-result-wrapper > .friends-results-list');

            for (const user of value) {
                $list.append(await TFriends.gen(user));
            }

            $('.friends-result-wrapper').removeClass('-hide');
        });
    }

    onload() {
        const plug = async ([value, page, end], list) => {
            const $list = $(list);

            this.#user_status(value.map(v => v.id), list);

            for (const user of value) {
                //Если при прогрузке встречаются повторки, то не добавлять их
                if ($list.find(`.friend-wrapper[data-id="${user.id}"]`).length)
                    continue;
                $list.append(await TFriends.gen(user));
            }
        };

        if (this.search.isSearch) {
            if (this.search.end) return;

            return this.search.next().then((value) => plug(value, '.friends-result-wrapper > .friends-results-list'));
        }

        if (IOFriends.sentinel.loaded) return;

        TFriends.req.next().then((value) => plug(value, '.friends-wrapper > .friends-list'));
    }

    show(id) {
        if (this.inited) {
            return this.window.show();
        }

        TFriends.on('init', async (value) => {
            const $list = $('.friends-wrapper > .friends-list');
            $list.empty();
            if (value.length === 0) {
                $list.append(this.#empty());
            } else {
                for (const user of value) {
                    $list.append(await TFriends.gen(user));
                }

                this.#user_status(value.map(v => v.id));
            }
            this.inited = true;
            this.window.show();
        }, { once: true, replay: true });
    }

    #user_status(ids, list = '.friends-wrapper > .friends-list') {
        TAppFriends.getIds(ids).then((statuses) => {
            const icons = {
                'user': ['tunime', 'app'],
                'dev': ['code', 'dev']
            }

            for (const key in statuses) {
                if (!Object.hasOwn(statuses, key) || Object.keys(statuses[key]).length === 0) continue;

                const status = statuses[key];
                const [icon, type] = icons[status.type] || ['tunime', 'app'];

                const $element = $(`${list} > .friend > .friend-wrapper[data-id="${key}"]`);

                $element.find(".title-wrapper").prepend(`<div class="tag -${status.type}"><div class="ticon i-${icon}"></div>${type}</div>`);
                $element.find(".description").text(status.tag).addClass('-app');

                const $online = $element.find('.online-wrapper');

                if (status.state) {
                    $online.text('В сети').addClass('-app');
                } else {
                    $online.text(`Онлайн: ${timeAgo(new Date(status.lastSeen))}`);
                }
            }
        });
    }

    #empty() {
        const nickname = $('.user-nickname > h1').text(); //TODO: Переделать получение пользовательского никнейма
        return `<div class="empty-friend"><div class="text"><div class="ticon i-list"></div>Список пуст</div><div class="tag">На данный момент у пользователя&nbsp;${nickname}<br />нет добавленных друзей&nbsp;в&nbsp;списке.</div></div>`;
    }

};