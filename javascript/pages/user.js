import { Main, OAuth } from "../core/main.core.js";
import { TMenu } from "../core/menu.core.js";
import { Tunime } from "../modules/api.tunime.js";
import { IOFriends } from "./user/io.friends.js";
import { TAchivements } from "./user/mod.achievements.io.js";
import { AchievementsFranchises } from "./user/mod.achiv.franchises.js";
import { UIFavorites } from "./user/mod.favorites.js";
import { TFriends } from "./user/mod.friends.js";
import { UIHeader, UITunime } from "./user/mod.header.js";
import { History } from "./user/mod.history.js";
import { TLevel } from "./user/mod.level.js";
import { IOUser, ULoader } from "./user/mod.loader.js";
import { UIStats } from "./user/mod.stats.js";
import { TEvents } from "./user/util.event.js";

export const TPage = new class extends TEvents {
    constructor() {
        super();
        this.id = new URLSearchParams(window.location.search).get("id");
        this.loader = new ULoader();
    }

    async init(logged) {
        // - Получение реального ID пользователя с ресура SHIKIMORI
        this.id = await this.loader.getID(this.id);
        // - Получение друзей и инициализация системы контроля типа страницы для кэширования
        IOFriends.init(this.id);

        // - Получение ресурсов пользователя
        const raw = await this.loader.getRaw(this.id, logged);

        if (raw === undefined) {
            return window.location.href = "/404a.html";
        }

        this.trigger('init', raw, { replay: true });
    }
}

Main((isLogged) => {
    //Для доступа к аккаунту нужно быть авторизированым
    if (!isLogged && TPage.id === null) {
        //Если пользователь не авторизован и нету id пользователя то делаем переадресацию на авторизацию
        return window.location.href = "/login.html";
    }

    TPage.on('init', async (user) => {
        // - Header (Время, кнопки)
        UIHeader.init(user);
        // - Прогрузка пользователя данные
        IOUser.load(TPage.id);
        // - Уровень пользователя
        TLevel.init(user);
        // - Статистика пользователя просмотренные аниме
        UIStats(user);
        // - Избранное пользователя (аниме / персонажи)
        const favorites = new UIFavorites(user.id);
        // - Ачивки пользователя
        const achievements = new TAchivements(user.id);
        new AchievementsFranchises(achievements);
        // - Друзья пользователя
        TFriends.init(TPage.id);
        // - История пользователя
        new History(user.id);

        updateFavorite(user, favorites);
    })

    IOUser.on('load', async (value, { source } = {}) => {
        if (value) {
            // - Header Poster + Tags
            UITunime(value);
        }

        TPage.loader.screen.hide();
    }, { replay: true });

    IOUser.on('update', async (value, { source } = {}) => {
        if (value) {
            // - Header Poster + Tags
            UITunime(value);
        }
    })

    TMenu.init();
    TPage.init(isLogged);
});


function updateFavorite(user, favorites) {
    if (user.id === OAuth.user.id) {
        (async () => {
            const [[fav, cached], tun] = await Promise.all([
                new Promise((resolve) => favorites.on('update', resolve, { once: true, replay: true })),
                new Promise((resolve) => IOUser.on('load', resolve, { once: true, replay: true }))
            ]);

            if (tun?.public?.character) {
                const ids = Object.keys(tun.public.character);
                const characters = fav.characters.map(x => x.id);

                const remove = [];

                const key = 'user-favorites';

                const local = JSON.parse(localStorage.getItem(key)) || {};
                local.Character = {};
                const date = new Date().toISOString();
                for (const id of characters) {
                    local.Character[id] = { date }
                }

                localStorage.setItem(key, JSON.stringify(local));

                for (const id of ids) {
                    if (!characters.includes(Number(id))) {
                        remove.push(id);
                    }
                }

                if (remove.length > 0) {
                    Tunime.api.user(user.id).DELETE({
                        character: remove
                    });
                }
            }
        })();
    }
}