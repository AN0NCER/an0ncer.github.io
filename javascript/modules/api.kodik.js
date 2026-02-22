const kurl = 'https://kodik-proxy.anime-tunime.workers.dev';

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
                event(ret);
                return resolve(ret);
            }
            response.json().then((val) => {
                ret = val;
                event(ret);
                return resolve(ret);
            }).catch((reas) => {
                console.log(reas);
                event(ret);
                return resolve(ret);
            });
        }).catch(err => {
            if (err?.name === "tabort") return;
            throw err;
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