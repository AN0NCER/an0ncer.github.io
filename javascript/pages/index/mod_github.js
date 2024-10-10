import { SetUpdateData, ShowUpdateWindow, UpdateKey } from "./mod_window.js";

const url = "https://api.github.com/repos/AN0NCER/an0ncer.github.io/releases/latest";

export function GitHubRel() {
    try {
        const data = JSON.parse(localStorage.getItem(UpdateKey())) || undefined;
        if (typeof data !== "undefined" && data.show) {
            fetch(url).then(async (response) => {
                if (!response.ok) {
                    return;
                }
                const jsonData = await response.json();
                if (jsonData.tag_name === data.ver) {
                    SetUpdateData(jsonData);
                    ShowUpdateWindow();
                }
            });
        }
    } catch (err) {
        console.log('Ошибка отображения обновления', err);
    }
}