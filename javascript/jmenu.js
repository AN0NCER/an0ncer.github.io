
//Отображен ли меню на сайте
let application_menu_showed = false;
//Интерактивное меню устройства
const application_interactive_html = `<div class="interactive-menu unselectable" style="display: none; ">
<div class="close-interactive"></div>
<div class="user-interactive">
<div class="btn-inter" data-intm="logout"><svg xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512">
        <path
            d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
    </svg>Выход</div>
<div class="btn-inter" data-intm="updats"><svg xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512">
        <path
            d="M142.9 142.9c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5c0 0 0 0 0 0H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5c7.7-21.8 20.2-42.3 37.8-59.8zM16 312v7.6 .7V440c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2l41.6-41.6c87.6 86.5 228.7 86.2 315.8-1c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.2 62.2-162.7 62.5-225.3 1L185 329c6.9-6.9 8.9-17.2 5.2-26.2s-12.5-14.8-22.2-14.8H48.4h-.7H40c-13.3 0-24 10.7-24 24z" />
    </svg>Обновления</div>
<div class="btn-inter" data-intm="settings"><svg xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512">
        <path
            d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z" />
    </svg>Настройки</div>
</div></div>`;
//Меню приложения устройства
const application_menu_html = `<div class="application-menu unselectable"></div>`;
//Страниы для переходов
const application_indexed_page = {
    index: 'index.html',
    list: 'list.html',
    search: 'search.html',
    settings: 'settings.html',
    user: 'user.html'
};
//Функции интерактивного меню
const application_menu_interactive_func = {
    logout: function(){
        usr.Storage.Clear();
        location.reload();
    },

    updats: function(){

    },

    settings: function(){
        window.location = application_indexed_page.settings;
    }
};

