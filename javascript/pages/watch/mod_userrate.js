import { UserRates } from "../../modules/ShikiAPI.js";
import { Sleep } from "../../modules/funcitons.js";
import { $ID } from "../watch.js";
import { User } from "../../modules/ShikiUSR.js";
import { SetSynchUserRate } from "./mod_synch.js";

//Все возможные статусы пользователя к текущему аниме
const anime_status = [
    { id: 0, name: "Посмотрю", sh: ["planned"] },
    { id: 1, name: "Смотрю", sh: ["watching", "rewatching", "on_hold"] },
    { id: 2, name: "Просмотрел", sh: ["completed"] },
    { id: 3, name: "Забросить", sh: ["dropped"] },
];

//Управление пользователем
const user = {
    rate: undefined, //Даные пользователя об аниме
    id: undefined, //Текущий статус аниме
    logged: false, //Авторизирован ли пользователь

    events: {
        /**
         * Изменяет статус аниме в shikimori
         * @param {Int} id - выбраный статус
         */
        changeStatus: function (id) {
            //Проверяем авторизирован ли пользоваетль
            if (user.logged) {
                //Проверяем есть ли у этого аниме rate (данные)
                if (user.rate) {
                    //Если нажали на активный статус
                    if (user.id == id) {
                        //Удаляем данные об аниме
                        this.removeData();
                    } else {
                        //Обновляем данные на новые данные
                        this.updateData(id);
                    }
                } else {
                    //Нет данных и статус не совпадает
                    if (user.id != id) {
                        //Создаем user rate
                        this.updateData(id);
                    }
                }
            }
        },

        /**
         * Устанавливает эпизод аниме в user_rate
         * @param {Int} e - Текущий эпизод аниме
         * @param {String} s - Текущий статус
         */
        setEpisode: function (e, s = anime_status[1].sh[0]) {
            if (user.logged) {
                if (user.rate) {
                    if (user.rate.status == "completed")
                        return;

                    //Переключение на ниже эпизод 
                    if (user.rate.episodes > e)
                        return;

                    UserRates.show(user.rate.id, async (res) => {
                        if (res.failed && res.status == 429) {
                            await Sleep(1000);
                            return this.setEpisode(e, s);
                        }

                        user.rate = res;
                        user.status();
                        user.setStatus();
                    }).PATCH({ "user_rate": { "episodes": e, "status": s } });
                }
            }
        },

        /**
         * Устанавливает оценку аниме в user_rate
         * @param {Integer} s - значение оценки
         * @returns Ничего не возвращает
         */
        setScore: function (s) {
            if (!user.logged && !user.rate) {
                return;
            }

            UserRates.show(user.rate.id, async (res) => {
                if (res.failed && res.status == 429) {
                    await Sleep(1000);
                    return this.setScore(s);
                }

                user.rate = res;
                user.status();
                user.setStatus();
            }).PATCH({ "user_rate": { "score": s } });
        },

        /**
         * Устанавливает значение text (коментарий) anime в user_rate
         * @param {String} s - коментарий к аниме
         * @returns Ничего не возвращает
         */
        setComment: function (s) {
            if (!user.logged && !user.rate) {
                return;
            }

            UserRates.show(user.rate.id, async (res) => {
                if (res.failed && res.status == 429) {
                    await Sleep(1000);
                    return this.setComment(s);
                }

                user.rate = res;
                user.status();
                user.setStatus();
            }).PATCH({ "user_rate": { "text": s } });

        },

        /**
         * Обновляет или создает user_rate
         * @param {Int} id - статус 
         */
        updateData: function (id) {
            UserRates.list({}, async (res) => {
                if (res.failed && res.status == 429) {
                    await Sleep(1000);
                    return this.createData(id);
                }
                user.rate = res;
                SetSynchUserRate(res);
                user.status();
                user.setStatus();
            }).POST({ "user_rate": { "status": anime_status[id].sh[0], "target_id": $ID, "target_type": "Anime", "user_id": User.Storage.Get('access_whoami').id } });
        },

        /**
         * Удаляет user_rate
         */
        removeData: function () {
            UserRates.show(user.rate.id, async (res) => {
                if (res.failed && res.status == 429) {
                    await Sleep(1000);
                    return this.removeData();
                }
            }).DELETE();
            user.rate = undefined;
            user.id = undefined;
            SetSynchUserRate(undefined);
            user.unselect();
        }
    },

    /**
     * Инициализация пользователя
     * @param {Object} obj - user_rate shikimori data
     * @param {Boolean} lgd - авторизирован ли пользователь
     */
    init: function (obj, lgd) {
        this.logged = lgd;
        if (obj.user_rate) {
            this.rate = obj.user_rate;
            this.status();
            this.setStatus();
        }

        $('.cur-status > .icon').click(() => {
            this.events.changeStatus($('.cur-status').data('id'));
        });
        $('.list-status > .status').click((e) => {
            this.events.changeStatus($(e.currentTarget).data('id'));
        });
    },

    /**
     * Достает статус из данных
     */
    status: function () {
        const i = anime_status.findIndex(x => x.sh.includes(this.rate.status));
        this.id = anime_status[i].id;
    },

    /**
     * Устанавливает статус для аниме
     * @param {Int} id - статус 
     */
    setStatus: function (id = this.id) {
        //Отоброжаем скрытый елемент
        $('.list-status > .hide').removeClass('hide');

        //Изменяем текст на выбраный статус
        $(`.cur-status > .icon > .text`).text(anime_status[id].name);
        //Изменяем иконку на выбраный статус
        $(`.cur-status > .icon > .safe-area`).html($(`.status[data-id="${id}"] > .safe-area > svg`).clone());

        //Скрываем выбранный статус
        $(`.status[data-id="${id}"]`).addClass('hide');

        //Закрашиваем выбранный статус
        $('.cur-status > .icon').addClass('selected');

        //Изменяем ид выбраного статуса
        $('.cur-status').data('id', id);

        //Если у статуса есть оценка то перекращиваем кнопку оценено
        if (this.rate.score > 0) {
            $('.lb > .btn').addClass('fill');
            $('.user-rate-score').text(`${this.rate.score}/10`);
        }
    },

    unselect: function () {
        $('.cur-status > .icon').removeClass('selected');
    }
}

export const AnimeUserRate = () => { return user; }