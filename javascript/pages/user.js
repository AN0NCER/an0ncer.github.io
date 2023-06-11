//Индентификатор пользователя
$ID = new URLSearchParams(window.location.search).get("id");

//Начало программы страницы
Main((e) => {
  $DEV.log('Auth', e);

  //Если пользователь не авторизирован сделать перенапрвление
  !usr.authorized ? window.location.href = "/login.html" : '';

  //Получаем данные пользователя
  LoadUser();

  //Скролл мышкой
  scrollElementWithMouse('.top-anime-user > .content');

  //Кнопка поделится пользователем
  $('.btn--share').click(() => {
    if (!$ID) {
      return;
    }
    navigator.share({
      title: $(document).attr("title"),
      text: $('meta[property="og:description"]').attr('content'),
      url: window.location.origin + window.location.pathname + '?id=' + $ID + '&share'
    }).catch((error) => $DEV.error('Sharing failed', error));
  });
});

/**
 * Получает данные о пользователе авторизации
 * @returns undefined
 */
function LoadUser() {
  if (!usr.authorized) {
    return;
  }

  $DEV.log('LoadUser');

  shikimoriApi.Users.whoami(async (res) => {
    $DEV.log(`Fail: ${res.failed}`, res);
    if (res.failed) {
      await sleep(1000);
      return LoadUser();
    }
    //
    usr.Storage.Set(res, usr.Storage.keys.whoami);
    //Загружаем статистику пользователя
    if (!$ID) {
      $ID = res.id;
    }
    LoadStats();
    LoadHistory();
    //Загружаем аниме пользователя
    LoadUserRates();
  });
}

/**
 * Получаем статистику пользователя (пользователь, рейтинги)
 * @returns undefined
 */
function LoadStats() {
  if (!usr.authorized && !$ID) {
    return;
  }

  shikimoriApi.Users.id($ID, {}, async (res) => {
    $DEV.log(`Fail: ${res.failed}`, res);
    if (res.failed) {
      await sleep(1000);
      return LoadStats();
    }

    //Устанавливаем изображение
    $('.avatar > img').attr('src', res.image.x160);
    $('.nikname').text(res.nickname);
    $(document).attr("title", "TUN - " + res.nickname);
    //Описание
    $('.user-info > .description').append(res.about)
    //Онлайн пользователя
    $('.user-online > .description').append(res.last_online);
    let date = new Date(res.last_online_at);
    $('.user-online > .date').append(`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`)

    let prc = ScoreToPrcnt(res.stats.scores);

    for (let i = 0; i < prc.length; i++) {
      const e = prc[i];
      $(`.r${e.name}`).css({ height: `${e.value}px` });
    }

    let animeprc = UserAnimeCountPrcnt(res.stats.full_statuses.anime);

    for (let i = 0; i < animeprc.length; i++) {
      const e = animeprc[i];
      $DEV.log(e);
      $(`.${e.name}`).css({ width: `${e.prcnt}%` });
      $(`.${e.name}`).text(e.size);
    }
  });

  function ScoreToPrcnt(scores) {
    const totalSum = scores.anime.reduce((sum, score) => sum + score.value, 0);
    const pixelValue = 60; // 100% в пикселях

    const percentagesInPixels = scores.anime.map((score) => ({
      name: score.name,
      value: Math.round((score.value / totalSum) * pixelValue),
    }));

    $DEV.log('prcnt', percentagesInPixels);
    return percentagesInPixels;
  }

  function UserAnimeCountPrcnt(anime) {
    $DEV.warn(anime);
    // Фильтруем массив anime по состояниям planned, completed и dropped
    const filteredAnime = anime.filter(item =>
      ["planned", "completed", "dropped"].includes(item.grouped_id)
    );

    // Считаем общий размер для выбранных состояний
    const totalSize = filteredAnime.reduce((sum, item) => sum + item.size, 0);

    // Преобразуем размеры в проценты и сохраняем результат в новом массиве
    const percentages = filteredAnime.map(item => ({
      ...item,
      prcnt: (item.size / totalSize) * 100
    }));

    $DEV.log(percentages);
    return percentages;
  }
}

/**
 * Получает историю пользователять просмотра
 * @param {Integer} page - страница запроса 
 * @returns undefined
 */
function LoadHistory(page = 1) {
  if (!usr.authorized && !$ID) {
    return;
  }

  shikimoriApi.Users.history($ID, { target_type: "Anime", limit: 9, page }, async (res) => {
    $DEV.log(`Fail: ${res.failed}`, res);
    if (res.failed) {
      await sleep(1000);
      return LoadHistory(page);
    }
    //Генерируем свой Object для истории
    const history = GenObjectHistory(res);

    if (res.length == 0) {
      return;
    }
    //Отображаем историю
    HistoryShow(history);

    trackScroll('scrollHistory', 200, (() => {
      LoadHistory(page + 1);
    }));
  });
}

