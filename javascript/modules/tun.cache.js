import { DBControls, TDatabase } from "./TDatabase.js";

export class TCache {
    static instance = null;

    constructor() {
        if (TCache.instance) return TCache.instance;

        this.db = new TDatabase({
            name: "tun-cache",
            initStorages: [
                { name: "requests", keyPath: "id", autoIncrement: false },
                { name: "images", keyPath: "id", autoIncrement: false },
                { name: "metadata", keyPath: "id", autoIncrement: false }
            ]
        });

        TCache.instance = this;
    }

    /**
     *  Сохранение данных в кэш.
     * @param {"requests"|"images"|"metadata"} storeName - Название хранилища (requests, images, metadata).
     * @param {string} id - Уникальный ключ (например, URL или ключ настроек).
     * @param {any} data - Данные для сохранения.
     * @param {number} ttl - Время жизни в миллисекундах (по умолчанию 7 дней).
     * @returns {Promise<void>}
     */
    async put(storeName, id, data, ttl = 7 * 24 * 60 * 60 * 1000) {
        try {
            const expiresAt = Date.now() + ttl;
            await this.db.Open();
            const controls = new DBControls(this.db);

            await controls.set(storeName, { id }, { data, expiresAt });
            controls.Close();
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Получение данных из кэша.
     * @param {"requests"|"images"|"metadata"} storeName - Название хранилища (requests, images, metadata).
     * @param {string} id - Уникальный ключ.
     * @returns {Promise<any | null>} - Возвращает данные или null, если запись устарела или не найдена.
     */
    async get(storeName, id) {
        try {
            await this.db.Open();
            const controls = new DBControls(this.db);

            const record = await controls.get(storeName, { id });

            if (!record) return null;

            if (record.expiresAt && record.expiresAt < Date.now()) {
                await controls.delete(storeName, { id });
                controls.Close();
                return null;
            }

            controls.Close();
            return record.data;
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    /**
     * Очищает устаревшие записи из всех хранилищ.
     * @returns {Promise<void>}
     */
    async cleanup() {
        const now = Date.now();
        await this.db.Open();
        const controls = new DBControls(this.db);

        for (const storeName of ["requests", "images", "metadata"]) {
            const allRecords = await controls.getAll(storeName);

            for (const record of allRecords) {
                if (record.expiresAt && record.expiresAt < now) {
                    await controls.delete(storeName, { id: record.id });
                }
            }
        }

        controls.Close();
    }

    /**
     * Удаление данных из кэша.
     * @param {"requests"|"images"|"metadata"} storeName - Название хранилища (requests, images, metadata).
     * @param {string} id - Уникальный ключ.
     * @returns {Promise<void>}
     */
    async delete(storeName, id){
        await this.db.Open();
        const controls = new DBControls(this.db);

        await controls.delete(storeName, {id});
        controls.Close();
    }
}