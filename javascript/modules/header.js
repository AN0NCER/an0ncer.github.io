import { Oauth } from "./ShikiUSR.js";

export const Headers = {
    base: () => {
        return {
            "User-Agent": "Tunime",
            Accept: "application/json",
        };
    },
    bearer: () => {
        return {
            "User-Agent": "Tunime",
            Authorization: `${Oauth.access.token_type} ${Oauth.access.access_token}`,
            Accept: "application/json",
        };
    }
}

export const Bodys = {
    Access: () => {
        const form = new FormData();
        form.append("grant_type", "authorization_code");
        form.append("client_id", Oauth.auth_url.client_id);
        form.append("client_secret", Oauth.auth_url.client_secret);
        form.append("redirect_uri", Oauth.auth_url.redirect_uri);
        return form;
    },
    Refresh: () => {
        const form = new FormData();
        form.append("grant_type", "refresh_token");
        form.append("client_id", Oauth.auth_url.client_id);
        form.append("client_secret", Oauth.auth_url.client_secret);
        form.append("refresh_token", Oauth.access.refresh_token);
        return form;
    }
}