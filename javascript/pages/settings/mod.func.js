import { TDatabase } from "../../modules/TDatabase.js";
import { Popup } from "../../modules/tun.popup.js";
import { TVerify } from "../../modules/tun.verify.js";

const clear = (name) => {
    TDatabase.Delete(name).then(() => {
        window.location.reload();
    }).catch((e) => {
        new Popup('tun.error', e);
    })

}

export function ClearDB(name, title, warning) {
    TVerify({ title, warning }).then((val) => {
        if (!val) return;
        clear(name);
    }).catch((e) => {
        new Popup('verify', 'Отмена действия');
    })
}

export function Logout() {
    import("../../utils/auth.logout.js").then(({ logout }) => {
        logout();
    });
}

export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}