import { User } from "../../modules/ShikiUSR.js";
import { WindowManagement } from "../../modules/Windows.js";
import { Player } from "./mod_player.js";
import { AnimeUserRate } from "./mod_userrate.js";

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

        $('.content-score > .content-wraper > textarea').bind('input', () => {
            this.auto_grow(document.querySelector('.content-score > .content-wraper > textarea'));
        });

        //Отслеживаем изменения оценки пользователем
        $('.score-list > .sc').click(function () {
            let score = $(this).attr('data-score');

            if (AnimeUserRate().rate && AnimeUserRate().rate.score == score) {
                return;
            }
            $(`.sc.selected`).removeClass('selected');
            $(this).addClass('selected');

            //Устанавливает оценку
            AnimeUserRate().events.setScore(score);

            $('.block-clear-score').removeClass('disabled');
            $('.bar-score > .window-title').text("Оценено");
        });

        //Отслеживаем изменение нажатие на кнопку очистить оценку
        $('.block-clear-score').click(function () {
            if ($(this).hasClass('disabled')) {
                return;
            }

            //  Устанавливает оценку 0
            AnimeUserRate().events.setScore(0);

            $('.block-clear-score').addClass('disabled');
            $(`.sc.selected`).removeClass('selected');
            $('.bar-score > .window-title').text("Оценить");
        });

        //Отслеживаем сохранение заметки
        $('.content-score > .content-wraper > .btn-commit').click(function () {
            let info = document.querySelector('#info-anime').checked;
            let val = $('.content-score > .content-wraper > textarea').val();
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
                val += '\n' + searchString + ` ${Player().translation.name} - ${Player().translation.id}`;
            }

            $('.content-score > .content-wraper > textarea').val(val);
            val += WindowScore.comments.footer;
            WindowScore.auto_grow(document.querySelector('.content-score > .content-wraper > textarea'))
            $DEV.log(val);
            //Устанавливает заметкку
            AnimeUserRate().events.setComment(val);
            _windowScore.hide();
        });

        $('#info-anime').click(function () {
            setParameter('saveinfo', this.checked);
        });
    },

    show: function () {
        //Проверяем на наличие у пользователя user_rate
        if (AnimeUserRate().rate) {
            //Проверяем оценку пользователя
            if (AnimeUserRate().rate.score != 0) {
                //Если есть оценка, то устанавливаем значение в input и включаем кнопку очистки значения
                $(`.sc-${AnimeUserRate().rate.score}`).addClass('selected');
                $('.block-clear-score').removeClass('disabled');
                //Изменяем title на оценено
                $('.bar-score > .window-title').text("Оценено");
            }

            //Проверяем комментарий пользователя
            $DEV.log(AnimeUserRate().rate);
            if (AnimeUserRate().rate.text) {
                let text = AnimeUserRate().rate.text;
                const regex = /\[tunime-sync:(\d+):(\d+):"(.+?)"]/;
                const match = text.match(regex);
                if(match){
                    this.comments.footer = `\r\n${match[0]}`;
                    text = text.replace(match[0], '');
                    text.trim();
                }
                //Устанавливаем значения комментария в input
                $('.content-score > .content-wraper > textarea').val(text);
                this.auto_grow(document.querySelector('.content-score > .content-wraper > textarea'));
            }
        }
    },

    hide: function () {

    },

    verif: function () {
        return User.authorized;
    },

    auto_grow: function (dom) {
        dom.style.height = "5px";
        dom.style.height = (dom.scrollHeight) + "px";
    }
}

const _windowScore = new WindowManagement(WindowScore, '.window-score');

export const ShowScoreWindow = () => { _windowScore.click(); }