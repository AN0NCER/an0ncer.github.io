const api = 'íç»÷\x97\x1DÝî\x1FïNü{·ùw\x8Dôç¯]ë\x9E}';
const kurl = 'https://' + btoa('\x92\x87b\x91ªb') + '.com';

export const Kodik = {
    List: function (query = {}, event = () => { }) {
        return Fetch(query, "list", event);
    },

    Search: function (query = {}, event = () => { }) {
        return Fetch(query, "search", event);
    },

    Translations: function (query = {}, event = () => { }) {
        return Fetch(query, "translations/v2", event);
    }

}

async function Fetch(query = {}, page, event = () => { }) {
    const url = `${kurl}/${page}${Query(query)}`;
    return new Promise((resolve) => {
        fetch(url, {
            method: 'GET'
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
        });
    });
}

function Query(query) {
    let q = "?token=" + btoa(api) + "&";
    if (Object.keys(query).length > 0) {
        q += new URLSearchParams(query).toString();
    }
    return q;
}