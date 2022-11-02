let url = "";

let dataLocal = {
    kodik_seasson: 1,
    kodik_episode: 1,
    kodik_dub: ''
}

const urlParametrs = new URLSearchParams(window.location.search);
const shikimoriID = urlParametrs.get('id');

if (shikimoriID != null) {
    let sd = localStorage.getItem(shikimoriID);
    if (sd) {
        dataLocal = JSON.parse(localStorage.getItem(shikimoriID));
    }
}

shikimoriUser.Events.oninit(() => {
    shikimoriApi.Animes.id(shikimoriID, (response) => {
        Visual(response);
    });
    shikimoriApi.Animes.roles(shikimoriID, (response) => {
        //console.log(response);
    });
});

kodikApi.search({ shikimori_id: shikimoriID }, (response) => {
    //console.log(response);
    for (let index = 0; index < response.results.length; index++) {
        AddDub(response.results[index]);
    }
    if (dataLocal.kodik_dub) {
        SelectDub(dataLocal.kodik_dub);
    } else {
        SelectDub(response.results[0].translation.id);
    }
    SetPlayer();
    ShowEpisodes(dubbing.sel.selected.element.data('last-episode'));
    SelectEpisode();
})

shikimoriUser.init();

dubbing.events.onclick((e) => {
    console.log(e);
    dataLocal.kodik_dub = e.id;
    SaveStorage();
    url = e.link;
    SetPlayer();
});


episodes.events.onchangeselect((e) => {
    dataLocal.kodik_episode = e;
    SaveStorage();
    SetPlayer();
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

function SelectDub(id) {
    dataLocal.kodik_dub = id;
    SaveStorage();
    dubbing.sel.select(id);
    url = dubbing.sel.selected.element.data('link');
}

function ShowEpisodes(count) {
    for (let index = 1; index <= count; index++) {
        episodes.add(index);
    }
}

function SelectEpisode() {
    episodes.select(dataLocal.kodik_episode);
}

function SaveStorage() {
    localStorage.setItem(shikimoriID, JSON.stringify(dataLocal));
}

function Visual(response) {
    $('.bg-paralax-img').css('background-image', 'url(https://kawai.shikimori.one' + response.image.original + ')');
    $(document).attr("title", response.russian);
    $('.russian').text(response.russian);
    $('.name').text(response.name);
    $('.raiting > span').text(response.score);
    for (let index = 0; index < response.genres.length; index++) {
        const element = response.genres[index];
        $('.janres').append(`<div class="val">${element.russian}</div>`)
    }
    $('.description > .content').text(response.description);
}

function SetPlayer() {
    $('#kodik-player').attr('src', url + '?hide_selectors=true&season=' + dataLocal.kodik_seasson + '&episode=' + dataLocal.kodik_episode);
}