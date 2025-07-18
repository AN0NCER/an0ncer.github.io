import { $PWA } from "../../core/pwa.core.js";
import { PullToClose, WindowManagement } from "../../modules/Windows.js";
import { GitCommit, GitTags } from "./mod_github.js";

const icons = {
    "undefined": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M386.3 160H336c-17.7 0-32 14.3-32 32s14.3 32 32 32H464c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32s-32 14.3-32 32v51.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0s-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3s163.8-62.5 226.3 0L386.3 160z"/></svg>`,
    "EDIT": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"/></svg>`,
    "FIX": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M159.3 5.4c7.8-7.3 19.9-7.2 27.7 .1c27.6 25.9 53.5 53.8 77.7 84c11-14.4 23.5-30.1 37-42.9c7.9-7.4 20.1-7.4 28 .1c34.6 33 63.9 76.6 84.5 118c20.3 40.8 33.8 82.5 33.8 111.9C448 404.2 348.2 512 224 512C98.4 512 0 404.1 0 276.5c0-38.4 17.8-85.3 45.4-131.7C73.3 97.7 112.7 48.6 159.3 5.4zM225.7 416c25.3 0 47.7-7 68.8-21c42.1-29.4 53.4-88.2 28.1-134.4c-4.5-9-16-9.6-22.5-2l-25.2 29.3c-6.6 7.6-18.5 7.4-24.7-.5c-16.5-21-46-58.5-62.8-79.8c-6.3-8-18.3-8.1-24.7-.1c-33.8 42.5-50.8 69.3-50.8 99.4C112 375.4 162.6 416 225.7 416z"/></svg>`,
    "NEW": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>`,
    "add": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>`,
    "edt": `<svg viewBox="0 0 448 512" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M161.665 206.542L295.048 238.924L353.644 205L375.232 239.695C359.298 256.657 342.85 272.077 325.888 285.955C308.926 299.319 295.819 306.001 286.567 306.001L153.184 273.619L94.588 307.543L73 272.848C88.934 255.886 105.382 240.723 122.344 227.359C139.306 213.481 152.413 206.542 161.665 206.542Z" /></svg>`,
    "rem": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"/></svg>`
};

