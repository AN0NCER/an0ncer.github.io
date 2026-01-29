import { DBControls, DBIndexing, TDatabase } from "./TDatabase.js"
import { Tunime } from "./api.tunime.js";
import { Sleep } from "./functions.js";


/**
 * Форматирует ссылку для fetch запросов добавляя https
 * @param {string} url - ссылка для форматирования
 * @returns {string} - Отфармотрованая ссылка
 */
const formatUrl = (url) => {
    return url.indexOf("http") != -1 ? url : `https:${url}`;
}

/**
 * Выбирает возможное самое близкое качество к заданым параметрам
 * @param {{'240':[{src:string, type:string}],'360':[{src:string, type:string}], '480':[{src:string, type:string}], '720':[{src:string, type:string}], '1080':[{src:string, type:string}]}} data - данные со всемы доступными качествами
 * @param {string|number} quality - Качество к каторому стремиться выбрать 
 * @returns {string|number} - максимальное доступное качество
 */
const getQuality = (data, quality) => {
    let allowQuality = Object.keys(data);

    //Записываем только досутпные разрешения
    for (let i = 0; i < allowQuality.length; i++) {
        const e = allowQuality[i];
        if (data[e].length == 0) {
            allowQuality.splice(i, 1);
        }
    }

    let idQuality = allowQuality.findIndex(x => x == quality);

    if (idQuality == -1) {
        if (allowQuality.length != 0) {
            quality = allowQuality[0];
        } else {
            return -1;
        }
    }

    return quality;
}

/**
 * Получить ссылку на m3u8 файл выбраного разрешения 
 * @param {string} kodikLink - kodik ссылка на плеер
 * @param {string} quality - качество загружаемого ролика
 * @returns {Promise<{quality:string, src:string} | {error:Object}>} - Возвращает m3u8 файл для загрузки
 */
const apiGetFLink = (kodikLink, quality) => {
    return new Promise(async (resolve, reject) => {
        const data = await Tunime.video.source(formatUrl(kodikLink));

        if (data.error || data === false)
            return reject('Tunime server error'); //TODO: Вернуть ошибку сервера

        const { qualities } = data;
        quality = getQuality(qualities, quality);
        resolve({ quality, src: qualities[quality][0].src });
    })
}

/**
 * Регулярное выражение для извлечения части ссылки с качеством удаляя путь к файлу
 * @param {string} link - ссылка на m3u8 файл
 * @param {string} quality - качество ресурса
 * @returns {string} - url ссылка на ресурсы ts фалов
 */
const linkParse = (link, quality) => {
    // Строка, которую нужно удалить
    let searchString = `${quality}.mp4:hls:manifest.m3u8`;
    // Регулярное выражение для извлечения части ссылки с качеством
    const pattern = /[^\/]+\.[^\/]+:hls:manifest\.m3u8/;
    const match = link.match(pattern);

    if (match) {
        searchString = match[0];
    }

    // Удалить подстроку из URL
    return link.substring(0, link.indexOf(searchString));
}

/**
 * Добавляет историю в БД
 * @param {TDownloader} control - контроллер загрузки
 * @param {{time:number, speed:number, size:number}} param - данные загрузки
 */
const addHistory = async (control, { time, speed, size } = {}) => {
    const limit = 5, name = 'history';
    const { db, data, vId } = control;

    /**@type {[HistoryTable]} */
    let hValue = await db.getAll(name);
    hValue.sort((a, b) => b.id - a.id);
    if (hValue.length >= limit) {
        const lastKey = hValue[hValue.length - 1].id;
        await db.delete(name, { id: lastKey });
    }

    await db.add(name, { animeId: data.anime.id, voiceId: data.voice.id, vId, time, speed, size, date: (new Date().toISOString()) });
}

export class TDLState {
    static #stats = [
        new TDLState("loading", 0),
        new TDLState("availble", 1),
        new TDLState("download", 2),
        new TDLState("stoped", 3),
        new TDLState("completed", 4),
        new TDLState("error", 5),
        new TDLState("save", 6)
    ]

    constructor(name, id) {
        this.name = name;
        this.id = id;
    }

    static #find(id) {
        return this.#stats.find(x => x.id === id);
    }

    static get loading() {
        return this.#find(0);
    }

    static get availble() {
        return this.#find(1);
    }

    static get download() {
        return this.#find(2);
    }

    static get stoped() {
        return this.#find(3);
    }

    static get completed() {
        return this.#find(4);
    }

    static get error() {
        return this.#find(5);
    }

    static get save() {
        return this.#find(6);
    }

    static all() {
        return this.#stats.map(state => state.name);
    }
}

/**
 * @typedef {Object} ATableP
 * @property {Blob} v - вертикальный постер
 * @property {Blob} h - горизонтальный постер
 */

