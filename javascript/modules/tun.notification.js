import { TEvents } from "../pages/user/util.event.js";
import { WNotification } from "../windows/win.notification.js";

const _VAPID_KEY = 'BI-EM3yjiaU8W9vQMBmZL06mJdROk-Y1nMOITPJF2Q0_nkxYvj0Dvr2CD47KYwfrOQITmGwAeW-wUFrVR_URISo';

/** @typedef {-1 | 0 | 1} TPermission */
/** Перевод строки Notification.permission → число */
const SYS_MAP = /** @type {Record<NotificationPermission, TPermission>} */ ({
    granted: 1,
    default: 0,
    denied: -1,
});

/**
 * Ключи хранилища.
 * win  — ответ пользователя на внутренний диалог PWA (-1 | 0 | 1)
 */
const STORAGE_KEY = 'app-notification';

/** @type {{ win: TPermission, hub: boolean, allowed: string[], date: string }} */
const EMPTY_STORE = () => ({ win: 0, hub: false, allowed: [], date: new Date().toISOString() });

function readSysPermission() {
    if (!('Notification' in window)) return -1;
    return SYS_MAP[Notification.permission];
}

/**
 * Разрешение на уведомления складывается из трёх независимых уровней:
 *  1. win  — ответ на внутренний (кастомный) диалог PWA (-1/0/1)
 *  2. sys  — системный Notification.permission (-1/0/1)
 *  3. hub  — есть ли активная push-подписка на сервере (bool) + allowed (типы уведомлений)
 *
 * .request() последовательно проходит эти три шага и останавливается,
 * как только пользователь на каком-то из них отказал.
 *
 * Событие 'state' стреляет на КАЖДОМ изменении любого из трёх уровней,
 * включая момент, когда сервер подтвердил push-подписку (allowed заполнился).
 */
