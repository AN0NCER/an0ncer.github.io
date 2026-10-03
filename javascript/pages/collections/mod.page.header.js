import { OAuth } from "../../core/main.core.js";
import { Users } from "../../modules/api.shiki.js";
import { THeader } from "./mod.header.js";

/**
 * Шапка страницы коллекций.
 *
 * Управление анимацией и поиском живёт в `mod.header.js` — здесь только
 * то, что специфично для этой страницы: чьи коллекции открыты и куда
 * ведут кнопки.
 */

/** Пока профиль не загрузился, в разметке стоит заглушка */
const PLACEHOLDER = {
    nickname: 'Пользователь',
    image: '/images/ava.webp'
};

/** Подписи над ником: своё и чужое читаются по-разному */
const TITLE = {
    own: 'Коллекции',
    foreign: 'Коллекции'
};

const dom = {
    avatar: '.profile > .ava-wrapper',
    title: '.profile > .profile-content > .page-title',
    username: '.profile > .profile-content > .username',
    filter: '.quick-panel > .btn#page-filter'
};

/**
 * Пометить кнопку сортировки, когда выбран не порядок по умолчанию.
 *
 * Иначе, вернувшись на страницу через день, человек не поймёт, почему
 * список выглядит именно так
 *
 * @param {boolean} state
 */
export const markFilter = (state) => {
    document.querySelector(dom.filter)?.classList.toggle('-active', Boolean(state));
};

/**
 * @param {{nickname?: string, image?: string, own?: boolean}} user
 */
const draw = ({ nickname, image, own = true } = {}) => {
    const avatar = document.querySelector(dom.avatar);
    const title = document.querySelector(dom.title);
    const username = document.querySelector(dom.username);

    if (avatar && image) avatar.style.setProperty('--p-ava-img', `url('${image}')`);
    if (title) title.textContent = own ? TITLE.own : TITLE.foreign;
    if (username) username.textContent = nickname ?? PLACEHOLDER.nickname;
};

/**
 * Владелец страницы: свой профиль лежит в OAuth, чужой приходится
 * спрашивать у Shikimori — в базе у нас только uid
 *
 * @param {string | null} uid
 * @returns {Promise<{id: string|number, nickname: string, image: string, own: boolean} | null>}
 */
const fetchOwner = async (uid) => {
    const own = !uid || String(uid) === String(OAuth.user?.id);

    if (own) {
        const me = OAuth.user;
        if (!me) return null;

        return {
            id: me.id,
            nickname: me.nickname,
            image: me.image?.x160 ?? PLACEHOLDER.image,
            own: true
        };
    }

    const response = await Users.show(uid).GET();
    if (response.failed) return null;

    return {
        id: response.id,
        nickname: response.nickname,
        image: response.image?.x160 ?? PLACEHOLDER.image,
        own: false
    };
};

/**
 * Поднять шапку и подставить владельца.
 *
 * @param {Object} opts
 * @param {string | null} [opts.uid] - чьи коллекции открыты
 * @param {() => void} [opts.onfilter] - нажали кнопку фильтра
 * @param {(user: Object) => void} [opts.onready] - владелец известен
 * @param {{oninput?: Function, onsearch?: Function}} [opts.search] -
 *  обработчики строки поиска, обычно `search.events`
 * @returns {Promise<Object | null>} профиль владельца
 */
export const PageHeader = async ({ uid = null, onfilter = () => { }, onready = () => { }, search = {} } = {}) => {
    THeader.init({
        events: {
            // Тап по профилю: у своей страницы ведёт в аккаунт, у чужой —
            // на профиль владельца
            onprofil: () => {
                if (!OAuth.auth) return window.location.href = "login.html";

                const own = !uid || String(uid) === String(OAuth.user?.id);
                window.location.href = own ? "user.html" : `user.html?id=${encodeURIComponent(uid)}`;
            },

            // Кнопка справа — фильтр и сортировка, решает страница
            onbutton: () => onfilter(),

            // Поиск приходит снаружи: что делать с запросом, знает
            // страница, а не шапка
            ...search
        }
    });

    const user = await fetchOwner(uid);

    // Профиль не загрузился — оставляем заглушку из разметки: пустая
    // шапка выглядела бы как поломка
    if (!user) return null;

    draw(user);
    onready(user);

    return user;
};

export default PageHeader;