//Иконки меню html выбранные и не выбранные
const application_menu_icon = {
    home: {
        main: `<svg xmlns="http://www.w3.org/2000/svg" class="main-icon" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"><path d="M256,56.9c12.4,0,24.3,4.5,33.7,12.5l133,115c19.6,17,26.9,30.6,26.9,50.3v187.2c0,18.4-14.9,33.3-33.3,33.3    h-75.2c-12,0-21.8-9.8-21.8-21.8v-73.5c0-34.9-28.4-63.3-63.3-63.3s-63.3,28.4-63.3,63.3v73.5c0,12-9.8,21.8-21.8,21.8H95.6    c-18.4,0-33.3-14.9-33.3-33.3V234.6c0-19.7,7.3-33.3,26.9-50.3l133-115C231.7,61.3,243.6,56.9,256,56.9 M256,36.9    c-16.7,0-33.3,5.8-46.8,17.4l-133,115c-21.5,18.6-33.9,37-33.9,65.4v187.2c0,29.4,23.9,53.3,53.3,53.3h75.2    c23.1,0,41.8-18.7,41.8-41.8v-73.5c0-23.9,19.4-43.3,43.3-43.3s43.3,19.4,43.3,43.3v73.5c0,23.1,18.7,41.8,41.8,41.8h75.2    c29.4,0,53.3-23.9,53.3-53.3V234.6c0-28.4-12.4-46.8-33.9-65.4l-133-115C289.3,42.7,272.7,36.9,256,36.9L256,36.9z" /></svg>`,
        selected: `<svg xmlns="http://www.w3.org/2000/svg" class="selected" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
        <path class="st2" d="M302.8,54.3l133,115c21.5,18.6,33.9,37,33.9,65.4v187.2c0,29.4-23.9,53.3-53.3,53.3h-75.2    c-23.1,0-41.8-18.7-41.8-41.8v-73.5c0-23.9-19.4-43.3-43.3-43.3h0h0h0c-23.9,0-43.3,19.4-43.3,43.3v73.5    c0,23.1-18.7,41.8-41.8,41.8H95.6c-29.4,0-53.3-23.9-53.3-53.3V234.6c0-28.4,12.4-46.8,33.9-65.4l133-115    C236.1,31.1,275.9,31.1,302.8,54.3z" fill="url(#paint0_linear_504_930)" /><defs><linearGradient id="paint0_linear_504_930" x1="38.4156" y1="36.8874" x2="510.611" y2="430.818" gradientUnits="userSpaceOnUse"><stop stop-color="#51B1FE" /><stop offset="1" stop-color="#2774DB" /></linearGradient></defs></svg>`,
    },
    search: {
        main: `<svg xmlns="http://www.w3.org/2000/svg" class="main-icon" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"> <path d="M204.2,82.5c34.1,0,66.1,13.3,90.2,37.4c24.1,24.1,37.4,56.1,37.4,90.2s-13.3,66.1-37.4,90.2 c-24.1,24.1-56.1,37.4-90.2,37.4s-66.1-13.3-90.2-37.4c-24.1-24.1-37.4-56.1-37.4-90.2s13.3-66.1,37.4-90.2 C138.1,95.7,170.1,82.5,204.2,82.5 M204.2,48.5C115,48.5,42.7,120.8,42.7,210S115,371.6,204.2,371.6S365.8,299.3,365.8,210 S293.4,48.5,204.2,48.5L204.2,48.5z" /> <rect x="369.2" y="291.3" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -164.0599 387.8484)" width="34" height="201.3" /> <path d="M129.8,210h-34c0-59.8,48.6-108.4,108.4-108.4v34C163.2,135.6,129.8,169,129.8,210z" /> </svg>`,
        selected: `<svg width="512" height="512" viewBox="0 0 512 512" class="selected" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M204.2 82.5C238.3 82.5 270.3 95.8 294.4 119.9C318.5 144 331.8 176 331.8 210.1C331.8 244.2 318.5 276.2 294.4 300.3C270.3 324.4 238.3 337.7 204.2 337.7C170.1 337.7 138.1 324.4 114 300.3C89.9 276.2 76.5999 244.2 76.5999 210.1C76.5999 176 89.9 144 114 119.9C138.1 95.7 170.1 82.5 204.2 82.5ZM204.2 48.5C115 48.5 42.7 120.8 42.7 210C42.7 299.2 115 371.6 204.2 371.6C293.4 371.6 365.8 299.3 365.8 210C365.8 120.7 293.4 48.5 204.2 48.5Z" fill="url(#paint0_linear_504_946)" /> <path d="M327.021 308.724L302.979 332.765L445.319 475.104L469.36 451.063L327.021 308.724Z" fill="url(#paint1_linear_504_946)" /> <path d="M129.8 210H95.8C95.8 150.2 144.4 101.6 204.2 101.6V135.6C163.2 135.6 129.8 169 129.8 210Z" fill="url(#paint2_linear_504_946)" /> <defs> <linearGradient id="paint0_linear_504_946" x1="67.5" y1="70" x2="465.5" y2="473" gradientUnits="userSpaceOnUse"> <stop stop-color="#4FAEFC" /> <stop offset="1" stop-color="#2875DC" /> </linearGradient> <linearGradient id="paint1_linear_504_946" x1="84.1407" y1="178.221" x2="214.216" y2="85.7779" gradientUnits="userSpaceOnUse"> <stop stop-color="#4FAEFC" /> <stop offset="1" stop-color="#2875DC" /> </linearGradient> <linearGradient id="paint2_linear_504_946" x1="83" y1="88" x2="457.5" y2="468" gradientUnits="userSpaceOnUse"> <stop stop-color="#4FAEFC" /> <stop offset="1" stop-color="#2875DC" /> </linearGradient> </defs> </svg>`,
    },
    play: `<svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg"> <g clip-path="url(#clip0_484_888)"> <path d="M3.88672 1.67579C3.25078 1.28477 2.45156 1.27188 1.80273 1.63712C1.15391 2.00235 0.75 2.68985 0.75 3.43751V18.5625C0.75 19.3102 1.15391 19.9977 1.80273 20.3629C2.45156 20.7281 3.25078 20.7109 3.88672 20.3242L16.2617 12.7617C16.8762 12.3879 17.25 11.7219 17.25 11C17.25 10.2781 16.8762 9.61641 16.2617 9.23829L3.88672 1.67579Z" fill="white" /> </g> </svg>`,
    list: {
        main: `<svg xmlns="http://www.w3.org/2000/svg" class="main-icon" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"> <path d="M347.2,62.3c25.8,0,46.7,21,46.7,46.7v325.9L261.9,358l-10.1-5.9l-10.1,5.9l-132.1,76.9V109.1 c0-25.8,21-46.7,46.7-46.7H347.2 M347.2,42.3H156.5c-36.9,0-66.7,29.9-66.7,66.7v360.6l162.1-94.4L414,469.7V109.1 C414,72.2,384.1,42.3,347.2,42.3L347.2,42.3z" /> </svg>`,
        selected: `<svg xmlns="http://www.w3.org/2000/svg" class="selected" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"> <path d="M351.4,42.3H160.6c-36.9,0-66.7,29.9-66.7,66.7v360.6L256,375.3l162.1,94.4V109.1 C418.1,72.2,388.2,42.3,351.4,42.3z" fill="url(#paint0_linear_504_937)" /> <defs> <linearGradient id="paint0_linear_504_937" x1="90.9535" y1="42.3" x2="518.395" y2="319.697" gradientUnits="userSpaceOnUse"> <stop stop-color="#51B1FE" /> <stop offset="1" stop-color="#2774DB" /> </linearGradient> </defs> </svg>`,
    },
    user: {
        main: `<svg xmlns="http://www.w3.org/2000/svg" class="main-icon" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"> <path d="M255.1,75l0.2,0c0.2,0,0.4,0,0.7,0c0.2,0,0.4,0,0.7,0l0.2,0c23.6,0.3,46.1,10.9,63.5,29.9 c9.9,10.9,17.7,24.2,22.7,38.5c5.2,15,7.1,30.6,5.8,46.4c-3,36-14.3,65.9-32.8,86.4c-16.3,18.1-37.1,27.7-60.1,27.7 c-23,0-43.7-9.6-60.1-27.7c-18.5-20.5-29.8-50.4-32.8-86.4c-1.3-15.7,0.7-31.3,5.8-46.4c4.9-14.3,12.8-27.6,22.7-38.5 C209,85.8,231.5,75.2,255.1,75 M256.9,55c-0.3,0-0.6,0-0.9,0c-0.3,0-0.6,0-0.9,0c-0.1,0-0.1,0-0.2,0 c-66.3,0.7-117.6,66.1-111.7,136.4c7.1,85,56.3,132.4,112.8,132.4c0,0,0,0,0,0c56.5,0,105.7-47.5,112.8-132.4 c5.9-70.3-45.4-135.8-111.7-136.4C257,55,257,55,256.9,55L256.9,55z" /> <path d="M297.2,375.1l3,0c15.2,0.2,54.7,2.3,91.9,16.2c15.5,5.8,28.2,12.8,37.9,20.9c8.8,7.4,15.1,15.7,18.6,24.8 H256H63.4c6.8-17.8,23.5-32.4,49.8-43.6c23.7-10.1,54.6-16.6,84.8-17.9L297.2,375.1 M300.5,355.1l-102.9,0.5 c-56.9,2.4-137.4,23.3-154.4,79c-3.4,11.2,5,22.5,16.7,22.5H256h196.2c11.6,0,20.1-11.2,16.7-22.3 C450.4,374.3,357.2,356,300.5,355.1L300.5,355.1L300.5,355.1z" /> </svg>`,
        selected: ` <svg xmlns="http://www.w3.org/2000/svg" class="selected" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"> <path class="st2" d="M257.1,55c-0.4,0-0.7,0-1.1,0s-0.7,0-1.1,0c-66.3,0.7-117.6,66.1-111.7,136.4c7.1,85,56.3,132.5,112.8,132.4 c56.5,0,105.7-47.5,112.8-132.4C374.7,121.1,323.4,55.7,257.1,55z" fill="url(#paint1_linear_504_939)" /> <path class="st2" d="M300.5,355.1L300.5,355.1l-102.9,0.4c-56.9,2.4-137.4,23.3-154.4,79c-3.4,11.2,5,22.5,16.7,22.5H256h196.2 c11.6,0,20.1-11.2,16.7-22.3C450.4,374.3,357.2,356,300.5,355.1z" fill="url(#paint1_linear_504_939)" /> <defs> <linearGradient id="paint0_linear_504_939" x1="140.679" y1="55" x2="419.95" y2="256.354" gradientUnits="userSpaceOnUse"> <stop stop-color="#51B1FE" /> <stop offset="1" stop-color="#2774DB" /> </linearGradient> <linearGradient id="paint1_linear_504_939" x1="38.5548" y1="355.1" x2="96.2851" y2="562.175" gradientUnits="userSpaceOnUse"> <stop stop-color="#51B1FE" /> <stop offset="1" stop-color="#2774DB" /> </linearGradient> </defs> </svg>`
    }
};

