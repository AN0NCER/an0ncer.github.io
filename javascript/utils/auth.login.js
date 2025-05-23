const local = ["anime-db", "user-level"];
const indexdb = ["tun-cache"];

export async function login(code) {
    const { TDatabase } = await import("../modules/TDatabase.js");
    const { User } = await import("../modules/ShikiUSR.js");

    User.Storage.Clear();
    local.map(x => localStorage.removeItem(x));

    for (let i = 0; i < indexdb.length; i++) {
        const name = indexdb[i];
        await TDatabase.Delete(name);
    }

    let application_event = localStorage.getItem('application_event');
    await User.Authorizate(code);
    localStorage.removeItem('application_event');

    if (application_event == "autologin") {
        //После авторизации переходим на главную страницу
        return window.location.href = "/index.html";
    }
    //После авторизации переходим на страницу пользователся
    return window.location.href = "/user.html"
    //Если авторизация была неудачна, то нас выкинет обратно на страницу авторизации
}