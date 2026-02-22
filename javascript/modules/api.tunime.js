import { Hub } from "../core/hub.core.js";

export const Tunime = new class {
    constructor() {
        this.fetch = Hub.fetch;
    }

    api = {
        users: (event = () => { }) => {
            const basePath = '/api/users/info';
            return {
                GET: async (ids = []) => {
                    const query = `ids=${ids.map(id => encodeURIComponent(id)).join(',')}`;
                    const fullPath = query ? `${basePath}?${query}` : basePath;
                    return this.fetch(fullPath, { method: 'GET' }, event);
                }
            }
        },
        user: (id, event = () => { }) => {
            const url = `/api/user/${id}`;

            const fetch = (method, body) => {
                return this.fetch(url, { method, body }, event);
            }

            return {
                GET: async () => {
                    return fetch('GET');
                },
                POST: async (body = {}) => {
                    return fetch('POST', body);
                },
                PATCH: async (body = {}) => {
                    return fetch('PATCH', body);
                },
                DELETE: async (body = {}) => {
                    return fetch('DELETE', body);
                }
            }
        },
        device: {
            list: (event = () => { }) => {
                const url = '/api/user/devices';

                return {
                    GET: () => {
                        return this.fetch(url, { method: 'GET' }, event);
                    }
                }
            },
            name: (event = () => { }) => {
                const url = '/api/user/device/name';

                const fetch = (method, body) => {
                    return this.fetch(url, { method, body }, event);
                }

                return {
                    GET: () => {
                        return fetch('GET');
                    },
                    PATCH: async (body = {}) => {
                        return fetch('PATCH', body);
                    }
                }
            }
        },
        anime: {
            get_popular: async () => {
                const response = await this.fetch('/anime/popular');
                if (!response.complete || !response.parsed) {
                    return false;
                }

                return response.value.data;
            }
        }
    }

    mark = {
        anime: (aid) => {
            return this.fetch(`/anime/${aid}`, { method: 'PUT' });
        },
        voice: (aid, vid) => {
            return this.fetch(`/voice/${aid}/${vid}`, { method: 'PUT' });
        }
    }

    video = {
        genLink: (query = {}) => {
            const url = new URL(`${Hub.url}/video/hls.m3u8`);
            for (const [key, value] of Object.entries(query)) {
                url.searchParams.append(key, encodeURIComponent(value));
            }
            return url.toString();
        },
        source: async (kodik) => {
            const body = { src: kodik };

            if (!Hub.snapshot.state.isConnected || !Hub.snapshot.state.permissions.includes("player")) return false;

            const response = await this.fetch('/video/source', { method: 'POST', body });

            if (!response.complete || !response.parsed) return false;
            return response.value.data;
        }
    }

    share = {
        anime: (id) => `${Hub.url}/l/${id}`,
        user: (id) => `${Hub.url}/u/${id}`
    }

    help = {
        hasAccount: async ({ scope = 'acc' } = {}) => {
            return Hub.snapshot.state.permissions.includes(scope);
        },
        logout: async () => {
            return Hub.api.logout();
        }
    }
}();

export const Rooms = new class {
    constructor() {
        this.fetch = Hub.fetch;
    }

    /**
     * @param {number} aid 
     * @param {{access:string, kodikId:string, episode:number, friendIds:number[],canPause:boolean}} [opts] 
     */
    create(aid, opts = {}, event = () => { }) {
        const access = opts?.access;
        const kodikId = opts?.kodikId;
        const episode = opts?.episode;
        const friendIds = opts?.friendIds ?? [];
        const canPause = opts?.canPause ?? false;

        return this.fetch(`/api/anime/${aid}/rooms`, {
            method: 'POST', body: {
                access,
                friendIds,
                kodikId,
                episode,
                canPause
            }
        }, event);
    }

    list(aid, event = () => { }) {
        return this.fetch(`/api/anime/${aid}/rooms`, { method: 'GET' }, event);
    }

    join(rid, event = () => { }) {
        return this.fetch(`/api/rooms/${rid}/join`, { method: 'POST' }, event)
    }
}();