export const TNotifi = new class extends TEvents {
    /** Поддерживает ли браузер Notification API */
    #apiAvailable = ('Notification' in window);

    /**
     * Персистентное хранилище.
     * @type {{ win: TPermission, hub: boolean, allowed: string[], date: string }}
     */
    #store = EMPTY_STORE();

    /**
     * Текущее системное разрешение (кэш, обновляется при изменении).
     * @type {TPermission}
     */
    #sys = 0;

    constructor() {
        super();
        this.#load();
        this.permision = this.getUIState();
        this.#emit();
    }

    // ── Public: чтение состояния ──

    /** Итоговое разрешение с учётом win + sys */
    getUIState() {
        if (!this.#apiAvailable) return -1;
        const win = this.#store.win;
        const sys = readSysPermission();

        if (win === -1) return -1;
        if (win === 0) return 0;
        // win === 1
        return sys; // granted=1, default=0, denied=-1
    }

    getStore() {
        return { ...this.#store };
    }

    getAllowedList() {
        return this.#store.allowed;
    }

    getSysPermision() {
        return readSysPermission();
    }

    // ── Public: запрос разрешения (३ шага) ──

    async request() {
        // ── Шаг 1: внутренний диалог ──
        if (this.#store.win === 0) {
            const { win, sysPermission } = await this.#requestWin();
            if (win !== 1) return this.getUIState();

            if (sysPermission) {
                const result = await sysPermission;
                this.#setSys(SYS_MAP[result]);
            }
        }

        if (this.#store.win === -1) return this.getUIState();

        // ── Шаг 2: системный запрос ──

        if (this.#sys === 0) {
            await this.#requestSys();
        }

        if (this.#sys !== 1) return this.getUIState();

        // ── Шаг 3: push-подписка на сервере ──
        if (!this.#store.hub) {
            await this.#registerPush();
        }

        return this.getUIState();
    }

    async requestWin(description) {
        // WNotification возвращает: 1 = разрешил, 0 = закрыл, -1 = отказал
        const { win } = await WNotification({ content: description });
        return /**@type {TPermission} */ (win);
    }

    resetWin() {
        this.updateState(0);
    }

    async resetHard() {
        const { Tunime } = await import('./api.tunime.js');

        const response = await Tunime.api.device.notify.registration().DELETE();

        if (response.status !== 200) {
            console.warn('[TNotifi] Ошибка hard отписки push:', response.status);
            return { complete: false, count: 0 };
        }

        this.#store = { win: 0, hub: false, allowed: [], date: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#store));

        this.permision = this.getUIState();
        this.#emit();

        return { complete: true, count: response.value.removedSubscriptions };
    }

    async setEnable(value) {
        if (!this.#store.hub) return { enabled: this.permision === 1 }
        const { Tunime } = await import('./api.tunime.js');

        const response = await Tunime.api.device.notify.registration().PATCH({ enabled: value });

        if (response.status !== 200) {
            console.warn('[TNotifi] Ошибка soft управление:', response.status);
            return { enabled: this.permision === 1 }
        }

        this.#store.win = response.value.enabled ? 1 : -1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#store));

        this.permision = this.getUIState();
        this.#emit();

        return { enabled: response.value.enabled };
    }

    async setAllow(list = []) {
        const { Tunime } = await import('./api.tunime.js');

        const response = await Tunime.api.device.notify.registration().PATCH({ allowList: JSON.stringify(list) });

        if (response.status !== 200 || !response.value?.types) {
            console.warn('[TNotifi] Ошибка soft управление:', response.status);
            return { allowed: this.#store.allowed, complete: false }
        }

        this.#store.allowed = response.value.types;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#store));
        this.#emit();

        return {allowed: response.value.types, complete: true};
    }

    updateState(winState) {
        this.#store.win = winState;
        this.#store.date = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#store));

        this.permision = this.getUIState();
        this.trigger('state', this.permision);
    }

    // ── Private ──

    #emit() {
        this.trigger('state', this.permision, { replay: true });
    }

    #persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#store));
    }

    #load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            this.#store = raw ? JSON.parse(raw) : EMPTY_STORE();
        } catch {
            this.#store = EMPTY_STORE();
        }
        // если система с прошлого раза отозвала разрешение — hub считаем недействительным
        this.#store.hub = readSysPermission() === 1 ? this.#store.hub : false;
    }

    async #registerPush() {
        try {
            const registration = await navigator.serviceWorker.ready;
            if (!registration) return;

            const { Tunime } = await import('./api.tunime.js');

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: _VAPID_KEY,
            });

            const response = await Tunime.api.device.notify.registration().POST(subscription.toJSON());

            if (response.status !== 200) {
                console.warn('[TNotifi] Ошибка регистрации push:', response.status);
                return;
            }

            this.#store.hub = response.value.enabled;
            this.#store.date = response.value.createdAt;
            this.#store.allowed = response.value.types;

            this.#persist();
        } catch (e) {
            console.warn('[TNotifi] Push-регистрация не удалась:', e);
        } finally {
            this.permision = this.getUIState();
            this.#emit();
        }
    }

    async #requestWin() {
        // WNotification возвращает: 1 = разрешил, 0 = закрыл, -1 = отказал
        const { win, result } = await WNotification({
            onConfirm: () => ('Notification' in window)
                ? Notification.requestPermission()
                : Promise.resolve('default')
        });
        this.updateState(win);
        return { win, sysPermission: result };
    }

    async #requestSys() {
        try {
            const result = await Notification.requestPermission();
            this.#setSys(SYS_MAP[result]);
        } catch (e) {
            console.warn('[TNotifi] Ошибка запроса системного разрешения:', e);
            this.#setSys(0);
        }
    }

    #setSys(value) {
        this.#sys = value;
        this.permision = this.getUIState();
        this.#emit();
    }

    // ── Debug ──

    debug() {
        console.group('[TNotifi] Debug');
        console.log('apiAvailable :', this.#apiAvailable);
        console.log('win          :', this.#store.win);
        console.log('sys          :', this.#sys);
        console.log('state        :', this.state);
        console.log('isGranted    :', this.isGranted);
        console.groupEnd();

        this.on('state', (val) => {
            console.log('[TNotifi] state changed →', val);
        }, { replay: true });
    }
}