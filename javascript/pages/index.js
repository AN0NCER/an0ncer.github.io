Main((e) => {
    console.log(e);

    shikimoriApi.Animes.animes({ kind: 'tv', order: 'ranked', status: 'ongoing', limit: 8, season: new Date().getFullYear() }, async (response) => {
        for (let index = 0; index < response.length; index++) {
            const element = response[index];
            let html = `<div class="swiper-slide-anim"> <a href="/watch.html?id=${element.id}"> <div class="card_anime"> <img src="https://nyaa.shikimori.one${element.image.original}" alt="${element.russian}"> <div class="card_user"></div> <div class="card_content"> <div class="episodes"> ${element.episodes_aired} Серий </div><div class="title">${element.russian}</div><div class="score"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>${element.score}</div></div></div></a> </div>`;
            $('#newanime').append(html);
        }
    });

});

new Swiper('.swiper_anim', {
    // Optional parameters
    direction: 'horizontal',
    slidesPerView: 'auto',
    spaceBetween: 0,
    //slidesPerView: 1,
    loop: false,
    slideClass: 'swiper-slide-anim',
    coverflowEffect: {
        rotate: 30,
        slideShadows: false,
        scale: .5
    }
});

function _0x42aa(_0x54c002, _0x274c6e) { const _0x16262c = _0x1626(); return _0x42aa = function (_0x42aa5e, _0x4e35b6) { _0x42aa5e = _0x42aa5e - 0x9b; let _0x39dc96 = _0x16262c[_0x42aa5e]; return _0x39dc96; }, _0x42aa(_0x54c002, _0x274c6e); } function _0x1626() { const _0x48d31d = ['\x22\x20alt=\x22', 'results', '\x22>\x20<div\x20class=\x22card_user\x22></div>\x20<div\x20class=\x22card_content\x22>\x20<div\x20class=\x22episodes\x22>\x20', 'failed', 'Animes', '#updateanime', '<div\x20class=\x22swiper-slide-anim\x22>\x20<a\x20href=\x22/watch.html?id=', 'original', '74504FKsAuK', 'append', '19551eqRKLS', 'length', 'anime-serial', 'list', 'push', 'image', '4143340ZDguPg', '</div></div></div></a>\x20</div>', '33390WPZLqZ', 'animes', 'russian', '\x20Серий\x20</div><div\x20class=\x22title\x22>', '</div><div\x20class=\x22score\x22>\x20<svg\x20xmlns=\x22http://www.w3.org/2000/svg\x22\x20viewBox=\x220\x200\x20576\x20512\x22><path\x20d=\x22M316.9\x2018C311.6\x207\x20300.4\x200\x20288.1\x200s-23.4\x207-28.8\x2018L195\x20150.3\x2051.4\x20171.5c-12\x201.8-22\x2010.2-25.7\x2021.7s-.7\x2024.2\x207.9\x2032.7L137.8\x20329\x20113.2\x20474.7c-2\x2012\x203\x2024.2\x2012.9\x2031.3s23\x208\x2033.8\x202.3l128.3-68.5\x20128.3\x2068.5c10.8\x205.7\x2023.9\x204.9\x2033.8-2.3s14.9-19.3\x2012.9-31.3L438.5\x20329\x20542.7\x20225.9c8.6-8.5\x2011.7-21.2\x207.9-32.7s-13.7-19.9-25.7-21.7L381.2\x20150.3\x20316.9\x2018z\x22/></svg>', '26viqyvQ', 'ready', '1246748oxWjLd', '1328lkyMWN', 'toString', '1660635tRsWUi', '65412vTSQWf', '9lDjrXi', '11VPXNyZ', '210dRdCoe', '1781nPDgaI']; _0x1626 = function () { return _0x48d31d; }; return _0x1626(); } const _0x17d245 = _0x42aa; (function (_0x13e148, _0x19fa7e) { const _0x313376 = _0x42aa, _0x25dbbb = _0x13e148(); while (!![]) { try { const _0x14e59b = -parseInt(_0x313376(0xa1)) / 0x1 * (parseInt(_0x313376(0xb0)) / 0x2) + -parseInt(_0x313376(0xb7)) / 0x3 * (-parseInt(_0x313376(0xb2)) / 0x4) + -parseInt(_0x313376(0xb9)) / 0x5 * (parseInt(_0x313376(0xab)) / 0x6) + parseInt(_0x313376(0xa3)) / 0x7 * (parseInt(_0x313376(0xb3)) / 0x8) + parseInt(_0x313376(0xb5)) / 0x9 + parseInt(_0x313376(0xa9)) / 0xa * (-parseInt(_0x313376(0xb8)) / 0xb) + -parseInt(_0x313376(0xb6)) / 0xc * (-parseInt(_0x313376(0xba)) / 0xd); if (_0x14e59b === _0x19fa7e) break; else _0x25dbbb['push'](_0x25dbbb['shift']()); } catch (_0x4d398c) { _0x25dbbb['push'](_0x25dbbb['shift']()); } } }(_0x1626, 0xae2a9), $(document)[_0x17d245(0xb1)](async () => { const _0x597224 = _0x17d245; let _0x4afa0f = await kodikApi[_0x597224(0xa6)]({ 'sort': 'updated_at', 'limit': 0x8, 'types': _0x597224(0xa5) }); if (!_0x4afa0f[_0x597224(0x9c)]) { let _0x54a3c9 = []; for (let _0x24831a = 0x0; _0x24831a < _0x4afa0f[_0x597224(0xbc)][_0x597224(0xa4)]; _0x24831a++) { _0x54a3c9[_0x597224(0xa7)](_0x4afa0f[_0x597224(0xbc)][_0x24831a]['shikimori_id']); } _0x4afa0f = await shikimoriApi[_0x597224(0x9d)][_0x597224(0xac)]({ 'ids': _0x54a3c9[_0x597224(0xb4)](), 'limit': 0x8 }); for (let _0xc07eb7 = 0x0; _0xc07eb7 < _0x4afa0f['length']; _0xc07eb7++) { const _0x378e11 = _0x4afa0f[_0xc07eb7]; let _0x12d25d = _0x597224(0x9f) + _0x378e11['id'] + '\x22>\x20<div\x20class=\x22card_anime\x22>\x20<img\x20src=\x22https://nyaa.shikimori.one' + _0x378e11[_0x597224(0xa8)][_0x597224(0xa0)] + _0x597224(0xbb) + _0x378e11['russian'] + _0x597224(0x9b) + _0x378e11['episodes_aired'] + _0x597224(0xae) + _0x378e11[_0x597224(0xad)] + _0x597224(0xaf) + _0x378e11['score'] + _0x597224(0xaa); $(_0x597224(0x9e))[_0x597224(0xa2)](_0x12d25d); } } }));

if (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches) {
    fetch("https://api.github.com/repos/AN0NCER/an0ncer.github.io/releases").then(async (response)=>{
        if(response.ok){
            let data = await response.json();
            console.log(data[0]);
            let date = new Date(data[0].published_at);
            $('pwa-show > .content > .version > b').text(data[0].tag_name);
            $('pwa-show > .content > .date > span').text(`${date.getFullYear()}.${date.getMonth()}.${date.getDay()}`);
        }
    });         
}