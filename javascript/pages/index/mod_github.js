import { $PWA } from "../../core/pwa.core.js";
import { ClearParams } from "../../modules/functions.js";

const url = "https://api.github.com/repos/AN0NCER/an0ncer.github.io/releases/latest";

export function GitHubRel() {
    function gitFetch() {
        return new Promise((resolve) => {
            fetch(url).then(async (response) => {
                if (!response.ok) {
                    return resolve(undefined);
                }
                const jsonData = await response.json();
                return resolve(jsonData);
            })
        });
    };

    const showUpdate = (data) => {
        import("./mod_update.js").then((mod) => {
            mod.Update.Set(data);
            mod.Update.Show("update");
        });
    };

    const showWindow = (data) => {
        import("./mod_update.js").then((mod) => {
            mod.Update.Set(data);
            mod.Update.Show("show");
        });
    };

    try {
        const update = $PWA.meta.update.has;
        const param = new URLSearchParams(window.location.search).get("update");
        ClearParams(['update']);

        if (update) {
            gitFetch().then((value) => {
                if (typeof value === 'undefined') {
                    return;
                }

                const raw = ((def = { id: 0, tag_name: '0.0.0' }) => {
                    try {
                        return JSON.parse(localStorage.getItem('app-confirmed')) || def;
                    } catch {
                        return def;
                    }
                })();

                if (value.id === raw.id) {
                    $PWA.meta.update.remove();
                    return;
                }

                showUpdate(value);
            });
        } else if (param) {
            gitFetch().then((value) => {
                if (typeof value === 'undefined') {
                    return;
                }

                showWindow(value);
            });
        }
    } catch (err) {
        console.log('Ошибка отображения обновления', err);
    }
}

export function GitTags(page = 1) {
    const url = `https://api.github.com/repos/AN0NCER/an0ncer.github.io/tags?page=${page}`;
    return new Promise((resolve) => {
        fetch(url).then(async (response) => {
            if (!response.ok) {
                return resolve([])
            }
            const data = await response.json();
            return resolve(data);
        });
    });
}

export function GitCommit(tag) {
    const url = `https://api.github.com/repos/AN0NCER/an0ncer.github.io/releases/tags/${tag}`;
    return new Promise((resolve) => {
        fetch(url).then(async (response) => {
            if (!response.ok) {
                return resolve({});
            }
            const data = await response.json();
            return resolve(data);
        });
    })
}

function GetDraftRelease(token = "") {
    const url = `https://api.github.com/repos/AN0NCER/an0ncer.github.io/releases`
    return new Promise((resolve) => {
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(async (response) => {
            if (!response.ok) {
                return resolve({});
            }
            const data = await response.json();
            return resolve(data[0]);
        })
    })
}

$PWA.events.on('load', () => {
    const meta = $PWA.meta;
    const date = new Date(meta.date);

    $('.pwa-version > .v').text(`v${meta.version}`);
    $('.pwa-version > .h').text(`[${meta.hash}]`);
    $('.pwa-date-update').text(`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`);
}, { replay: true });