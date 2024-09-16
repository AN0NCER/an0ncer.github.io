const HtmlItemCollection = ({ count = 0, bgs = [], title, id } = {}) => {
    return `<div class="item-collection" data-id="${id}">
                ${getbgcollection(bgs, count)}
                <div class="info-collection">
                    <span class="collection-name">${title}</span>
                    <span class="collection-counts">${count} Аниме</span>
                </div>
            </div>`;

    function getbgcollection(bg = [], count = 0) {
        let block1 = bg.length > 0 ? bg[0] : '';
        let previews = '';

        for (let i = 1; i < 4; i++) {
            if (bg[i]) {
                previews += `<div class="preview" style="--bg-image: url(${bg[i]})"></div>`;
            }
        }

        return `<div class="bg-collection count-${count}">
                    <div class="block-1" style="--bg-image: url(${block1})"></div>
                        <div class="block-2">
                            ${previews}
                        </div>
                </div>`;
    }
}

const HtmlItemLoadCollection = ({ title, id, count } = {}) => {
    return `<div class="item-collection" data-id="${id}">
                ${getbgcollection(count)}
                <div class="info-collection">
                    <span class="collection-name">${title}</span>
                    <span class="collection-counts">${count} Аниме</span>
                </div>
            </div>`;

    function getbgcollection(count = 0) {
        let previews = '';

        for (let i = 0; i < count && i < 3; i++) {
            previews += `<div class="preview loading"></div>`;
        }

        return `<div class="bg-collection count-${count}">
                    <div class="block-1 loading"></div>
                    <div class="block-2">
                        ${previews}
                    </div>
                </div>`;
    }
}

class HtmlNotFoundCollection {
    #classes = ['item-collection', 'not-found'];
    constructor() {
        this.image = '/images/collections.png';
        this.name = 'Не найдено';
    }

    get dom() {
        return `.${this.#classes.join('.')}`;
    }

    Get() {
        return `<div class="${this.#classes.join(' ')}">
                    <div class="bg-collection count-1">
                        <div class="block-1" style="--bg-image: url(${this.image})"></div>
                    </div>
                    <div class="info-collection">
                        <span class="collection-name">${this.name}</span>
                    </div>
                </div>`
    }

    Show(path) {
        let element = $(`${path} > ${this.dom}`)
        if (element.length > 0) {
            element.show();
        } else {
            $(path).append(this.Get());
        }
    }

    Hide(path) {
        let element = $(`${path} > ${this.dom}`)
        if (element.length > 0) {
            element.hide();
        }
    }
}

export const HCollection = {
    Iteam: HtmlItemCollection,
    Load: HtmlItemLoadCollection,
    NotFound: new HtmlNotFoundCollection()
}

export class ISearch {
    constructor() {
        this.dom = $('#active-icon');
        this.#SetStatus('default');
    }

    Search() {
        this.#SetStatus('load');
    }

    Result(count = 0) {
        $('#active-icon > .wrapper > .num').text(count);
        this.#SetStatus('result');
    }

    Empty() {
        $('#active-icon > .wrapper > .num').text('Очистить');
        this.#SetStatus('empty');
    }

    Clear() {
        this.#SetStatus('default');
    }

    #SetStatus(status) {
        this.status = status;
        this.dom.attr('data-status', this.status);
    }
}