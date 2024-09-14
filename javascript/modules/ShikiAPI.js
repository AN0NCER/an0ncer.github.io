import { ObjectToQuery, Fetch } from "./functions.js";
import { Headers } from "./header.js";
import { SHIKIURL } from "./Settings.js";
import { User } from "./ShikiUSR.js"

export const Achievements = {
    base_url: () => { return `${SHIKIURL.url}/api/achievements` },
    achievements: function (query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        const url = this.base_url() + query;
        const request = Fetch("GET", url);
        return {
            GET: async () => {
                const method = "GET";
                request.headers = Headers.base();
                request.method = method;
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    }
}

export const Animes = {
    base_url: () => { return `${SHIKIURL.url}/api/animes` },
    list: function (query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        const url = this.base_url() + query;
        return StandartIDGET(url, event);
    },

    show: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id;
        const request = Fetch("GET", url, Headers.base());
        return {
            GET: async (logged = false) => {
                if (logged) {
                    request.setHeaders(Headers.bearer());
                }
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    },

    roles: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id + "/roles";
        return StandartIDGET(url, event);
    },

    similar: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id + "/similar";
        return StandartIDGET(url, event);
    },

    related: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id + "/related";
        return StandartIDGET(url, event);
    },

    screenshots: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id + "/screenshots";
        return StandartIDGET(url, event);
    },

    franchise: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id + "/franchise";
        return StandartIDGET(url, event);
    },

    external_links: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id + "/external_links";
        return StandartIDGET(url, event);
    },

    topics: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id + "/topics";
        return StandartIDGET(url, event);
    }
};

