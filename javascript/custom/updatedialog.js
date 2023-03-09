const dialog_icons = {
    "ANIMATION": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M304 48c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zm0 416c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM48 304c26.5 0 48-21.5 48-48s-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48zm464-48c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM142.9 437c18.7-18.7 18.7-49.1 0-67.9s-49.1-18.7-67.9 0s-18.7 49.1 0 67.9s49.1 18.7 67.9 0zm0-294.2c18.7-18.7 18.7-49.1 0-67.9S93.7 56.2 75 75s-18.7 49.1 0 67.9s49.1 18.7 67.9 0zM369.1 437c18.7 18.7 49.1 18.7 67.9 0s18.7-49.1 0-67.9s-49.1-18.7-67.9 0s-18.7 49.1 0 67.9z" /></svg>`,
    "VIDEO": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM48 368v32c0 8.8 7.2 16 16 16H96c8.8 0 16-7.2 16-16V368c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16zm368-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V368c0-8.8-7.2-16-16-16H416zM48 240v32c0 8.8 7.2 16 16 16H96c8.8 0 16-7.2 16-16V240c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16zm368-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V240c0-8.8-7.2-16-16-16H416zM48 112v32c0 8.8 7.2 16 16 16H96c8.8 0 16-7.2 16-16V112c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16zM416 96c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V112c0-8.8-7.2-16-16-16H416zM160 128v64c0 17.7 14.3 32 32 32H320c17.7 0 32-14.3 32-32V128c0-17.7-14.3-32-32-32H192c-17.7 0-32 14.3-32 32zm32 160c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32H320c17.7 0 32-14.3 32-32V320c0-17.7-14.3-32-32-32H192z" /></svg>`,
    "DEVELOP": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z" /></svg>`,
}

const dialog = {
    //Url куда будет выполняться запрос
    url: 'https://api.github.com/repos/AN0NCER/an0ncer.github.io/releases',
    key: 'dialog-update',

    /**
     * Отобразить окно с обновлениями
     * @param {Event} e - событие после скрытия диалогового окна
     */
    show: async function (e = () => { }, response = undefined) {
        data = await this.load(response);
        if (data) {
            await this.structure(data);
            $('.frame-dialog').css('display', '');
            $('body').css('overflow-y', 'hidden');
            $('.dialog > .btn-submit >.submit').click(() => {
                $('.frame-dialog').css('display', 'none');
                $('body').css('overflow-y', '');
                e();
            });
        }
    },

    structure: function (data) {
        $('.dialog > .wraper > .title > .text').text(data.title);
        $('.dialog > .wraper > .title > .version > span').text(data.tag);

        for (let i = 0; i < data.content.length; i++) {
            const element = data.content[i];
            let content = `<div class="info-block-content ${i + 1 == 1 ? "first" : i + 1 == 2 ? "second" : "third"}">`;
            $('.dialog > .wraper').append(this.html.title(element.title, i + 1));
            for (let i = 0; i < element.block.length; i++) {
                const block = element.block[i];
                let info_content = "";
                for (let i = 0; i < block.content.length; i++) {
                    const update = block.content[i];
                    info_content += this.html.info_update(update);
                }
                content += this.html.info(block.title, block.icon, info_content);
            }
            content += `</div>`;
            $('.dialog > .wraper').append(content);
        }
    },

    /**
     * Загружает последние обновление с github
     * @returns {Array} - Массив данных
     */
    load: function (response) {
        return new Promise((resolve) => {
            //Выполняем запрос
            if (response) {
                init(response);
            } else {
                fetch(this.url).then(async (res) => {
                    //Преобразовуем в json
                    let data = await res.json();
                    init(data);
                });
            }
            async function init(data) {
                console.log(data);
                //Проверяем если это массив
                if (Array.isArray(data) && data.length > 0) {
                    const pages = [];
                    //Разбиваем текст на строки
                    const arr = data[0].body.split('\r\n');
                    //Страница для pages
                    let page = {};

                    //проходимся по строкам
                    for (let i = 0; i < arr.length; i++) {
                        const line = arr[i]; //Строка

                        //Если строка начинается на '- ' это основной блок
                        if (line.startsWith('- ')) {
                            //Если строка начанает на '- ' и страница имеет уже ключи то нужно создать новую страницу а ту сохранить в основную книгу
                            if (Object.keys(page).length > 0) {
                                //Сохраняем страницу в книгу
                                pages.push(page);
                                //Создаем новую страницу
                                page = {};
                            }

                            page.title = line.substring(2); // Заголовок основного блока
                            page.block = []; // Место для дополнительных блоков
                        }

                        //Если строка начинается на '> -' это дополнительный блок основного блока
                        if (line.startsWith('> -')) {
                            const parts = line.split("["); // Рабиваем строку на 2 части
                            //Заголовом вырезаем и убираем **
                            const title = parts[0].trim().substring(3).replace(/\*/g, '');;
                            //Достаем текст иконки
                            const icon = parts[1].substring(0, parts[1].length - 1);
                            //Добавляем в дополнительный блок страницы
                            page.block.push({ title, icon, content: [] });
                        }

                        //Текст обновления для дополнительного блока начинается на '>' но не начинается '> -'
                        if (line.startsWith('>') && !line.startsWith('> -')) {
                            //Добавляем в дополнительный блок контент с текстом обновления
                            page.block[page.block.length - 1].content.push(line.replace('> ', ''));
                        }
                    }

                    //Добавляем последнию страницу
                    pages.push(page);

                    resolve({ title: data[0].name, tag: data[0].tag_name, content: pages });
                } else {
                    //Возвращаем пусто
                    resolve({});
                }
            }
        });
    },

    html: {
        title: function (title, count) {
            return `<div class="title-block ${count == 1 ? "first" : count == 2 ? "second" : "third"}"><span></span>${title}</div>`
        },
        info: function (title, icon, content) {
            return `<div class="info-block"><div class="icon">${dialog_icons[icon]}</div><div class="content"><div class="title">${title}</div>${content}</div></div>`
        },
        info_update: function (text) {
            return `<div class="info">${text}</div>`;
        }
    }
}