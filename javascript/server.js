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
        if (window.matchMedia('(display-mode: standalone)').matches) {
            
        }else{
           this.style.display = "none";
        }
    }
}

customElements.define('pwa-show', PWAShow);