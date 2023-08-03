import { ObjectToQuery, Fetch } from "./funcitons.js";
import { Headers } from "./header.js";
import { User } from "./ShikiUSR.js"

export const Achievements = {
    base_url: () => { return "https://shikimori.me/api/achievements" },
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
    base_url: () => { return "https://shikimori.me/api/animes" },
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
    base_url: () => { return "https://shikimori.me/api/appears" },
    appears: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id;
        const request = Fetch("POST", url, Headers.bearer());
        return {
            POST: async (body) => {
                request.setBody(body);
                const response = await request.fetch();
                event(response);
                return response;
            }
        }
    }
};

export const Users = {
    base_url: () => { return "https://shikimori.me/api/users" },
    list: function (query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        const url = this.base_url() + query;
        return StandartIDGET(url, event);
    },

    show: function (id, query = {}, event = () => { }) {
        query = ObjectToQuery(query);
        let url = this.url + "/" + id + query;
        return StandartIDGET(url, event);
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

    friends: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id + "/friends";
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
        return StandartIDGET(url, event);
    },

    unread_messages: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id + "/unread_messages";
        return StandartIDGET(url, event);
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
    base_url: () => { return "https://shikimori.me/api/v2/user_rates" },

    show: function (id, event = () => { }) {
        const url = this.base_url() + "/" + id;
        const request = Fetch("DELETE", url, Headers.bearer());
        return {
            DELETE: async () => {
                const response = await request.fetch();
                event(response);
                return response;
            },

            PATCH: async (body) => {
                request.setMethod("PATCH");
                request.setBody(body);
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
            GET: async () => {
                const response = await request.fetch();
                event(response);
                return response;
            },
            POST: async (body = undefined) => {
                request.setMethod("POST");
                request.setBody(body);
                const response = await request.fetch();
                event(response);
                return response;
            },
        }
    }
};

export const Genres = {
    base_url: () => { return "https://shikimori.me/api/genres" },

    list: function (event = () => { }) {
        const url = this.base_url();
        return StandartIDGET(url, event);
    }
}

export const Styles = {
    base_url: () => { return "https://shikimori.me/api/styles" },

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