/**
 * @typedef {Object} ATableE
 * @property {string} vId - индентификатор видео
 * @property {number} episode - номер загруженого эпизода
 * @property {string} quality - качество загруженого эпизода
 * @property {number} size - вес загруженого файла
 * @property {number} duration - продолжительность видео
 */

/**
 * @typedef {Object} ATableV
 * @property {string} name - название озвучки
 * @property {number} id - индентификатор озвучки
 * @property {[ATableE]} episodes - эпизоды данной озвучки
 */

/**
 * @typedef {Object} AnimeTable
 * @property {number} id - индентификатор аниме
 * @property {string} name - название аниме на русском
 * @property {ATableP} poster - постеры аниме
 * @property {Object.<number, ATableV>} video - загруженые эпизоды в таблице
 * @property {number} size - размер всего аниме в байтах
 */

/**
 * @typedef {Object} tdr_constructor
 * @property {TDatabase} db - база данных для загрузки аниме
 * @property {TDAnime} anime - аниме данные
 * @property {number} episode - выбранный эпизод
 * @property {string} kodikLink - ссылка на kodikPlayer
 * @property {string} quality - желаемое качество загрузки
 */

/**
 * @typedef {Object} TTableL
 * @property {number} time - время последнего обновления ссылки
 * @property {string | undefined} url - пряммая ссылка на сегменты и m3u8 файл
 */

/**
 * @typedef {Object} TaskTable
 * @property {number} id - индентификатор очереди загрузки
 * @property {string} vId - индентификатор видео
 * @property {number} size - текущий размер недогруженого видео
 * @property {number} speed - средняя скорость недогруженого видео
 * @property {number} time - пройденое время недозагруженого видео
 * @property {string} src - кодик ссылка
 * @property {string} quality - качество загружаемого эпизода
 * @property {TTableL} link - пряммая ссылка на ресурсы
 */

/**
 * @typedef {Object} VTableB - сегмент видео
 * @property {number} t - длительнось сегмента
 * @property {Blob|string} b - файл или ссылка на файл
 */

/**
 * @typedef {Object} VTableI - видео информация
 * @property {number} size - размер видео
 * @property {number} duration - продолжительност видео
 * @property {number} date - дата загрузки
 */

/**
 * @typedef {Object} M3U8 - данные файла
 * @property {number} sSequence - m3u8 данные
 * @property {number} sDuration - m3u8 данные
 */

/**
 * @typedef {Object} VideoTable
 * @property {string} vId - индентификатор видео
 * @property {[VTableB]} blobs - сегменты видео файла
 * @property {VTableI} info - информация о видео ролике
 * @property {M3U8} m3u8 - сохраненые данные
 */

/**
 * @typedef {Object} HistoryTable
 * @property {number} id - индентификатор очереди загркзки
 * @property {number} animeId - индентификатор аниме
 * @property {number} voiceId - индентификатор озвучки
 * @property {string} vId - индентификатор видео
 * @property {number} time - пройденое время загруженого видео
 * @property {number} speed - средняя скорость загруженого видео
 * @property {number} size - размер загруженого видео
 * @property {number} date - дата загрузки
 */

/**@type {[string]} */
const tasks = [];

