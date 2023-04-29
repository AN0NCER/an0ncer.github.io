//Управление окнами визуала
const WindowManagment = {
    authorized: false,
    showed: false,
  
    target: {
      /**
       * Инициализация функции окна, запускается если прошел верификацию (this.verif)
       */
      init: function () { },
      /**
       * Отображение окна
       */
      show: function () { },
      /**
       * Скрытие окна
       */
      hide: function () { },
      /**
       * Проверка для инициализация окна. Если проверка не нужна просто верни true
       * @returns Возвращает boolean
       */
      verif: function () { return true; },
    },
  
    init: function (authorized) {
      this.authorized = authorized;
      $('.hide-window').click(() => {
        this.hide();
        this.target.hide();
      })
    },
  
    click: function (target = this.target) {
      if (!target.verif()) {
        return;
      }
      this.target = target;
      this.target.init();
      this.show();
      this.target.show();
    },
  
    hide: async function () {
      this.showed = false;
      let el = $('.windowed');
      $('.hide-window').css('opacity', 0);
      await sleep(300);
      el.addClass('hide');
      $('.hide-window').css('opacity', '');
    },
  
    show: async function () {
      this.showed = true;
      let el = $('.windowed.hide');
      el.css('display', 'block');
      await sleep(10);
      $('.hide-window').css('opacity', 1);
      el.removeClass('hide');
      el.css('display', '');
      await sleep(300);
      $('.hide-window').css('opacity', '');
    }
  }