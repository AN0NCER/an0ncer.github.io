const local = ["anime-db", "user-level"];
const indexdb = ["tun-cache"];

export async function logout() {
    (await import("../core/main.core.js")).OAuth.events.clear();

    try {
        setParameter('autologin', false);
    } catch (err) {
        console.log(`[auth.logout]: ${err}`);
    }

    local.map(x => localStorage.removeItem(x));

    const { TDatabase } = await import("../modules/TDatabase.js");

    for (let i = 0; i < indexdb.length; i++) {
        const name = indexdb[i];
        await TDatabase.Delete(name);
    }

    const { Tunime } = await import("../modules/api.tunime.js");
    await Tunime.help.logout();

    window.location.replace(window.location.href);
}