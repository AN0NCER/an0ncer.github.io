/**
 * Когда была команда обновить файлы;
 * В нашем примере это работает как обновление программы
 */
navigator.serviceWorker?.addEventListener('controllerchange', () => {
    //Указываем что было обновление
    localStorage.setItem('dialog-update', true);
    //Чтобы изменения вступили в силу нужно перезагрузить страницу (программу)
    window.location.reload();
});

/**
 * Регистрируем ServiceWorker
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js', { scope: '/' }).then(() => {
            console.log('[SW]: Registered successfully.');
        }).catch(error => {
            console.log('[SW]: Registration failed:', error);
        });
    }
}

//Начало программы server.js
(() => {
    //Регистриуем приложение service worker
    registerServiceWorker();
})();