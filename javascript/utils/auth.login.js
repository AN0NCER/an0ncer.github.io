const local = ["anime-db", "access_token", "access_whoami"];
const indexdb = ["tun-cache"];

const codes = {
    'DEVICE_BLOCKED': "Устройство было заблокировано пользователем.",
    'CODE_REQUIRED': "Нажми авторизоваться.",
    'DEFAULT': "Непредвиденная ошибка."
}

export async function login(code) {
    const { TDatabase } = await import("../modules/TDatabase.js");
    const { OAuth } = await import("../core/main.core.js");

    OAuth.events.clear();
    local.map(x => localStorage.removeItem(x));

    for (let i = 0; i < indexdb.length; i++) {
        const name = indexdb[i];
        await TDatabase.Delete(name);
    }

    let application_event = localStorage.getItem('application_event');
    try {
        await OAuth.requests.authorizate(code);
        localStorage.removeItem('application_event');

        if (application_event == "autologin") {
            //После авторизации переходим на главную страницу
            return window.location.href = "/index.html";
        }
        //После авторизации переходим на страницу пользователся
        return window.location.href = "/user.html?onload=true"
        //Если авторизация была неудачна, то нас выкинет обратно на страницу авторизации
    } catch (err) {
        const text = codes[err?.value?.msg] ? codes[err?.value?.msg] : codes['DEFAULT'];
        throw new Error(text);
    }
}