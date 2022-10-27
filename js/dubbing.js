const dubbing = {
    dub: {
      dom: ".dubbing_settings > .dub",
      element: $(".dubbing_settings > .dub"),
      show: function () {
        this.element.css("display", "flex");
      },
      add: function (title, id, ec, le, link) {
        let html = `<div class="val" data-id="${id}" data-episodes-count="${ec}" data-last-episode="${le}" data-link="${link}" data-type="dub">${title}</div>`;
        $(this.dom + ">.value").append(html);
        $(`.val[data-id="${id}"]`).click((h) => {
          let el = $(h.currentTarget);
          let id = el.data("id");
          let ec = el.data("episodes-count");
          let le = el.data("last-episode");
          let link = el.data("link");
          dubbing.events.onclick({ id, ec, le, link });
        });
      }
    },
    sub: {
      dom: ".dubbing_settings > .sub",
      element: $(".dubbing_settings > .sub"),
      show: function () {
        this.element.css("display", "flex");
      },
      add: function (title, id, ec, le, link) {
        let html = `<div class="val" data-id="${id}" data-episodes-count="${ec}" data-last-episode="${le}" data-link="${link}" data-type="sub">${title}</div>`;
        $(this.dom + ">.value").append(html);
        $(`.val[data-id="${id}"]`).click((h) => {
          let el = $(h.currentTarget);
          let id = el.data("id");
          let ec = el.data("episodes-count");
          let le = el.data("last-episode");
          let link = el.data("link");
          dubbing.events.onclick({ id, ec, le, link });
        });
      }
    },
    events: {
      click: [],
      onclick: function (event) {
        if (typeof event == "function") {
          this.click.push(event);
          return;
        }
        if (this.click) {
          this.click.forEach((value) => value(event));
          return;
        }
      }
    },
    sel: {
      dom: $(`.sub > .value > .sel_dub`),
      selected: {
        type: "",
        element: "",
        id: ""
      },
      select: function (id) {
        let element = $(`.val[data-id="${id}"]`);
        if(element.length == 0){
          return;
        }
        let type = element.data('type');
        if(type != this.selected.type && this.selected.type){
          anime({
            targets: `.${this.selected.type} > .value .sel_dub`,
            width: 0,
            duration: 200,
            easing: 'cubicBezier(.5, .05, .1, .3)'
          });
          anime({
            targets: `.val[data-id="${this.selected.id}"]`,
            color: '#555657',
            duration: 200,
            easing: 'cubicBezier(.5, .05, .1, .3)'
          });
        }
        if(type == this.selected.type){
          anime({
            targets: `.val[data-id="${this.selected.id}"]`,
            color: '#555657',
            duration: 200,
            easing: 'cubicBezier(.5, .05, .1, .3)'
          });
        }
          anime({
            targets: `.${type} > .value .sel_dub`,
            width: element.outerWidth(),
            height: element.outerHeight(),
            duration: 200,
            left: element.position().left,
            top: element.position().top,
            easing: 'cubicBezier(.5, .05, .1, .3)'
          });
          anime({
            targets: `.val[data-id="${id}"]`,
            color: '#ffffff',
            duration: 200,
            easing: 'cubicBezier(.5, .05, .1, .3)'
          });
          this.selected = {
            type: type,
            element: element,
            id: id
          }
      }
    }
  };
  
  dubbing.dub.show();
  dubbing.sub.show();
  dubbing.dub.add("Name", 900, 12, 12, "#");
  dubbing.dub.add("Name", 901, 12, 12, "#");
  dubbing.dub.add("Name", 902, 12, 12, "#");
  dubbing.dub.add("Name", 903, 12, 12, "#");
  dubbing.dub.add("Name", 904, 12, 12, "#");
  dubbing.sub.add("Subtitles", 457, 12, 12, "#");
  dubbing.events.onclick((e) => {
    console.log(e.id);
    dubbing.sel.select(e.id);
  });
  