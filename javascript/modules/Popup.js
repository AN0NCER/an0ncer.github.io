import { Menu } from "../menu.js";

let _ids = [];

export async function ShowInfo(message, id, z = 11) {
    if (_ids.findIndex(x => x == id) != -1) {
        return;
    }

    _ids.push(id);


    let ismenu = Menu().hasMenu() ? "visible" : "none";
    $('body').append(genHtml({ text: message, id: id, menu: ismenu, z }));
    let h = $(`.popup-id-${id} > .popup-content`).height();
    let h_menu = !Menu().hasMenu() ? 0 : $('.application-menu').outerHeight();
    if ($('body').hasClass('menuver') && ($('body').attr("data-orientation") == "90" || $('body').attr("data-orientation") == "270")) {
        h_menu = 0;
    }

    anime({
        targets: `.popup-id-${id}`,
        bottom: [-60, h + h_menu + 10],
        rotate: [30, 0],
        complete: () => {
            let i = setInterval(() => {
                anime({
                    targets: `.popup-id-${id}`,
                    bottom: -h * 5,
                    complete: () => {
                        clearInterval(i);
                        _ids.splice(_ids.findIndex(x => x == id), 1);
                        $(`.popup-id-${id}`).remove();
                    }
                })
            }, 3000);
        }
    });
}

function genHtml({ menu = "visible", text, id, z } = {}) {
    const html = `<div class="popup unselectable popup-menu-${menu} popup-id-${id}" style="--z:${z};"><div class="popup-content">${text}<img src="/images/popup.webp" /></div></div>`;
    return html;
}