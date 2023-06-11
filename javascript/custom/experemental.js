//Эту библиотеку загружать последним
const $EXPEMENTAL = {
    links: {
        'watch.html': 'https://raw.githubusercontent.com/AN0NCER/an0ncer.github.io/ex-watch/javascript/pages/ex-watch.js',
    },
};

(() => {
    //Если эта функция включена
    if (!$PARAMETERS.experement) {
        return;
    }

    $DEV.log(`[expr] - Load experements function`);
    let page = window.location.pathname.split('/').pop();

    if (page) {
        $DEV.log(`[expr] - Finded experemental ${page}`);
        loadLibrary($EXPEMENTAL.links[page]);
    }
})();

function loadLibrary(libraryUrl) {
    fetch(libraryUrl)
        .then(response => response.text())
        .then(script => {
            const scriptElement = document.createElement('script');
            scriptElement.textContent = script;
            document.head.appendChild(scriptElement);
            $DEV.log(`[expr] - Load (${libraryUrl}) completed`);

        })
        .catch(error => {
            console.error('Ошибка загрузки скрипта:', error);
            $DEV.log(`[expr] - Error (${libraryUrl}) load`);
        });
}