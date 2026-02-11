import { md5 } from "../library/md5.wasm.min.js";
import { Sleep } from "./functions.js";
import { TCache } from "./tun.cache.js";

const BASE_URL = 'https://api.jikan.moe/v4'

class JikanControls {
    static instance = null;

    constructor() {
        if (JikanControls.instance) return JikanControls.instance;

        this.cache = new TCache();
        JikanControls.instance = this;
    }

    async hash(url) {
        return await md5(url);
    }

    async fetch(url, init, cache, ttl, e) {
        const hash = await this.hash(url.href);

        if (cache) {
            const cachedData = await this.cache.get("requests", hash);
            if (cachedData) {
                e(cachedData);
                return cachedData;
            }
        }

        return _fetch.bind(this)();

        function _fetch() {
            return new Promise((resolve) => {
                fetch(url, { ...init }).then(async (response) => {
                    if (!response.ok) {
                        if (response.status == 429) {
                            await Sleep(1200);
                            return _fetch();
                        }
                        return new Error(`Ошибка API: ${response.status}`);
                    }

                    response.json().then(async value => {
                        if (cache) {
                            await this.cache.put("requests", hash, value, ttl);
                        }
                        e(value);
                        resolve(value);
                    });
                }).catch(err => {
                    if (err?.name === "tabort") return;
                    throw err;
                });
            });
        }
    }
}

export const Jikan = {
    anime: {
        getAnimeFullById: (id, e = () => { }) => {
            const control = new JikanControls();
            const url = new URL(`${BASE_URL}/anime/${id}/full`);

            return {
                GET: (init = {}, cache = true, ttl = 60 * 60 * 1000) => {
                    return control.fetch(url, init, cache, ttl, e);
                }
            }
        },
        getAnimeSearch: (params = {}, e = () => { }) => {
            const control = new JikanControls();
            const url = new URL(`${BASE_URL}/anime`);

            Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

            return {
                GET: (init = {}, cache = true, ttl = 60 * 60 * 1000) => {
                    return control.fetch(url, init, cache, ttl, e);
                }
            }
        },
        getAnimeCharacters: (id, e = () => { }) => {
            const control = new JikanControls();
            const url = new URL(`${BASE_URL}/anime/${id}/characters`);

            return {
                GET: (init = {}, cache = true, ttl = 60 * 60 * 1000) => {
                    return control.fetch(url, init, cache, ttl, e);
                }
            }
        }
    },
    producers: {
        getProducerById: (id, e = () => { }) => {
            const control = new JikanControls();
            const url = new URL(`${BASE_URL}/producers/${id}`);

            return {
                GET: (init = {}, cache = true, ttl = 60 * 60 * 1000) => {
                    return control.fetch(url, init, cache, ttl, e);
                }
            }
        },
        getProducers: (params = {}, e = () => { }) => {
            const control = new JikanControls();
            const url = new URL(`${BASE_URL}/producers`);

            Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

            return {
                GET: (init = {}, cache = true, ttl = 60 * 60 * 1000) => {
                    return control.fetch(url, init, cache, ttl, e);
                }
            }
        }
    },
    seasons: {
        getSeasonNow: (params = {}, e = () => { }) => {
            const control = new JikanControls();
            const url = new URL(`${BASE_URL}/seasons/now`);

            Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

            return {
                GET: (init = {}, cache = true, ttl = 60 * 60 * 1000) => {
                    return control.fetch(url, init, cache, ttl, e);
                }
            }
        },
        getSeason: (year, season, params = {}, e = () => { }) => {
            const control = new JikanControls();
            const url = new URL(`${BASE_URL}/seasons/${year}/${season}`);

            Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

            return {
                GET: (init = {}, cache = true, ttl = 60 * 60 * 1000) => {
                    return control.fetch(url, init, cache, ttl, e);
                }
            }
        },
        getSeasonsList: (e = () => { }) => {
            const control = new JikanControls();
            const url = new URL(`${BASE_URL}/seasons`);

            return {
                GET: (init = {}, cache = true, ttl = 60 * 60 * 1000) => {
                    return control.fetch(url, init, cache, ttl, e);
                }
            }
        }
    },
    random: {
        getRandomAnime: (e = () => { }) => {
            const control = new JikanControls();
            const url = new URL(`${BASE_URL}/random/anime`);

            return {
                GET: (init = {}, cache = false, ttl = 0) => {
                    return control.fetch(url, init, cache, ttl, e);
                }
            }
        }
    },
    recommendations: {
        getRecentAnimeRecommendations: (params = {}, e = () => { }) => {
            const control = new JikanControls();
            const url = new URL(`${BASE_URL}/recommendations/anime`);

            Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

            return {
                GET: (init = {}, cache = true, ttl = 60 * 60 * 1000) => {
                    return control.fetch(url, init, cache, ttl, e);
                }
            }
        }
    },
    characters: {
        getCharacterFullById: (id, e = () => { }) => {
            const control = new JikanControls();
            const url = new URL(`${BASE_URL}/characters/${id}/full`);

            return {
                GET: (init = {}, cache = true, ttl = 60 * 60 * 1000) => {
                    return control.fetch(url, init, cache, ttl, e);
                }
            }
        },

        getCharacterPictures: (id, e = () => { }) => {
            const control = new JikanControls();
            const url = new URL(`${BASE_URL}/characters/${id}/pictures`);

            return {
                GET: (init = {}, cache = true, ttl = 60 * 60 * 1000) => {
                    return control.fetch(url, init, cache, ttl, e);
                }
            }
        }
    }
}