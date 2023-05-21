//Эту библиотеку загружать последним
const $EXPEMENTAL = {
    links: {
        'watch.html': 'https://cdn.jsdelivr.net/gh/AN0NCER/an0ncer.github.io@ex-watch/javascript/pages/ex-watch.js',
    },
};

(() => {
    //Если эта функция включена
    if (!$PARAMETERS.experement) {
        return;
    }

    DevLog(`[expr] - Load experements function`);
    let page = window.location.pathname.split('/').pop();

    if (page) {
        DevLog(`[expr] - Finded experemental ${page}`);
        loadLibrary($EXPEMENTAL.links[page]);
    }
})();

function loadLibrary(libraryUrl) {
    var script = document.createElement('script');
    script.src = libraryUrl;

    script.onload = function () {
        // Код будет выполнен, когда библиотека успешно загрузится
        DevLog(`[expr] - Load (${libraryUrl}) completed`);
    };

    script.onerror = function () {
        // Код будет выполнен в случае ошибки загрузки библиотеки
        DevLog(`[expr] - Error (${libraryUrl}) load`);
    };

    document.head.appendChild(script);
}