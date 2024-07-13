const $SERVER = {
    sw: navigator.serviceWorker,
    cache: caches || undefined,
    version: undefined,
    hash: undefined,
    dialog_key: "dialog-update",
    updatet: false,
    functions: {
        // Удаляет регистрацию Service Worker
        removeRegistration: () => {
            return $SERVER.sw.getRegistration().then(reg => {
                return reg.unregister();
            });
        },
        // Регистрирует новый Service Worker
        newRegistration: async () => {
            return $SERVER.sw.register("./sw.js", { scope: "/" }).then(() => {
                console.log('[SW]: Registered successfully');
            }).catch(error => {
                console.error('[SW]: Registration failed', error);
            });
        },
        // Получает текущую регистрацию Service Worker
        getRegistration: async () => {
            return $SERVER.sw.getRegistration().then(reg => {
                return reg;
            });
        }
    },
    On: {
        complete: false,
        subscribe: [],
        // Подписывается на событие обновления
        Updatet: function (event) {
            if (typeof event === "function") {
                this.subscribe.push(event);
            }
            if (this.complete) {
                event($SERVER.updatet);
            }
        }
    }
};

(async () => {
    if ($SERVER.sw) {
        await $SERVER.functions.newRegistration();
        const { version, hash } = await Events().getVersion();
        Object.assign($SERVER, { version, hash });
        console.log(`[SW] - Loaded complete Version: ${$SERVER.version} - Hash: ${$SERVER.hash} to {$SERVER}`);

        ShowUIVersion();

        OnUpdate();

        UpdateSystem();
    }

    // Обрабатывает обновление интерфейса
    function OnUpdate() {
        const url = new URL(window.location.href);
        if (url.searchParams.get('update') === 'true' && url.searchParams.get('ver') && url.searchParams.get('hash')) {
            SetUIVersion({ ver: url.searchParams.get('ver'), hash: url.searchParams.get('hash') }, true);
            $('.update-progress > .progress').css({ width: '80%' });
            $('.text-update > span').text('Обновление завершено');
            $('.app-update').css({ display: 'flex' });
            $('.app-update').addClass('show');

            setTimeout(() => {
                $('.app-update').removeClass('show');
                const url = new URL(window.location.href);
                url.searchParams.delete('update');
                url.searchParams.delete('ver');
                url.searchParams.delete('hash');
                window.history.replaceState(null, '', url.toString());
            }, 3000);
            setTimeout(() => {
                $('.update-progress > .progress').css({ width: '100%' });
            }, 100);

        }
    }

    // Обновляет систему Service Worker
    async function UpdateSystem() {
        const reg = await $SERVER.functions.getRegistration();
        let newServer = undefined;

        if (reg) {
            if (reg.installing) {
                newServer = reg.installing;
            } else if (reg.waiting) {
                newServer = reg.waiting;
                const data = await ParseSWVersion();
                $SERVER.updatet = true;
                $('.app-update').css({ display: 'flex' });
                SetUIVersion(data);
                $('.app-update').addClass('show');
                $('.update-progress > .progress').css({ width: '50%' });

                const skipData = await Events().skipWaiting();
            } else if (reg.active) {
                newServer = reg.active;
            }
        }

        $SERVER.On.subscribe.forEach(event => {
            event($SERVER.updatet);
        });

        newServer.addEventListener('statechange', ev => {
            console.log(ev.target.state);
            if (ev.target.state === 'activating') {
                $('.update-progress > .progress').css({ width: '80%' });
            }
            if (ev.target.state === 'activated' || ev.target.state === 'redundant') {
                const url = new URL(window.location.href);
                url.searchParams.set('update', 'true');
                url.searchParams.set('ver', $SERVER.version);
                url.searchParams.set('hash', $SERVER.hash);
                window.location.href = url.toString();
            }
        });
    }

    // Отображает версию интерфейса
    function ShowUIVersion() {
        $('.github > .version-hash > .version > span').text($SERVER.version);
        $('.github > .version-hash > .hash').text($SERVER.hash);

        let data = JSON.parse(localStorage.getItem($SERVER.dialog_key));
        if (data === undefined) {
            data = { show: false, version: $SERVER.version, hash: $SERVER.hash, update: new Date().toJSON() };
            localStorage.setItem($SERVER.dialog_key, JSON.stringify(data));
        }
        const date = new Date(data.update);
        $('.github > .date').text(`${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`);
    }

    // События для взаимодействия с Service Worker
    function Events() {
        return {
            // Получает версию Service Worker
            getVersion: () => {
                return new Promise(async (resolve, reject) => {
                    try {
                        const data = await eventListener(220);
                        resolve({ version: data.val.ver, hash: data.val.hash });
                    } catch (error) {
                        reject(error);
                    }
                })
            },
            // Пропускает ожидание Service Worker
            skipWaiting: () => {
                return new Promise(async (resolve, reject) => {
                    try {
                        const data = await eventListener(221);
                        resolve(data);
                    } catch (error) {
                        reject(error);
                    }
                })
            }
        }

        // Слушатель событий для Service Worker
        function eventListener(code) {
            return new Promise((resolve, reject) => {
                $SERVER.sw.addEventListener("message", (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.id === code) {
                            resolve(data);
                        }
                    } catch (error) {
                        reject(error);
                    }
                    $SERVER.sw.removeEventListener("message", eventListener);
                });

                $SERVER.sw.ready.then(reg => {
                    if (reg.active) {
                        reg.active.postMessage({ id: code });
                    }
                });
            })
        }
    }

    // Устанавливает версию интерфейса
    function SetUIVersion(data, reverse = false) {
        localStorage.setItem($SERVER.dialog_key, JSON.stringify({ show: true, ver: data.ver, hash: data.hash, update: new Date().toJSON() }));
        if (reverse) {
            if ($SERVER.version === data.ver) {
                $('.update-content-version > .to-version > .cur').text(data.hash);
                $('.update-content-version > .to-version > .next').text($SERVER.hash);
            } else {
                $('.update-content-version > .to-version > .cur').text(data.ver);
                $('.update-content-version > .to-version > .next').text($SERVER.version);
            }
        } else {
            if ($SERVER.version === data.ver) {
                $('.update-content-version > .to-version > .cur').text($SERVER.hash);
                $('.update-content-version > .to-version > .next').text(data.hash);
            } else {
                $('.update-content-version > .to-version > .cur').text($SERVER.version);
                $('.update-content-version > .to-version > .next').text(data.ver);
            }
        }
    }
})();

/**
 * Получает версию с файла sw.js
 * @returns {Promise<{ver: string, hash: string}>}
 */
function ParseSWVersion() {
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