function LoadUserRates() {
  shikimoriApi.User_rates.user_rates({
    user_id: $ID,
    target_type: 'Anime'
  }, async (res) => {
    $DEV.log(`Fail: ${res.failed}`, res);
    if (res.failed) {
      await sleep(1000);
      return LoadUserRates();
    }

    //сортируем аниме пользователя
    res = SorttUserRates(res);
    $DEV.log('Sortabled User Rates', res);

    let task_loading = []; // Список который будем загружать аниме

    //Добавляем пустышки на страницу
    for (let i = 0; i < res.length; i++) {
      const element = res[i];
      task_loading.push(element.target_id);
      $('.top-anime-user > .content').append(`<a href="/watch.html?id=${element.target_id}"  class="card-anime" data-score="${element.score}" data-id="${element.target_id}" data-status="${element.status}" data-type="all" data-loaded="false"></a>`);
    }

    //Загружаем аниме
    LoadAnimeList(task_loading);

    function LoadAnimeList(task) {
      shikimoriApi.Animes.animes({ ids: task.toString(), limit: task.length }, async (res) => {
        if (res.failed && res.status == 429) {
          await sleep(1000);
          return LoadAnimeList(task);
        }

        for (let i = 0; i < res.length; i++) {
          const element = res[i];
          AddAnime(element);
        }
      })
    }

    /**
     * Добавляет структуру елемента в документ
     * @param {Object} response shikimori аниме ответ
     */
    function AddAnime(response) {
      //Текущий елемнт который обрабатывался
      let target = $(`a[data-id="${response.id}"]`);

      //Присваем стрктуру к елементу
      target.append(GenerateCardHtml(response, target.attr('data-score')));
    }
  }).GET();
}

function SorttUserRates(resource) {
  resource.sort(function (a, b) {
    return b.score - a.score;
  });
  return resource.slice(0, 10);
}

/**
 * Переделывает Object с историей в массив данных
 * @param {Object} resource - история пользователя
 * @returns Возвращает измененый Object в Array с историей
 */
function GenObjectHistory(resource) {
  $DEV.log(resource);
  const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const daysOfWeek = ['Вск', 'Пнд', 'Втр', 'Срд', 'Чтв', 'Птн', 'Сбт'];

  var data = [];

  for (let i = 0; i < resource.length; i++) {
    const element = resource[i];
    const date = new Date(element.created_at);

    let id = `${date.getMonth()}.${date.getFullYear()}`;
    let mounthIndex = data.findIndex((x) => x.id == id);

    //Месяц
    if (mounthIndex === -1) {
      data.push({ id: id, month: months[date.getMonth()], year: date.getFullYear(), data: [] });
      mounthIndex = data.length - 1;
    }

    let dayIndex = data[mounthIndex].data.findIndex((x) => x.day == date.getDate());

    //Дни
    if (dayIndex === -1) {
      data[mounthIndex].data.push({ day: date.getDate(), week: daysOfWeek[date.getDay()], list: [] });
      dayIndex = data[mounthIndex].data.length - 1;
    }

    //Событие
    data[mounthIndex].data[dayIndex].list.push({ id: element.target.id, russian: element.target.russian, description: element.description });

    // $DEV.log('Generate', data[mounthIndex].data[dayIndex]);
  }

  // $DEV.log(data);
  return data;
}

/**
 * Отображает историю на сайте
 * @param {Array} data Данные с историей
 */
function HistoryShow(data) {
  for (let i = 0; i < data.length; i++) {
    //Месяц
    const month = data[i];
    AddMonth(month.month, month.year);
    for (let i = 0; i < month.data.length; i++) {
      //Дни
      const day = month.data[i];
      let htmlHistory = GenHtmlHistory(day.day, day.week);
      for (let i = 0; i < day.list.length; i++) {
        //События
        const event = day.list[i];
        htmlHistory += GenEvent(event.id, event.russian, event.description);
      }
      htmlHistory += EndGenHtmlHistory();
      $('.block-history').append(htmlHistory);
    }
  }

  /**
   * Добавляет на сайт название месяца
   * @param {String} name название месяца
   */
  function AddMonth(name, year) {
    $('.block-history').append(`<div class="mounth">${name}<span>${year}</span></div>`);
  }

  /**
   * Генерирует html историю для сайта (закончить EndGenHtmlHistory)
   * @param {Int} day День
   * @param {String} week День Недели
   * @returns html c началом истории
   */
  function GenHtmlHistory(day, week) {
    return `<div class="block-date-data">
              <div class="history-date">
                <span class="mon">${week}</span>
                <span class="day">${day}</span>
              </div>
            <div class="history-data">
    `
  }

  /**
   * Генерация html событие для истории вызывать после (GenHtmlHistory)
   * @param {Int} id аниме
   * @param {String} title Название аниме
   * @param {String} event Событие связаное с аниме
   * @returns Возвразает html с событие
   */
  function GenEvent(id, title, event) {
    return `<a href="/watch.html?id=${id}">
              <div class="block">
                <span class="anime-title">${title}</span>
                <span class="anime-event">${event}</span>
              </div>
            </a>`;
  }

  /**
   * Заглушка закрвыающие теги вызвать после (EndGenHtmlHistory)
   * @returns Html
   */
  function EndGenHtmlHistory() {
    return `</div></div>`;
  }
}

