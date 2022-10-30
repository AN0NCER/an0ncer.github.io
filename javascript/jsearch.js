const jsearchType = {
    dom: '.dropdown-content button',
    animate: false,
    visible: false,
    duration: 300,
    easing: 'linear',
    select: "",
    initialized: false,
    events: {
        select: [],
        onselect: function (e) {
            if (typeof (e) == 'function') {
                this.select.push(e);
                return;
            }
            if (this.select.length != 0) {
                this.select.forEach(func => func(e));
                return;
            }
        }
    },
    show: function () {
        anime({
            targets: this.dom,
            opacity: 1,
            easing: this.easing,
            duration: this.duration,
            begin: function (anim) {
                jsearchType.animate = true;
                for (let index = 0; index < $(jsearchType.dom).length; index++) {
                    const element = $(jsearchType.dom)[index];
                    element.style.display = "flex";
                }
            },
            complete: function (anim) {
                jsearchType.animate = false;
                jsearchType.visible = true;
            }
        });
    },
    hide: function () {
        anime({
            targets: '.dropdown-content button',
            opacity: 0,
            easing: this.easing,
            duration: this.duration,
            begin: function (anim) {
                jsearchType.animate = true;

            },
            complete: function (anim) {
                jsearchType.animate = false;
                for (let index = 0; index < $('.dropdown-content button').length; index++) {
                    const element = $('.dropdown-content button')[index];
                    element.style.display = "none";
                }
                jsearchType.visible = false;
            }
        });
    },
    init: function () {
        if (this.initialized == true) {
            return this.initialized;
        }
        this.initialized = true
        $('.dropbtn').click((h) => {
            this.visible ? this.hide() : this.show();
            $('.dropbtn').focus();
        });
        $(this.dom).click((h) => {
            this.select = $(h.currentTarget).data('type');
            $('.showin_text').text($(h.currentTarget).text());
            this.events.onselect({ select: this.select });
            this.hide();
        });
        $('.dropbtn').blur((h) => {
            this.hide();
        });
    }
}

const jsearchSupp = {
    dom: '.supp',
    showing: false,
    show: function (v = [0, 53]) {
        anime({
            targets: this.dom,
            opacity: 1,
            translateY: v
        });
        this.showing = true;
    },
    hide: function (v = [53, 0]) {
        anime({
            targets: this.dom,
            opacity: 0,
            translateY: v
        });
        this.showing = false;
    },
    variation: {
        dom: ".variation",
        attribute: "position",
        add: function (t) {
            for (let index = 0; index < $(this.dom).length; index++) {
                const element = $(this.dom)[index];
                if ($(element).text() == t) {
                    return;
                }
            }
            let vposition = 0;
            let count = $(this.dom).length;
            vposition = count + 1;
            $(jsearchSupp.dom).append(
                `<div class="variation" data-position="${vposition}">${t}</div>`
            );
        },
        count: function () {
            return $(this.dom).length;
        },
        change: function (a = []) {
            if (this.count() > a.length) {
                let c = this.count();

                for (let index = a.length; index < c; index++) {
                    let element = $('.variation[data-position="' + (index + 1) + '"]');
                    element.remove();
                }
            }
            for (let index = 0; index < a.length; index++) {
                let element = $('.variation[data-position="' + (index + 1) + '"]');
                if (element.length > 0) {
                    element.text(a[index]);
                } else {
                    this.add(a[index]);
                }
                if (jsearchSupp.select.selected == index + 1) {
                    jsearchSupp.select.select(jsearchSupp.select.selected);
                }
                if (jsearchSupp.select.selected > a.length) {
                    jsearchSupp.select.select();
                }
            }
        },
        changeOne: function (v, i) { },
        get: function (i = jsearchSupp.select.selected) {
            if (i && typeof (i) == 'number') {
                let el = $(`${this.dom}[data-position="${i}"]`);
                return el.text();
            }
        }
    },
    select: {
        dom: ".select",
        selected: undefined,
        select: function (n = 1) {
            if (this.selected && this.selected != n) {
                anime({
                    targets: '.variation[data-position="' + this.selected + '"]',
                    color: "#686a77"
                });
            }
            let variation = $('.variation[data-position="' + n + '"]');
            let width = variation.outerWidth();
            let left = variation.position().left;
            this.selected = n;
            anime({
                targets: this.dom,
                width: width,
                translateX: left
            });
            anime({
                targets: '.variation[data-position="' + n + '"]',
                color: "#fff"
            });
        },
        next: function () {
            if (this.selected) {
                anime({
                    targets: '.variation[data-position="' + this.selected + '"]',
                    color: "#686a77"
                });
            }

            if (jsearchSupp.variation.count() < this.selected + 1) {
                this.selected = 1;
            } else {
                this.selected++;
            }

            let variation = $('.variation[data-position="' + this.selected + '"]');
            let width = variation.outerWidth();
            let left = variation.position().left;
            anime({
                targets: this.dom,
                width: width,
                translateX: left
            });
            anime({
                targets: '.variation[data-position="' + this.selected + '"]',
                color: "#fff"
            });
        }
    },
}

