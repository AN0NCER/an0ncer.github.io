let _updateData = undefined;
let _enabled = false;


GetOnlineData();
setInterval(() => {
    GetOnlineData();
}, 299000);

function GetOnlineData() {
    fetch('https://tunime.onrender.com/online').then((respnose) => {
        return respnose.json();
    }).then((val) => {
        _updateData = val;
        _enabled = true;
    });
}

export function GetM3U8(url) {
    return new Promise((resolve) => {
        fetch("https://anime-m3u8.onrender.com/link-anime", { body: new URLSearchParams({ 'link': 'https:' + url }), method: 'post' })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                return resolve(data);
            }).catch((res)=>{
                console.error(res);
            });
    });
}