/**
* Генерирует html код с подготовленными данными об аниме
* @param {Object} response shikimori ответ anime
* @param {Int} score оценка пользователя
* @returns Возваращет готовый html картки аниме
*/
function GenerateCardHtml(response, score) {
  return `<div class="card-content"><img src="https://moe.shikimori.me/${response.image.original}"><div class="title"><span>${response.russian}</span></div>${score > 0 ? `<div class="my-score"><svg width="7" height="6" viewBox="0 0 7 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.19916 0.210914C4.13607 0.0820221 4.00275 0 3.85634 0C3.70993 0 3.5778 0.0820221 3.51352 0.210914L2.74813 1.76113L1.0388 2.00954C0.89596 2.03063 0.776925 2.12906 0.732883 2.26381C0.68884 2.39856 0.72455 2.54737 0.82692 2.64697L2.06726 3.85504L1.77443 5.56227C1.75063 5.70288 1.81014 5.84583 1.92799 5.92902C2.04583 6.01222 2.20177 6.02276 2.33032 5.95597L3.85753 5.15333L5.38474 5.95597C5.5133 6.02276 5.66923 6.01339 5.78708 5.92902C5.90492 5.84466 5.96444 5.70288 5.94063 5.56227L5.64662 3.85504L6.88696 2.64697C6.98933 2.54737 7.02623 2.39856 6.98099 2.26381C6.93576 2.12906 6.81792 2.03063 6.67507 2.00954L4.96455 1.76113L4.19916 0.210914Z" fill="white"/></svg>${score}</div>` : ""}</div><div class="card-information"><div class="year">${new Date(response.aired_on).getFullYear()}</div><div class="score"><svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.73196 0.745728C4.65834 0.595337 4.50279 0.499634 4.33196 0.499634C4.16112 0.499634 4.00696 0.595337 3.93196 0.745728L3.0389 2.55452L1.04446 2.84436C0.877789 2.86897 0.7389 2.98381 0.687511 3.14104C0.636122 3.29827 0.677789 3.4719 0.797233 3.58811L2.24446 4.99768L1.90279 6.98967C1.87501 7.15374 1.94446 7.32053 2.08196 7.4176C2.21946 7.51467 2.4014 7.52698 2.5514 7.44905L4.33334 6.51252L6.11529 7.44905C6.26529 7.52698 6.44723 7.51604 6.58473 7.4176C6.72223 7.31917 6.79168 7.15374 6.7639 6.98967L6.42084 4.99768L7.86807 3.58811C7.98751 3.4719 8.03057 3.29827 7.97779 3.14104C7.92501 2.98381 7.78751 2.86897 7.62084 2.84436L5.62501 2.55452L4.73196 0.745728Z" fill="#FFE600"/></svg>${response.score}</div></div>`;
}

//Функция для прокручивания елемента с помощью мышки
function scrollElementWithMouse(dom) {
  const element = $(dom)[0];

  let isDragging = false;
  let currentX;
  let initialMouseX;
  let scrollLeft;

  element.addEventListener('mousedown', (e) => {
    initialMouseX = e.clientX;
    scrollLeft = element.scrollLeft;
    isDragging = true;
  });

  element.addEventListener('mousemove', (e) => {
    if (isDragging) {
      currentX = e.clientX - initialMouseX;
      element.scrollLeft = scrollLeft - currentX;
    }
  });

  element.addEventListener('mouseup', () => {
    isDragging = false;
  });

  element.addEventListener('mouseleave', () => {
    isDragging = false;
  });

  element.addEventListener('wheel', (e) => {
    // Проверить, достигнут ли конец элемента
    if (Math.abs(element.scrollLeft - (element.scrollWidth - element.clientWidth)) <= 2 && e.deltaY > 0) {
      return;
    }
    //Проверить если число явсляется отрицательным и мы на начале элемента то прокручивать на врех дальше
    if (e.deltaY < 0 && element.scrollLeft == 0) {
      return;
    }
    e.preventDefault();
    element.scrollLeft += e.deltaY;
  });
}

/**
 * Отслеживает, когда пользователь почти прокручивает до конца определенного элемента,
 * вызывает заданную функцию и удаляет отслеживание.
 *
 * @param {string} elementId - Идентификатор элемента, до которого нужно прокрутить.
 * @param {number} threshold - Пороговое значение, по которому определяется, что пользователь почти прокрутил до конца.
 * @param {function} callback - Функция обратного вызова, которую нужно вызвать, когда пользователь почти прокрутил до конца.
 */
function trackScroll(elementId, threshold, callback) {
  const $element = $('#' + elementId);

  function handleScroll() {
    const scrollTop = $(window).scrollTop();
    const elementHeight = $element.outerHeight();
    const windowHeight = $(window).height();

    const scrollableDistance = elementHeight - windowHeight;
    const scrolledDistance = scrollTop - $element.offset().top;

    if (scrolledDistance >= scrollableDistance - threshold) {
      // Вызываем заданную функцию
      callback();

      // Удаляем отслеживание прокрутки
      $(window).off('scroll', handleScroll);
    }
  }

  // Начинаем отслеживать прокрутку
  $(window).on('scroll', handleScroll);
}