function shikimoriFetch(method = "GET", url = "", headers = {}, body = "") {
    return {
        method: method,
        url: url,
        headers: headers,
        body: body,
        badresponse: {
            failed: true,
            status: "404"
        },
        setMethod: function (method) {
            this.method = method;
            return this.method;
        },

        setUrl: function (url) {
            this.url = url;
            return this.url;
        },

        setHeaders: function (headers) {
            this.headers = headers;
            return this.headers;
        },

        setBody: function (body) {
            this.body = body;
            return this.body;
        },

        fetch: function () {
            if (!this.url) {
                return this.badresponse;
            }

            let request = {
                method: this.method,
                headers: this.headers
            }

            if (this.body) {
                request.body = this.body;
            }

            return new Promise((resolve) => {
                fetch(this.url, request).then((response) => {
                    if (!response.ok) {
                        let r = this.badresponse;
                        r.status = response.status;
                        resolve(r);
                    }
                    resolve(response.json());
                });
            });
        },


    }
}
const shikimoriUser = {
    authorized: false,
    init: async function () {
        let code;
        if ((code = this.checkLoagin()) != false) {
            this.authorized = await this.authorization(code);
            this.Events.oninit();
            return;
        }
        if (this.Storage.Get() == undefined) {
            this.authorized = false;
        } else {
            if (!this.Oauth.access) {
                this.Oauth.access = JSON.parse(this.Storage.Get());
            }
            //Check Live Account
            if (!this.expires()) {
                this.logout();
            } else {
                this.refresh();
                this.authorized = true;
            }
            this.Events.oninit();
            return;
        }
        this.Events.oninit();
    },

    expires: function (access = this.Oauth.access) {
        if (new Date((access.created_at + access.expires_in) * 1000) > new Date()) {
            return true;
        } else {
            return false;
        }
    },

    authorization: async function (code) {
        let shikfetch = shikimoriFetch();
        let body = this.Oauth.getBodyAccessToken();
        body.append('code', code);
        shikfetch.setUrl(this.Oauth.base_url);
        shikfetch.setBody(body);
        shikfetch.setMethod("POST");
        shikfetch.setHeaders({ "User-Agent": "Tunime" });
        let response = await shikfetch.fetch();
        if (response.failed) {
            //Bad Code;
            return false;
        }
        this.Oauth.access = response;
        this.Storage.Set(JSON.stringify(response));
        return true;
    },

    refresh: async function (access = this.Oauth.access) {
        let shikfetch = shikimoriFetch();
        let body = this.Oauth.getBodyRefreshToken();
        body.append('refresh_token', access.refresh_token);
        shikfetch.setUrl(this.Oauth.base_url);
        shikfetch.setBody(body);
        shikfetch.setMethod("POST");
        shikfetch.setHeaders({ "User-Agent": "Api Test" });
        let response = await shikfetch.fetch();
        if (response.failed) {
            //Bad Code;
            return false;
        }
        this.Oauth.access = response;
        this.Storage.Set(JSON.stringify(response));
        return true;
    },

    logout: function () {
        this.authorized = false;
        this.Oauth.access = null;
        this.Storage.Remove();
    },

    checkLoagin: function () {
        if (this.Oauth.redirect_url == 'urn:ietf:wg:oauth:2.0:oob') {
            let code = prompt("Code:");
            if (code) {
                return code;
            } else {
                return false;
            }
        }
        const urlParams = new URLSearchParams(window.location.search);
        let code = urlParams.get('code');
        if (code == null) {
            return false;
        }
        return code;
    },

    loadScripts: (src) => {
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.src = src;
        $("head").append(s);
    },

    Storage: {
        token: "access_token",
        Set: function (value, name = this.token) {
            localStorage.setItem(name, value);
            return value;
        },
        Get: function (name = this.token) {
            return localStorage.getItem(name);
            //undefined
        },
        Remove: function (name = this.token) {
            localStorage.removeItem(name);
        }
    },

    Oauth: {
        base_url: "https://shikimori.one/oauth/token",
        client_id: "EKv75uNamao_d3uzFREIfo71l6cpyG2IEUIpBxFgcAM",
        client_secret: "WKDClcJlc3grYpBWDbxqQyAFEW0SquPgrvTdXeAfhds",
        redirect_url: "https://an0ncer.github.io/user.html",

        access: null,

        getUrl: function () { return "https://shikimori.one/oauth/authorize?client_id=" + this.client_id + "&redirect_uri=" + encodeURIComponent(this.redirect_url) + "&response_type=code&scope=user_rates+comments+topics"; },

        getBodyAccessToken: function () {
            const form = new FormData();
            form.append('grant_type', 'authorization_code');
            form.append('client_id', this.client_id);
            form.append('client_secret', this.client_secret);
            form.append('redirect_uri', this.redirect_url);
            return form;
        },

        getBodyRefreshToken: function () {
            const form = new FormData();
            form.append('grant_type', 'refresh_token');
            form.append('client_id', this.client_id);
            form.append('client_secret', this.client_secret);
            return form;
        },

        test: function () {
            this.client_id = "bce7ad35b631293ff006be882496b29171792c8839b5094115268da7a97ca34c";
            this.client_secret = "811459eada36b14ff0cf0cc353f8162e72a7d6e6c7930b647a5c587d1beffe68";
            this.redirect_url = 'urn:ietf:wg:oauth:2.0:oob';
        }
    },

    Events: {
        init: [],
        oninit: function (e) {
            if (typeof (e) == 'function') {
                this.init.push(e);
                return;
            }
            if (this.init.length != 0) {
                this.init.forEach(func => func(e));
                return;
            }
        }
    }
}
const shikimoriApi = {
    Animes: {
        url: 'https://shikimori.one/api/animes',
        animes: async function (query = {}, event = () => { }) {
            let q = "";
            if (Object.keys(query).length > 0) {
                q += '?' + new URLSearchParams(query).toString();
            }
            let url = this.url + q;
            let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime"});
            if(shikimoriUser.Oauth.access != null){
                request = shikimoriFetch("GET", url, { "User-Agent": "Tunime", "Authorization": `${shikimoriUser.Oauth.access.token_type} ${shikimoriUser.Oauth.access.access_token}`});

            }
            let response = await request.fetch();
            event(response);
            return response;
        },
        id: async function (id, event=()=>{}){
            let url = this.url + '/' + id;
            let request = shikimoriFetch("GET", url);
            let response = await request.fetch();
            event(response);
            return response;
        },
        roles: async function(id, event=()=>{}){
            let url = this.url + '/' + id + '/roles';
            let request = shikimoriFetch("GET", url);
            let response = await request.fetch();
            event(response);
            return response;
        }
    },
    Users: {
        url: 'https://shikimori.one/api/users',
        users: async function (query = {}, event = () => { }) {
            let q = "";
            if (Object.keys(query).length > 0) {
                q += '?' + new URLSearchParams(query).toString();
            }
            let url = this.url + q;
            let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
            let response = await request.fetch();
            event(response);
            return response;
        },

        id: async function (id, query = {}, event = () => { }) {
            let q = "";
            if (Object.keys(query).length > 0) {
                q += '?' + new URLSearchParams(query).toString();
            }
            let url = this.url + "/" + id + q;
            let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
            let response = await request.fetch();
            event(response);
            return response;
        },

        info: async function (id, event = () => { }) {
            let url = this.url + "/" + id + "/info";
            let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
            let response = await request.fetch();
            event(response);
            return response;
        },

        whoami: async function (event = () => { }) {
            if (shikimoriUser.authorized) {
                let url = this.url + '/whoami'
                let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime", "Authorization": `${shikimoriUser.Oauth.access.token_type} ${shikimoriUser.Oauth.access.access_token}` });
                let response = await request.fetch();
                event(response);
                return response;
            }
        },

        friends: async function (id, event = () => { }) {
            let url = this.url + "/" + id + "/friends";
            let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
            let response = await request.fetch();
            event(response);
            return response;
        },

        clubs: async function (id, event = () => { }) {
            let url = this.url + "/" + id + "/clubs";
            let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
            let response = await request.fetch();
            event(response);
            return response;
        },

        anime_rates: async function (id, query = {}, event = () => { }) {
            let q = "";
            if (Object.keys(query).length > 0) {
                q += '?' + new URLSearchParams(query).toString();
            }
            let url = this.url + '/' + id + "/anime_rates" + q;
            let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
            let response = await request.fetch();
            event(response);
            return response;
        },

        favourites: async function (id, event = () => { }) {
            let url = this.url + "/" + id + "/favourites";
            let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
            let response = await request.fetch();
            event(response);
            return response;
        },

        messages: async function (id, query = { type: "notifications" }, event = () => { }) {
            if (shikimoriUser.authorized) {
                let q = "";
                if (Object.keys(query).length > 0) {
                    q += '?' + new URLSearchParams(query).toString();
                }
                let url = this.url + '/' + id + "/messages" + q;
                let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime", "Authorization": `${shikimoriUser.Oauth.access.token_type} ${shikimoriUser.Oauth.access.access_token}` });
                let response = await request.fetch();
                event(response);
                return response;
            }
        },

        unread_messages: async function (id, event = () => { }) {
            if (shikimoriUser.authorized) {
                let url = this.url + "/" + id + "/unread_messages";
                let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime", "Authorization": `${shikimoriUser.Oauth.access.token_type} ${shikimoriUser.Oauth.access.access_token}` });
                let response = await request.fetch();
                event(response);
                return response;
            }
        },

        history: async function (id, query = {}, event = () => { }) {
            let q = "";
            if (Object.keys(query).length > 0) {
                q += '?' + new URLSearchParams(query).toString();
            }
            let url = this.url + '/' + id + "/history" + q;
            let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
            let response = await request.fetch();
            event(response);
            return response;
        },

        bans: async function (id, event = () => { }) {
            let url = this.url + "/" + id + "/bans";
            let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
            let response = await request.fetch();
            event(response);
            return response;
        },
    },
    User_rates: {
        url: 'https://shikimori.one/api/v2/user_rates',
        id: async function (id, event = () => { }) {
            let url = this.url + "/" + id;
            let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
            let response = await request.fetch();
            event(response);
            return response;
        },
        user_rates: async function (query = {}, event = () => { }) {
            let q = "";
            if (Object.keys(query).length > 0) {
                q += '?' + new URLSearchParams(query).toString();
            }
            let url = this.url + q;
            let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
            let response = await request.fetch();
            event(response);
            return response;
        },
    }
}