class TDControl {
    #statsInterval;
    #controllers = {
        video: new AbortController()
    }
    #callbacks = {
        "completed": [], // 1
        "parts": [], // 1
        "error": [], // 1
        "abortet": [], // 1
        "stats": [], // 1
        "update": [], // 1
        "link": [], // 1
    }
    /**
     * Контроллер загрузчика видео
     * @param {TDownloader} tDownloader - основнолй компонент
     * @param {{tValue:TaskTable, vValue:VideoTable}} tables 
     */
    constructor(tDownloader, tables) {
        this.tDr = tDownloader;
        this.tValue = tables.tValue;
        this.vValue = tables.vValue;

        this.on("completed", async ({ size }) => {
            this.vValue.info.size = size;
            await this.tDr.db.set('video', { vId: this.tDr.vId }, this.vValue);
            await this.tDr.db.delete('task', { id: this.tValue.id });
        });
    }

    Abort() {
        this.#controllers.video.abort({ name: "tabort" });
        this.tDr.state = TDLState.stoped;
        tasks.splice(tasks.findIndex(x => x === this.tDr.vId), 1);
        clearInterval(this.#statsInterval);
        this.#Dispatch('abortet', this.tDr.state);
        this.#controllers.video = new AbortController();
    }

    async Download() {
        if ([TDLState.completed, TDLState.download].includes(this.tDr.state) || tasks.includes(this.tDr.vId))
            return this.#Dispatch('error', 'Ошибка, видео уже загруж(ено/аеться)');
        this.tDr.state = TDLState.download;
        tasks.push(this.tDr.vId);

        // console.log(this.tValue);
        if (this.tValue.link.url !== undefined) {
            if ((Date.now() - this.tValue.link.time) >= (6 * 60 * 60 * 1000)) {
                const { src, quality } = this.tValue;
                this.tValue.link = await this.#refreshVideoUrl(src, quality);
                //Обновляем url по которому будет загрудать ts ресурсы
                this.tValue = await this.tDr.db.set('task', { id: this.tValue.id }, this.tValue);
            }
        } else {
            //Новая загрузка
            const data = await apiGetFLink(this.tValue.src, this.tDr.quality);

            this.tValue.quality = data.quality;
            this.tDr.quality = data.quality;

            const stream = await this.#loadStreamings(data);

            this.tValue.link = {
                url: stream.url,
                time: Date.now()
            }

            this.vValue.blobs = stream.blobs;
            this.vValue.m3u8 = {
                sDuration: stream.sDuration,
                sSequence: stream.sSequence
            }

            await this.tDr.db.set("video", { vId: this.vId }, this.vValue);
            await this.tDr.db.set("task", { id: this.tValue.id }, this.tValue);
        }

        const { url } = this.tValue.link;
        let sizeLoaded = this.tValue.size;
        const startTime = Date.now();

        let averageSpeedMBps = this.tValue.speed; // Средняя скорость загрузки
        let elapsedTime = this.tValue.time; // Прошедшее время
        let progress = 0;

        let promiseRetry = []; // Если будет не удачная загрузка, то будет попытки снова перезагрузить ресурсы
        let isAbortet = false; // Если будет остановка загрузки то нужно будет сохранить то что уже загрузил

        const tryFetch = (link, attempt = 5) => {
            return new Promise((resolve) => {
                try {
                    fetch(link, { signal: this.#controllers.video.signal }).then(async response => {
                        const contentType = response.headers.get('Content-Type') || 'video/mp2t'; //Тип загружаемого файла
                        const reader = response.body.getReader();
                        const chunks = [];

                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            chunks.push(value);
                            sizeLoaded += value.length;
                        }

                        const endTime = Date.now();
                        elapsedTime = (endTime - startTime) / 1000;
                        averageSpeedMBps = (sizeLoaded / elapsedTime / (1024 * 1024)).toFixed(2);
                        const blob = new Blob(chunks, { type: contentType });
                        resolve(blob);
                    }).catch(async (err) => {
                        if (['AbortError', 'tabort'].includes(err.name)) {
                            if (!isAbortet) {
                                isAbortet = !isAbortet;
                                this.tValue.speed = averageSpeedMBps;
                                this.tValue.size = sizeLoaded;
                                this.tValue.time = elapsedTime;
                                await this.tDr.db.set("video", { vId: this.tDr.vId }, this.vValue);
                                await this.tDr.db.set("task", { id: this.tValue.id }, this.tValue);
                            }
                            return;
                        }
                        if (attempt > 0) {
                            console.log(`Retry loadin in 1 second. (${attempt}) attempts left.`);
                            await Sleep(1000);
                            return resolve(tryFetch(link, attempt - 1));
                        }
                        console.log(err);
                        this.#Error('Ошибка при загрузке аниме.')
                    });
                } catch (err) {
                    console.log(err);
                    this.#Error('Ошибка при загрузке аниме.')
                }
            })
        }

        /**@type {[Promise]} */
        let promiseTasks = [];
        let downloaded = 0;

        const { blobs } = this.vValue;

        this.#statsInterval = setInterval(() => {
            this.#Dispatch("stats", { speed: averageSpeedMBps, time: elapsedTime, size: sizeLoaded })
        }, 1000);

        this.#Dispatch("parts", blobs.length);

        for (let i = 0; i < blobs.length; i++) {
            const { b, t } = blobs[i];

            if (b instanceof Blob) {
                downloaded++;
                continue;
            }

            promiseTasks.push(tryFetch(`${url}${b}`).then(async (blob) => {
                this.vValue.blobs[i].b = blob;
                this.vValue.info.duration += t;
                downloaded++;

                if (downloaded % 30 === 0 && downloaded !== blobs.length) {
                    this.tValue.speed = averageSpeedMBps;
                    this.tValue.size = sizeLoaded;
                    this.tValue.time = elapsedTime;

                    await this.tDr.db.set("video", { id: this.tDr.vId }, this.vValue);
                    await this.tDr.db.set("task", { id: this.tValue.id }, this.tValue);
                } else if (downloaded === blobs.length) {
                    await this.tDr.db.set("video", { id: this.tDr.vId }, this.vValue);
                }

                progress = downloaded / blobs.length * 100;
                this.#Dispatch("update", { progress, parts: downloaded });
            }));
        }

        Promise.all(promiseTasks).then(() => {
            const finish = () => {
                clearInterval(this.#statsInterval);
                tasks.splice(tasks.findIndex(x => x === this.tDr.vId), 1);
                this.#Dispatch("completed", { size: sizeLoaded, time: elapsedTime, speed: averageSpeedMBps, duration: this.vValue.info.duration });
            }

            if (promiseRetry.length === 0) {
                finish();
            } else {
                Promise.all(promiseRetry).then(finish);
            }
        });
    }

    async LocalDownload() {
        if ([TDLState.completed, TDLState.download].includes(this.tDr.state) || tasks.includes(this.tDr.vId))
            return this.#Dispatch('error', 'Ошибка, видео уже загруж(ено/аеться)');
        this.tDr.state = TDLState.download;
        tasks.push(this.tDr.vId);

        //Новая загрузка
        const data = await apiGetFLink(this.tValue.src, this.tDr.quality);

        this.tValue.quality = data.quality;
        this.tDr.quality = data.quality;

        const stream = await this.#loadStreamings(data);

        this.tValue.link = {
            url: stream.url,
            time: Date.now()
        }

        this.vValue.blobs = stream.blobs;
        this.vValue.m3u8 = {
            sDuration: stream.sDuration,
            sSequence: stream.sSequence
        }

        //Из за того что это локальная загрузка, то нужно удалить данные из БД
        await this.tDr.db.delete("task", { id: this.tValue.id });
        await this.tDr.db.delete("video", { id: this.tDr.vId });

        //Загружаем все сегменты видео
        const { blobs } = this.vValue;
        const { url } = this.tValue.link;
        const startTime = Date.now();

        let averageSpeedMBps = 0; // Средняя скорость загрузки
        let elapsedTime = 0; // Прошедшее время
        let progress = 0; // Прогресс загрузки
        let downloaded = 0; // Количество загруженых сегментов
        let sizeLoaded = 0; // Размер загруженого видео

        let promiseTasks = [];
        let isAbortet = false; // Если будет остановка загрузки то нужно будет сохранить то что уже загрузил

        const tryFetch = (link, attempt = 5) => {
            return new Promise((resolve) => {
                fetch(link).then(async response => {
                    const contentType = response.headers.get('Content-Type') || 'video/mp2t'; //Тип загружаемого файла
                    const reader = response.body.getReader();
                    const chunks = [];

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        chunks.push(value);
                        sizeLoaded += value.length;
                    }

                    const blob = new Blob(chunks, { type: contentType });
                    resolve(blob);
                }).catch(async (err) => {
                    if (['AbortError', 'tabort'].includes(err.name)) {
                        if (!isAbortet) {
                            isAbortet = !isAbortet;
                        }
                        return;
                    }
                    if (attempt > 0) {
                        console.log(`Retry loadin in 1 second. (${attempt}) attempts left.`);
                        await Sleep(1000);
                        return resolve(tryFetch(link, attempt - 1));
                    }
                    console.log(err);
                    this.#Error('Ошибка при загрузке аниме.')
                });
            });
        };

        this.#statsInterval = setInterval(() => {
            elapsedTime = (Date.now() - startTime) / 1000;
            averageSpeedMBps = (sizeLoaded / elapsedTime / (1024 * 1024)).toFixed(2);
            this.#Dispatch("stats", { speed: averageSpeedMBps, time: elapsedTime, size: sizeLoaded, })
        }, 1000);

        this.#Dispatch("parts", blobs.length);

        for (let i = 0; i < blobs.length; i++) {
            const { b } = blobs[i];

            if (b instanceof Blob) {
                downloaded++;
                sizeLoaded += b.size;
                continue;
            }

            promiseTasks.push(tryFetch(`${url}${b}`).then(async (blob) => {
                this.vValue.blobs[i].b = blob;
                downloaded++;

                progress = downloaded / blobs.length * 100;
                this.#Dispatch("update", { progress, parts: downloaded });
            }));
        }

        Promise.all(promiseTasks).then(() => {
            const finish = () => {
                clearInterval(this.#statsInterval);
                tasks.splice(tasks.findIndex(x => x === this.tDr.vId), 1);
                this.#Dispatch("link", this.#CreateBlob(this.vValue.blobs));
                this.tDr.state = TDLState.save;
            };

            finish();
        });

    }

    /**
     * Получает данные с m3u8 файла
     * @param {{src:string, quality:string|number }} data - данные загрузки 
     * @returns {Promise<{blobs:[VTableB],sDuration:number,sSequence:number, url:string}>}
     */
    async #loadStreamings(data) {
        const parseData = (line) => {
            return parseFloat(line.split(':')[1]);
        }

        // Загружаем m3u8 файл и разбираем его
        return new Promise((resolve) => {
            fetch(formatUrl(data.src)).then((response) => {
                const url = linkParse(response.url, data.quality);
                response.text().then((content) => {
                    const lines = content.split('\n');
                    const blobs = [];
                    let duration = null;
                    let sDuration = 0;
                    let sSequence = 0;

                    lines.forEach((line) => {
                        line = line.trim();
                        if (line.startsWith('#EXTINF:')) {
                            // Извлекаем длительность из строки #EXTINF
                            duration = parseData(line);
                        } else if (line.endsWith('.ts')) {
                            // Добавляем объект с URL и длительностью сегмента
                            blobs.push({ b: line, t: duration });
                            duration = null; // Сбрасываем длительность для следующего сегмента
                        } else if (line.startsWith('#EXT-X-TARGETDURATION:')) {
                            sDuration = parseData(line);
                        } else if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
                            sSequence = parseData(line);
                        }
                    });

                    return resolve({ blobs, sDuration, sSequence, url });
                });
            })
        });
    }

    /**
     * Создает файл и  ссылку на файл
     * @param {[VTableB]} data 
     */
    #CreateBlob(data) {
        const blob = new Blob(data.map(x => x.b), { type: 'video/mp2t' });
        return URL.createObjectURL(blob);
    }

    #Error(msg) {
        tasks.splice(tasks.findIndex(x => x === this.tDr.vId), 1);
        this.#Dispatch('error', msg);
    }

    /**
     * Получает обновленую ссылку
     * @param {string} kodikLink - ссылка на плеер Kodik
     * @param {string} quality - качество загружаемого видео
     * @returns {Promise<{url:string, time:number}>}
     */
    async #refreshVideoUrl(kodikLink, quality) {
        const data = await apiGetFLink(kodikLink, quality);
        if (data.error) {
            return this.url; //TODO: Огшибка сервера
        }

        return new Promise((resolve) => {
            fetch(formatUrl(data.src)).then((response) => {
                return resolve({ url: linkParse(response.url, data.quality), time: Date.now() });
            });
        });
    }

    /**
     * Добавляет обработчик события.
     * @param {"completed" | "parts" | "error" | "abortet" | "stats" | "update" | "link"} event - Название события.
     * @param {Function} callback - Функция обработчик события.
     */
    on(event, callback) {
        if (typeof callback !== "function") return;
        const [mainEvent, subEvent] = event.split(".");
        if (!this.#callbacks[mainEvent]) {
            this.#callbacks[mainEvent] = {};
        }
        if (subEvent) {
            if (!this.#callbacks[mainEvent][subEvent]) {
                this.#callbacks[mainEvent][subEvent] = [];
            }
            this.#callbacks[mainEvent][subEvent].push(callback);
        } else {
            if (!this.#callbacks[mainEvent].default) {
                this.#callbacks[mainEvent].default = [];
            }
            this.#callbacks[mainEvent].default.push(callback);
        }
    }

    off(event, callback) {
        const [mainEvent, subEvent] = event.split(".");
        if (!this.#callbacks[mainEvent]) return;
        if (subEvent) {
            if (!this.#callbacks[mainEvent][subEvent]) return;
            if (!callback) {
                delete this.#callbacks[mainEvent][subEvent];
            } else {
                this.#callbacks[mainEvent][subEvent] = this.#callbacks[mainEvent][subEvent].filter(cb => cb !== callback);
            }
        } else {
            if (!callback) {
                delete this.#callbacks[mainEvent];
            } else if (this.#callbacks[mainEvent].default) {
                this.#callbacks[mainEvent].default = this.#callbacks[mainEvent].default.filter(cb => cb !== callback);
            }
        }
    }

    /**
     * Вызывает функция событий с данными.
     * @param {"completed" | "parts" | "error" | "abortet" | "stats" | "update" | "link"} event - Название события.
     * @param {Object} data - данные которые приходят в функцию.
     */
    #Dispatch(event, data) {
        const mainEvent = event;
        if (!this.#callbacks[mainEvent]) return;

        // Вызов всех обработчиков для события и всех его под-событий
        Object.keys(this.#callbacks[mainEvent]).forEach(key => {
            if (key === "default") return;
            this.#callbacks[mainEvent][key].forEach(callback => callback(data));
        });

        // Вызов обработчиков по умолчанию
        if (this.#callbacks[mainEvent].default) {
            this.#callbacks[mainEvent].default.forEach(callback => callback(data));
        }
    }
}

