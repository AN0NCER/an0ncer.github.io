Main(async () => {

  if (!usr.authorized) {
    window.location.href = "/login.html";
  }

  if (usr.authorized) {
    shikimoriApi.Users.whoami((response) => {
      usr.Storage.Set(response, usr.Storage.keys.whoami);
      console.log(response);
      $(".account--image > img").attr("src", response.image.x160);
      $(".account--title").text(response.nickname);
      $(".account--year > span").text(
        response.full_years ? response.full_years : "?"
      );
      Stats(response.id);
      History(response.id);
    });
  }

});

$(document).ready(() => {
  $("#menu--statistick").click(() => {
    $("#menu--statistick").addClass("menu--btn--select");
    $("#menu--settings").removeClass("menu--btn--select");

    $(".main--status").removeClass("hide");
    $(".main--settings").addClass("hide");
  });
  $("#menu--settings").click(() => {
    window.location.href = "settings.html";
  });

  // $(".main--settings--synch--btn").click(() => {
  //   if (
  //     confirm(
  //       "Синхронизировать с сервера? \r\n ДА - C сервера в приложение \r\n Отменить - С телефона на сервер"
  //     )
  //   ) {
  //     let data = synch.get();
  //     if (data) {
  //       console.log(data);
  //       for (let key in data) {
  //         console.log(key);
  //         localStorage.setItem(key, data[key]);
  //       }
  //       alert('Готово');
  //     }
  //   } else {
  //     let data = {};

  //     for (var i = 0, len = localStorage.length; i < len; ++i) {
  //       //console.log(localStorage.key(i));
  //       if (
  //         localStorage.key(i) == "access_token" ||
  //         localStorage.key(i) == "access_whoami" ||
  //         localStorage.key(i) == "bearer"
  //       ) {
  //         continue;
  //       }
  //       data[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
  //       //console.log(localStorage.getItem(localStorage.key(i)));
  //     }
  //     synch.set(data);
  //   }
  // });
});

function Stats(id) {
  shikimoriApi.Users.id(id, {}, async (response) => {
    if (response.failed && response.status == 429) {
      await sleep(1000);
      Stats(id);
      return;
    }
    console.log(response);
    response.stats.full_statuses.anime.forEach((element) => {
      if (element.grouped_id == "planned") {
        $(".main--status--statistics--block--value#planned").text(element.size);
      }
      if (element.grouped_id == "watching") {
        $(".main--status--statistics--block--value#watching").text(
          element.size
        );
      }
      if (element.grouped_id == "completed") {
        $(".main--status--statistics--block--value#completed").text(
          element.size
        );
      }
    });

    synch.init(response);
  });
}

function History(id) {
  shikimoriApi.Users.history(
    id,
    { target_type: "Anime", limit: 5 },
    async (response) => {
      if (response.failed && response.status == 429) {
        await sleep(1000);
        History(id);
        return;
      }
      for (let index = 0; index < response.length; index++) {
        const element = response[index];
        const days = Math.round(
          (Date.parse(new Date()) - Date.parse(element.created_at)) / 86400000
        );
        const date = `${new Date(element.created_at).getFullYear()}.${new Date(
          element.created_at
        ).getMonth()}.${new Date(element.created_at).getDay()}`;
        $(".main--status--history").append(`<div class="list--history">
            <div class="list--history--icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zm0-160c-53 0-96-43-96-96s43-96 96-96s96 43 96 96s-43 96-96 96z" /></svg>
            </div>
            <div class="list--history--block">
                <div class="list--history--date">
                    <span>${DaysText(days)}</span><span>${date}</span>
                </div>
                <div class="list--history--text">
                    <spa><a href="/watch.html?id=${element.target.id}">${element.target.russian
          }</a></spa> <span>${element.description}</span>
                </div>
            </div>
        </div>`);
      }
      console.log(response);
    }
  );
}

function DaysText(d) {
  if (d == 0) return "сегодня";
  if (d == 1) return `${d} день назад`;
  if (d > 1 && d < 5) return `${d} дня назад`;
  if (d >= 5 && d < 20) {
    return `${d} дней назад`;
  }
  if (d >= 20 && d < 100) {
    let cc = String(d).match(/(.)$/)[0];
    if (cc == "0") return `${d} дней назад`;
    if (cc == "1") return `${d} день назад`;
    if (cc == "2" || cc == "3" || cc == "4") return `${d} дня назад`;
    return `${d} дней назад`;
  }
  if (d >= 100) {
    let cc = String(d).match(/(.)$/)[0];
    let ccdub = String(d).match(/(..)$/)[0];
    if (
      cc == "0" ||
      ccdub == "11" ||
      ccdub == "12" ||
      ccdub == "13" ||
      ccdub == "14"
    )
      return `${d} дней назад`;
    if (cc == "1") return `${d} день назад`;
    if (cc == "2" || cc == "3" || cc == "4") return `${d} дня назад`;
    return `${d} дней назад`;
  }
}

//https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep/39914235#39914235
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const synch = {
  loaded: false,
  style_id: undefined,
  inserted: false,
  data_saved: undefined,
  founded: false,
  style: undefined,

  init: function (response) {
    if (response) {
      this.style_id = response.style_id;
      this.load();
    }
  },

  load: function () {
    shikimoriApi.Styles.id(this.style_id, (response) => {
      this.style = response.css;
      if (response.css.search(/TunimeData/) != -1) {
        //founded data from shikimori
        this.founded = true;
        const regex = /\[SYNCH\]\r\n([^]*)\r/;
        const match = regex.exec(response.css);
        if (match) {
          const data = match[1].trim(); // убрать лишние пробелы и переносы строк
          this.data_saved = data.replace("//", "");
        }
      }
      this.loaded = true;
    }).GET();
  },

  get: function () {
    if (this.loaded && this.data_saved) {
      return JSON.parse(decodeURIComponent(atob(this.data_saved)));
    }
  },

  set: function (data) {
    if (this.loaded) {
      let css = this.style;

      if (!this.founded) {
        css += "\r\n//**TunimeData**";
      }

      if (!this.data_saved) {
        css += "\r\n//" + "[SYNCH]";
        css +=
          "\r\n//" + btoa(encodeURIComponent(JSON.stringify(data))) + "\r\n";
      } else {
        const regex = /\[SYNCH\]\r\n([^]*)\r/;
        css = css.replace(
          regex,
          "[SYNCH]\r\n//" +
          btoa(encodeURIComponent(JSON.stringify(data))) +
          "\r"
        );
      }

      console.log(css);
      shikimoriApi.Styles.id(this.style_id, (response) => {
        console.log(response);
      }).PATCH({ style: { css: css, name: "Tunime" } });
    }
    // if(this.loaded){
    //   let css = ;
    //
    // }
  },
};
