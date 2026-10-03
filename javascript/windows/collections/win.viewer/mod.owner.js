import { Users } from "../../../modules/api.shiki.js";
import { pressable } from "../../../modules/tun.animate.js";

/** Автор подборок разработчика — не пользователь Shikimori */
const TUNIME = 'tunime';

const HOUSE = { nickname: 'Tunime', image: '/images/icons/icon-192.png' };

/**
 * Плашка автора коллекции.
 *
 * Ник и аватар живут на Shikimori: в базе у нас только uid, а он и есть
 * идентификатор пользователя Shikimori.
 *
 * @param {HTMLElement} root - корень окна
 */
export function createOwner(root) {
    const wrapper = root.querySelector('.collection-owner');
    const avatar = wrapper?.querySelector('.avatar img');
    const nickname = wrapper?.querySelector('.nickname');

    /** У подборок разработчика профиля нет — плашка остаётся без перехода */
    let profile = null;

    const draw = ({ nickname: name, image, uid = null }) => {
        if (!wrapper) return;

        if (nickname) nickname.textContent = name ?? '';

        if (avatar && image) {
            avatar.src = image;
            avatar.alt = name ?? '';
        }

        profile = uid ? `/user.html?id=${encodeURIComponent(uid)}` : null;
        wrapper.classList.toggle('-clickable', profile !== null);

        // Пустую плашку не показываем: до ответа там были бы кружок-дыра
        // и пустая строка
        wrapper.classList.remove('hide');
    };

    const onClick = () => {
        if (profile) location.href = profile;
    };

    wrapper?.addEventListener('click', onClick);

    // Отклик на нажатие тот же, что у кнопок окна
    const unpress = pressable([wrapper].filter(Boolean));

    return {
        /**
         * @param {string} owner - uid владельца
         * @returns {Promise<boolean>} удалось ли узнать автора
         */
        async load(owner) {
            if (!owner) return false;

            if (owner === TUNIME) {
                draw(HOUSE);
                return true;
            }

            const response = await Users.show(owner).GET();
            if (response.failed) return false;

            draw({
                nickname: response.nickname,
                image: response.image?.x80 ?? response.image?.x64,
                uid: response.id ?? owner
            });

            return true;
        },

        destroy() {
            wrapper?.removeEventListener('click', onClick);
            unpress();
        }
    };
}

export default createOwner;