class TDownloader {
    #callbacks = {
        "state": [], // 1
        "error": []
    }
    /**
     * Инициализирует Менеджер загрузки аниме
     * @param {tdr_constructor} param 
     */
    constructor({ db, anime, episode, kodikLink, quality } = {}) {
        this.db = new DBControls(db);
        this.data = anime; // <- Аниме информация
        this.episode = episode;
        this.kodikLink = kodikLink;
        this.quality = `${quality}`;

        this.vId = `${anime.anime.id}-${episode}-${anime.voice.id}`; // <- индиведуальный ид для видео
    }

    //Текущее состояние контролера
    #state = TDLState.loading;

    get state() {
        return this.#state;
    }

    set state(val) {
        this.#state = val;
        this.#Dispatch("state", this.#state);
    }

    //Выбранный эпизод
    #episode = 0;

    get episode() {
        return this.#episode;
    }

    set episode(value) {
        this.#episode = parseInt(value);
        this.vId = `${this.data.anime.id}-${this.#episode}-${this.data.voice.id}`;
    }


    /**
     * Получает состояние загрузки видео
     * @returns {Promise<TDLState>} Состояние видео
     */
    async Isset() {
        if (this.state === TDLState.save) {
            return this.state = TDLState.save;
        }

        if (tasks.findIndex(x => x === this.vId) !== -1) {
            this.state = TDLState.download;
            return this.state;
        }

        if ((await this.db.issetByKey("task", { key: "vId", id: this.vId }))) {
            this.state = TDLState.stoped;
            return this.state;
        };

        /** @type {null | AnimeTable} */
        const aTable = await this.db.get("anime", { id: this.data.anime.id });

        if (aTable === null) {
            this.state = TDLState.availble;
            return this.state;
        }

        let index = -1;
        const { [this.data.voice.id]: voice } = aTable.video;

        if (voice) {
            index = voice.episodes.findIndex(x => x.episode === this.episode);
        }

        if (index === -1) {
            this.state = TDLState.availble;
            return this.state;
        }

        this.state = TDLState.completed;
        return this.state;
    }

    /**
     * Настройка даннных таблицы для загрузки видео
     * @returns {Promise<TDControl>} управление загрузчиком видео
     */
    async Setup() {
        // Проверка на права пользователя 
        if (!window.$SHADOW.state.isConnected && window.$SHADOW.state.hasApiAccess) {
            return this.#Dispatch("error", `Нету доступа к Tunime серверу`);
        }

        const status = this.state;

        if (status === TDLState.completed) {
            return this.#Dispatch("error", `Эпизод (${this.episode}) уже загружен`);
        }

        this.kodikLink += `?episode=${this.episode}`;

        /**@type {TaskTable} */
        let tValue = null;
        /**@type {VideoTable} */
        let vValue = null;

        if (status === TDLState.stoped) {
            tValue = await this.db.getByKey("task", { key: 'vId', id: this.vId });
            vValue = await this.db.get("video", { id: this.vId });
        }

        if (status === TDLState.availble) {
            await this.data.NewTable(this.db);
            if (tValue === null) {
                tValue = {
                    vId: this.vId,
                    link: {
                        time: 0,
                        url: undefined
                    },
                    quality: this.quality,
                    size: 0,
                    speed: 0,
                    src: this.kodikLink,
                    time: 0
                }
            }

            if (vValue === null) {
                vValue = {
                    vId: this.vId,
                    info: {
                        date: Date.now(),
                        size: 0,
                        duration: 0
                    }
                }
            }

            await this.db.set("video", { vId: this.vId }, vValue);
            tValue.id = await this.db.set("task", { vid: this.vId }, tValue);
        }

        const control = new TDControl(this, { tValue, vValue });

        control.on("completed", async ({ size, time, speed, duration }) => {
            /**
             * Обновляем аниме данные указывая новый размер аниме, и добавляя эпизод,
             * после чего сортируем эпизоды чтобы они отображались от меньшего к большему
             */

            /**@type {AnimeTable} */
            const aValue = await this.db.get('anime', { id: this.data.anime.id });
            aValue.size += size;
            aValue.video[this.data.voice.id].episodes.push({
                vId: this.vId,
                episode: this.episode,
                quality: this.quality,
                size: size,
                duration: duration
            });
            aValue.video[this.data.voice.id].episodes.sort((a, b) => a.episode - b.episode);
            await this.db.set('anime', { id: this.data.anime.id }, aValue);
            //Добавляем в историю о том что аниме было загружено
            await addHistory(this, { size, time, speed });
            //Изменяем статус на "completed"
            this.state = TDLState.completed;
        });

        return control;
    }

    async Delete() {
        /**
         * Нужно удалить загрузку в каждом таблице
         * anime, history, task, video
         */
        const fromAnime = async (id) => {
            /**@type {[TaskTable]} */
            const tasks = await this.db.getAll('task');
            /**@type {null | AnimeTable} */
            let data = await this.db.get('anime', { id });

            const issetTask = tasks.findIndex(x => x.vId.startsWith(`${id}`) && x.vId.endsWith(`${this.data.voice.id}`));

            if (data === null)
                return;

            const { [this.data.voice.id]: voice } = data.video;

            if (!voice)
                return;

            if (voice.episodes.length <= 1) {
                if (Object.keys(data.video).length <= 1 && issetTask == -1) {
                    return await this.db.delete('anime', { id });
                }
            }

            const index = voice.episodes.findIndex(x => x.episode === this.episode);

            if (index === -1)
                return;

            voice.episodes.splice(index, 1);
            data.video[this.data.voice.id] = voice;
            await this.db.set('anime', { id }, data);
        }

        const fromHistory = async () => {
            /**@type {[HistoryTable]} */
            const data = await this.db.getAll('history');

            if (data.length === 0)
                return;

            const index = data.findIndex(x => x.vId === this.vId);

            if (index === -1)
                return;

            await this.db.delete('history', { id: data[index].id });
        }

        const fromTask = async () => {
            /**@type {null|TaskTable} */
            const data = await this.db.getByKey('task', { key: 'vId', id: this.vId });

            if (data === null)
                return;

            await this.db.delete('task', { id: data.id });
        }

        const fromVideo = async () => {
            await this.db.delete('video', { id: this.vId });
        }

        try {
            if (this.state === TDLState.download)
                return;

            await fromTask();
            await fromAnime(this.data.anime.id);
            await fromHistory();
            await fromVideo();
            this.state = TDLState.availble;
        } catch (err) {
            console.log(err);
            this.#Dispatch('error', `Не удалось удалить эпизод (${this.episode})`);
        }
    }

    /**
     * Добавляет обработчик события.
     * @param {"state" | "error"} event - Название события.
     * @param {Function} callback - Функция обработчик события.
     */
    on(event, callback) {
        if (typeof callback !== "function") return;
        const [mainEvent, subEvent] = event.split(".");
        if (!this.#callbacks[mainEvent]) {
            this.#callbacks[mainEvent] = {};
        }
        if (subEvent) {
            if (!this.#callbacks[mainEvent][subEvent]) {
                this.#callbacks[mainEvent][subEvent] = [];
            }
            this.#callbacks[mainEvent][subEvent].push(callback);
        } else {
            if (!this.#callbacks[mainEvent].default) {
                this.#callbacks[mainEvent].default = [];
            }
            this.#callbacks[mainEvent].default.push(callback);
        }
    }

    off(event, callback) {
        const [mainEvent, subEvent] = event.split(".");
        if (!this.#callbacks[mainEvent]) return;
        if (subEvent) {
            if (!this.#callbacks[mainEvent][subEvent]) return;
            if (!callback) {
                delete this.#callbacks[mainEvent][subEvent];
            } else {
                this.#callbacks[mainEvent][subEvent] = this.#callbacks[mainEvent][subEvent].filter(cb => cb !== callback);
            }
        } else {
            if (!callback) {
                delete this.#callbacks[mainEvent];
            } else if (this.#callbacks[mainEvent].default) {
                this.#callbacks[mainEvent].default = this.#callbacks[mainEvent].default.filter(cb => cb !== callback);
            }
        }
    }

    /**
     * Вызывает функция событий с данными.
     * @param {"state" | "error"} event - Название события.
     * @param {Object} data - данные которые приходят в функцию.
     */
    #Dispatch(event, data) {
        const mainEvent = event;
        if (!this.#callbacks[mainEvent]) return;

        // Вызов всех обработчиков для события и всех его под-событий
        Object.keys(this.#callbacks[mainEvent]).forEach(key => {
            if (key === "default") return;
            this.#callbacks[mainEvent][key].forEach(callback => callback(data));
        });

        // Вызов обработчиков по умолчанию
        if (this.#callbacks[mainEvent].default) {
            this.#callbacks[mainEvent].default.forEach(callback => callback(data));
        }
    }
}

