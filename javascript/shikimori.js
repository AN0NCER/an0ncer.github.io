const TemplateShikimori = {
  Headers: {
    base: () => {
      return {
        "User-Agent": "Tunime",
        Accept: "application/json",
      };
    },

    bearer: () => {
      return {
        "User-Agent": "Tunime",
        Authorization: `${usr.Oauth.access.token_type} ${usr.Oauth.access.access_token}`,
        Accept: "application/json",
      };
    },

    bearerjson: () => {
      return {
        "User-Agent": "Tunime",
        Authorization: `${usr.Oauth.access.token_type} ${usr.Oauth.access.access_token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      };
    },
  },

  Body: {
    Access: () => {
      const form = new FormData();
      form.append("grant_type", "authorization_code");
      form.append("client_id", usr.Oauth.auth_url.client_id);
      form.append("client_secret", usr.Oauth.auth_url.client_secret);
      form.append("redirect_uri", usr.Oauth.auth_url.redirect_uri);
      return form;
    },
    Refresh: () => {
      const form = new FormData();
      form.append("grant_type", "refresh_token");
      form.append("client_id", usr.Oauth.auth_url.client_id);
      form.append("client_secret", usr.Oauth.auth_url.client_secret);
      form.append("refresh_token", usr.Oauth.access.refresh_token);
      return form;
    },
  },
};
function shikimoriFetch(method = "GET", url = "", headers = {}, body = "") {
  return {
    method: method,
    url: url,
    headers: headers,
    body: body,
    badresponse: {
      failed: true,
      status: "404",
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
      if (typeof body == "object") {
        body = JSON.stringify(body);
      }
      this.body = body;
      return this.body;
    },

    fetch: function () {
      if (!this.url) {
        return this.badresponse;
      }

      let request = {
        method: this.method,
        headers: this.headers,
      };

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
  };
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
    body.append("code", code);
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
    body.append("refresh_token", access.refresh_token);
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
    if (this.Oauth.redirect_url == "urn:ietf:wg:oauth:2.0:oob") {
      let code = prompt("Code:");
      if (code) {
        return code;
      } else {
        return false;
      }
    }
    const urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get("code");
    if (code == null) {
      return false;
    }
    return code;
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
    },
  },

  Oauth: {
    base_url: "https://shikimori.me/oauth/token",
    client_id: "EKv75uNamao_d3uzFREIfo71l6cpyG2IEUIpBxFgcAM",
    client_secret: "WKDClcJlc3grYpBWDbxqQyAFEW0SquPgrvTdXeAfhds",
    redirect_url: "https://an0ncer.github.io/user.html",
    scope: "user_rates+messages+comments+topics+clubs+friends+ignores",

    access: null,

    getUrl: function () {
      return (
        "https://shikimori.me/oauth/authorize?client_id=" +
        this.client_id +
        "&redirect_uri=" +
        encodeURIComponent(this.redirect_url) +
        "&response_type=code&scope=" +
        this.scope
      );
    },

    getBodyAccessToken: function () {
      const form = new FormData();
      form.append("grant_type", "authorization_code");
      form.append("client_id", this.client_id);
      form.append("client_secret", this.client_secret);
      form.append("redirect_uri", this.redirect_url);
      return form;
    },

    getBodyRefreshToken: function () {
      const form = new FormData();
      form.append("grant_type", "refresh_token");
      form.append("client_id", this.client_id);
      form.append("client_secret", this.client_secret);
      return form;
    },

    test: function () {
      this.client_id =
        "bce7ad35b631293ff006be882496b29171792c8839b5094115268da7a97ca34c";
      this.client_secret =
        "811459eada36b14ff0cf0cc353f8162e72a7d6e6c7930b647a5c587d1beffe68";
      this.redirect_url = "urn:ietf:wg:oauth:2.0:oob";
    },
  },

  Events: {
    init: [],
    oninit: function (e) {
      if (typeof e == "function") {
        this.init.push(e);
        return;
      }
      if (this.init.length != 0) {
        this.init.forEach((func) => func(e));
        return;
      }
    },
  },
};
const shikimoriApi = {
  Animes: {
    url: "https://shikimori.me/api/animes",
    animes: async function (query = {}, event = () => {}) {
      let q = "";
      if (Object.keys(query).length > 0) {
        q += "?" + new URLSearchParams(query).toString();
      }
      let url = this.url + q;
      let request = shikimoriFetch(
        "GET",
        url,
        TemplateShikimori.Headers.base()
      );
      let response = await request.fetch();
      event(response);
      return response;
    },
    id: async function (id, event = () => {}, logged = false) {
      let url = this.url + "/" + id;
      let request = shikimoriFetch("GET", url);
      if (logged) {
        request.setHeaders(TemplateShikimori.Headers.bearer());
      }
      let response = await request.fetch();
      event(response);
      return response;
    },
    screenshots: async function (id, event = () => {}) {
      let url = this.url + "/" + id + "/screenshots";
      let request = shikimoriFetch("GET", url);
      let response = await request.fetch();
      event(response);
      return response;
    },
    roles: async function (id, event = () => {}) {
      let url = this.url + "/" + id + "/roles";
      let request = shikimoriFetch("GET", url);
      let response = await request.fetch();
      event(response);
      return response;
    },
    franchise: async function (id, event = () => {}) {
      let url = this.url + "/" + id + "/franchise";
      let request = shikimoriFetch("GET", url);
      let response = await request.fetch();
      event(response);
      return response;
    },
    similar: async function (id, event = () => {}) {
      let url = this.url + "/" + id + "/similar";
      let request = shikimoriFetch("GET", url);
      let response = await request.fetch();
      event(response);
      return response;
    },
  },
  Users: {
    url: "https://shikimori.me/api/users",
    users: async function (query = {}, event = () => {}) {
      let q = "";
      if (Object.keys(query).length > 0) {
        q += "?" + new URLSearchParams(query).toString();
      }
      let url = this.url + q;
      let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
      let response = await request.fetch();
      event(response);
      return response;
    },

    id: async function (id, query = {}, event = () => {}) {
      let q = "";
      if (Object.keys(query).length > 0) {
        q += "?" + new URLSearchParams(query).toString();
      }
      let url = this.url + "/" + id + q;
      let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
      let response = await request.fetch();
      event(response);
      return response;
    },

    info: async function (id, event = () => {}) {
      let url = this.url + "/" + id + "/info";
      let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
      let response = await request.fetch();
      event(response);
      return response;
    },

    whoami: async function (event = () => {}) {
      if (usr.authorized) {
        let url = this.url + "/whoami";
        let request = shikimoriFetch(
          "GET",
          url,
          TemplateShikimori.Headers.bearer()
        );
        let response = await request.fetch();
        event(response);
        return response;
      }
    },

    friends: async function (id, event = () => {}) {
      let url = this.url + "/" + id + "/friends";
      let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
      let response = await request.fetch();
      event(response);
      return response;
    },

    clubs: async function (id, event = () => {}) {
      let url = this.url + "/" + id + "/clubs";
      let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
      let response = await request.fetch();
      event(response);
      return response;
    },

    anime_rates: async function (id, query = {}, event = () => {}) {
      let q = "";
      if (Object.keys(query).length > 0) {
        q += "?" + new URLSearchParams(query).toString();
      }
      let url = this.url + "/" + id + "/anime_rates" + q;
      let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
      let response = await request.fetch();
      event(response);
      return response;
    },

    favourites: async function (id, event = () => {}) {
      let url = this.url + "/" + id + "/favourites";
      let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
      let response = await request.fetch();
      event(response);
      return response;
    },
    //Tyt
    messages: async function (
      id,
      query = { type: "notifications" },
      event = () => {}
    ) {
        let q = "";
        if (Object.keys(query).length > 0) {
          q += "?" + new URLSearchParams(query).toString();
        }
        let url = this.url + "/" + id + "/messages" + q;
        let request = shikimoriFetch("GET", url, TemplateShikimori.Headers.bearer());
        let response = await request.fetch();
        event(response);
        return response;
    },

    unread_messages: async function (id, event = () => {}) {
      let url = this.url + "/" + id + "/unread_messages";
      let request = shikimoriFetch(
        "GET",
        url,
        TemplateShikimori.Headers.bearer()
      );
      let response = await request.fetch();
      event(response);
      return response;
    },

    history: async function (id, query = {}, event = () => {}) {
      let q = "";
      if (Object.keys(query).length > 0) {
        q += "?" + new URLSearchParams(query).toString();
      }
      let url = this.url + "/" + id + "/history" + q;
      let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
      let response = await request.fetch();
      event(response);
      return response;
    },

    bans: async function (id, event = () => {}) {
      let url = this.url + "/" + id + "/bans";
      let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
      let response = await request.fetch();
      event(response);
      return response;
    },
  },
  User_rates: {
    url: "https://shikimori.me/api/v2/user_rates",
    id: function (id, event = () => {}) {
      let url = this.url + "/" + id;
      let request = shikimoriFetch(
        "GET",
        url,
        TemplateShikimori.Headers.base()
      );
      return {
        DELETE: async function () {
          request.setMethod("DELETE");
          request.setHeaders(TemplateShikimori.Headers.bearer());
          let response = await request.fetch();
          event(response);
          return response;
        },

        PATCH: async function (body) {
          request.setMethod("PATCH");
          request.setHeaders(TemplateShikimori.Headers.bearerjson());
          request.setBody(body);
          let response = await request.fetch();
          event(response);
          return response;
        },
      };
      //let response = await request.fetch();
      //event(response);
      //return response;
    },
    user_rates: function (q = {}, e = () => {}, d = undefined) {
      let query = "";
      if (Object.keys(q).length > 0) {
        query += "?" + new URLSearchParams(q).toString();
      }
      let url = this.url + query;
      let request = shikimoriFetch(
        "GET",
        url,
        TemplateShikimori.Headers.base()
      );
      return {
        GET: async function () {
          let response = await request.fetch();
          e(response);
          return response;
        },
        POST: async function () {
          request.setMethod("POST");
          request.setBody(d);
          request.setHeaders(TemplateShikimori.Headers.bearerjson());
          let response = await request.fetch();
          e(response);
          return response;
        },
      };
      // let q = "";
      // if (Object.keys(query).length > 0) {
      //     q += '?' + new URLSearchParams(query).toString();
      // }
      // let url = this.url + q;
      // let request = shikimoriFetch("GET", url, { "User-Agent": "Tunime" });
      // let response = await request.fetch();
      // event(response);
      // return response;
    },
  },
  Genres: {
    url: "https://shikimori.me/api/genres",
    genres: async function (event = () => {}) {
      let url = this.url;
      let request = shikimoriFetch(
        "GET",
        url,
        TemplateShikimori.Headers.base()
      );
      let response = await request.fetch();
      event(response);
      return response;
    },
  },
  Styles: {
    url: "https://shikimori.me/api/styles",
    id: function (id, event = () => {}) {
      let url = this.url + "/" + id;
      let request = shikimoriFetch(
        "GET",
        url,
        TemplateShikimori.Headers.base()
      );
      return {
        GET: async function () {
          let response = await request.fetch();
          event(response);
          return response;
        },
        PATCH: async function (body) {
          request.setMethod("PATCH");
          request.setHeaders(TemplateShikimori.Headers.bearerjson());
          request.setBody(body);
          let response = await request.fetch();
          event(response);
          return response;
        },
        PUT: async function (body) {
          request.setMethod("PUT");
          request.setHeaders(TemplateShikimori.Headers.bearerjson());
          request.setBody(body);
          let response = await request.fetch();
          event(response);
          return response;
        },
      };
    },
  },
};
let usr = {
  authorized: false,
  isteste: false,

  Authorizate: async function (code) {
    let request = shikimoriFetch(
      "POST",
      this.Oauth.base_url,
      TemplateShikimori.Headers.base(),
      TemplateShikimori.Body.Access()
    );
    request.body.append("code", code);
    let response = await request.fetch();
    if (response.failed) {
      if (response.status == 429) {
        await sleep(1000);
        return await this.Authorizate(code);
      } else {
        return;
      }
    }
    this.Oauth.access = response;
    this.Storage.Set(response);
    this.authorized = true;
    this.Events.Onauthorized();
  },

  Refresh: async function () {
    let request = shikimoriFetch(
      "POST",
      this.Oauth.base_url,
      TemplateShikimori.Headers.base(),
      TemplateShikimori.Body.Refresh()
    );
    let response = await request.fetch();
    if (response.failed) {
      if (response.status == 429) {
        await sleep(1000);
        return await this.Refresh();
      } else {
        return;
      }
    }
    this.Oauth.access = response;
    this.Storage.Set(response);
    this.authorized = true;
    this.Events.Onrefresh();
  },

  Oauth: {
    access: null,
    auth_url: {
      client_id: "EKv75uNamao_d3uzFREIfo71l6cpyG2IEUIpBxFgcAM",
      client_secret: "WKDClcJlc3grYpBWDbxqQyAFEW0SquPgrvTdXeAfhds",
      redirect_uri: "https://an0ncer.github.io/login.html",
      response_type: "code",
      scope: "user_rates+messages+comments+topics+clubs+friends+ignores",
    },
    base_url: "https://shikimori.me/oauth/token",

    GetUrl: function () {
      return (
        "https://shikimori.me/oauth/authorize?client_id=" +
        this.auth_url.client_id +
        "&redirect_uri=" +
        encodeURIComponent(this.auth_url.redirect_uri) +
        "&response_type=" +
        this.auth_url.response_type +
        "&scope=" +
        this.auth_url.scope
      );
    },
  },

  Storage: {
    keys: {
      access: "access_token",
      whoami: "access_whoami",
    },

    Get: function (key = this.keys.access) {
      return JSON.parse(localStorage.getItem(key));
    },

    Set: function (value, key = this.keys.access) {
      if (typeof value == "object") {
        value = JSON.stringify(value);
      }
      localStorage.setItem(key, value);
    },

    Clear: function () {
      for (let val in this.keys) {
        localStorage.removeItem(this.keys[val]);
      }
    },

    Remove: function (key = this.keys.access) {
      localStorage.removeItem(key);
    },
  },

  Events: {
    refresh: [],
    Onrefresh: function (e) {
      if (typeof e == "function") {
        this.refresh.push(e);
        return;
      }
      if (this.refresh.length != 0) {
        this.refresh.forEach((func) => func(e));
        return;
      }
    },
    authorized: [],
    Onauthorized: function (e) {
      if (typeof e == "function") {
        this.authorized.push(e);
        return;
      }
      if (this.authorized.length != 0) {
        this.authorized.forEach((func) => func(e));
        return;
      }
    },
  },

  expires_in: function (access = this.Oauth.access) {
    if (access) {
      if (
        new Date((access.created_at + access.expires_in) * 1000) > new Date()
      ) {
        return true;
      } else {
        return false;
      }
    } else return false;
  },

  test_on: function () {
    this.Oauth.auth_url.client_id =
      "bce7ad35b631293ff006be882496b29171792c8839b5094115268da7a97ca34c";
    this.Oauth.auth_url.client_secret =
      "811459eada36b14ff0cf0cc353f8162e72a7d6e6c7930b647a5c587d1beffe68";
    this.Oauth.auth_url.redirect_uri = "urn:ietf:wg:oauth:2.0:oob";
    this.isteste = true;
  },
};

if (location.hostname == "192.168.31.233" || location.hostname == "127.0.0.1") {
  usr.test_on();
}

async function Main(event = () => {}) {
  if (!usr.authorized) {
    if (usr.Storage.Get()) {
      usr.Oauth.access = usr.Storage.Get();
      if (usr.expires_in()) {
        await usr.Refresh();
      }
    }
  }
  event(usr.authorized);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}