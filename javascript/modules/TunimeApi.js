let _updateData = undefined;
let _enabled = false;

GetOnlineData();
setInterval(() => {
    GetOnlineData();
}, 299000);

function GetOnlineData() {
    fetch('https://tunime.onrender.com/online').then((response) => {
        return response.json();
    }).then((val) => {
        _updateData = val;
        _enabled = true;
    });
}

export const ApiTunime = {
    anime: async function (id) {
        fetch(`https://tunime.onrender.com/online/${id}/o`).then((response) => {
            return response.json();
        }).then((val) => {
            console.log(val);
        });
    },

    online: function () {

    },

    /**
     * Получение stream аниме
     * @param {string} url - ссыка на Kodik c https://
     * @returns 
     */
    stream: function (url) {
        return new Promise((resolve) => {
            fetch(`https://anime-m3u8.onrender.com/link-anime`, { body: new URLSearchParams({ 'link': url }), method: 'post' })
                .then(function (response) { return response.json(); })
                .then(function (data) { return resolve(data); })
                .catch((res) => { console.log(res) });
        });
    }
}