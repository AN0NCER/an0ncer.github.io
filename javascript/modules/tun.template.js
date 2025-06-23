const TEMPLATE_BASE_PATH = '/templates';

/**
 * Асинхронная функция, которая загружает шаблон и обрабатывает вложенные include директивы.
 * @param {string} url - URL основного файла шаблона.
 * @param {Set<string>} [visited=new Set()] - Множество для отслеживания посещенных URL (для предотвращения циклических включений).
 * @returns {Promise<string>} - Промис, разрешающийся с готовым HTML-содержимым.
 */
async function loadTemplateWithIncludes(url, visited = new Set()) {
    if (visited.has(url)) return ``;
    visited.add(url);

    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Failed to load template: ${url}, Status: ${response.status}`);
        return ``;
    }

    let content = await response.text();

    const includeRegex = /{{\s*include\s*:\s*([\w./-]+)\s*}}/g;
    const includes = [...content.matchAll(includeRegex)];

    for (const match of includes) {
        const includeFile = match[1];
        // Убедимся, что относительный путь правильно обрабатывается
        // Если includeFile абсолютный, то `${TEMPLATE_BASE_PATH}` не нужен
        const includeUrl = includeFile.startsWith('/') ? includeFile : `${TEMPLATE_BASE_PATH}/${includeFile}`;
        const includeContent = await loadTemplateWithIncludes(includeUrl, visited);
        content = content.replace(match[0], includeContent);
    }

    return content;
}

/**
 * Вспомогательная функция для "сглаживания" вложенного объекта.
 * Преобразует { a: { b: 1 } } в { 'a.b': 1 }.
 * @param {object} obj - Исходный объект.
 * @param {string} [prefix=''] - Префикс для ключей.
 * @param {object} [res={}] - Объект-аккумулятор.
 * @returns {object} - Сглаженный объект.
 */
function flatten(obj, prefix = '', res = {}) {
    for (let key in obj) {
        // Проверяем, что ключ принадлежит самому объекту, а не прототипу
        if (!obj.hasOwnProperty(key)) continue;

        const value = obj[key];
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            flatten(value, path, res);
        } else {
            res[path] = value;
        }
    }
    return res;
}

/**
 * Основная функция-фабрика для работы с шаблонами.
 * @param {string} file - Имя файла шаблона (относительно TEMPLATE_BASE_PATH).
 * @returns {Promise<object>} - Промис, разрешающийся с объектом, предоставляющим методы для работы с шаблоном.
 */
export async function Template(file) {
    const templatePath = `${TEMPLATE_BASE_PATH}/${file}`;
    let tpl = await loadTemplateWithIncludes(templatePath);

    const template = {
        /**
         * Добавляет CSS-файл в <head> страницы, если он ещё не добавлен.
         * @param {string} e - Имя CSS-файла.
         * @param {string} [a='/style/css'] - Базовый путь для CSS-файлов.
         * @returns {object} - Возвращает объект 'template' для цепочного вызова.
         */
        css: (e, a = '/style/css') => {
            const link = `${a}/${e}`;
            if (document.querySelector(`link[href="${link}"]`)) return template;

            const linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = link;
            document.head.appendChild(linkElement);
            return template;
        },

        /**
         * Заполняет шаблон данными из объекта.
         * @param {object} [e={}] - Объект с данными для замены плейсхолдеров.
         * @returns {object} - Возвращает объект 'template' для цепочного вызова.
         */
        html: (e = {}) => {
            const flat = flatten(e);
            for (const key in flat) {
                // Экранируем спецсимволы в ключе для использования в RegExp,
                // чтобы избежать ошибок, если key содержит '.', '(', ')', и т.д.
                const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'g');
                tpl = tpl.replace(regex, flat[key]);
            }
            return template;
        },

        /**
         * Возвращает обработанный HTML-шаблон в виде строки.
         * @returns {string} - HTML-строка шаблона.
         */
        text: () => {
            return tpl;
        }
    };

    return template;
}