class TManager {
    /**
     * 
     * @param {TDAnime} data 
     */
    constructor(data, db) {
        this.db = new DBControls(db);
        this.data = data;
    }

    vId(episode) {
        return `${this.data.anime.id}-${episode}-${this.data.voice.id}`;
    }

    async IsDownloaded(episode) {
        episode = parseInt(episode);
        /**@type {null | AnimeTable} */
        const aValue = await this.db.get('anime', { id: this.data.anime.id });
        if (aValue === null)
            return false;

        const { [this.data.voice.id]: voice } = aValue.video;

        if (!voice)
            return false;

        const i = voice.episodes.findIndex(x => x.episode === episode);
        if (i === -1)
            return false;
        return true;
    }

    async getAnimeSize() {
        /**@type {[AnimeTable]} */
        const aValue = await this.db.getAll('anime');
        let size = 0;
        aValue.forEach(x => {
            size += x.size;
        });
        return size;
    }

    /**
     * Возвращает все эпизод данного аниме
     * @returns {Promise<[number]>}
     */
    async getEpisodes() {
        /**@type {null | AnimeTable} */
        const aValue = await this.db.get('anime', { id: this.data.anime.id });
        if (aValue === null)
            return [];
        const { [this.data.voice.id]: voice } = aValue.video;
        if (voice === undefined)
            return [];
        return voice.episodes;
    }

