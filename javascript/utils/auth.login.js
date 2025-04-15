const local = ["anime-db", "user-level"];
const indexdb = ["tun-cache"];

export async function login() {
    const { User, Oauth } = await import("../modules/ShikiUSR.js");
    const { TDatabase } = await import("../modules/TDatabase.js");

    User.Storage.Clear();

    local.map(x => localStorage.removeItem(x));

    for (let i = 0; i < indexdb.length; i++) {
        const name = indexdb[i];
        await TDatabase.Delete(name);
    }

    if (User.isteste) {
        localStorage.removeItem('application_event');
        //Если тестовый режим то запрашиваем код от пользователя
        let code = prompt("Тестовый режим авторизации:");
        if (code) {
            //Проверяем авторизацию и переходим на станицу пользователя
            await User.Authorizate(code);
            window.location.href = "/user.html"
        } else {
            window.open(Oauth.GetUrl(), '_blank').focus();
        }
    } else {
        window.location.href = Oauth.GetUrl();
    }
}