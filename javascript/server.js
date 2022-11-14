function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js', { scope: '/' }).then(() => {
            console.log('[SW]: Registered successfully.');
        }).catch(error => {
            console.log('[SW]: Registration failed:', error);
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

async function detectSWUpdate() {
    const registration = await navigator.serviceWorker.ready;

    registration.addEventListener("updatefound", event => {
        const newSW = registration.installing;
        newSW.addEventListener("statechange", event => {
            if (newSW.state == "installed") {
                console.log('[SW]: New service worker is installed, but waiting activation');
                // New service worker is installed, but waiting activation
            }
        });
    })
}

detectSWUpdate();