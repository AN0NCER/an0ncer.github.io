import { initState } from "./modules/mod.state.js";
import { initMascot } from "./modules/mod.mascot.js";
import { initNoise } from "./modules/mod.noise.js";
import { initHit } from "./modules/mod.hit.js";

/**
 * Заглушка в iframe плеера (watch.html) и 404 сайта.
 * Состояние (html[data-state]) задаётся хэшем: loading | empty | error | notfound.
 */

initMascot();
initState();
initNoise();
initHit();