const jsearchInput = {
    dom: '#search',
    typingTimer: undefined,
    initialized: false,
    doneTypingInterval: 1000,
    changed: false,
    last: "",
    value: function () { return $(this.dom).val(); },
    type: function () { return /[a-zA-Z]/.test(this.value()) ? "en" : "ru" },
    events: {
        focus: [],
        blur: [],
        onfocus: function (e) {
            if (typeof (e) == 'function') {
                this.focus.push(e);
                return;
            }
            if (this.focus.length != 0) {
                this.focus.forEach(func => func(e));
                return;
            }
        },
        onblur: function (e) {
            if (typeof (e) == 'function') {
                this.blur.push(e);
                return;
            }
            if (this.blur.length != 0) {
                this.blur.forEach(func => func(e));
                return;
            }
        }
    },
    doneTyping: async function () {
        let data = [];
        let anime = await SearchAnime(jsearchInput.value(), 5);
        for (let index = 0; index < anime.length; index++) {
            const element = anime[index];
            if(jsearchInput.type() == "ru"){
                data.push({href: element.id, title: element.russian, year: new Date(element.released_on).getFullYear(), score: element.score});
            }else{
                data.push({href: element.id, title: element.name, year: new Date(element.released_on).getFullYear(), score: element.score});
            }
        }
        jsearchResult.change(data);
    },
    interception: function (e) {
        let kc = e.keyCode;

        //Tab
        if (kc == 9) {
            e.preventDefault();
            jsearchSupp.select.next();
        }
        if (this.changed == true && kc != 9 && kc != 32) {
            this.changed = false;
        }
        if (this.changed == true && kc == 32 && this.last != "") {
            this.changed = false;
            $(this.dom).val(this.last);
            this.last = "";
            return;
        }
        //Space
        if (kc == 32) {
            let value = jsearchSupp.variation.get();
            if (this.changed == false && value != "" && value != undefined) {
                this.changed = true;
                this.last = this.value();
                console.log(this.last);
                let val = $(this.dom).val().split(" ").pop();
                let change = $(this.dom).val().replace(val, value);
                $(this.dom).val(change);
                console.log(change);
                jsearchSupp.select.selected = undefined;
                return;
            }
        }
    },
    searchsupp: async function (e) {
        if (e.originalEvent) {
            if (e.originalEvent.keyCode == 9) {
                return;
            }
        }
        let value = this.value().split(" ").pop();
        if (this.value().length < 2 || value.length == 0) {
            if (jsearchSupp.showing) {
                jsearchSupp.hide();
            }
            return;
        }
        let anime = await SearchAnime(this.value(), 5);
        let variation = [];
        for (let index = 0; index < anime.length; index++) {
            const element = anime[index];
            let regval;
            if (this.type() == "ru") {
                regval = SearchForText(element.russian, value);
            } else {
                regval = SearchForText(element.name, value);
            }
            if (regval) {
                if (!variation.includes(regval)) {
                    variation.push(regval);
                }
            }
        }
        jsearchSupp.variation.change(variation);
        if (jsearchSupp.variation.count() == 0) {
            if (jsearchSupp.showing) {
                jsearchSupp.hide();
                jsearchResult.show();
            }
        } else {
            if (!jsearchSupp.showing) {
                jsearchSupp.show();
                jsearchResult.show();
            }
            if (!jsearchSupp.select.selected) {
                jsearchSupp.select.select();
                jsearchResult.show();
            }
        }
    },
    init: function () {
        if (this.initialized == true) {
            return this.initialized;
        }
        this.initialized = true

        //Method search anime

        $(this.dom).on("keyup", (e) => {
            clearTimeout(this.typingTimer);
            this.typingTimer = setTimeout(this.doneTyping, this.doneTypingInterval);
        });

        //on keydown, clear the countdown
        $(this.dom).on("keydown", () => {
            clearTimeout(this.typingTimer);
        });

        $(this.dom).keydown((e) => this.interception(e));
        $(this.dom).keyup((e) => this.searchsupp(e))
        $(this.dom).focus(() => { this.events.onfocus() });
        $(this.dom).blur(() => { this.events.onblur() });
    }
}

