
//Отображен ли меню на сайте
let application_menu_showed = false;
//Интерактивное меню устройства
const application_interactive_html = `<div class="interactive-menu" style="display: none; opacity: 0;"></div>`;
//Меню приложения устройства
const application_menu_html = `<div class="application-menu"></div>`;
//Страниы для переходов
const application_indexed_page = {
    index: 'index.html',
    list: 'list.html',
    search: 'search.html',
    user: 'user.html'
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

function SelectCurrentMenuPage() {
    $('.btn-menu[data-page="' + $($(`head meta[name="page"]`)[0]).attr('content') + '"]').addClass('selected');
}

// if (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches) {  
//     //This is appliction
//     const html = `<div class="phone_menu">
//     <div class="btn_menu">
//         <div class="icon_btn" data-page="index">
//             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>
//         </div>
//         <div class="icon_btn" data-page="search">
//             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352c79.5 0 144-64.5 144-144s-64.5-144-144-144S64 128.5 64 208s64.5 144 144 144z"/></svg>
//         </div>
//         <div class="icon_btn" data-page="list">
//             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
//                 <path d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z"/>
//             </svg>
//         </div>
//         <div class="icon_btn" data-page="user">
//             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
//                 <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0S96 57.3 96 128s57.3 128 128 128zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/>
//             </svg>
//         </div>
//     </div>
// </div>`;
// $('body').append(html);
//     const page = $($(`head meta[name="page"]`)[0]).attr('content');
//     let el = $('.icon_btn[data-page="'+page+'"]');
//     if(el.length != 0){
//         el.addClass('selected');
//     }
//     $('.icon_btn').click((h)=>{
//         let link = $(h.currentTarget).data('page');
//         if(link != undefined){
//             window.location.replace('/'+link+'.html');
//         }
//     })
// }  