const urlParametrs = new URLSearchParams(window.location.search);
const shikimoriID = urlParametrs.get('id');

let url = "";
let kodik_episode = 1;

shikimoriUser.Events.oninit(() => {
    shikimoriApi.Animes.id(shikimoriID, (response) => {
        console.log(response);
        $('.bg-paralax-img').css('background-image', 'url(https://kawai.shikimori.one'+response.image.original+')');
        $(document).attr("title", response.russian);
        $('.russian').text(response.russian);
        $('.name').text(response.name);
        $('.raiting > span').text(response.score);
        for (let index = 0; index < response.genres.length; index++) {
            const element = response.genres[index];
            $('.janres').append(`<div class="val">${element.russian}</div>`)
        }
        $('.description > .content').text(response.description);
    });
    shikimoriApi.Animes.roles(shikimoriID, (response) => {
        console.log(response);
    });
});

kodikApi.search({ shikimori_id: shikimoriID }, (response) => {
    console.log(response);
    for (let index = 0; index < response.results.length; index++) {
        AddDub(response.results[index]);
    }
    url = response.results[0].link;
    SelectDub(response.results[0].translation.id);
    ShowEpisodes(response.results[0].episodes_count);
    $('#kodik-player').attr('src', url + '?hide_selectors=true&season=1&episode='+kodik_episode);
})

shikimoriUser.init();

dubbing.events.onclick((e) => {
    url = e.link;
    $('#kodik-player').attr('src', url + '?hide_selectors=true&season=1&episode='+kodik_episode);
});

episodes.events.onchangeselect((e)=>{
    kodik_episode = e;
    $('#kodik-player').attr('src', url + '?hide_selectors=true&season=1&episode='+kodik_episode);
});

function AddDub(element) {
    if (element.translation.type == "voice") {
        dubbing.dub.add(element.translation.title, element.translation.id, element.episodes_count, element.last_episode, element.link);
        dubbing.dub.show();
    } else {
        dubbing.sub.add(element.translation.title, element.translation.id, element.episodes_count, element.last_episode, element.link);
        dubbing.sub.show();
    }
}

function SelectDub(id){
    dubbing.sel.select(id)
}

function ShowEpisodes(count){
    for (let index = 1; index <= count; index++) {
        episodes.add(index);
    }
}