(() => {
    //Добавляем елементы
    AddMenuElements();
    AddMenuButtons();
    //Выделяем выбранное страницу в меню
    SelectCurrentMenuPage();
    AddButtonEvents();
    MenuEventsUser();
    InteractiveFunctionMenu();
})();

/**
 * Добавляет основные елементы меню на сайт
 */
function AddMenuElements() {
    $('body').append(application_menu_html, application_interactive_html);
    application_menu_showed = true;
}

/**
 * Добавляет кнопки управления меню
 */
function AddMenuButtons() {
    if (application_menu_showed) {
        $('.application-menu').append(GenerateMenuButton(application_menu_icon.home.main, application_menu_icon.home.selected, "index"));
        $('.application-menu').append(GenerateMenuButton(application_menu_icon.search.main, application_menu_icon.search.selected, "search"));
        AddToContinueButton(application_menu_icon.play);
        $('.application-menu').append(GenerateMenuButton(application_menu_icon.list.main, application_menu_icon.list.selected, "list"));
        $('.application-menu').append(GenerateMenuButton(application_menu_icon.user.main, application_menu_icon.user.selected, "user"));
    }
}

/**
 * Генерирует кнопку для меню
 * @param {String} main - основная иконка (не выбрано)
 * @param {String} selected - дополнительная иконка (выбрано)
 * @param {String} target - id ключ страницы
 * @returns готовый html кнопки
 */