export const Appear = {
    base_url: () => { return `${SHIKIURL.url}/api/appears` },
    appears: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id;
        const request = Fetch("POST", url, Headers.bearer());
        return {
            POST: async (body) => {
                request.setBody(body);
                request.setHeaders(Headers.bearer());
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    }
};

export const Friends = {
    base_url: () => { return `${SHIKIURL.url}/api/friends` },
    friends: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id;
        const request = Fetch("POST", url, Headers.bearer());
        return {
            POST: async () => {
                const response = await request.fetch();
                event(response);
                return response;
            },
            DELETE: async () => {
                request.setMethod('DELETE');
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    }
}

export const Favorites = {
    base_url: () => { return `${SHIKIURL.url}/api/favorites` },
    /**
     * @param {"Anime" | "Manga" | "Ranobe" | "Character"} type - Тип избранного
     * @param {number} id - ID избранного
     * @param {*} event - Функция обработки ответа
     */
    favorites: function (type, id, event = () => { }) {
        let url = this.base_url() + "/" + type + "/" + id;
        const request = Fetch("POST", url, Headers.bearer());
        return {
            POST: async () => {
                const response = await request.fetch();
                event(response);
                return response;
            },
            DELETE: async () => {
                request.setMethod("DELETE");
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    }
}

export const Users = {
    base_url: () => { return `${SHIKIURL.url}/api/users` },
    list: function (query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        const url = this.base_url() + query;
        return StandartIDGET(url, event);
    },

    show: function (id, query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        let url = this.base_url() + "/" + id + query;
        const request = Fetch("GET", url, Headers.base());
        return {
            GET: async (logged = false) => {
                if (logged) {
                    request.setHeaders(Headers.bearer());
                }
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    },

    info: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id + "/info";
        return StandartIDGET(url, event);
    },

    whoami: function (event = () => { }) {
        if (!User.Authorizate) return "No Authorizate";
        const url = this.base_url() + "/whoami";
        const request = Fetch("GET", url, Headers.bearer());
        return {
            GET: async () => {
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    },

    friends: function (id, query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        const url = this.base_url() + "/" + id + "/friends" + query;
        return StandartIDGET(url, event);
    },

    clubs: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id + "/clubs";
        return StandartIDGET(url, event);
    },

    anime_rates: function (id, query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        const url = this.base_url() + "/" + id + "/anime_rates" + query;
        return StandartIDGET(url, event);
    },

    favourites: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id + "/favourites";
        return StandartIDGET(url, event);
    },

    messages: function (id, query = { type: "notifications" }, event = () => { }) {
        query = ObjectToQuery(query);
        const url = this.base_url() + "/" + id + "/messages" + query;
        const request = Fetch("GET", url, Headers.bearer());
        return {
            GET: async () => {
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    },

    unread_messages: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id + "/unread_messages";
        const request = Fetch("GET", url, Headers.bearer());
        return {
            GET: async () => {
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    },

    history: function (id, query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        const url = this.base_url() + "/" + id + "/history" + query;
        return StandartIDGET(url, event);
    },

    bans: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id + "/bans";
        return StandartIDGET(url, event);
    }
};

export const UserRates = {
    base_url: () => { return `${SHIKIURL.url}/api/v2/user_rates` },

    show: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id;
        const request = Fetch("DELETE", url, Headers.bearer());
        return {
            DELETE: async () => {
                request.setHeaders(Headers.bearer());
                const response = await request.fetch();
                event(response);
                return response;
            },

            PATCH: async (body) => {
                request.setMethod("PATCH");
                request.setHeaders(Headers.bearer());
                request.setBody(body);
                const response = await request.fetch();
                event(response);
                return response;
            },

            GET: async () => {
                request.setMethod("GET");
                request.setHeaders(Headers.bearer());
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    },

    list: function (query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        const url = this.base_url() + query;
        const request = Fetch("GET", url, Headers.base());
        return {
            GET: async (logged = false) => {
                if (logged) {
                    request.setHeaders(Headers.bearer());
                }
                const response = await request.fetch();
                event(response);
                return response;
            },
            POST: async (body = undefined) => {
                request.setMethod("POST");
                request.setHeaders(Headers.bearer());
                request.setBody(body);
                const response = await request.fetch();
                event(response);
                return response;
            },
        }
    }
};

export const Genres = {
    base_url: () => { return `${SHIKIURL.url}/api/genres` },

    list: function (event = () => { }) {
        const url = this.base_url();
        return StandartIDGET(url, event);
    }
}

export const Messages = {
    base_url: () => { return `${SHIKIURL.url}/api/messages` },

    mark_read: function (event = () => { }) {
        const url = this.base_url() + '/mark_read';
        const request = Fetch("POST", url, Headers.bearer());
        return {
            POST: async (body = undefined) => {
                request.setBody(body);
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    },

    delete: function (id, event = () => { }) {
        const url = this.base_url() + '/' + id;
        const request = Fetch("DELETE", url, Headers.bearer());
        return {
            DELETE: async () => {
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    }
}

export const Styles = {
    base_url: () => { return `${SHIKIURL.url}/api/styles` },

    show: function (id, event = () => { }) {
        const url = this.base_url() + '/' + id;
        const request = Fetch("GET", url, Headers.base());
        return {
            GET: async () => {
                const response = await request.fetch();
                event(response);
                return response;
            },
            PATCH: async (body) => {
                request.setMethod("PATCH");
                request.setHeaders(Headers.bearer());
                request.setBody(body);
                const response = await request.fetch();
                event(response);
                return response;
            },
            PUT: async (body) => {
                request.setMethod("PUT");
                request.setHeaders(Headers.bearer());
                request.setBody(body);
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    }
}

export const GraphQl = {
    base_url: () => { return `${SHIKIURL.url}/api/graphql` },

    animes: function (arg = {}, event = () => { }) {
        const url = this.base_url();
        const request = Fetch("POST", url, Headers.base());
        return {
            POST: async (body = [], logged = false) => {
                body = BodyGraphQl("animes", arg, body);
                if (logged)
                    request.setHeaders(Headers.bearer());
                request.setBody(body);
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    },

    user_rate: function (arg = {}, event = () => { }) {
        const url = this.base_url();
        const request = Fetch("POST", url, Headers.bearer());
        return {
            POST: async (body = []) => {
                body = BodyGraphQl("userRates", arg, body);
                request.setBody(body);
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    }
}

function BodyGraphQl(prof, arg = {}, body = []) {
    const query = Object.entries(arg).map(([key, value]) => 
        `${key}: ${Array.isArray(value) ? `"${value}"` : value}`
    );

    //Updated parser for graphql: Recursive function
    //["id", "status", { anime: ["id", "russian", "score", { airedOn: ["year"]}] }]

    function processBodyRecursively(element) {
        if (typeof element === "object" && !Array.isArray(element)) {
            return Object.entries(element).reduce((acc, [key, value]) => {
                if (Array.isArray(value)) {
                    acc += `${key} { ${processBodyRecursively(value)} }`;
                } else if (typeof value === "object") {
                    acc += `${key} { ${processBodyRecursively(value)} }`;
                } else {
                    acc += `${key} `;
                }
                return acc;
            }, "");
        } else if (Array.isArray(element)) {
            return element.map(processBodyRecursively).join(' ');
        }
        return element;
    }

    const processedBody = body.map(processBodyRecursively);

    return { query: `{${prof}(${query.join(', ')}){${processedBody.join(' ')}}}` };
}

function StandartIDGET(url, event) {
    const request = Fetch("GET", url, Headers.base());
    return {
        GET: async () => {
            const response = await request.fetch();
            event(response);
            return response;
        }
    }
}