/**
 * Преобразует объект с параметрами запроса в строку параметров URL в формате запроса.
 * @param {Object} q - Объект с параметрами запроса в виде ключ-значение.
 * @returns {string} Строка с параметрами URL в формате запроса, начинающаяся с "?",
 * или пустая строка, если объект с параметрами пуст.
 */
export function ObjectToQuery(q = {}) {
    let ret = "";
    if (Object.keys(q).length > 0) {
        ret += "?" + new URLSearchParams(q).toString();
    }
    return ret;
}

/**
 * Утилита для выполнения HTTP-запросов с возможностью настройки метода, URL, заголовков и тела запроса.
 * @param {string} method - HTTP-метод запроса (например, "GET", "POST", "PUT", "DELETE" и т.д.).
 * @param {string} url - URL, на который будет отправлен запрос.
 * @param {Object} headers - Объект с заголовками запроса в виде ключ-значение.
 * @param {string|Object} body - Тело запроса, может быть строкой или объектом, который будет преобразован в JSON-строку.
 * @returns {Object} Объект с методами для настройки запроса и выполнения запроса.
 */
export function Fetch(method, url, headers, body = "") {
    return {
        method: method,
        url: url,
        headers: headers,
        body: body,
        badresponse: {
            failed: true,
            status: "404",
        },

        /**
         * Метод для установки HTTP-метода запроса.
         * @param {string} method - Новый HTTP-метод запроса.
         * @returns {string} Установленный HTTP-метод запроса.
         */
        setMethod: function (method) {
            this.method = method;
            return this.method;
        },

        /**
         * Метод для установки URL для отправки запроса.
         * @param {string} url - Новый URL для запроса.
         * @returns {string} Установленный URL для запроса.
         */
        setUrl: function (url) {
            this.url = url;
            return this.url;
        },

        /**
         * Метод для установки заголовков запроса.
         * @param {Object} headers - Объект с заголовками запроса в виде ключ-значение.
         * @returns {Object} Установленные заголовки запроса.
         */
        setHeaders: function (headers) {
            this.headers = headers;
            return this.headers;
        },

        /**
         * Метод для установки тела запроса.
         * Если передан объект, он будет преобразован в JSON-строку.
         * @param {string|Object} body - Тело запроса (строка или объект).
         * @returns {string|Object} Установленное тело запроса.
         */
        setBody: function (body) {
            if (typeof body === "object") {
                body = JSON.stringify(body);
            }
            this.body = body;
            return this.body;
        },

        /**
         * Метод для выполнения HTTP-запроса.
         * @returns {Promise} Промис, который разрешается в JSON-ответе на запрос или объекте badresponse в случае ошибки.
         */
        fetch: function () {
            if (!this.url) {
                return this.badresponse;
            }

            let request = {
                method: this.method,
                headers: this.headers,
            };

            if (this.body) {
                request.body = this.body;
                if (!(request.body instanceof FormData))
                    request.headers["Content-Type"] = "application/json";
            }

            return new Promise((resolve) => {
                fetch(this.url, request).then((response) => {
                    if (!response.ok) {
                        let r = this.badresponse;
                        r.status = response.status;
                        return resolve(r);
                    }
                    if (response.status == 204) {
                        return resolve({ ok: response.ok, status: response.status });
                    }
                    
                    response.json().then(json => {
                        return resolve(json);
                    }).catch(()=>{
                        return resolve({ ok: response.ok, status: response.status });
                    })
                });
            });
        },
    };
}

/**
 * Функция задержки (сна) на указанное количество миллисекунд.
 * Возвращает промис, который разрешается после заданной задержки.
 * @param {number} ms - Количество миллисекунд для задержки.
 * @returns {Promise} Промис, который разрешается после заданной задержки.
 */
export function Sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Возвращает объект с методами для отслеживания прокрутки до элемента с указанным классом и удаления слушателя события прокрутки.
 * @returns {Object} Объект с методами eventScroll и removeEvent.
 */