function GenerateMenuButton(main, selected, target) {
    return `<div class="btn-menu" data-page="${target}">${main}${selected}</div>`
}

/**
 * Добавляет в меню кнопку продолжить просмотр
 * @param {String} icon - html иконки
 */
function AddToContinueButton(icon) {
    $('.application-menu').append(`<div class="btn-menu primary" id="btnContinue">${icon}</div>`);
    $('#btnContinue').click(() => {
        let data = JSON.parse(localStorage.getItem('last-watch'));
        if (data && data[0]) {
            location.replace('watch.html?id=' + data[0].id + '&player=true&continue=' + data[0].continue);
        }
    });
}

/**
 * Добавляет события к кнопкам меню
 */
function AddButtonEvents() {
    $('.btn-menu[data-page]').click((e) => {
        window.location = application_indexed_page[$(e.currentTarget).data('page')];
    });
}

/**
 * Выделяет текущую выбранную страницу
 */
function SelectCurrentMenuPage() {
    $('.btn-menu[data-page="' + $($(`head meta[name="page"]`)[0]).attr('content') + '"]').addClass('selected');
}

/**
 * Добавляет события к кнопке с пользователем (дополнительные функции)
 */
function MenuEventsUser() {
    let target = '.btn-menu[data-page="user"]';
    let timer;

    $(target).contextmenu((e) => {
        e.preventDefault();
        ShowInteractiveMenu();
    });

    $(target).bind('touchstart', function (e) {
        clearInterval(timer);
        timer = setInterval(() => {
            ShowInteractiveMenu();
        }, 700);
        //e.preventDefault();
    });

    $(target).bind('touchend', function (e) {
        clearInterval(timer);
    });


    $('.close-interactive').click((e) => {
        HideInteractiveMenu();
    });

    function ShowInteractiveMenu() {
        $('.interactive-menu').css('display', 'block');
        setTimeout(() => {
            $('.interactive-menu').css('opacity', '1');
        }, 100);
    }

    function HideInteractiveMenu() {
        $('.interactive-menu').css('opacity', '0');

        setTimeout(() => {
            $('.interactive-menu').css({ display: 'none' });
        }, 300);
    }
}

/**
 * Функционал интеративного меню
 */
function InteractiveFunctionMenu(){
    $('.user-interactive > .btn-inter[data-intm]').click((e)=>{
        e.preventDefault();
        let key = $(e.currentTarget).data('intm');
        application_menu_interactive_func[key]();
    })
}