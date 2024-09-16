import { SwipePrototype } from "../../modules/EventTools.js";
import { WindowManagement } from "../../modules/Windows.js";
import { $ID } from "../watch.js";
import Collection from "../../modules/Collection.js";

const UI = {
    add: ({ item, type = "append", animate = false, selected = false } = {}) => {
        const data = `<div class="swipe-collection-item${animate ? " animation" : ""}${selected ? " selected" : ""}"><div class="reveal-left btn--remove"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg></div><div class="swipe-item" id="${item.id}"><span class="collection-name">${item.name}</span><span class="collection-count">${item.list.length}</span></div><div class="reveal-right btn--rename"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z" /></svg></div></div>`;
        if (type === "append") {
            $(`.list-collection`).append(data);
        } else {
            $(`.list-collection`).prepend(data);
        }
    },

    update: (cid, count, add = true) => {
        const el = $(`.swipe-item[id="${cid}"]`);
        el.parent().toggleClass('selected', add);
        el.find('.collection-count').text(count);
    },

    rename: (id, name) => {
        $(`.swipe-item[id="${id}"] > .collection-name`).text(name);
    },

    remove: (id) => {
        $(`.swipe-collection-item > .swipe-item[id="${id}"]`).parent().remove();
    }
}

const Input = {
    showed: false,

    show: function (value) {
        $('.collection-search').css({ 'max-height': '40px' });
        if (value) {
            $(`input.input-collection`).val(value);
        }
        this.showed = true;
    },

    hide: function () {
        const input = $(`input.input-collection`);
        $('.collection-search').css({ 'max-height': '' });
        input.val('');
        this.rotate();
        input.blur();
        this.showed = false;
    },

    rotate: function () {
        const value = $(`input.input-collection`).val().trim();
        $('.btn.add-new-collection').css({ transform: value === '' ? 'rotate(45deg)' : 'rotate(0deg)' });
    },

    auto: function () {
        if (this.showed && $(`input.input-collection`).val() === '') {
            this.hide();
        } else {
            this.show();
        }
    }
}

const Window = {
    init: () => {
        const controls = new Collection();
        const swipe = new SwipePrototype({
            dom: '.list-collection > .swipe-collection-item > .swipe-item',
            title: 'collection',
            size: 45,
            not: { id: ['favourites'] }
        });

        const updateName = (data = controls.list) => {
            const aid = parseInt($ID);
            const collection = data.find(c => c.list.includes(aid));
            const count = data.filter(c => c.list.includes(aid)).length;
            if (count > 0) {
                $(`.collection-select > .collection-name`).html(`<span class="select">${collection.name}</span>${count > 1 ? ` и еще ${count - 1}` : ``}`);
            } else {
                $(`.collection-select > .collection-name`).html(`Не выбрано`);
            }
        }

        const acceptChange = () => {
            const input = $(`input.input-collection`);
            const value = input.val().trim();
            if (input.attr('data-type') == 'rename') {
                const id = input.attr('data-id');
                input.attr('data-type', '');
                if (value !== '') {
                    controls.Collection.Rename(id, value);
                }
                return Input.hide();
            }
            if (value !== '') {
                controls.Collection.New(value);
            }
            return Input.hide();
        }

        controls.on("loaded", (data) => {
            data.sort((a, b) => {
                return new Date(b.modified) - new Date(a.modified);
            });
            const id = parseInt($ID);

            updateName(data);

            for (let i = 0; i < data.length; i++) {
                UI.add({ item: data[i], animate: false, selected: data[i].list.includes(id) });
            }
            swipe.Reload();
        });

        controls.on("new_collection", (data) => {
            UI.add({ item: data, type: "prepend", animate: true });
            swipe.Reload();
        });

        controls.on("remove_collection", (data) => {
            UI.remove(data.id);
            updateName();
        });

        controls.on("remove_anime", ({ id, list }) => {
            if (id === 'favourites') {
                $(`.swipe-item[id="${id}"]`).parent().removeClass('load');
            }
            UI.update(id, list.length, false);
            updateName();
        });

        controls.on("change_collection", ({ id, list }) => {
            if (id === 'favourites') {
                $(`.swipe-item[id="${id}"]`).parent().removeClass('load');
            }

            UI.update(id, list.length, true);

            updateName();
        });

        controls.on("rename_collection", ({ id, name }) => {
            UI.rename(id, name);
        });

        controls.Init();

        $('.btn.add-to-collection').on('click', () => {
            swipe.Clear();
            Input.auto();
        });

        $('.btn.add-new-collection').on('click', () => {
            swipe.Clear();
            acceptChange();
        });

        $(`input.input-collection`).on('keyup', () => {
            Input.rotate();
        });

        $(`input.input-collection`).on('keypress', (event) => {
            if (event.which == 13) {
                acceptChange();
            }
        });

        $('.content-collection > .content-wraper > .btn-commit').on('click', () => {
            if (Input.showed) {
                acceptChange();
            } else {
                _window.hide();
            }
        });

        swipe.on('pre', () => swipe.Clear());
        swipe.on('click', (data) => {
            swipe.Clear();
            if (data.swiped) return;

            const cid = data.element.attr('id');
            const is = controls.Collection.Anime.Is($ID, cid);
            if (cid === 'favourites') {
                if (data.element.parent().hasClass('load')) return;
                data.element.parent().addClass('load');
            }
            if (is) {
                controls.Collection.Anime.Remove($ID, cid);
            } else {
                controls.Collection.Anime.Add($ID, cid);
            }
        });

        swipe.on('reload', () => {
            $(`.btn--remove`).off('click.remove-collection');
            $(`.btn--rename`).off('click.rename-collection');
            $(`.btn--remove`).on('click.remove-collection', (event) => {
                const id = $(event.currentTarget).parent().find('.swipe-item').attr('id');
                controls.Collection.Remove(id);
            });
            $(`.btn--rename`).on('click.rename-collection', (event) => {
                const id = $(event.currentTarget).parent().find('.swipe-item').attr('id');
                const data = controls.Collection.Find({ id, type: 'collection' });
                if (data) {
                    $(`input.input-collection`).attr('data-type', 'rename');
                    $(`input.input-collection`).attr('data-id', data.id);
                    Input.show(data.name);
                    Input.rotate();
                    swipe.Clear();
                }
            });
        });

        swipe.Reload();

        controls.on("storage", (data) => {
            data.forEach(element => {
                console.log(element);
                if (element.action === "deleted") {
                    UI.remove(element.id);
                    updateName();
                } else if (element.action === "added") {
                    const data = controls.Collection.Find({ id: element.id, type: "collection" });
                    UI.add({ item: data, type: "prepend", animate: true });
                    swipe.Reload();
                } else if (element.action === "renamed") {
                    UI.rename(element.id, element.newName);
                } else if (element.action === "list_changed") {
                    const aid = parseInt($ID);
                    const data = controls.Collection.Find({ id: element.id, type: "collection" });
                    let selected = false;
                    if (data.list.includes(aid)) {
                        selected = true;
                    }
                    updateName();
                    UI.update(data.id, data.list.length, selected);
                }
            });
        });
    },

    show: () => {
        $('body').addClass('loading');
    },

    hide: () => {

    },

    anim: {
        hided: () => {
            Input.hide();
        }
    },

    verif: () => { return true }
}

const _window = new WindowManagement(Window, ".window-collection");

export const ShowCollectionWindow = () => { _window.click(); }