export function TrackElement() {
    return {
        Handler: undefined,

        /**
         * Метод для отслеживания события прокрутки до элемента с указанным классом.
         * Когда элемент появляется в области видимости окна, вызывается переданный обратный вызов (callback).
         * @param {string} className - Класс элемента, который необходимо отслеживать.
         * @param {function} callback - Обратный вызов, который будет вызван, когда элемент станет видимым.
         */
        eventScroll: function (className, callback) {
            this.removeEvent();
            this.Handler = () => {
                const target = document.querySelector(className);
                if (!target) return; // Если элемент с указанным классом не найден, выходим из метода.
                const targetHeight = target.offsetHeight;
                const scrollPosition = window.scrollY;
                const viewportHeight = window.innerHeight;
                if (scrollPosition + viewportHeight >= targetHeight) {
                    callback();
                    this.removeEvent();
                }
            };
            window.addEventListener('scroll', this.Handler);
        },

        /**
         * Метод для удаления слушателя события прокрутки.
         * Удаляет ранее установленный слушатель, чтобы прекратить отслеживание события прокрутки.
         */
        removeEvent: function () {
            if (this.Handler !== undefined) {
                window.removeEventListener('scroll', this.Handler);
                this.Handler = undefined;
            }
        }
    }
}

/**
 * Вычисляет хеш SHA-256 для переданной строки.
 * @param {string} str - Строка для вычисления хеша SHA-256.
 * @returns {string} Хеш в шестнадцатеричном формате.
 */
export function sha256(str) {
    const utf8Encoder = new TextEncoder();
    const data = utf8Encoder.encode(str);

    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }

    function sha256Round(k, w) {
        const a = new Uint32Array([
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
        ]);
        const wCopy = w.slice();

        for (let i = 16; i < 64; i++) {
            const s0 = rightRotate(wCopy[i - 15], 7) ^ rightRotate(wCopy[i - 15], 18) ^ (wCopy[i - 15] >>> 3);
            const s1 = rightRotate(wCopy[i - 2], 17) ^ rightRotate(wCopy[i - 2], 19) ^ (wCopy[i - 2] >>> 10);
            wCopy[i] = wCopy[i - 16] + s0 + wCopy[i - 7] + s1;
        }

        let [a_, b_, c_, d_, e_, f_, g_, h_] = a;
        for (let i = 0; i < 64; i++) {
            const s0 = rightRotate(a_, 2) ^ rightRotate(a_, 13) ^ rightRotate(a_, 22);
            const maj = (a_ & b_) ^ (a_ & c_) ^ (b_ & c_);
            const t2 = s0 + maj;
            const s1 = rightRotate(e_, 6) ^ rightRotate(e_, 11) ^ rightRotate(e_, 25);
            const ch = (e_ & f_) ^ (~e_ & g_);
            const t1 = h_ + s1 + ch + k[i] + wCopy[i];

            h_ = g_;
            g_ = f_;
            f_ = e_;
            e_ = d_ + t1;
            d_ = c_;
            c_ = b_;
            b_ = a_;
            a_ = t1 + t2;
        }

        a[0] += a_;
        a[1] += b_;
        a[2] += c_;
        a[3] += d_;
        a[4] += e_;
        a[5] += f_;
        a[6] += g_;
        a[7] += h_;

        return a;
    }

    function toHex(value) {
        let hex = '';
        for (let i = 0; i < 4; i++) {
            hex += ((value >> (24 - i * 8)) & 0xff).toString(16).padStart(2, '0');
        }
        return hex;
    }

    const k = new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ]);

    const padding = new Uint8Array([(0x80 << 24) | 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    let buffer = new Uint8Array(data);
    let bufferLen = buffer.length;
    let paddedLen = Math.ceil((bufferLen + 9) / 64) * 64;
    let paddedBuffer = new Uint8Array(paddedLen);

    paddedBuffer.set(buffer);
    paddedBuffer.set(padding, bufferLen);

    const dataLenBits = bufferLen * 8;
    for (let i = 0; i < 8; i++) {
        paddedBuffer[paddedLen - 8 + i] = (dataLenBits >>> ((7 - i) * 8)) & 0xff;
    }

    let chunks = paddedLen / 64;
    let w = new Uint32Array(64);

    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;

    for (let chunk = 0; chunk < chunks; chunk++) {
        let startIndex = chunk * 64;

        for (let i = 0; i < 16; i++) {
            let index = startIndex + i * 4;
            w[i] =
                (paddedBuffer[index] << 24) |
                (paddedBuffer[index + 1] << 16) |
                (paddedBuffer[index + 2] << 8) |
                paddedBuffer[index + 3];
        }

        for (let i = 16; i < 64; i++) {
            const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = w[i - 16] + s0 + w[i - 7] + s1;
        }

        const temp = sha256Round(k, w);
        h0 += temp[0];
        h1 += temp[1];
        h2 += temp[2];
        h3 += temp[3];
        h4 += temp[4];
        h5 += temp[5];
        h6 += temp[6];
        h7 += temp[7];
    }

    const result =
        toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4) + toHex(h5) + toHex(h6) + toHex(h7);
    return result;
}

