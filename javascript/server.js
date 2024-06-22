const SW = navigator.serviceWorker;
let currentVersion = { ver: 'undef', hash: 'undef' };

(async () => {
    if (SW) {
        //Статус о регистрации sw.js в приложении
        const regInfo = await SW.getRegistration();

        if (regInfo === undefined) {
            await SW.register('sw.js', { scope: '/' }).then(() => {
                console.log('[SW]: Registered successfully.');
            }).catch(error => {
                console.log('[SW]: Registration failed:', error);
            });
        }

        Main();
    }

    async function Main() {
        const keyStorage = "dialog-update";
        const pages = ['/', '/index.html'];
        let newServiceWorker = undefined;


        //Скрипт только для главной страницы
        if (pages.includes(window.location.pathname) && SW) {
            //Сообщения от SW
            SW.addEventListener('message', (ev) => {
                try {
                    /**@type {{id: number, val: string | object}} */
                    const data = JSON.parse(ev.data);
                    if (data.id === 220) {
                        currentVersion = data.val;
                        SetVersion();
                    }
                } catch {
                    console.log('[SW] - Message', ev);
                }
            })
            //Статус о регистрации sw.js в приложении
            const regInfo = await SW.getRegistration();

            if (regInfo) {
                if (regInfo.installing) {
                    newServiceWorker = regInfo.installing;
                } else if (regInfo.waiting) {
                    newServiceWorker = regInfo.waiting;
                    ShowUpdate();
                } else if (regInfo.active) {
                    newServiceWorker = regInfo.active;
                }

                regInfo.onupdatefound = (ev) => {
                    SW.getRegistration().then((swr) => {
                        if (swr.installing) {
                            newServiceWorker = swr.installing;
                        } else if (swr.waiting) {
                            newServiceWorker = swr.waiting;
                        } else if (swr.active) {
                            newServiceWorker = swr.active;
                        }
                        newServiceWorker.addEventListener('statechange', (ev) => {
                            if (ev.currentTarget.state === 'activated') {
                                CompleteUpdate();
                            }
                        });
                    })
                    //Во время пользоваением приложения было изменение sw.js
                    ShowUpdate();
                }
            }

            newServiceWorker.addEventListener('statechange', ev => {
                //Установлена новая версия sw.js (обновляем страницу чтобы применить изменения)
                if (ev.currentTarget.state === 'activated') {
                    CompleteUpdate();
                }
            });

            SW.ready.then(registartion => {
                if (registartion.active) {
                    registartion.active.postMessage(220);
                }
            });

            async function ShowUpdate() {
                const newVersion = await ParseVersion();
                $('.app-update').css({ display: 'flex' });
                if (currentVersion.ver === newVersion.ver) {
                    $('.update-content-version > .to-version > .cur').text(currentVersion.hash);
                    $('.update-content-version > .to-version > .next').text(newVersion.hash);
                    try {
                        let data = JSON.parse(localStorage.getItem(keyStorage));
                        if (data.show != undefined) {
                            data.update = new Date().toJSON();
                            localStorage.setItem(keyStorage, JSON.stringify(data));
                        }
                    } catch (err) {
                        console.log('Не удалось устновить данные', err);
                    }
                } else {
                    $('.update-content-version > .to-version > .cur').text(currentVersion.ver);
                    $('.update-content-version > .to-version > .next').text(newVersion.ver);
                    //Указываем что было обновление
                    localStorage.setItem(keyStorage, JSON.stringify({ show: true, ver: newVersion.ver, update: new Date().toJSON() }));
                }
                setTimeout(() => {
                    $('.app-update').addClass('show');
                    setTimeout(() => {
                        $('.update-progress > .progress').css({ width: '50%' });
                        SW.getRegistration().then((reg) => {
                            if (reg.waiting) {
                                reg.waiting.postMessage(221);
                            }
                        });
                    }, 500);
                }, 300)
            }

            function CompleteUpdate() {
                $('.update-progress > .progress').css({ width: '100%' });
                setTimeout(() => {
                    location.reload()
                }, 500);
            }

            function SetVersion() {
                $('.github > .version-hash > .version > span').text(currentVersion.ver);
                $('.github > .version-hash > .hash').text(currentVersion.hash);
                try {
                    let data = JSON.parse(localStorage.getItem(keyStorage))
                    //Проверка на старрые тип данных до версии 2.0.2
                    if (!data.update) {
                        let ver = '2.0.0'
                        if (currentVersion.ver != 'undef')
                            ver = currentVersion.ver;
                        data = { show: data, ver: ver, update: new Date().toJSON() };
                        localStorage.setItem(keyStorage, JSON.stringify(data));
                    }
                    const date = new Date(data.update);
                    $('.github > .date').text(`${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`);
                } catch (error) {
                    console.log('Ошибка отображения версии', error);
                }
            }
        }
    }
})();

/**
 * Получает версию с файла sw.js
 * @returns {Promise<{ver: string, hash: string}>}
 */
function ParseVersion() {
    return new Promise((resolve) => {
        fetch('sw.js').then((val) => {
            val.text().then(val => {
                const versionRegex = /const\s+version\s+=\s+'([^']+)';/;
                const hashRegex = /const\s+hash\s+=\s+'([^']+)';/;

                const versionMatch = val.match(versionRegex);
                const hashMatch = val.match(hashRegex);

                if (versionMatch && hashMatch) {
                    // Извлекаем значения версии и хэша из найденных совпадений
                    const versionValue = versionMatch[1];
                    const hashValue = hashMatch[1];

                    // Возвращаем объект с извлеченными значениями
                    return resolve({ ver: versionValue, hash: hashValue })
                } else {
                    return resolve({ ver: '0.0.0', hash: '00000' });
                }
            }).catch(reason => {
                return resolve({ ver: '0.0.0', hash: '00000' });
            })
        }).catch(reason => {
            return resolve({ ver: '0.0.0', hash: '00000' });
        });
    });
}