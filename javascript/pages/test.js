Main((e) => {
    if (e) {
        shikimoriApi.Users.unread_messages(usr.Storage.Get(usr.Storage.keys.whoami).id, async (response) => {
            console.log(response);
        });
        shikimoriApi.Users.messages(usr.Storage.Get(usr.Storage.keys.whoami).id, { type: "notifications" }, async (response) => {
            console.log(response);
        });
    }
});