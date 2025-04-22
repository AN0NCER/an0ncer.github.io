export class SHIKIURL {
    static get protocol() {
        return 'https://';
    }
    static get domain() {
        return 'shikimori.one';
    }
    static get url() {
        return `${this.protocol}${this.domain}`;
    }
    static suburl(sub) {
        return `${this.protocol}${sub}.${this.domain}`;
    }
}

export const AppStorageKeys = {
    "lastUpdate": 'dialog-update', //{"show":false,"ver":"2.5.1","hash":"69c3d","update":"2024-10-27T23:32:24.597Z"}
    "gitVersion": 'github-version'
}