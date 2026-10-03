import { Users } from "../../../modules/api.shiki.js";
import { pressable } from "../../../modules/tun.animate.js";

/** Автор подборок разработчика — не пользователь Shikimori */
const TUNIME = 'tunime';

const HOUSE = { nickname: 'Tunime', image: '/images/icons/icon-192.png' };

/**
 * Плашка автора коллекции в панели управления.
 *
 * Ник и аватар живут на Shikimori: в базе у нас только uid, а он и есть
 * идентификатор пользователя Shikimori.
 *
 * @param {HTMLElement} root - контейнер `.cid-collection`
 */
export function createOwner(root) {
    const el = root.querySelector('.cid-btn.-account');
    const avatar = el?.querySelector('.avatar');
    const nickname = el?.querySelector('span');

    // Разделитель отбивает плашку от кнопок — без неё он висел бы
    // в воздухе, поэтому показываем и прячем их вместе
    const separator = root.querySelector('.cid-controller-wrapper > .separator');

    const show = (state) => {
        el?.classList.toggle('-hide', !state);
        separator?.classList.toggle('-hide', !state);
    };

    // До ответа плашки нет. Заодно чистим содержимое разметки: там
    // стоит заглушка, и, не загрузись автор, она выдавала бы чужой
    // список за свой
    if (el) {
        if (nickname) nickname.textContent = '';
        avatar?.style.removeProperty('--p-ava-img');
    }

    show(false);

    /** Профиль есть не у всех: у подборок разработчика перехода нет */
    let profile = null;

    const draw = ({ nickname: name, image, uid = null }) => {
        if (!el) return;

        if (nickname) nickname.textContent = name ?? '';
        if (avatar && image) avatar.style.setProperty('--p-ava-img', `url('${image}')`);

        profile = uid ? `/user.html?id=${encodeURIComponent(uid)}` : null;

        el.classList.toggle('-static', profile === null);
        show(true);
    };

    const onClick = () => {
        if (profile) location.href = profile;
    };

    el?.addEventListener('click', onClick);

    // Отклик на нажатие тот же, что у соседних кнопок панели
    const unpress = pressable([el].filter(Boolean), { scale: 1.06 });

    return {
        /**
         * @param {string} owner - uid владельца коллекции
         * @returns {Promise<boolean>} удалось ли узнать автора
         */
        async load(owner) {
            if (!owner || !el) return false;

            if (owner === TUNIME) {
                draw(HOUSE);
                return true;
            }

            const response = await Users.show(owner).GET();
            if (response.failed) return false;

            draw({
                nickname: response.nickname,
                image: response.image?.x160 ?? response.image?.x80,
                uid: response.id ?? owner
            });

            return true;
        },

        destroy() {
            el?.removeEventListener('click', onClick);
            unpress();
        }
    };
}

export default createOwner;
