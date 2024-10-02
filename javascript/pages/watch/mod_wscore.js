import { User } from "../../modules/ShikiUSR.js";
import { WindowManagement } from "../../modules/Windows.js";
import { UserRate } from "./mod_urate.js";
import { SetSynchEnable, SYNC_ENABLE, Synch } from "./mod_sdata.js";
import { Private } from "./mod_private.js";
import { ShowCollectionWindow } from "./mod_collection.js";
import Collection from "../../modules/Collection.js";
import { IPlayer } from "./mod_player.js";

const Player = IPlayer.Init();

const WindowScore = {
    comments: {
        footer: ""
    },

    init: function () {
        if ($PARAMETERS.watch.saveinfo) {
            $('#info-anime').prop('checked', true);
        }

        //Кнопка закрытия окна
        $('.bar-score > .window-close').click(() => {
            this.hide();
            _windowScore.hide();
        });

        $('textarea.noten').bind('input', () => {
            this.auto_grow(document.querySelector('textarea.noten'));
        });

        //Отслеживаем изменения оценки пользователем
        $('.score-list > .sc').click(function () {
            let score = $(this).attr('data-score');

            let ur = UserRate().Get();

            console.log(ur);

            if (ur == null || ur.score == score) {
                return;
            }
            $(`.sc.selected`).removeClass('selected');
            $(this).addClass('selected');

            //Устанавливает оценку
            UserRate().Controls.Score(score)

            $('.block-clear-score').removeClass('disabled');
            $('.bar-score > .window-title').text("Оценено");
        });

        //Отслеживаем изменение нажатие на кнопку очистить оценку
        $('.block-clear-score').click(function () {
            if ($(this).hasClass('disabled')) {
                return;
            }

            //  Устанавливает оценку 0
            UserRate().Controls.Score(0);

            $('.block-clear-score').addClass('disabled');
            $(`.sc.selected`).removeClass('selected');
            $('.bar-score > .window-title').text("Оценить");
        });

        //Отслеживаем сохранение заметки
        $('.content-score > .content-wraper > .btn-commit').click(function () {
            let info = document.querySelector('#info-anime').checked;
            let val = $('textarea.noten').val();
            if (!val && val.length >= 0) {
                return;
            }

            if (info) {
                var searchString = 'Озвучка:';
                var lines = val.split('\n'); // Разбиваем содержимое на строки

                //Найдена данная строка
                if (val.indexOf(searchString) !== -1) {
                    //Отбираем без этой строки
                    var updatedLines = lines.filter(function (line) {
                        return -1 === line.indexOf(searchString); // Фильтруем строки, удаляя найденную строку
                    });
                    //Изменяем текст
                    val = updatedLines.join('\n');
                }

                //Добавляем информацию о тексте
                val += '\n' + searchString + ` ${Player.CTranslation.name} - ${Player.CTranslation.id}`;
            }

            $('textarea.noten').val(val);
            val += WindowScore.comments.footer;
            WindowScore.auto_grow(document.querySelector('textarea.noten'))
            //Устанавливает заметкку
            UserRate().Controls.Note(val);
            _windowScore.hide();
        });

        $('#info-anime').click(function () {
            setParameter('saveinfo', this.checked);
        });

        $('#sync-anime').click(function () {
            SetSynchEnable(this.checked);
        });

        $('#anime-incognito').click(function () {
            Private.INCOGNITO = this.checked;
        })

        $('.collection-select.btn').click(() => {
            ShowCollectionWindow();
        })

        UserRate().Events.OnInit((res) => {
            UserRate().Events.OnUpdate((res) => {
                if (res == null) {
                    SetScore(0);
                    $('textarea.noten').val('')
                    return;
                }

                SetScore(res.score);
                SetNote(res.text);
            });

            if (res == null) {
                return;
            }

            SetScore(res.score);
            SetNote(res.text);
        });

        Player.on("inited", (results) => {
            Synch.Init().On((data) => {
                try {
                    if (data === undefined)
                        return;

                    const index = results.findIndex(x => x.translation.id === data.kodik_dub);

                    if (index === -1)
                        return;

                    const title = results[index].translation.title;
                    const date = new Date(data.date_update);

                    $(`.sync-data > .voice`).text(title);
                    $(`.sync-data > .episode`).text(`${data.kodik_episode} Эпизод`);
                    $(`.sync-data > .time`).text(`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`);
                } catch (error) {
                    console.log(error);
                }

            });

            Synch.Init().plugins.update.On((data) => {
                const index = results.findIndex(x => x.translation.id === data.kodik_dub);

                if (index === -1)
                    return;

                const title = results[index].translation.title;
                const date = data.date_update;

                $(`.sync-data > .voice`).text(title);
                $(`.sync-data > .episode`).text(`${data.kodik_episode} Эпизод`);
                $(`.sync-data > .time`).text(`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`);
            });
        });
    },

    show: function () {
        $('body').addClass('loading');
        $('#sync-anime').attr('checked', SYNC_ENABLE);
        $('#anime-incognito').attr('checked', Private.INCOGNITO);
    },

    hide: function () {
        $('body').removeClass('loading');
    },

    verif: function () {
        return User.authorized;
    },

    auto_grow: function (dom) {
        dom.style.height = "5px";
        dom.style.height = (dom.scrollHeight) + "px";
    }
}

function SetScore(score) {
    if (score == 0) {
        $('.block-clear-score').addClass('disabled');
        $(`.sc.selected`).removeClass('selected');
        $('.bar-score > .window-title').text("Оценить");
        return;
    }
    //Если есть оценка, то устанавливаем значение в input и включаем кнопку очистки значения
    $(`.sc-${score}`).addClass('selected');
    $('.block-clear-score').removeClass('disabled');
    //Изменяем title на оценено
    $('.bar-score > .window-title').text("Оценено");
}

function SetNote(note) {
    if (note) {
        let text = note;
        const regex = /\[tunime-sync:(\d+):(\d+):"(.+?)"]/;
        const match = text.match(regex);
        if (match) {
            WindowScore.comments.footer = `\r\n${match[0]}`;
            text = text.replace(match[0], '');
            text.trim();
        }
        //Устанавливаем значения комментария в input
        $('textarea.noten').val(text.trim());
        WindowScore.auto_grow(document.querySelector('textarea.noten'));
    }
}

const _windowScore = new WindowManagement(WindowScore, '.window-score');

export const ShowScoreWindow = () => { _windowScore.click(); }