const update = {
    data: undefined,
    script: [],
    type: 'update',
    tag: '0.0.0',

    /**
     * Разбор обновления github
     * @param {Array} data - Массив данных
     * @returns {Object} - возвращает разобранные данные последнего обновления
     */
    load: function (data) {
        if (!data) {
            return {};
        }
        const arrayContent = [];
        //Разбиваем текст на строки
        /**@type {[string]} */
        const lines = data.body?.split('\r\n') || [];
        //Обьект для контента
        let objectContent = {};
        //Обьект для таблиц
        let objectTable = {};
        //Обьект для Swiper
        let swiperElements = {};

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (Object.keys(objectTable).length > 0) {
                _tProcess(line);
                continue;
            }
            if (Object.keys(swiperElements).length > 0) {
                _sProcess(line);
                continue;
            }
            //Если строка начинается на '- ' это основной блок
            if (line.startsWith('- ')) {
                _mainTitle(line);
                continue;
            }

            //Если строка начинается на '> -' это дополнительный блок основного блока
            if (line.startsWith('> -')) {
                _subTitle(line);
                continue;
            }

            //Текст обновления для дополнительного блока начинается на '>'
            if (line.startsWith('>')) {
                _content(line);
                continue;
            }

            if (line.startsWith('```table')) {
                _table(line);
                continue;
            }

            if (line.startsWith('[Script]')) {
                this.script = _script(line, this.script);
                continue;
            }

            if (line.includes('#swiper')) {
                _swiper(line);
                continue;
            }
        }

        //Добавляем последние данные
        arrayContent.push(objectContent);
        this.tag = data.tag_name;

        return { title: data.name, tag: this.tag, content: arrayContent };

        function _mainTitle(line) {
            if (Object.keys(objectContent).length > 0) {
                //Сохраняем данные и пересоздаем на новый блок
                arrayContent.push(objectContent);
                objectContent = {};
            }

            objectContent.type = "mainTitle";
            objectContent.value = line.substring(2);
            objectContent.content = [];
        }

        function _subTitle(line) {
            const parts = line.split("["); // Рабиваем строку на 2 части
            //Заголовом вырезаем и убираем **
            const value = parts[0].trim().substring(3).replace(/\*/g, '');;
            //Достаем текст иконки
            const icon = parts[1].substring(0, parts[1].length - 1);

            objectContent?.content.push({ value: value.trim(), icon: icon.trim(), type: "subTitle", content: [] });
        }

        function _content(line) {
            const value = line.replace('> ', '');
            objectContent?.content[objectContent.content.length - 1]?.content.push({ value: value.trim(), type: "content" });
        }

        function _table(line) {
            if (line.startsWith('```table_modif')) {
                objectTable = { type: "modTable", content: [] };
            }
        }

        function _tLine(line) {
            if (objectTable.type === "modTable") {
                if (line.startsWith(`[+]`)) {
                    const match = line.split(`[+]`)[1].match(/\[(.*?)\]\((\d+)\)/);
                    objectTable.content.push({ type: 'add', name: match[1].trim(), id: match[2].trim() });
                }
                if (line.startsWith(`[-]`)) {
                    const match = line.split(`[-]`)[1].match(/\[(.*?)\]\((\d+)\)/);
                    objectTable.content.push({ type: 'rem', name: match[1].trim(), id: match[2].trim() });
                }
                if (line.startsWith(`[~]`)) {
                    const match = line.split(`[~]`)[1].match(/\[(.*?)\]\((\d+)\)/);
                    objectTable.content.push({ type: 'edt', name: match[1].trim(), id: match[2].trim() });
                }
            }
        }

        function _tProcess(line) {
            if (line.startsWith('```')) {
                objectContent?.content[objectContent.content.length - 1]?.content.push(objectTable);
                objectTable = {};
                return;
            }

            _tLine(line);
        }

        function _sSlide(line) {
            if (line.includes('<!--video')) {
                _video(line);
                return;
            }

        }

        function _sProcess(line) {
            if (line.includes('#endswiper')) {
                objectContent?.content[objectContent.content.length - 1]?.content.push(swiperElements);
                swiperElements = {};
                return;
            }

            _sSlide(line);
        }

        function _script(line, scripts = []) {
            const regex = /\[.*?\]\((https?:\/\/[^\s)]+)\)/;
            const match = line.match(regex);

            if (match) {
                scripts.push(match[1]);
            }

            return scripts;
        }

        function _video(line) {
            const regex = /<!--video:(https?:\/\/[^\s:]+):"([^"]+)":([^\s>]+)-->/;
            const match = line.match(regex);

            if (match) {
                const videoUrl = match[1];      // Первая ссылка на видео
                const title = match[2];         // Текст названия
                const additionalUrl = match[3]; // Вторая ссылка
                swiperElements?.content.push({ type: "video", video: videoUrl, name: title, url: additionalUrl });
            }
        }

        function _swiper(line) {
            swiperElements = { type: 'swiper', content: [] };
        }
    },

    init: function () {
    },

    show: function () {
        this.script = [];
        //Данные Github релиза
        const GitRes = this.load(this.data);

        //Название и тег
        $('.content-update > .content-wraper > .title-content > .title').html(GitRes.title);
        $('.content-update > .content-wraper > .title-content > .tag > .t').html(GitRes.tag);

        const restart = $('.content-buttons > .restart-script');
        restart.removeClass('show');
        if (update.type === "show" && update.script.length > 0)
            restart.addClass('show');

        //html контент
        let html = "";
        //swiper элемент
        let swiper;
        let swiperCss;

        const tRecursion = (data) => {
            for (let i = 0; i < data.length; i++) {
                const element = data[i];
                html += `<a href="watch.html?id=${element.id}"><div class="t${element.type}"><span class="icon">${icons[element.type]}</span><div class="value">${element.name}</div></div></a>`;
            }
        }

        const sRecrusion = (data) => {
            for (let i = 0; i < data.length; i++) {
                const element = data[i];
                if (element.type === 'video') {
                    html += `<div class="vWrapper swiper-slide"><video id="player${i}" loop="" muted="" playsinline="" class="video-background" src="${element.video}"></video><div class="controls" id="player${i}"><span class="icon"><img src="./images/icons/logo-x192-o.png">${element.name}</span><div class="buttons"><div class="btn-play-pause play" id="player${i}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="pause"><path d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z"/></svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="play"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg></div><a href="${element.url}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2 160 448c0 17.7 14.3 32 32 32s32-14.3 32-32l0-306.7L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg></a></div></div></div>`;
                }
            }
        }

        const recursion = (data) => {
            for (let i = 0; i < data.length; i++) {
                const element = data[i];

                if (element.type === "mainTitle") {
                    html += `<div class="block-title"><span></span>${element.value}</div>`;
                    html += `<div class="update-page-block">`;
                    recursion(element.content);
                    html += `</div>`;
                }

                if (element.type === "subTitle") {
                    html += `<div class="block-content">`;
                    let icon = icons[element.icon];
                    html += `<div class="block-icon"><span class="icon">${icon ? icon : icons[icon]}</span><div class="title">${element.value}</div></div>`;
                    html += `<div class="block-text">`;
                    recursion(element.content);
                    html += `</div>`;
                    html += `</div>`;
                }

                if (element.type === "content") {
                    html += `<div class="content">${element.value}</div>`
                }

                if (element.type === "modTable") {
                    html += `<div class="tWrapper scroll-none"><div class="modTable">`;
                    tRecursion(element.content);
                    html += `</div></div>`;
                }

                if (element.type === "swiper") {
                    swiperCss = 'random-class-' + Math.floor(Math.random() * 10000);
                    html += `<div class="uSwiperWrapper"><div class="sWrapper ${swiperCss}"><div class="swiper-wrapper">`;
                    sRecrusion(element.content);
                    html += `</div><div class="swiper-pagination"></div></div></div>`;
                }
            }
        }

        if (typeof GitRes === "object") {
            recursion(GitRes.content);
        }

        $('.content-update > .content-wraper > .update-content-wraper').append(html);

        initSwiper(swiperCss);

        function initSwiper(css) {
            if (swiper) {
                swiper.destroy(true, true)
            }

            swiper = new Swiper(`.${css}`, {
                // Parametrs
                init: false,
                slidesPerView: 1,
                spaceBetween: 10,
                breakpoints: {
                    740: {
                        slidesPerView: 2
                    }
                },
                pagination: {
                    el: '.swiper-pagination',
                    type: 'bullets',
                    clickable: true,
                    dynamicBullets: true,
                    bulletActiveClass: 'swiper-pagination-bullet-active',
                    bulletClass: 'swiper-pagination-bullet',
                    bulletSize: '10px',
                    bulletStyle: 'circle',
                    bulletElement: 'span',
                    hideOnClick: false,
                    watchOverflow: true,
                },
            });

            const visibleVideo = () => {
                const { activeIndex, params, slides } = swiper;

                slides.forEach((slide, index) => {
                    const video = $(slide).find('video')[0];

                    if (!video) return;

                    if (index >= activeIndex && index < activeIndex + params.slidesPerView) {
                        video.play();
                    } else {
                        video.pause();
                    }
                })
            }

            swiper.on('slideChange', visibleVideo);

            swiper.on('slidesLengthChange', visibleVideo);

            swiper.on('resize', visibleVideo);

            swiper.init();

            $(`.vWrapper > video`).on('click', (e) => {
                const id = $(e.currentTarget).attr('id');
                ShowControls(id);
            });

            $(`.vWrapper > .controls > .buttons > .btn-play-pause`).on('click', (e) => {
                const id = $(e.currentTarget).attr('id');
                const video = $(`video#${id}`)[0];
                if (video.paused) {
                    video.play();
                } else {
                    video.pause()
                }
            });

            $(`.vWrapper > video`).on('play', (e) => {
                const id = $(e.currentTarget).attr('id');
                $(`.buttons > .btn-play-pause#${id}`).removeClass('play');
                $(`.buttons > .btn-play-pause#${id}`).addClass('pause');

            });

            $(`.vWrapper > video`).on('pause', (e) => {
                const id = $(e.currentTarget).attr('id');
                $(`.buttons > .btn-play-pause#${id}`).removeClass('pause');
                $(`.buttons > .btn-play-pause#${id}`).addClass('play');
            })

            let timeControls;

            function ShowControls(id) {
                anime({
                    targets: `.vWrapper > .controls#${id}`,
                    bottom: 5,
                    duration: 300,
                });

                clearTimeout(timeControls);
                timeControls = setTimeout(() => {
                    anime({
                        targets: `.vWrapper > .controls`,
                        bottom: -40,
                        duration: 300,
                    });
                }, 5000);
            }
        }
    },

    hide: function () {
        try {
            $PWA.meta.update.remove();
        } catch (error) {
            console.log('[update] - Window hide error', error);
        }
    }
};

