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
            log: (name, event = () => { }) => {
                const url = '/logs/upload';

                return {
                    POST: async (body = {}) => {
                        return this.fetch(url, { method: 'POST', body: { name, ...body } }, event);
                    }
                }
            },
            notify: {
                /**
                 * Подписка на уведомления
                 * @param {'dubEpisode' | 'roomCreate'} type 
                 * @param {Function} event 
                 * @returns 
                 */
                subscription: (type, event = () => { }) => {
                    const url = '/notify/subscription';

                    return {
                        POST: async (body = {}) => {
                            return this.fetch(url, { method: 'POST', body: { ...body, type } }, event);
                        },
                        DELETE: async ({ kodik_id, anime_id } = {}) => {
                            return this.fetch(url, { method: 'DELETE', body: { kodik_id, anime_id, type } }, event);
                        }
                    }
                },
                registration: (event = () => { }) => {
                    const url = '/notify';

                    return {
                        POST: async (body = {}) => {
                            return this.fetch(url, { method: 'POST', body }, event);
                        },
                        DELETE: async () => {
                            return this.fetch(url, { method: 'DELETE' }, event);
                        },
                        PATCH: async (body) => {
                            return this.fetch(url, { method: 'PATCH', body }, event);
                        }
                    }
                }
            },
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
        source: async (kodik, caching = true) => {
            const body = { src: kodik, caching };

            if (!Hub.snapshot.state.isConnected || !Hub.snapshot.state.permissions.includes("player")) return false;

            const response = await this.fetch('/video/source', { method: 'POST', body });

            if (!response.complete || !response.parsed) return false;
            return response.value.data;
        }
    }

    share = {
        anime: (id) => `${Hub.url}/l/${id}`,
        user: (id) => `${Hub.url}/u/${id}`,
        collection: (cid) => `${Hub.url}/c/${cid}`
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

export const Collections = new class {
    /** Зарезервированные имена вместо cid */
    SPECIAL = {
        RECOMMEND: 'recommend'
    };

    /** @type {{PRIVATE:'private', PUBLIC:'public'}} */
    VISIBILITY = {
        PRIVATE: 'private',
        PUBLIC: 'public'
    };

    /** @type {{CUSTOM:'custom', RECOMMEND:'recommend', FEATURED:'featured'}} */
    KIND = {
        CUSTOM: 'custom',
        RECOMMEND: 'recommend',
        FEATURED: 'featured'
    };

    constructor() {
        this.fetch = Hub.fetch;
    }

    /**
     * Собирает query-строку, пропуская пустые значения
     * @param {Object} params
     * @returns {string}
     */
    #query(params = {}) {
        const query = Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

        return query ? `?${query}` : '';
    }

    /** Приводит одно значение или массив к массиву id */
    #ids(value) {
        return Array.isArray(value) ? value : [value];
    }

    /**
     * Создать коллекцию.
     *
     * Состав передаётся сразу: сервер заводит коллекцию уже с аниме,
     * так что при обрыве связи не останется пустышки
     *
     * @param {{title:string, visibility?:string, cover?:number[], anime?:number[]}} data
     * @param {Function} [event]
     */
    create({ title, visibility = this.VISIBILITY.PRIVATE, cover = [], anime = [] } = {}, event = () => { }) {
        return this.fetch('/api/collections', {
            method: 'POST',
            body: {
                title, visibility,
                ...(cover.length > 0 ? { cover } : {}),
                ...(anime.length > 0 ? { anime } : {})
            }
        }, event);
    }

    /**
     * Свои коллекции, включая приватные
     * @param {{kind?:string, preview?:boolean, limit?:number}} [opts]
     *  preview — без списка аниме (для витрин и меню выбора)
     * @param {Function} [event]
     */
    list({ kind, preview, limit, rev } = {}, event = () => { }) {
        const url = `/api/collections${this.#query({ kind, preview, limit, rev })}`;
        return this.fetch(url, { method: 'GET' }, event);
    }

    /**
     * Подборки от разработчика
     * @param {{limit?:number}} [opts]
     * @param {Function} [event]
     */
    featured({ limit, rev } = {}, event = () => { }) {
        const url = `/api/collections/featured${this.#query({ limit, rev })}`;
        return this.fetch(url, { method: 'GET' }, event);
    }

    /**
     * Управление конкретной коллекцией.
     * Вместо cid принимает имя особой коллекции ('recommend').
     * @param {string} cid
     * @param {Function} [event]
     */
    entity(cid, event = () => { }) {
        const url = `/api/collections/${encodeURIComponent(cid)}`;

        const patch = (body) => this.fetch(url, { method: 'PATCH', body }, event);

        return {
            /** Коллекция вместе со списком аниме */
            GET: () => {
                return this.fetch(url, { method: 'GET' }, event);
            },

            /** Удалить коллекцию (особые удалить нельзя) */
            DELETE: () => {
                return this.fetch(url, { method: 'DELETE' }, event);
            },

            /**
             * Произвольное обновление — можно послать несколько полей сразу
             * @param {{title?:string, visibility?:string, cover?:number[]|'auto', add?:number[], remove?:number[]}} body
             */
            PATCH: (body = {}) => {
                return patch(body);
            },

            /**
             * Переименовать
             * @param {string} title
             */
            rename: (title) => {
                return patch({ title });
            },

            /**
             * Приватность: публичные коллекции видны в профиле
             * @param {'private' | 'public'} value
             */
            visibility: (value) => {
                return patch({ visibility: value });
            },

            cover: {
                /**
                 * Задать обложку вручную — 1..4 аниме из этой коллекции
                 * @param {number[] | number} ids
                 */
                set: (ids) => {
                    return patch({ cover: this.#ids(ids) });
                },

                /** Вернуть автоматическую сборку из последних добавленных */
                auto: () => {
                    return patch({ cover: 'auto' });
                }
            },

            anime: {
                /**
                 * Добавить аниме (одно или списком)
                 * @param {number[] | number} ids
                 */
                add: (ids) => {
                    return patch({ add: this.#ids(ids) });
                },

                /**
                 * Убрать аниме (одно или списком)
                 * @param {number[] | number} ids
                 */
                remove: (ids) => {
                    return patch({ remove: this.#ids(ids) });
                }
            }
        };
    }

    /**
     * Правка одного аниме сразу в нескольких коллекциях — одним запросом
     * и одной транзакцией на сервере.
     *
     * Избранное Shikimori сюда не входит: у него свой API.
     *
     * @param {number} aid
     * @param {{add?: string[], remove?: string[]}} changes
     * @param {Function} [event]
     */
    apply(aid, { add = [], remove = [] } = {}, event = () => { }) {
        return this.fetch(`/api/anime/${encodeURIComponent(aid)}/collections`, {
            method: 'PUT',
            body: { add, remove }
        }, event);
    }

    /**
     * Коллекция «Рекомендую» текущего пользователя.
     * Заводится сама при первом добавлении, отдельно создавать не нужно.
     * @param {Function} [event]
     */
    recommend(event = () => { }) {
        return this.entity(this.SPECIAL.RECOMMEND, event);
    }

    /**
     * Данные другого пользователя (страница профиля)
     * @param {string | number} id
     * @param {Function} [event]
     */
    user(id, event = () => { }) {
        return {
            /**
             * Коллекции пользователя. Чужие — только публичные,
             * свои — все (в ответе есть флаг `owner`)
             * @param {{kind?:string, limit?:number}} [opts]
             */
            collections: ({ kind, limit } = {}) => {
                const url = `/api/user/${id}/collections${this.#query({ kind, limit })}`;
                return this.fetch(url, { method: 'GET' }, event);
            },

            /**
             * Рекомендации пользователя плоским списком (новые сверху)
             * @param {{limit?:number}} [opts]
             */
            recommends: ({ limit } = {}) => {
                const url = `/api/user/${id}/recommends${this.#query({ limit })}`;
                return this.fetch(url, { method: 'GET' }, event);
            }
        };
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