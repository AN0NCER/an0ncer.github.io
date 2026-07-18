// Базовый провайдер — каждый знает свой ключ в localStorage
class StorageProvider {
    key = ""; // ключ в localStorage (например "db:notifications")

    read(id) {
        const db = JSON.parse(localStorage.getItem(this.key)) || {};
        return db[id] ?? this.default();
    }

    write(id, val) {
        const db = JSON.parse(localStorage.getItem(this.key)) || {};
        if (val === undefined || val === null) {
            delete db[id];
        } else {
            db[id] = val;
        }
        localStorage.setItem(this.key, JSON.stringify(db));
    }

    default() { return undefined; }
}

class AnimeProvider extends StorageProvider {
    key = "anime-db";
    default() {
        return { synch: $PARAMETERS.anime.syncdata, ldata: undefined };
    }
}

class NotificationsProvider extends StorageProvider {
    key = "db:notifications";
    default() { return []; }

    // Не пишем пустой массив
    write(id, val) {
        super.write(id, val?.length ? val : undefined);
    }
}

export const DBAnime = new class {
    #providers = new Map();
    /**@type {Map<string, StorageProvider>} - кэш каждого **provider** */
    #cache;

    constructor(id) {
        /** @type {string} - ключ ID аниме куда подключается **provider** @private */
        this.id = id;
        this.#cache = new Map();

        this.register("anime", new AnimeProvider());
        this.register("notifications", new NotificationsProvider());

        this.#loadAll()
    }

    /**
     * Регистрация нового **provider**
     * @param {string} name - ключ для ображение к **provider** 
     * @param {StorageProvider} provider 
     * @private
     */
    register(name, provider) {
        this.#providers.set(name, provider);
    }

    /**
     * Загрузка каждого **provider** данных в cache
     */
    #loadAll() {
        for (const [name, provider] of this.#providers) {
            this.#cache.set(name, provider.read(this.id));
        }
    }

    /**
     * Получение данных с кэша хранилища
     * @param {"anime" | "notifications"} provider - ключ **provider** 
     * @param {string} key - ключ данных
     * @returns {any}
     */
    get(provider, key) {
        const data = this.#cache.get(provider);
        return key ? data?.[key] : data;
    }

    /**
     * Сохранение данных в localStorage
     * @param {"anime" | "notifications"} provider - ключ **provider** 
     * @param {string | null | undefined} [key] - ключ данных
     * @param {any} val - значение для записи
     */
    set(provider, key, val) {
        if (key !== undefined && key !== null) {
            // Обновляем одно поле внутри провайдера
            const data = { ...this.#cache.get(provider) }; // не мутируем кеш напрямую
            data[key] = val;
            this.#cache.set(provider, data);
        } else {
            // Заменяем весь объект провайдера
            this.#cache.set(provider, val);
        }

        this.#providers.get(provider)?.write(this.id, this.#cache.get(provider));
    }
}(new URLSearchParams(window.location.search).get("id"));