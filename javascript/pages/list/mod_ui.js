import { ScrollElementWithMouse } from "../../modules/functions.js";

function ScrollMenu() {
    let threshold = $(`.anime-list`).offset().top + 56;
    let scrollTopPrev = $('.app').scrollTop(); // Текущая позиция скролла
    let accumulatedScrollUp = 0; // Накопленное расстояние прокрутки вверх
    let showDistance = 300; // Расстояние, через которое меню снова появится
    let isMenuHidden = false; // Флаг состояния меню

    $('.app').scroll(function () {
        let scrollTop = $('.app').scrollTop();
        let appOffset = scrollTop; // Прокрутка внутри элемента .app

        // Если прокрутка идет вниз
        if (scrollTop > scrollTopPrev) {
            // Если прокрутка прошла порог и меню еще не скрыто, скрываем его
            if (appOffset > threshold && !isMenuHidden) {
                $(`.application-menu`).addClass(`hide`);
                isMenuHidden = true; // Меню скрыто
            }
            // Сбрасываем накопленное расстояние при прокрутке вниз
            accumulatedScrollUp = 0;
        }

        // Если прокрутка идет вверх
        if (scrollTop < scrollTopPrev) {
            // Накопление пройденного расстояния вверх
            accumulatedScrollUp += (scrollTopPrev - scrollTop);

            // Если накопленное расстояние превышает showDistance, показываем меню
            if (accumulatedScrollUp >= showDistance && isMenuHidden) {
                $(`.application-menu`).removeClass(`hide`);
                isMenuHidden = false; // Меню отображено
                accumulatedScrollUp = 0; // Сбрасываем накопленное расстояние после отображения меню
            }
        }

        // Обновляем предыдущую позицию скролла
        scrollTopPrev = scrollTop;
    });
}

/**
 * Перезагрузка страницы
 */
function PageReload(dom) {
    const $reload = $('.app-reload');
    $(dom).on('touchstart.reload', (e) => {
        let scroll = 0;
        let reload = false;
        
        $(`.app`).on('scroll.reload', (e) => {
            scroll = e.target.scrollTop;
            onReload();
        });

        $(window).on('scroll.reload', (e) => {
            scroll = window.scrollY;
            onReload();
        });

        $(dom).on('touchend.reload', async (e) => {
            if (scroll <= -100) {
                reload = true;
                window.location.reload();
            } else {
                $reload.css({ top: '-300px' });
            }
            $(dom).off('scroll.reload');
            $(dom).off('touchend.reload');
        });

        const onReload = () => {
            if (scroll <= -30 && !reload) {
                $reload.css({ top: '20px' });
                $reload.find('.wrapper').css({ padding: '' });
                $reload.find('.wrapper > svg').css({ width: '' });
            } else if (!reload) {
                $reload.css({ top: '-300px' });
                $reload.find('.wrapper').css({ padding: '' });
                $reload.find('.wrapper > svg').css({ width: '' });

            }
            if (scroll <= -100) {
                $reload.css({ top: '60px' });
                $reload.find('.wrapper').css({ padding: '17px' });
                $reload.find('.wrapper > svg').css({ width: '17px' });
            }
        }
    });
}

export const InitUI = () => {
    ScrollMenu();
    PageReload(document);
    ScrollElementWithMouse('.span-row');
}