    /**
     * Удаление задачи
     * @param {{animeId:number, episodeId:number, voiceId:number}} param 
     * @param {string} vId 
     * @returns {boolean}
     */
    async RemoveTask({ animeId, episodeId, voiceId } = {}, vId) {
        /**
         * Нужно удалить загрузку в каждом таблице
         * anime, task, video
         */
        const fromAnime = async (id) => {
            /**@type {null | AnimeTable} */
            let data = await this.db.get('anime', { id });

            if (data === null)
                return;

            const { [voiceId]: voice } = data.video;

            if (!voice)
                return;

            if (voice.episodes.length <= 1) {
                if (Object.keys(data.video).length <= 1) {
                    return await this.db.delete('anime', { id });
                }
            }

            const index = voice.episodes.findIndex(x => x.episode === this.episode);

            if (index === -1)
                return;

            voice.episodes.splice(index, 1);
            data.video[this.data.voice.id] = voice;
            await this.db.set('anime', { id }, data);
        }

        const fromTask = async (vId) => {
            /**@type {null|TaskTable} */
            const data = await this.db.getByKey('task', { key: 'vId', id: vId });

            if (data === null)
                return;

            await this.db.delete('task', { id: data.id });
        }

        const fromVideo = async (vId) => {
            await this.db.delete('video', { id: vId });
        }

        if (tasks.includes(vId))
            return false;

        /**@type {[TaskTable]} */
        const tableTask = (await this.db.getAll('task')).filter(x => x.vId.startsWith(`${animeId}`) && x.vId.endsWith(`${voiceId}`));

        //Есть такая задача
        const isIsset = tableTask.findIndex(x => x.vId === vId) === -1 ? false : true;
        //Имеет другие не завершенные загрузки
        const isAvailble = tableTask.length > 1 ? true : false;

        if (!isIsset)
            return false;

        if (!isAvailble)
            await fromAnime(animeId)
        await fromTask(vId)
        await fromVideo(vId);

        return true;
    }
}

