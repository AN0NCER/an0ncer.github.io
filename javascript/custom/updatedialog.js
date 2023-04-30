//Окно обновления
const UpdateWindow = {
    key: 'dialog-update',
    target: '.content-update',
    data: undefined,
    /**
     * Инициализация функции окна, запускается если прошел верификацию (this.verif)
     */
    init: function () {
        //Разбираем данные
        let gitres = this.load(this.data);
        //Расставляем данные
        //Название и тег
        $('.content-update > .content-wraper > .title-content > .title').html(gitres.title);
        $('.content-update > .content-wraper > .title-content > .tag > .t').html(gitres.tag);

        //html контент
        let html = "";

        for (let i = 0; i < gitres.content.length; i++) {
            //Название раздела
            const e = gitres.content[i];
            //Добавляем в html новый раздел
            html += `<div class="update-page-block">`;
            //Добавляем в html название раздела
            html += `<div class="block-title"><span></span> ${e.title}</div>`;
            //Добавляем блок контента
            html += `<div class="block-content">`;
            for (let i = 0; i < e.block.length; i++) {
                //Контент раздела
                const b = e.block[i];
                html += HtmlSection(b);
            }
            //Закрываем блок контента
            html += `</div>`;
            //Закрываем раздел
            html += `</div>`;
        }

        $('.content-update > .content-wraper > .update-content-wraper').append(html);

        //Функция нажатие на кнопку Подтвердить
        $('.content-update > .content-wraper > .btn-submit').click(()=>{
            WindowManagment.hide();
            this.hide();
        });

        function HtmlSection(data) {
            console.log(data);
            const icons = {
                "undefined": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M386.3 160H336c-17.7 0-32 14.3-32 32s14.3 32 32 32H464c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32s-32 14.3-32 32v51.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0s-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3s163.8-62.5 226.3 0L386.3 160z"/></svg>`,
                "EDIT": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M304 48c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zm0 416c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM48 304c26.5 0 48-21.5 48-48s-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48zm464-48c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM142.9 437c18.7-18.7 18.7-49.1 0-67.9s-49.1-18.7-67.9 0s-18.7 49.1 0 67.9s49.1 18.7 67.9 0zm0-294.2c18.7-18.7 18.7-49.1 0-67.9S93.7 56.2 75 75s-18.7 49.1 0 67.9s49.1 18.7 67.9 0zM369.1 437c18.7 18.7 49.1 18.7 67.9 0s18.7-49.1 0-67.9s-49.1-18.7-67.9 0s-18.7 49.1 0 67.9z" /></svg>`,
                "FIX": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM48 368v32c0 8.8 7.2 16 16 16H96c8.8 0 16-7.2 16-16V368c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16zm368-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V368c0-8.8-7.2-16-16-16H416zM48 240v32c0 8.8 7.2 16 16 16H96c8.8 0 16-7.2 16-16V240c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16zm368-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V240c0-8.8-7.2-16-16-16H416zM48 112v32c0 8.8 7.2 16 16 16H96c8.8 0 16-7.2 16-16V112c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16zM416 96c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V112c0-8.8-7.2-16-16-16H416zM160 128v64c0 17.7 14.3 32 32 32H320c17.7 0 32-14.3 32-32V128c0-17.7-14.3-32-32-32H192c-17.7 0-32 14.3-32 32zm32 160c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32H320c17.7 0 32-14.3 32-32V320c0-17.7-14.3-32-32-32H192z" /></svg>`,
                "NEW": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z" /></svg>`,
            };
            let html = "";
            let icon = icons[data.icon];
            html += `<div class="block-icon">${icon?icon:icons[icon]}<div class="title">${data.title}</div></div>`;
            //Text block
            html += `<div class="block-text">`;
            for (let i = 0; i < data.content.length; i++) {
                const text = data.content[i];
                html += `<div class="content">${text}</div>`;
            }
            //End text block
            html += `</div>`;
            return html;
        }
    },
    /**
     * Отображение окна
     */
    show: async function () {
        $(this.target).removeClass('hide');
        await sleep(10);
        $(this.target).css('transform', 'translateY(0%)')
    },

    /**
     * Скрытие окна
     */
    hide: async function () {
        $(this.target).css('transform', '');
        await sleep(300);
        $(this.target).addClass('hide');
        localStorage.setItem(this.key, false);
        localStorage.setItem('github-version', JSON.stringify({ tag: this.data[0].tag_name, published_at: this.data[0].published_at }));
    },
    /**
     * Проверка для инициализация окна. Если проверка не нужна просто верни true
     * @returns Возвращает boolean
     */
    verif: function () { return this.data != undefined && this.data; },

    /**
     * Разбор обновления github
     * @param {Array} data - Массив данных
     * @returns {Object} - возвращает разобранные данные последнего обновления
     */
    load: function (data) {
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

            return { title: data[0].name, tag: data[0].tag_name, content: pages };
        } else {
            //Возвращаем пусто
            return {};
        }
    },
};