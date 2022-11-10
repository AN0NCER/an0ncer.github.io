function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js', { scope: '/' }).then(() => {
            console.log('Service Worker registered successfully.');
        }).catch(error => {
            console.log('Service Worker registration failed:', error);
        });
    }
}

registerServiceWorker();

class PWAShow extends HTMLElement {
    constructor() {
        super();
        if (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches) {

        }else{
           this.style.display = "none";
        }
    }
}

class PWAHide extends HTMLElement{
    constructor() {
        super();
        if (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches) {
            this.style.display = "none";
        }
    }
}

customElements.define('pwa-show', PWAShow);
customElements.define('pwa-hide', PWAHide);