import { Sleep } from "./funcitons.js";

class Tunime {
    static get standart() {
        return { id: 'shadow', key: 'tunime-register', date: Date.now() - 10000 }
    }

    constructor() {
        this.lk = 'shadow-api';
        this.life = 350000;
        this.time = 299000;
        this.interval = undefined;
        this.url = 'tunime.onrender.com';
        this.link = {
            save: 'hujg',
            domain: 'onrender.com',
            name: 'tunime'
        };
        this.tunime = {
            url: 'tunime.onrender.com',
            save: 'hujg',
            name: 'tunime'
        };
        this.m3u8 = {
            url: 'anime-m3u8.onrender.com',
            save: 'qmyf',
            name: 'anime-m3u8'
        };
        if (window.location.pathname != '/player.html') {
            this.Update();
        }
    }

    set access(val) {
        if (val && val?.id && val?.key && val?.date) {
            localStorage.setItem(this.lk, JSON.stringify(val));
        }
    }

    /**
     * @returns {{id: string, key: string, date: number}}
     */
    get access() {
        let inl = localStorage.getItem(this.lk);
        inl = inl || JSON.stringify(Tunime.standart);
        let val = JSON.parse(inl);
        if ((new Date() - val.date) > this.life) {
            val = Tunime.standart;
        }
        this.access = val;
        return val;
    }

    online() {
        return new Promise((resolve) => {
            let code = 503;
            const data = this.access;
            fetch(`https://${this.tunime.url}/online/`, {
                method: 'POST',
                body: new URLSearchParams({ id: data.id, key: data.key })
            }).then((response) => {
                code = response.status;
                return response.json()
            }).then((val) => {
                this.access = { id: val.id, key: val.key, date: Date.now() }
                this.Update();
                resolve(true);
            }).catch(async (reas) => {
                console.log(`Error: ${this.tunime.url} Code: ${code}`);
                if (code == 503) {
                    this.tunime.url = `${this.tunime.name}-${this.link.save}.onrender.com`;
                    return resolve(this.online());
                }
                this.access = Tunime.standart;
                await Sleep(1000);
                this.Update();
                return resolve(false);
            });
        });
    }

    Update() {
        if (this.access.id == 'shadow') {
            this.online();
        }
        clearInterval(this.interval);
        this.interval = setInterval(() => {
            this.online();
        }, this.time - (Date.now() - this.access.date));
    }

    anime(id) {
        let code = 503;
        const data = this.access;
        fetch(`https://${this.tunime.url}/online/${id}/o`, {
            method: 'POST',
            body: new URLSearchParams({ id: data.id, key: data.key })
        }).then((response) => {
            code = response.status;
            return response.json();
        }).then((val) => {
            this.access = { id: val.id, key: val.key, date: Date.now() }
        }).catch(async (err) => {
            console.log(`Error: ${this.tunime.url} Code: ${code}`);
            if (code == 503) {
                this.tunime.url = `${this.tunime.name}-${this.link.save}.onrender.com`;
                return this.anime(id);
            }
            await Sleep(1000);
            this.access = Tunime.standart;
            await this.online();
            this.anime(id);
        });
    }

    //https://anime-m3u8-qmyf.onrender.com - save url
    stream(url) {
        return new Promise(async (resolve) => {
            let code = 503;
            const access = this.access;
            this.m3u8.url
            fetch(`https://${this.m3u8.url}/link-anime`, {
                body: new URLSearchParams({
                    'link': url,
                    'id': access.id,
                    'key': access.key
                }), method: 'post'
            }).then((response) => {
                code = response.status;
                return response.json();
            }).then((data) => {
                this.access = { id: access.id, key: data.key, date: Date.now() };
                return resolve(data);
            }).catch(async (res) => {
                console.log(`Error: ${this.m3u8.url} Code: ${code}`);
                if (code == 503) {
                    this.m3u8.url = `${this.m3u8.name}-${this.m3u8.save}.onrender.com`;
                    return resolve(this.stream(url));
                }
                await Sleep(3000);
                return resolve(this.stream(url));
            });
        });
    }

    link({ q720 = undefined, q480 = undefined, q360 = undefined } = {}) {
        const params = { q720, q480, q360 };
        const queryParams = Object.entries(params)
            .filter(([key, value]) => value !== undefined)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
        return `https://${this.m3u8.url}/m3u8?${queryParams}`;
    }

    tsget(id) {
        return new Promise((resolve) => {
            let code = 503;
            const access = this.access;
            if (access.id == Tunime.standart.id) {
                return resolve({ translations: [] });
            }
            fetch(`https://${this.tunime.url}/ts/${id}`, {
                method: 'POST',
                body: new URLSearchParams({
                    'id': access.id,
                    'key': access.key
                })
            }).then((res) => {
                code = res.status;
                return res.json();
            }).then((val) => {
                return resolve(val);
            }).catch(() => {
                console.log(`Error: ${this.tunime.url} Code: ${code}`);
                if (code == 503) {
                    this.tunime.url = `${this.tunime.name}-${this.link.save}.onrender.com`;
                    return resolve(this.tsget(id));
                }
                return resolve({ translations: [] });
            });
        });
    }

    tsset(aid, tid) {
        return new Promise((resolve) => {
            let code = 503;
            const access = this.access;
            if (access.id === Tunime.standart.id) {
                return resolve({ completed: false });
            }
            fetch(`https://${this.tunime.url}/ts/${aid}/${tid}`, {
                method: 'POST',
                body: new URLSearchParams({
                    'id': access.id,
                    'key': access.key
                })
            }).then((res) => {
                code = res.status;
                return res.json();
            }).then((val) => {
                return resolve(val);
            }).catch(() => {
                console.log(`Error: ${this.tunime.url} Code: ${code}`);
                if (code == 503) {
                    this.tunime.url = `${this.tunime.name}-${this.link.save}.onrender.com`;
                    return resolve(this.tsset(aid, tid));
                }
                return resolve({ completed: false });
            });
        });
    }

    loadpage(data, id) {
        return new Promise((resolve) => {
            let code = 503;
            const access = this.access;
            if (access.id === Tunime.standart.id) {
                return resolve({ completed: false });
            }
            fetch(`https://${this.tunime.url}/page/load/${id}`, {
                method: 'POST',
                body: new URLSearchParams({
                    'id': access.id,
                    'key': access.key,
                    'data': JSON.stringify(data)
                })
            }).then((res) => {
                code = res.status;
                return res.json();
            }).then((val) => {
                return resolve(val);
            }).catch(() => {
                console.log(`Error: ${this.tunime.url} Code: ${code}`);
                if (code == 503) {
                    this.tunime.url = `${this.tunime.name}-${this.link.save}.onrender.com`;
                    return resolve(this.loadpage(data, id));
                }
                return resolve({ completed: false });
            });
        })
    }
}

export const ApiTunime = new Tunime();