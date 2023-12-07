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
    },

    /**
     * Создание обьединеного файла m3u8
     * @param {string} q720 - ссылка на 720p
     * @param {string} q480 - ссылка на 480p
     * @param {string} q360 - ссылка на 360p
     * @returns Ссылку на объединенный файл m3u8
     */
    link_file: function ({ q720 = undefined, q480 = undefined, q360 = undefined } = {}) {
        const params = { q720, q480, q360 };
        const queryParams = Object.entries(params)
            .filter(([key, value]) => value !== undefined)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
        return `https://anime-m3u8.onrender.com/m3u8?${queryParams}`;
    }
}