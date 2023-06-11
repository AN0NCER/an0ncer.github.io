/**
 * Данный скрипт предназначен для заполнения информации о типе устройства, версии браузера и поддержке сервисного работника (service worker) и уведомлений на основе значения navigator.userAgent. Он определяет различные свойства и значения в объекте $DEVICE, которые могут быть использованы для адаптации функциональности или отображения контента в зависимости от характеристик устройства и браузера.
 */

const $DEVICE = {
    type: '',
    version: '',
    browser: '',
    iOS: '',
    support: {
        srvWorker: false,
        notification: false
    }
}

/**
 * Сравнивает две версии и возвращает true, если версия version1 больше или равна version2, и false в противном случае.
 * @param {string} version1 - Первая версия для сравнения.
 * @param {string} version2 - Вторая версия для сравнения.
 * @returns {boolean} - Результат сравнения: true, если version1 больше или равна version2, и false в противном случае.
 */
function isVersionGreaterOrEqual(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1Part = v1Parts[i] || 0;
        const v2Part = v2Parts[i] || 0;

        if (v1Part > v2Part) {
            return true;
        } else if (v2Part > v1Part) {
            return false;
        }
    }

    // Если все компоненты равны
    return true;
}
/**
 * Заполняет информацию о типе устройства, версии браузера и поддержке сервисного работника и уведомлений
 * на основе значения navigator.userAgent.
 */
function fillDeviceInfo() {
    const userAgent = navigator.userAgent;

    // Определение типа устройства
    if (/Mobile/i.test(userAgent)) {
        $DEVICE.type = 'Mobile';
    } else if (/Tablet/i.test(userAgent)) {
        $DEVICE.type = 'Tablet';
    } else {
        $DEVICE.type = 'Desktop';
    }

    // Определение версии
    const versionMatch = userAgent.match(/Version\/([\d.]+)/);
    if (versionMatch) {
        $DEVICE.version = versionMatch[1];
    }

    // Определение браузера
    if (/Firefox/i.test(userAgent)) {
        $DEVICE.browser = 'Firefox';
    } else if (/Chrome/i.test(userAgent)) {
        $DEVICE.browser = 'Chrome';
    } else if (/Safari/i.test(userAgent)) {
        $DEVICE.browser = 'Safari';
    } else if (/Opera|OPR/i.test(userAgent)) {
        $DEVICE.browser = 'Opera';
    } else if (/Edge/i.test(userAgent)) {
        $DEVICE.browser = 'Edge';
    } else if (/MSIE|Trident/i.test(userAgent)) {
        $DEVICE.browser = 'Internet Explorer';
    } else {
        $DEVICE.browser = 'Unknown';
    }

    // Определение поддержки сервисного работника
    $DEVICE.support.srvWorker = 'serviceWorker' in navigator;

    // Определение поддержки уведомлений
    $DEVICE.support.notification = 'Notification' in window && 'PushManager' in window;

    // Определение операционной системы iOS
    $DEVICE.iOS = /iPhone|iPad|iPod/i.test(userAgent);
}

fillDeviceInfo();