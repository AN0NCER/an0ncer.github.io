export class SHIKIURL {
    static get protocol() {
        return 'https://';
    }
    static get domain() {
        return 'shikimori.io';
    }
    static get url() {
        return `${this.protocol}${this.domain}`;
    }
    static suburl(sub) {
        return `${this.protocol}${sub}.${this.domain}`;
    }
}