/**
 * Добавляет слушатели событий для прокрутки горизонтального скролла элемента с помощью мыши.
 * @param {string} dom - Селектор элемента, к которому будет добавлены слушатели событий.
 */
export function ScrollElementWithMouse(dom) {
    const element = $(dom)[0];

    let isDragging = false;
    let currentX;
    let initialMouseX;
    let scrollLeft;

    element.addEventListener('mousedown', (e) => {
        initialMouseX = e.clientX;
        scrollLeft = element.scrollLeft;
        isDragging = true;
    });

    element.addEventListener('mousemove', (e) => {
        if (isDragging) {
            currentX = e.clientX - initialMouseX;
            element.scrollLeft = scrollLeft - currentX;
        }
    });

    element.addEventListener('mouseup', () => {
        isDragging = false;
    });

    element.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    element.addEventListener('wheel', (e) => {
        // Проверить, достигнут ли конец элемента
        if (Math.abs(element.scrollLeft - (element.scrollWidth - element.clientWidth)) <= 2 && e.deltaY > 0) {
            return;
        }
        //Проверить если число явсляется отрицательным и мы на начале элемента то прокручивать на врех дальше
        if (e.deltaY < 0 && element.scrollLeft == 0) {
            return;
        }
        e.preventDefault();
        element.scrollLeft += e.deltaY;
    });
}

/**
 * Сравнивает два объекта и возвращает true, если значения всех свойств объектов (за исключением указанных в excludedKeys) равны между собой.
 * @param {Object} obj1 - Первый объект для сравнения.
 * @param {Object} obj2 - Второй объект для сравнения.
 * @param {string[]} excludedKeys - Массив ключей, которые нужно исключить из сравнения.
 * @returns {boolean} Результат сравнения объектов.
 */
export function isObjectEqual(obj1, obj2, excludedKeys) {
    const keys1 = Object.keys(obj1).filter((key) => !excludedKeys.includes(key));
    const keys2 = Object.keys(obj2).filter((key) => !excludedKeys.includes(key));

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }

    return true;
}

/**
 * Проверяет видимость элемента и его положение на экране.
 * @param {jQuery} element - jQuery-элемент для проверки.
 * @returns {boolean} - `true`, если элемент видим и находится на экране, в противном случае `false`.
 */
export function isElementVisible(element) {
    // Получаем размеры окна просмотра
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();

    // Получаем размеры и позицию элемента
    var elementWidth = element.outerWidth();
    var elementHeight = element.outerHeight();
    var elementPosition = element.offset();

    // Проверяем видимость элемента
    var isVisible =
        elementPosition.left >= 0 &&
        elementPosition.top >= 0 &&
        elementPosition.left + elementWidth <= windowWidth &&
        elementPosition.top + elementHeight <= windowHeight;

    // Проверяем, что элемент не скрыт через opacity или display
    var isNotHidden = element.is(":visible");

    return isVisible && isNotHidden;
}

/**
 * Удаляет указанные параметры из URL и заменяет их на новые значения.
 * @param {[string]} params - Массив с параметрами для удаления и замены.
 */
export function ClearParams(params) {
    const url = new URL(window.location.href);
    params.forEach(param => url.searchParams.delete(param));
    window.history.replaceState(null, '', url.toString());
}

/**
 * Проверяет, равны ли два массива.
 * @param {Array} a - Первый массив для сравнения.
 * @param {Array} b - Второй массив для сравнения.
 * @returns {boolean} - `true`, если массивы равны, в противном случае `false`.
 */
export function arraysAreEqual(a, b) {
    if (a.length != b.length) return false;
    return a.every(element => b.includes(element)) && b.every(element => a.includes(element));
}