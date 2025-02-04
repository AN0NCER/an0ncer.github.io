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
 * @typedef {Object} ATableP
 * @property {Blob} v - вертикальный постер
 * @property {Blob} h - горизонтальный постер
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