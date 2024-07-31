import { Menu } from "../menu.js";
import { Fetch, Sleep } from "./functions.js";
import { Headers, Bodys } from "./header.js";
import { SHIKIURL } from "./Settings.js";
import { } from "./TunimeApi.js";

export const Oauth = {
    access: null,
    auth_url: {
        client_id: "EKv75uNamao_d3uzFREIfo71l6cpyG2IEUIpBxFgcAM",
        client_secret: "WKDClcJlc3grYpBWDbxqQyAFEW0SquPgrvTdXeAfhds",
        redirect_uri: "https://an0ncer.github.io/login.html",
        response_type: "code",
        scope: "user_rates+messages+comments+topics+clubs+friends+ignores",
    },
    base_url: `${SHIKIURL.url}/oauth/token`,

    GetUrl: function () {
        return (
            `${SHIKIURL.url}/oauth/authorize?client_id=` +
            this.auth_url.client_id +
            "&redirect_uri=" +
            encodeURIComponent(this.auth_url.redirect_uri) +
            "&response_type=" +
            this.auth_url.response_type +
            "&scope=" +
            this.auth_url.scope
        );
    },
};

export let User = {
    authorized: false,
    isteste: false,

    Authorizate: async function (code) {
        let request = Fetch("POST", Oauth.base_url, Headers.base(), Bodys.Access());
        request.body.append("code", code);
        let response = await request.fetch();
        if (response.failed) {
            if (response.status == 429) {
                await Sleep(1000);
                return await this.Authorizate(code);
            } else {
                return;
            }
        }
        Oauth.access = response;
        this.Storage.Set(response);
        this.authorized = true;
    },

    Refresh: async function () {
        let request = Fetch("POST", Oauth.base_url, Headers.base(), Bodys.Refresh());
        let response = await request.fetch();
        if (response.failed) {
            if (response.status == 429) {
                await Sleep(1000);
                return await this.Refresh();
            } else {
                return;
            }
        }
        Oauth.access = response;
        this.Storage.Set(response);
        this.authorized = true;
    },

    Leave: async function (access) {
        if (access) {
            Oauth.access = access;
            this.Storage.Set(access);
            this.authorized = true;
        }
    },

    expires_in: function (access = Oauth.access) {
        if (access) {
            const currentTime = new Date().getTime();
            const tokenExpirationTime = (access.created_at + access.expires_in) * 1000;
            const twoHoursInMilliseconds = 6 * 60 * 60 * 1000; // 6 часов в миллисекундах
            if (tokenExpirationTime - currentTime > twoHoursInMilliseconds) {
                return true;
            } else {
                return false;
            }
        } else return false;
    },

    test_on: function () {
        Oauth.auth_url.client_id =
            "bce7ad35b631293ff006be882496b29171792c8839b5094115268da7a97ca34c";
        Oauth.auth_url.client_secret =
            "811459eada36b14ff0cf0cc353f8162e72a7d6e6c7930b647a5c587d1beffe68";
        Oauth.auth_url.redirect_uri = "urn:ietf:wg:oauth:2.0:oob";
        this.isteste = true;
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
}

const ips = ["192.168.31.233", "127.0.0.1", "192.168.31.45"]

if (ips.findIndex(x => x == location.hostname) != -1) {
    console.log("[ver] - Test");
    User.test_on();
    var manifestLink = document.querySelector('head > link[rel="manifest"]');
    manifestLink.href = '/images/icons/manifest-b.json';
    var appleIcon = document.querySelector('head > link[sizes="120x120"]');
    if (appleIcon)
        appleIcon.href = './images/icons/logo-x192-b.png';
    appleIcon = document.querySelector('head > link[sizes="152x152"]');
    if (appleIcon)
        appleIcon.href = './images/icons/logo-x192-b.png';
}

/**
 * Основная функция для выполнения операций связанных с авторизацией пользователя.
 * @param {function} e - Функция обратного вызова, которая будет вызвана с результатом проверки авторизации пользователя.
 */
export async function Main(e = () => { }) {
    if (!User.authorized) {
        if (User.Storage.Get()) {
            Oauth.access = User.Storage.Get();
            if (User.expires_in()) {
                await User.Leave(Oauth.access);
            } else {
                await User.Refresh();
            }
        }
    }
    e(User.authorized);
    if (!User.authorized && Menu().hasMenu()) {
        Menu('user').setUrl('login.html');
        Menu('list').setUrl('login.html');
    }
}