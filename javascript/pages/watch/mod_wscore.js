import { WindowManagement } from "../../modules/Windows.js";
import { Private } from "./mod_private.js";
import { IPlayer } from "./mod_player.js";
import { OAuth } from "../../core/main.core.js";
import { DBAnime } from "./mod.db.js";
import { ASynch } from "./mod.synch.js";
import { URate } from "./mod.urate.js";
import { UIScore } from "./mod.score.js";

const Player = IPlayer.Init();

const WindowScore = {
    comments: {
        footer: ""
    },

    anim: {
        showed: function () {
            WindowScore.auto_grow(document.querySelector('textarea.noten'));
        }
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

        //Авто установка высоты input
        $('textarea.noten').bind('input', () => {
            this.auto_grow(document.querySelector('textarea.noten'));
        });

        // Изменение оценки пользователем
        UIScore.on('score', (value) => {
            if (!URate.uRate) {
                URate.setScore(0, false);
                return;
            } else if (URate.uRate.score === value) {
                return;
            }

            URate.setScore(value, true);
        });

        //Отслеживаем сохранение заметки
        $('.content-score > .content-wraper > .btn-commit').click(() => {
            let info = document.querySelector('#info-anime').checked;
            let val = $('textarea.noten').val();
            if (!val && val.length >= 0) {
                this.hide();
                _windowScore.hide();
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
            WindowScore.auto_grow(document.querySelector('textarea.noten'));

            //Устанавливает заметкку
            if (URate.uRate.text != val)
                URate.setNote(val);

            this.hide();
            _windowScore.hide();
        });

        $('#info-anime').click(function () {
            setParameter('saveinfo', this.checked);
        });

        $('#sync-anime').click(function () {
            DBAnime.set('anime', 'synch', this.checked);
        });

        $('#anime-incognito').click(function () {
            Private.INCOGNITO = this.checked;
        })

        $('.collection-select.btn').click(() => {
            import("./mod_collection.js").then(val => val.ShowCollectionWindow());
        })

        URate.on('init', (res) => {
            URate.on('update', (res) => {
                if (res == null) {
                    SetScore(0);
                    $('textarea.noten').val('')
                    return;
                }

                SetScore(res.score);
                SetNote(res.text);
            });

            if (res === null) {
                return;
            }

            SetScore(res.score);
            SetNote(res.text);
        }, { replay: true });

        Player.on("inited", ({ resultsVoice }) => {
            const callback = (data) => {
                try {
                    if (data === undefined)
                        return;

                    const kodikInfo = resultsVoice.get(data.kodik_dub);

                    if (!kodikInfo)
                        return;

                    const title = kodikInfo.translation.title;
                    const date = new Date(data.date_update);

                    $(`.sync-data > .voice`).text(title);
                    $(`.sync-data > .episode`).text(`${data.kodik_episode} Эпизод`);
                    $(`.sync-data > .time`).text(`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`);
                } catch (error) {
                    console.log(error)
                }
            }

            callback(DBAnime.get('anime', 'ldata'));
            ASynch.on('loaded', callback, { once: true, replay: true });
            ASynch.on('update', callback);
        });
    },

    show: function () {
        $('body').addClass('loading');
        $('#sync-anime').attr('checked', DBAnime.get('anime', 'synch'));
        $('#anime-incognito').attr('checked', Private.INCOGNITO);
        import(`/javascript/pages/watch/mod_collection.js`);
    },

    hide: function () {
        $('body').removeClass('loading');
    },

    verif: function () {
        return OAuth.auth;
    },

    auto_grow: function (dom) {
        dom.style.height = "5px";
        dom.style.height = (dom.scrollHeight) + "px";
    }
}

function SetScore(score) {
    UIScore.setScore(score);
}

let last_note;

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
        if (last_note != note) {
            //Устанавливаем значения комментария в input
            $('textarea.noten').val(text.trim());
            WindowScore.auto_grow(document.querySelector('textarea.noten'));
        }
        last_note = note;
    }
}

const _windowScore = new WindowManagement(WindowScore, '.window-score');

export const ShowScoreWindow = () => { _windowScore.click(); }