const jsearchResult = {
    dom: '.results',
    duration: 500,
    easing: 'linear',
    show: function () {
        let top = "55px";
        console.log(jsearchSupp.showing);
        if(jsearchSupp.showing){
            top = "95px";
        }
        anime({
            targets: this.dom,
            opacity: 1,
            top: top,
            duration: 300,
            easing: this.easing,
            begin: (anim) => {
                $(this.dom)[0].style.display = "flex";
            },
            complete: function (anim) {

            }
        })
    },
    hide: function () {
        anime({
            targets: this.dom,
            opacity: 0,
            duration: 500,
            easing: 'linear',
            begin: (anim) => {

            },
            complete: (anim) => {
                $(this.dom)[0].style.display = "none";
            }
        })
    },
    count: function (){
        return $(this.dom + " > a").length;
    },
    add: function (data = {href: "#", title: "Title", year: "0000", score: "0.0"}) {
        let count = this.count() + 1;
        const html = this.control_html(data, count, "display:none; opacity: 0;");
        $(this.dom).append(html);
        anime({
            targets: `a[data-id="${count}"]`,
            opacity: 1,
            duration: this.duration,
            translateY: [100,0],
            easing: this.easing,
            begin: ()=>{
                $(`${this.dom}>a[data-id="${count}"]`)[0].style.display = "block";
            }
        });
    },
    change: function(data = [{href: "#", title: "Title", year: "0000", score: "0.0"}]){
        for (let index = 0; index < this.count(); index++) {
            if(index < data.length){
                let d = data[index];
                let changed =false;
                let timeline = anime.timeline({
                    duration: 750,
                    easing: 'easeOutExpo',
                }).add({
                    targets: `a[data-id="${(index+1)}"]`,
                    translateX: ["0","50%"],
                    opacity: 0,
                    update: (anim)=>{
                        if(timeline.children[0].completed && changed == false){
                            changed = true;
                            $(`a[data-id="${(index+1)}"] .title > span`).text(d.title);
                            $(`a[data-id="${(index+1)}"] .year > span`).text(d.year);
                            $(`a[data-id="${(index+1)}"] .score > span`).text(d.score);
                        }
                    }
                }).add({
                    targets: `a[data-id="${(index+1)}"]`,
                    translateX: ["-50%","0"],
                    opacity:1,
                }, "-=50");
            }else{
                let element = $(`a[data-id="${(index+1)}"]`);
                anime({
                    targets: `a[data-id="${(index+1)}"]`,
                    duration: 750,
                    opacity: 0,
                    easing: 'easeOutExpo',
                    complete: ()=>{
                        element.remove();
                    }
                })
            }            
        }

        if(data.length > this.count()){
            let count = this.count();
            for (let index = 0 + count; index < data.length; index++) {
                console.log(index);
                const element = data[index];
                console.log(element);
                this.add(element);
            }
        }

        if(this.count() != 0){
            this.show();
        }
    },
    control_html: function(data = {href: "#", title: "Title", year: 0000, score: "0.0"},id=1,style = ""){
        return `<a href="${data.href}" data-id="${id}" style="${style}"><div class="result_anime"><div class="title"><span>${data.title}</span></div><div class="year"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M232 120C232 106.7 242.7 96 256 96C269.3 96 280 106.7 280 120V243.2L365.3 300C376.3 307.4 379.3 322.3 371.1 333.3C364.6 344.3 349.7 347.3 338.7 339.1L242.7 275.1C236 271.5 232 264 232 255.1L232 120zM256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0zM48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48C141.1 48 48 141.1 48 256z" /></svg><span>${data.year}</span></div><div class="score"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" /></svg><span>${data.score}</span></div><div class="enter">Enter</div></div></a>`;
    },
}

jsearchType.init();
jsearchInput.init();

$(jsearchInput.dom).val("Маст");
$(jsearchInput.dom).keyup();


function SearchAnime(value, limit = 3) {
    return new Promise((resolve) => {
        fetch(`https://shikimori.one/api/animes?limit=${limit}&search=${value}&kind=${jsearchType.select}`, {
            method: "GET",
            headers: {
                "User-Agent": "Tunime"
            }
        }).then((response) => {
            if (!response.ok) {
                resolve({ failed: true, status: response.status });
            }
            resolve(response.json());
        });
    });
}

function SearchForText(text, symbol) {
    let ret = undefined;
    let words = text.split(" ");
    let chars = symbol.split("");
    for (let index = 0; index < words.length; index++) {
        const c = words[index].split("");
        if (c.length > chars.length) {
            let overlap = 0;
            for (let index1 = 0; index1 < chars.length; index1++) {
                if (chars[index1].toUpperCase() == c[index1].toUpperCase()) {
                    overlap++;
                }
            }
            if (overlap == chars.length) {
                return words[index];
            }
        }
    }
    return ret;
}