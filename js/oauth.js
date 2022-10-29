let cookie_name = 'code';
let cookie_access_token = 'access_token';
let client_id = "EKv75uNamao_d3uzFREIfo71l6cpyG2IEUIpBxFgcAM";
let client_secret = "WKDClcJlc3grYpBWDbxqQyAFEW0SquPgrvTdXeAfhds";
let called_oauth = false;

let oauth_url = "https://shikimori.one/oauth/authorize?client_id=" + client_id + "&redirect_uri=https%3A%2F%2Fan0ncer.github.io%2Fauthorized.html&response_type=code&scope=user_rates+messages+comments+topics+content+clubs+friends+ignores";

$(document).ready(() => {
    if (Cookies.get(cookie_access_token) && Cookies.get(cookie_access_token) != "undefined") {
        console.log(JSON.parse(Cookies.get(cookie_access_token)));
    } else {
        let i = setInterval(async () => {
            if (Cookies.get(cookie_name)) {
                let res = await GetAccessToken(Cookies.get(cookie_name));
                if (!res.status) {
                    console.log(res);
                    Cookies.set(cookie_access_token, JSON.stringify(res));
                } else {
                    Cookies.set(cookie_name, "");
                }
                clearInterval(i);
            } else {
                if (!called_oauth) {
                    openInNewTab(oauth_url);
                    called_oauth = true;
                }
            }
        }, 1000);
    }
});

function openInNewTab(url) {
    window.open(url, '_self').focus();
}

async function GetAccessToken(code) {
    const form = new FormData();
    form.append('grant_type', 'authorization_code');
    form.append('client_id', client_id);
    form.append('client_secret', client_secret);
    form.append('code', code);
    form.append('redirect_uri', 'https://an0ncer.github.io/authorized.html');
    return await new Promise((resolve) => {
        fetch('https://shikimori.one/oauth/token', {
            method: 'POST',
            headers: {
                'User-Agent': 'Tunime'
            },
            body: form
        }).then((response) => {
            if (!response.ok) {
                resolve({ failed: true, status: response.status });
            }
            resolve(response.json());
        });
    });
}

async function RefreshAccessToken(refresh_token) {
    const form = new FormData();
    form.append('grant_type', 'refresh_token');
    form.append('client_id', client_id);
    form.append('client_secret', client_secret);
    form.append('refresh_token', refresh_token);
    return await new Promise((resolve) => {
        fetch('https://shikimori.one/oauth/token', {
            method: 'POST',
            headers: {
                'User-Agent': 'Tunime'
            },
            body: form
        }).then((response) => {
            if (!response.ok) {
                resolve({ failed: true, status: response.status });
            }
            resolve(response.json());
        });
    });
}
