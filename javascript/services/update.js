import { Manager } from './dispatcher.js';
//В этом файле нужно сделать наблюдателя на service worker для не основных стрнаиц
//и если он был активирован новый service worker то на главной странице отобразить про обновление
//Попробывать роеализовать проверку на обновления для Tunime Api auto update

(async () => {
    if (typeof navigator.serviceWorker === 'undefined') {
        return;
    }
    
    console.log(`[service] - Update`);
    
    const reg = await navigator.serviceWorker.getRegistration();

    let newServer = undefined;

    if (reg !== undefined) {
        newServer = reg.installing || reg.waiting || reg.active;

        reg.onupdatefound = async () => {
            const swr = await navigator.serviceWorker.getRegistration();
            newServer.removeEventListener('statechange', OnStateChange);
            newServer = swr.installing || swr.waiting || swr.active;
            newServer.addEventListener('statechange', OnStateChange);
        }

        newServer.addEventListener('statechange', OnStateChange);
    }

    async function OnStateChange(ev) {
        if (ev.target.state === 'activated') {
            //Получить новую версию
            const newVersion = await GetVersionSW(ev.target);
            Manager.NewTask('bg-update', 'update').data({ version: newVersion.version, hash: newVersion.hash });
        }
    }
})();


function GetVersionSW(sw) {
    return new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.id === 220) {
                    navigator.serviceWorker.removeEventListener('message', event);
                    resolve({ version: data.val.ver, hash: data.val.hash });
                }
            } catch (error) {
                console.log(error);
            }
        });
        sw.postMessage({ id: 220 });
    })
}