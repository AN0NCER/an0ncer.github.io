import { ClearParams } from "../../modules/functions.js";
import { AppStorageKeys } from "../../modules/Settings.js";

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
        const param = new URLSearchParams(window.location.search).get("update");
        const data = JSON.parse(localStorage.getItem(AppStorageKeys.lastUpdate)) || undefined;
        ClearParams(["update"]);


        if (typeof data !== "undefined" && data.show) {
            gitFetch().then((value) => {
                if (typeof value === 'undefined') {
                    return;
                }

                if (value.tag_name === data.ver) {
                    showUpdate(value);
                } else if (param) {
                    showWindow(value);
                }
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

function GetDraftRelease(token = ""){
    const url = `https://api.github.com/repos/AN0NCER/an0ncer.github.io/releases`
    return new Promise((resolve) => {
        fetch(url, { headers: { Authorization: `Bearer ${token}` }}).then(async (response) => {
            if(!response.ok){
                return resolve({});
            }
            const data = await response.json();
            return resolve(data[0]);
        })
    })
}