import { SetUpdateData, ShowUpdateWindow, UpdateKey } from "./mod_window.js";

const url = "https://api.github.com/repos/AN0NCER/an0ncer.github.io/releases";

export function GitHubRel() {
    fetch(url).then(async (response) => {
        if (!response.ok) {
            OfflineData();
            return;
        }

        const jsonData = await response.json();
        const dateLastRelease = new Date(jsonData[0].published_at);

        $('.github > .version > span').text(jsonData[0].tag_name); // <- Отображение текущей версии с гита
        $('.github > .date').text(`${dateLastRelease.getFullYear()}.${dateLastRelease.getMonth() + 1}.${dateLastRelease.getDate()}`); // <- Отображение даты последнего релиза
        UpdatetGithub(jsonData);
    });
}


function UpdatetGithub(data) {
    let saved_git_version = JSON.parse(localStorage.getItem('github-version'));

    if (saved_git_version == null || saved_git_version.tag != data[0].tag_name) {
        //Пользователь находиться без ключа об обновлениях
        if (localStorage.getItem(UpdateKey()) == null) {
            localStorage.setItem(UpdateKey(), true);
        }
        //Если было обновление показываем диалоговое окно
        if (localStorage.getItem(UpdateKey()) == "true") {
            SetUpdateData(data);
            ShowUpdateWindow();
        }
    }
}

function OfflineData() {
    let saved_git_version = JSON.parse(localStorage.getItem('github-version'));
    if (saved_git_version == null) {
        return;
    }
    let date = new Date(saved_git_version.published_at);
    $('.github > .version > span').text(saved_git_version.tag);
    $('.github > .date').text(`${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`);
}