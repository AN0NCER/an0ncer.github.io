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
                "EDIT": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"/></svg>`,
                "FIX": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M159.3 5.4c7.8-7.3 19.9-7.2 27.7 .1c27.6 25.9 53.5 53.8 77.7 84c11-14.4 23.5-30.1 37-42.9c7.9-7.4 20.1-7.4 28 .1c34.6 33 63.9 76.6 84.5 118c20.3 40.8 33.8 82.5 33.8 111.9C448 404.2 348.2 512 224 512C98.4 512 0 404.1 0 276.5c0-38.4 17.8-85.3 45.4-131.7C73.3 97.7 112.7 48.6 159.3 5.4zM225.7 416c25.3 0 47.7-7 68.8-21c42.1-29.4 53.4-88.2 28.1-134.4c-4.5-9-16-9.6-22.5-2l-25.2 29.3c-6.6 7.6-18.5 7.4-24.7-.5c-16.5-21-46-58.5-62.8-79.8c-6.3-8-18.3-8.1-24.7-.1c-33.8 42.5-50.8 69.3-50.8 99.4C112 375.4 162.6 416 225.7 416z"/></svg>`,
                "NEW": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>`,
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