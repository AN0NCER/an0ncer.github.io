const kurl = 'https://kodik.tunime.app';

export const Kodik = {
    List: function (query = {}, event = () => { }, signal) {
        return Fetch(query, "list", event, signal);
    },

    Search: function (query = {}, event = () => { }, signal) {
        return Fetch(query, "search", event, signal);
    },

    Translations: function (query = {}, event = () => { }, signal) {
        return Fetch(query, "translations/v2", event, signal);
    }
}

async function Fetch(query = {}, page, event = () => { }, signal) {
    const url = `${kurl}/${page}${Query(query)}`;
    return new Promise((resolve) => {
        fetch(url, {
            method: 'GET',
            signal
        }).then((response) => {
            let ret = { failed: true };
            if (!response.ok) {
                resolve(ret);
                return event(ret);
            }
            response.json().then((val) => {
                ret = val;
                resolve(ret);
                event(ret);
            }, (reas) => {
                console.log(reas);
                resolve(ret);
                event(ret);
            });
        }, err => {
            if (["AbortError", "tabort"].includes(err?.name)) return resolve({ failed: true, aborted: true });

            // Сеть / CORS: как и ответ с ошибкой
            console.log(err);
            const ret = { failed: true };
            resolve(ret);
            event(ret);
        });
    });
}

function Query(query) {
    let q = "?";
    if (Object.keys(query).length > 0) {
        q += new URLSearchParams(query).toString();
    }
    return q;
}