const tagList = {
    lHide: true,
    gPage: 1,
    gLoad: false,
    gMax: 30,
    gTop: 0,
    gProcess: false,
    heightL: 140,

    Init: function () {
        const T = $(`.content-update > .content-wraper > .title-content > .tag`);

        const onClick = () => {
            if (this.lHide) {
                this.eShow();
            } else {
                this.eHide();
            }
        }

        const tEvent = (e) => {
            const j = $(e.currentTarget);

            if (j.hasClass('select'))
                return;

            $(`.list-tags > .t.select`).removeClass('select');
            j.addClass('select');

            onClick();
            $(`.content-update`).addClass('load-commit');
            GitCommit(j.attr('v')).then(value => {
                Update.Set(value);
                $(`.update-content-wraper`).empty();
                windowUpdate.show();
                $(`.content-update`).removeClass('load-commit');
            });
        }

        const gTagLoad = (e = () => { }) => {
            if (this.gLoad)
                return e();

            this.gProcess = true;

            GitTags(this.gPage).then(value => {
                if (value.length < this.gMax) {
                    this.gLoad = true;
                }

                this.gPage++;

                value.forEach(({ name }) => {
                    $(`.window-update > .list-tags`).append(`<span class="t" v="${name}">${name}</span>`);
                });

                $(`.list-tags > .t[v="${update.tag}"]`).addClass('select');
                $(`.list-tags > .t`).off('click.tEvent');
                $(`.list-tags > .t`).on('click.tEvent', tEvent);
                this.gProcess = false;
                e();
            })
        }

        T.on('click', () => {
            if (!this.eCheck())
                return;

            const callback = () => {
                onClick(this.ePosition());
            }

            gTagLoad(callback);
        });

        $(`.filter-hide`).on('click', () => {
            if (!this.lHide)
                onClick();
        });

        window.screen.orientation.addEventListener('change', () => {
            if (!this.lHide)
                onClick();
        });

        $('.window-update > .list-tags').on('scroll', (e) => {
            if (this.gLoad || this.gProcess) return;

            const el = $(e.currentTarget);
            const scrollTop = $(el).scrollTop();
            if (scrollTop < this.gTop)
                return;

            this.gTop = scrollTop <= 0 ? 0 : scrollTop;
            if (scrollTop + 200 + el.innerHeight() >= el[0].scrollHeight) {
                gTagLoad();
            }
        });
    },

    eCheck: function () {
        if (update.type === 'update') {
            return false;
        }
        return true;
    },

    ePosition: function () {
        const T = $(`.content-update > .content-wraper > .title-content > .tag`);
        const W = $(`.content-update > .content-wraper`);
        const L = $(`.window-update > .list-tags`);

        const position_T = T.position();
        const width_T = T.innerWidth();
        const height_T = T.innerHeight();
        const height_W = W.innerHeight();
        const margin = 10;

        if ((this.heightL + margin + height_T) < height_W) {
            const top = position_T.top + height_T + margin;
            L.css({
                left: position_T.left,
                bottom: '',
                top: `calc(100dvh - ${height_W}px + ${top}px)`,
                width: width_T
            });
            return 'top';
        } else {
            const bottom = height_W - margin + 5;
            L.css({
                left: position_T.left,
                bottom,
                top: '',
                width: width_T
            });
            return 'bottom';
        }
    },

    eHide: function (duration = 100) {
        $(`.content-update`).removeClass('list-show');
        anime({
            targets: `.window-update > .list-tags`,
            height: [this.heightL, 0],
            easing: 'linear',
            duration: duration
        });
        this.lHide = true;
    },

    eShow: function () {
        $(`.content-update`).addClass('list-show');
        anime({
            targets: `.window-update > .list-tags`,
            height: [0, this.heightL],
            easing: 'linear',
            duration: 100
        });
        this.lHide = false;
    }
};

