import Collections from "../../modules/tun.collections.js";
import { WNotification } from "../win.notification.js";

/**
 * Спросить перед удалением коллекции.
 *
 * Общее для окон выбора и редактирования: удаление необратимо, а кнопка
 * в обоих случаях стоит вплотную к безобидным действиям.
 *
 * @param {string} cid
 * @param {string} [title] - если название уже под рукой, лишний поиск не нужен
 * @returns {Promise<boolean>} подтвердил ли пользователь
 */
export async function confirmRemove(cid, title = null) {
    const name = title ?? Collections.get(cid)?.title ?? 'коллекцию';

    const { win } = await WNotification({
        content: `Удалить коллекцию «${name}»?<br />Восстановить её будет нельзя.`
    });

    return win === 1;
}

export default confirmRemove;