export class TDAnime {
    constructor({ anime = { id: 0, name: undefined }, voice = { id: 0, name: undefined } } = {}) {
        this.anime = {
            id: parseInt(anime.id),
            name: anime.name
        };
        this.voice = {
            id: parseInt(voice.id),
            name: voice.name
        };
        this.img = '/images/img.404a.webp';
    }

    /**
     * Создает аниме в БД `anime`
     * @param {DBControls} db - контроллер БД
     * @returns {Promise<undefined>}
     */
    async NewTable(db) {
        /**
         * Загружает и конвертирует img в blob
         * @param {string} url - ссылка на изображение
         * @returns {Promise<string|Blob>}
         */
        const imageToBlob = (url) => {
            return new Promise(async (resolve) => {
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    resolve(blob);
                } catch {
                    resolve(this.img);
                }
            });
        }

        const jikanApi = () => {
            return new Promise(async (resolve) => {
                try {
                    const response = await fetch(`https://api.jikan.moe/v4/anime/${this.anime.id}/pictures`);
                    const { data } = await response.json();
                    resolve(imageToBlob(data[0].jpg.image_url));
                } catch {
                    resolve(this.img);
                }
            })
        }

        /**@type {AnimeTable | null} */
        let aValue = await db.get("anime", { id: this.anime.id });
        if (aValue === null) {
            const h = await jikanApi();
            let size = 0;
            if (h instanceof Blob)
                size = h.size;
            aValue = {
                size,
                name: this.anime.name,
                poster: { h },
                video: {
                    [this.voice.id]: {
                        id: this.voice.id,
                        name: this.voice.name,
                        episodes: []
                    }
                }
            }

            await db.set("anime", { id: this.anime.id }, aValue);
        } else {
            let { [this.voice.id]: voice } = aValue.video;
            if (!voice) {
                voice = {
                    id: this.voice.id,
                    name: this.voice.name,
                    episodes: []
                }

                aValue.video[this.voice.id] = voice;

                await db.set("anime", { id: this.anime.id }, aValue);
            }
        }
    }
}

