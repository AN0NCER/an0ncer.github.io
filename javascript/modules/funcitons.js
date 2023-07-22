export function ObjectToQuery(q = {}) {
    let ret = "";
    if (Object.keys(q).length > 0) {
        ret += "?" + new URLSearchParams(q).toString();
    }
    return ret;
}

export function Fetch(method, url, headers, body = "") {
    return {
        method: method,
        url: url,
        headers: headers,
        body: body,
        badresponse: {
            from: "Tunime",
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

export function Sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}