const windowUpdate = {
    init: function () {
        let process = false;

        const submit = (reload = false) => {
            if (process)
                return;

            process = true;

            const close = () => {
                process = false;
                $('.content-buttons > .btn-submit').removeClass('cl-2');
                if (reload) {
                    $('.content-buttons > .restart-script').removeClass('show');
                    return;
                }
                _windowUpdate.hide();
                this.hide();
            }

            const progress = (total, completed) => {
                // console.log(total, completed);
            }

            const loadModule = (modul) => {
                try {
                    import(`${modul}?v=${update.tag}`).then((mod) => {
                        mod.initialize({
                            version: update.tag, priority: reload, callback: (data) => {
                                // console.log(data);
                                close();
                            }, onProgress: progress
                        });
                    }).catch((error) => {
                        console.error(error);
                        close();
                    })
                } catch (error) {
                    console.log('[update] - Error load module', error);
                    close();
                }
            }

            if (update.script.length > 0 && (update.type === 'update' || reload)) {
                $('.content-buttons > .btn-submit').addClass('cl-2');
                update.script.forEach(modul => {
                    loadModule(modul);
                });
            } else {
                close();
            }
        }

        tagList.Init();

        //Обработчик события -> нажатие на кнопку "подтвердить"
        $('.content-buttons > .btn-submit').on('click', () => { submit() });
        $(`.window-update > .hide-window`).on('click.custom', () => { submit() });
        $('.content-buttons > .restart-script').on('click', () => { submit(true) });
        PullToClose('.update-content-wraper', () => { submit() });
    },

    show: function () {
        //Отключаем стандартное управление
        $(`${_windowUpdate.element} > .hide-window`).off('click.basic');
        $('body').addClass('hidden');
        update.show();
    },

    hide: function () {
        $('body').removeClass('hidden');
        if (!tagList.lHide)
            tagList.eHide(50);
        if (update.type !== 'update') {
            return;
        }

        update.hide();
    },
    verif: function () {
        return update.data != undefined;
    }
};

const _windowUpdate = new WindowManagement(windowUpdate, '.window-update');

export const Update = {
    Set: (data) => {
        update.data = data;
    },
    /**
    * @param {"update" | "show"} type 
    */
    Show: (type) => {
        update.type = type;
        _windowUpdate.click("Ошибка данных");
    }
}