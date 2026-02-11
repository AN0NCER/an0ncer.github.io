import { Fetch, Headers, OAuth, sUrl } from "../core/main.core.js";
import { ObjectToQuery } from "./functions.js";

export const Achievements = {
    base_url: () => { return `${sUrl}/api/achievements` },
    achievements: function (query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        const url = this.base_url() + query;
        const request = Fetch.get(url);
        return {
            GET: async () => {
                request.headers = Headers.base;
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    }
}

export const Animes = {
    base_url: () => { return `${sUrl}/api/animes` },
    list: function (query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        const url = this.base_url() + query;
        return StandartIDGET(url, event);
    },

    show: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id;
        const request = Fetch.get(url, Headers.base);
        return {
            GET: async (logged = false) => {
                if (logged) {
                    request.headers = Headers.bearer;
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
    base_url: () => { return `${sUrl}/api/appears` },
    appears: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id;
        const request = Fetch.post(url, {}, Headers.bearer);
        return {
            POST: async (body) => {
                request.setBody(body);
                request.headers = Headers.bearer;
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    }
};

export const Friends = {
    base_url: () => { return `${sUrl}/api/friends` },
    friends: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id;
        const request = Fetch.post(url, {}, Headers.bearer);
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
    base_url: () => { return `${sUrl}/api/favorites` },
    /**
     * @param {"Anime" | "Manga" | "Ranobe" | "Character"} type - Тип избранного
     * @param {number} id - ID избранного
     * @param {*} event - Функция обработки ответа
     */
    favorites: function (type, id, event = () => { }) {
        let url = this.base_url() + "/" + type + "/" + id;
        const request = Fetch.post(url, {}, Headers.bearer);
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
    base_url: () => { return `${sUrl}/api/users` },
    list: function (query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        const url = this.base_url() + query;
        return StandartIDGET(url, event);
    },

    show: function (id, query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        let url = this.base_url() + "/" + id + query;
        const request = Fetch.get(url, Headers.base);
        return {
            GET: async (logged = false) => {
                if (logged) {
                    request.headers = Headers.bearer;
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
        if (!OAuth.auth) return "No Authorizate";
        const url = this.base_url() + "/whoami";
        const request = Fetch.get(url, Headers.bearer);
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
        const request = Fetch.get(url, Headers.bearer);
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
        const request = Fetch.get(url, Headers.bearer);
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
    base_url: () => { return `${sUrl}/api/v2/user_rates` },

    show: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id;
        const request = Fetch.delete(url, Headers.bearer);
        return {
            DELETE: async () => {
                request.headers = Headers.bearer;
                const response = await request.fetch();
                event(response);
                return response;
            },

            PATCH: async (body) => {
                request.setMethod("PATCH");
                request.headers = Headers.bearer;
                request.setBody(body);
                const response = await request.fetch();
                event(response);
                return response;
            },

            GET: async () => {
                request.setMethod("GET");
                request.headers = Headers.bearer;
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    },

    list: function (query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        const url = this.base_url() + query;
        const request = Fetch.get(url, Headers.base);
        return {
            GET: async (logged = false) => {
                if (logged) {
                    request.headers = Headers.bearer;
                }
                const response = await request.fetch();
                event(response);
                return response;
            },
            POST: async (body = undefined) => {
                request.setMethod("POST");
                request.headers = Headers.bearer;
                request.setBody(body);
                const response = await request.fetch();
                event(response);
                return response;
            },
        }
    }
};

export const Genres = {
    base_url: () => { return `${sUrl}/api/genres` },

    list: function (event = () => { }) {
        const url = this.base_url();
        return StandartIDGET(url, event);
    }
}

export const Messages = {
    base_url: () => { return `${sUrl}/api/messages` },

    mark_read: function (event = () => { }) {
        const url = this.base_url() + '/mark_read';
        const request = Fetch.post(url, {}, Headers.bearer);
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
        const request = Fetch.delete(url, Headers.bearer);
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
    base_url: () => { return `${sUrl}/api/styles` },

    show: function (id, event = () => { }) {
        const url = this.base_url() + '/' + id;
        const request = Fetch.get(url, Headers.base);
        return {
            GET: async () => {
                const response = await request.fetch();
                event(response);
                return response;
            },
            PATCH: async (body) => {
                request.setMethod("PATCH");
                request.headers = Headers.bearer;
                request.setBody(body);
                const response = await request.fetch();
                event(response);
                return response;
            },
            PUT: async (body) => {
                request.setMethod("PUT");
                request.headers = Headers.bearer;
                request.setBody(body);
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    }
}

/**
 * @typedef {Object} QueryConfig
 * @property {Object} args - Аргументы запроса
 * @property {Array<string|Object>} fields - Поля для выборки
 */

/**
 * @typedef {Object.<string, QueryConfig>} QueriesObject
 */

export const GraphQl = {
    base_url: () => { return `${sUrl}/api/graphql` },

    /**
    * Выполняет множественные GraphQL запросы к API
    * @param {QueriesObject} root - Объект с запросами
    * ...
    */
    query: function (root = {}, event = () => { }, signal) {
        const url = this.base_url();
        const request = Fetch.post(url, {}, Headers.base)
        return {
            POST: async (logged = false) => {
                if (logged)
                    request.headers = Headers.bearer;

                request.setBody(BodyGraphQlMulti(root));
                const response = await request.fetch(signal);
                event(response);
                return response;
            }
        }
    },

    animes: function (arg = {}, event = () => { }, signal) {
        const url = this.base_url();
        const request = Fetch.post(url, {}, Headers.base);
        return {
            POST: async (body = [], logged = false) => {
                body = BodyGraphQl("animes", arg, body);
                if (logged)
                    request.headers = Headers.bearer;
                request.setBody(body);
                const response = await request.fetch(signal);
                event(response);
                return response;
            }
        }
    },

    user_rate: function (arg = {}, event = () => { }, signal) {
        const url = this.base_url();
        const request = Fetch.post(url, {}, Headers.bearer);
        return {
            POST: async (body = []) => {
                body = BodyGraphQl("userRates", arg, body);
                request.setBody(body);
                const response = await request.fetch(signal);
                event(response);
                return response;
            }
        }
    },

    genres: function (arg = {}, event = () => { }, signal) {
        const url = this.base_url();
        const request = Fetch.post(url, {}, Headers.base);
        return {
            POST: async (body = []) => {
                body = BodyGraphQl("genres", arg, body);
                request.setBody(body);
                const response = await request.fetch(signal);
                event(response);
                return response;
            }
        }
    }
}

// Функция для множественных запросов с объектом
function BodyGraphQlMulti(root = {}) {
    function buildArgs(args = {}) {
        return Object.entries(args)
            .map(([k, v]) => `${k}: ${serializeValue(v)}`)
            .join(',');
    }

    function buildSelection(body) {
        if (Array.isArray(body))
            return body.map(buildSelection).join(' ');

        if (typeof body === 'object')
            return Object.entries(body)
                .map(([k, v]) => `${k} { ${buildSelection(v)} }`)
                .join(' ');

        return body;
    }

    function buildQuery(root) {
        return Object.entries(root).map(([name, cfg]) => {
            const args = buildArgs(cfg.args);
            const body = buildSelection(cfg.fields);

            return `${name}${args ? `(${args})` : ''} {${body}}`;
        });
    }

    function serializeValue(value) {
        if (Array.isArray(value))
            return `"${value.map(serializeValue).join(', ')}"`;

        if (typeof value === "string")
            return value;

        if (value === null)
            return "null";

        return value;
    }

    return {
        query: `{${buildQuery(root)}}`
    };
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
    const request = Fetch.get(url, Headers.base);
    return {
        GET: async () => {
            const response = await request.fetch();
            event(response);
            return response;
        }
    }
}