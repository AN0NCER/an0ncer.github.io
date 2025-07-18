import { createTimeline, utils, createSpring } from "../library/anime.esm.min.js";
import { Menu } from "../menu.js";

/**@type {[Popup]} */
const STACK = [];
let globalComponentId = 0;

const ORIENTATIONS = {
    LANDSCAPE: ["90", "270"],
    PORTRAIT: ["0", "180"]
};

const POSITIONS = {
    PORTRAIT_START: -60,
    LANDSCAPE_START: -120
};

const TIMING = {
    SHOW_DURATION: 600,
    DISPLAY_DELAY: 3000,
    HIDE_DURATION: 1000,
    UPDATE_SHAKE_DURATION: 250
};

const BOTTOM_OFFSET = 10;

class state {
    static get waiting() { return 1; }
    static get loading() { return 2; }
    static get process() { return 3; }
    static get complete() { return 4; }
}

export class Popup {
    constructor(id, msg, pos = 11) {
        const existingPopup = this.#findExistingPopup(id, msg);
        if (existingPopup) {
            return existingPopup.state === state.process ? existingPopup.update() : undefined;
        }

        this.#initialize(id, msg, pos);
        this.#addToStack();
    }

    #findExistingPopup(id, msg) {
        return STACK.find(x =>
            x.data.id === id &&
            x.data.msg === msg &&
            x.state !== state.complete
        );
    }

    #initialize(id, msg, pos) {
        this.id = generateUniqueId();
        this.data = { id, msg };
        this.z = pos;
        this.state = state.waiting;
        this.position = { start: POSITIONS.PORTRAIT_START };
        this.#createTimeline();
    }

    #createTimeline() {
        this.timeline = createTimeline({
            onBegin: () => { this.state = state.loading; },
            onComplete: () => { this.#next(); }
        });
    }

    #addToStack() {
        const shouldAutorun = STACK.length === 0;
        STACK.push(this);
        if (shouldAutorun) STACK[0].show();
    }

    #next() {
        this.#cleanup();
        STACK.splice(0, 1);
        if (STACK[0]) STACK[0].show();
    }

    #cleanup() {
        $(window).off(`orientationchange.${this.id}`);
        $(`#${this.id}`).remove();
    }

    update(delay = TIMING.DISPLAY_DELAY) {
        if (this.state !== state.process) return this;

        this.#resetTimeline();
        this.#addShakeAnimation();
        this.#addHideAnimation(delay);

        return this;
    }

    #resetTimeline() {
        this.timeline.cancel();
        this.#createTimeline();
    }

    #addShakeAnimation() {
        this.timeline.add(`#${this.id}`, {
            rotate: [0, 5, 0, -5, 0],
            duration: TIMING.UPDATE_SHAKE_DURATION,
            ease: 'out(3)',
            onComplete: () => { this.state = state.process; }
        });
    }

    #addHideAnimation(delay) {
        this.timeline.add(`#${this.id}`, {
            bottom: this.position.start,
            rotate: 60,
            delay,
            duration: TIMING.HIDE_DURATION,
            ease: 'inOutElastic(1, .6)',
            onBegin: () => { this.state = state.complete; }
        });
    }

    show() {
        if (!this.#canShow()) return;

        this.#setupOrientationHandler();
        const positioning = this.#calculateInitialPositioning();
        this.#renderHTML();
        this.#setupShowAnimations(positioning);
    }

    #canShow() {
        return STACK[0] === this && this.state === state.waiting;
    }

    #setupOrientationHandler() {
        $(window).on(`orientationchange.${this.id}`, () => {
            this.#handleOrientationChange();
        });
    }

    #handleOrientationChange() {
        const body = $('body');
        if (!body.hasClass('menuver')) return;

        const positioning = this.#calculatePositioning(body);

        if (this.state === state.process) {
            utils.set(`#${this.id}`, {
                bottom: positioning.height + positioning.bottom
            });
            this.update(TIMING.DISPLAY_DELAY - this.timeline.currentTime);
        }
    }

    #calculateInitialPositioning() {
        const body = $('body');
        return this.#calculatePositioning(body);
    }

    #calculatePositioning(body) {
        const hasMenu = Menu().hasMenu();
        const isLandscape = this.#isLandscapeOrientation(body);

        let height = 0;
        let bottom = BOTTOM_OFFSET;
        let startPosition = POSITIONS.PORTRAIT_START;

        if (isLandscape) {
            startPosition = POSITIONS.LANDSCAPE_START;
            bottom = this.#getSafeAreaBottom(body);
        } else {
            height = hasMenu ? $(`.application-menu`).outerHeight() : 0;
        }

        this.position.start = startPosition;

        return { height, bottom };
    }

    #isLandscapeOrientation(body) {
        return body.hasClass('menuver') &&
            ORIENTATIONS.LANDSCAPE.includes(body.attr("data-orientation"));
    }

    #getSafeAreaBottom(body) {
        return parseInt(getComputedStyle(body[0]).getPropertyValue("--sab")) || BOTTOM_OFFSET;
    }

    #renderHTML() {
        const hasMenu = Menu().hasMenu();
        const menu = hasMenu ? "visible" : "none";

        $('body').append(this.#html({
            menu,
            text: this.data.msg,
            id: this.id,
            z: this.z
        }));
    }

    #setupShowAnimations(positioning) {
        const elementId = `#${this.id}`;
        const finalBottom = positioning.height + positioning.bottom;

        // Анимация появления
        this.timeline.add(elementId, {
            bottom: [this.position.start, finalBottom],
            rotate: [90, 0],
            duration: TIMING.SHOW_DURATION,
            ease: createSpring({
                stiffness: 300,
                damping: 15,
                mass: 0.8,
            }),
            onComplete: () => { this.state = state.process; }
        });

        // Анимация скрытия с задержкой
        this.#addHideAnimation(TIMING.DISPLAY_DELAY);
    }

    #html({ menu = "visible", text, id, z } = {}) {
        return `<div id="${id}" class="popup unselectable popup-menu-${menu}" style="--z:${z};"><div class="popup-content">${text}<img src="/images/popup.webp" /></div></div>`;
    }
}

function generateUniqueId() {
    return `pop-${globalComponentId++}`;
}