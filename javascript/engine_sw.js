const engine = {
    sw_file: '/data/swiper.json',
    sliders: {},
    dom: '#slide-engine',
    get_file: function () {
        return new Promise((resolve, reject) => {
            fetch(this.sw_file, { method: "GET" }).then((result) => {
                resolve(result.json());
            }).catch((err) => {

            });
        });
    },
    init: async function () {
        const t = await this.get_file();
        this.sliders = t.slides;
    },
    addslides: function () {
        for (let index = 0; index < this.sliders.length; index++) {
            const element = this.sliders[index];
            let html = `<div class="swiper-slide">${element.obj}</div>`;
            $(this.dom).append(html);
            this.addstyles(element.styles)
            this.runscript(element.script)
        }
    },
    addstyles: function (css) {
        var css = css,
            head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('style');
        head.appendChild(style);
        style.appendChild(document.createTextNode(css));
    },
    runscript: function (script){
        eval(script);
    }
}

$(document).ready(async () => {
    await engine.init();
    engine.addslides();
    const swiper = new Swiper('.swiper', {
        // Optional parameters
        direction: 'horizontal',
        //slidesPerView: 1,
        loop: false,
        effect: 'slide',
        pagination: {
            el: '.swiper-pagination',
            clickable: false,
        },
    });
});