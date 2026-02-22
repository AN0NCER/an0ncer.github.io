import { OAuth } from "../../core/main.core.js";

let pLogin = null;
let pLink = null;

export const Page = new class {
    constructor() {
        this.isBlocked = false;
        this.isDev = OAuth.isDev;

        const url = new URL(window.location.href);

        this.uCode = url.searchParams.get('code');
        this.uAnim = url.searchParams.get('anim');

        url.searchParams.delete('code');
        url.searchParams.delete('anim');

        window.history.replaceState(null, '', url.toString());
    }

    async login(code, oncomplete = () => { }, onerror = () => { }) {
        const process = async () => {
            const { login } = await import("../../utils/auth.login.js");
            try {
                await login(code).catch(async (reason) => {
                    onerror(reason);
                });
            } finally {
                this.isBlocked = false;
                pLogin = null;
                oncomplete();
            }
        }

        if (pLogin) return;
        this.isBlocked = true;
        pLogin = process();
    }

    async genLink(oncomplete = () => { }, onerror = () => { }) {
        const process = async () => {
            try {
                await OAuth.events.genLink().catch(async (reason) => {
                    onerror(reason);
                }).then((link) => {
                    oncomplete(link);
                });
            } finally {
                this.isBlocked = false;
                pLink = null;
            }
        }

        if (pLink) return;
        this.isBlocked = true;
        pLink = process();
    }
}();