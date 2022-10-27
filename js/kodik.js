let url = "";
let kodik_episode = 1;

$.ajax({
    url:
        "https://kodikapi.com/search?token=7ee795cd3e4f7078e7f5d430569d6559&shikimori_id=" + urlParams.get('shikimori')
}).done((e) => {

    for (let index = 0; index < e.results.length; index++) {
        const element = e.results[index];
        if (element.translation.type == "voice") {
            dubbing.dub.add(element.translation.title, element.translation.id, element.episodes_count, element.last_episode, element.link);
            dubbing.dub.show();
        } else {
            dubbing.sub.add(element.translation.title, element.translation.id, element.episodes_count, element.last_episode, element.link);
            dubbing.sub.show();
        }
    }
    dubbing.sel.select(e.results[0].translation.id);
    for (let index = 1; index <= e.results[0].episodes_count; index++) {
        episodes.add(index);
    }
    url = e.results[0].link;
    $('#kodik-player').attr('src', url + '?hide_selectors=true&season=1&episode='+kodik_episode);
});

dubbing.events.onclick((e) => {
    url = e.link;
    $('#kodik-player').attr('src', url + '?hide_selectors=true&season=1&episode='+kodik_episode);
});

episodes.events.onchangeselect((e)=>{
    kodik_episode = e;
    $('#kodik-player').attr('src', url + '?hide_selectors=true&season=1&episode='+kodik_episode);
});