import { createTimeline } from "../library/anime.esm.min.js";
import { Menu } from "../menu.js";

/**@type {[Popup]} */
const STACK = [];
let globalComponentId = 0;

class state {
    static get waiting() { return 1; }
    static get loading() { return 2; }
    static get process() { return 3; }
    static get complete() { return 4; }
}

export class Popup {
    constructor(id, msg, pos = 11) {
        const index = STACK.findIndex(x => x.data.id === id && x.data.msg === msg && x.state !== state.complete);
        if (index !== -1) {
            if (STACK[index].state === state.process) {
                return STACK[index].update();
            }
            return;
        }

        this.id = generateUniqueId();
        this.data = {
            id: id,
            msg: msg
        }
        this.z = pos;
        this.state = state.waiting;
        this.timeline = createTimeline({
            onBegin: () => { this.state = state.loading; },
            onComplete: () => { this.#next(); }
        });

        let autorun = false;
        if (STACK.length === 0) {
            autorun = true;
        }

        STACK.push(this);
        if (autorun) STACK[0].show();
    }

    #next() {
        STACK.splice(0, 1);
        if (STACK[0]) return STACK[0].show();
    }

    update() {
        if (this.state !== state.process) return;

        this.timeline.cancel();
        this.timeline = createTimeline({
            onBegin: () => { this.state = state.loading; },
            onComplete: () => { this.#next(); }
        });
        this.timeline.add(`#${this.id}`, {
            rotate: [0, 5, 0, -5, 0],
            duration: 250,
            ease: 'out(3)',
            onComplete: () => { this.state = state.process; }
        });
        this.timeline.add(`#${this.id}`, {
            bottom: -60,
            rotate: 60,
            delay: 3000,
            duration: 1000,
            ease: 'inOutElastic(1, .6)',
            onBegin: () => { this.state = state.complete; }
        })
    }

    show() {
        if (STACK[0] !== this || this.state !== state.waiting) return;

        let hasMenu = Menu().hasMenu();

        const menu = hasMenu ? "visible" : "none";
        const body = $('body').append(this.#html({ menu, text: this.data.msg, id: this.id, z: this.z }));

        let height = !hasMenu ? 0 : $(`.application-menu`).outerHeight();
        if (body.hasClass('menuver') && ["90", "270"].includes(body.attr("data-orientation"))) {
            height = 0;
        }

        this.timeline.add(`#${this.id}`, {
            bottom: [-60, height + 10],
            rotate: [90, 0],
            duration: 600,
            ease: 'inOutElastic(1, .8)',
            onComplete: () => { this.state = state.process; }
        });
        this.timeline.add(`#${this.id}`, {
            bottom: -60,
            rotate: 60,
            delay: 3000,
            duration: 1000,
            ease: 'inOutElastic(1, .6)',
            onBegin: () => { this.state = state.complete; }
        });
    }

    #html({ menu = "visible", text, id, z } = {}) {
        return `<div id="${id}" class="popup unselectable popup-menu-${menu}" style="--z:${z};"><div class="popup-content">${text}<img src="/images/popup.webp" /></div></div>`;
    }
}

function generateUniqueId() {
    return `pop-${globalComponentId++}`;
}