export class TDownload {
    static #db;
    /**
     * Инициализация БД "downloader"
     * @returns {Promise<TDatabase>}
     */
    static async #dbInit() {
        if (!this.#db) {
            const dbConstructor = new TDatabase({
                name: "downloader",
                initStorages: [
                    { name: "video", keyPath: "vId", autoIncrement: false },
                    { name: "task", keyPath: "id", autoIncrement: true, indexing: [new DBIndexing('vId', 'vId', { unique: true })] },
                    { name: "anime", keyPath: "id", autoIncrement: false },
                    { name: "history", keyPath: "id", autoIncrement: true }
                ]
            });
            await dbConstructor.Open();
            this.#db = dbConstructor;
        }
        return this.#db;
    }
    /**
     * Аниме загрузчик
     * @param {TDAnime} anime - аниме данные
     * @param {number | string} episode - эпизод аниме
     * @param {string} kodikLink - ссылка на kodikPlayer
     * @param {number | string} quality - желаемое качество
     * @returns {Promise<TDownloader>}
     */
    static async Downloader(anime, episode, kodikLink, quality) {
        const db = await this.#dbInit();
        return new TDownloader({ db, anime, episode, kodikLink, quality });
    }

    /**
     * Информация в БД
     * @param {TDAnime} anime - аниме данные
     * @returns {Promise<TManager>}
     */
    static async Manager(anime) {
        const db = await this.#dbInit();
        return new TManager(anime, db);
    }
}