import Collections from "../../modules/tun.collections.js";
import { $ID } from "../watch.js";

const NAME = '.collection-select > .collection-name';

/** Подпись кнопки: первая коллекция и сколько ещё */
const render = () => {
    const root = document.querySelector(NAME);
    if (!root) return;

    const cids = Collections.find(Number($ID));
    const first = cids.length > 0 ? Collections.get(cids[0]) : null;

    if (!first) {
        root.textContent = 'Не выбрано';
        return;
    }

    // Название — пользовательский текст, только через textContent
    const title = document.createElement('span');
    title.className = 'select';
    title.textContent = first.title ?? '';

    root.replaceChildren(title);
    if (cids.length > 1) root.append(` и еще ${cids.length - 1}`);
};

export const InitCollection = (logged) => {
    if (!logged) return;

    Collections.on('loaded', render, { replay: true });

    for (const event of ['sync', 'create', 'rename', 'remove', 'visibility', 'change', 'storage']) {
        Collections.on(event, render);
    }

    if (!Collections.loaded) Collections.init();
    else Collections.sync();
};