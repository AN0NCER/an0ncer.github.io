import { Main, OAuth } from "../core/main.core.js";
import { TMenu } from "../core/menu.core.js";
import { Collections as API } from "../modules/api.tunime.js";
import Collections from "../modules/tun.collections.js";
import { WCollectionSorting } from "../windows/collections/win.sorting.js";
import { apply as applySort, custom as customSort, read as readSort } from "../windows/collections/win.sorting/mod.state.js";
import WCollectionViewer from "../windows/collections/win.viewer.js";
import { createButton } from "./collections/mod.create.js";
import { applyFilter, createFilter } from "./collections/mod.filter.js";
import { markFilter, PageHeader } from "./collections/mod.page.header.js";
import { createRender } from "./collections/mod.render.js";
import { createSearch } from "./collections/mod.search.js";

/** Чьи коллекции смотрим. Без параметра — свои */
export const $UID = new URLSearchParams(window.location.search).get("id");

TMenu.init();

/** Список для поиска по названиям: свои из фасада, чужие из памяти */
let page = [];

/** Что показано: обычный список или выдача поиска */
let query = '';

/** Порядок и автогруппы — запомнены на устройстве с прошлого раза */
let sort = readSort();

/** Свои или чужие. От этого зависит вообще всё на странице */
const mine = () => !$UID || String($UID) === String(OAuth.user?.id);

/** Отрисовка. Клик по карточке открывает окно просмотра */
const view = createRender({
    own: mine(),
    onOpen: (cid) => WCollectionViewer(cid).catch(() => null)
});

/**
 * Свои коллекции живут в фасаде: он держит кэш, синхронизируется по
 * маркеру и сам сообщает о правках через события.
 */
const own = () => {
    const render = () => {
        // Поиск по названиям смотрит сюда: список живой, и после любой
        // правки он должен искать по свежему
        page = Collections.list;

        redraw();
    };

    // replay: кэш мог подняться на прошлой странице, и события мы уже
    // пропустили — подписка всё равно получит состояние
    Collections.on('loaded', render, { replay: true });

    // Дальше перерисовка по любой правке: часть придёт от окон на этой
    // странице, часть — из соседней вкладки через storage
    Collections.on('sync', render);
    Collections.on('create', render);
    Collections.on('rename', render);
    Collections.on('visibility', render);
    Collections.on('remove', render);
    Collections.on('change', render);
    Collections.on('storage', render);

    Collections.on('error', (data) => console.log('[collections] - ошибка', data));

    if (!Collections.loaded) Collections.init();
    else Collections.sync();
};

/**
 * Чужие коллекции фасад не кэширует — там только свои. Поэтому один
 * запрос и список в переменной страницы, без событий.
 */
const foreign = async (uid) => {
    const response = await API.user(uid).collections({});

    if (!response.complete) {
        return console.log('[collections] - не удалось получить список', response);
    }

    const { data = [], owner } = response.value ?? {};

    // owner приходит с сервера: чужому отдаются только публичные
    console.log(`[collections] - чужих коллекций: ${data.length} (owner=${owner})`, data);

    // Избранное лежит на Shikimori, у нас его нет вовсе
    const favourites = await Collections.favouritesOf(uid);

    console.log('[collections] - избранное владельца', favourites
        ? { cid: favourites.cid, count: favourites.count }
        : 'недоступно');

    // Состав тут не приходит: список отдаётся в режиме preview, без
    // items. Для карточек хватает count и cover
    page = favourites ? [favourites, ...data] : data;

    return { list: page, owner };
};

/**
 * Поиск страницы.
 *
 * Внутри коллекций ищем только у себя: чужие приходят без состава,
 * сервер отдаёт их в режиме preview
 */
const search = createSearch({
    source: () => page,
    inside: mine(),
    onResult: (result) => {
        query = result.query;

        // Запрос стёрли — возвращаем обычный список
        if (!query) return redraw();

        // Выдача — два раздела. Пометки «автогруппа» у них нет: их
        // собрал не алгоритм по префиксам, а сам поиск
        const sections = [];

        if (result.titles.length > 0) {
            sections.push({
                title: 'Коллекции',
                items: applyFilter(result.titles, type),
                note: false
            });
        }

        if (result.inside.length > 0) {
            const matches = new Map(result.inside.map(x => [x.collection.cid, x.matches]));

            sections.push({
                title: 'Найдено внутри',
                items: applyFilter(result.inside.map(x => x.collection), type),
                note: false,
                matches
            });
        }

        view.draw({ groups: sections });
    }
});

/** Выбранная приватность — от неё зависит, что попадёт в отрисовку */
let type = 'all';

/** Переключатель «Все / Публичные / Приватные» в шапке списка */
const filter = createFilter(document.querySelector('.collection-filter'), {
    onChange: (value) => {
        type = value;
        redraw();
    }
});

/** Группировка по префиксу названия: «Must - …» собираются вместе */
const SPLIT = /\s*[-–—:|/]\s*/;

const groups = (list, { min = 3 } = {}) => {
    const buckets = new Map();
    const rest = [];

    for (const collection of list) {
        // Особые мимо групп: иначе однажды окажутся под чужим заголовком
        if (collection.kind !== 'custom') {
            rest.push(collection);
            continue;
        }

        const key = String(collection.title ?? '').split(SPLIT)[0].trim();

        if (!key) {
            rest.push(collection);
            continue;
        }

        if (!buckets.has(key.toLowerCase())) buckets.set(key.toLowerCase(), { title: key, items: [] });
        buckets.get(key.toLowerCase()).items.push(collection);
    }

    const result = [];

    for (const group of buckets.values()) {
        // Группа из всех коллекций сразу — не группа, а шум
        if (group.items.length >= min && group.items.length < list.length) result.push(group);
        else rest.push(...group.items);
    }

    return { groups: result, rest };
};

/**
 * Собрать и отрисовать то, что положено показывать сейчас.
 *
 * Во время поиска не вмешиваемся: выдачей управляет он, иначе правка
 * коллекции сбрасывала бы результаты под руками
 */
const redraw = () => {
    if (query) return;

    const list = applySort(applyFilter(page, type), sort);

    // Приглашение создать первую коллекцию нужно, даже когда избранное
    // с Shikimori уже нарисовано: своих коллекций-то ещё нет
    const empty = mine()
        ? !page.some(x => x.kind === 'custom')
        : page.length === 0;

    // Автогруппы считаем по отфильтрованному: иначе под заголовком
    // окажется меньше карточек, чем обещает группа
    const shape = sort.groups ? groups(list) : { groups: [], rest: list };

    view.draw({ ...shape, empty });
};

Main(async (e) => {
    if (!e) return window.location.href = "login.html";

    console.log(`[collections] - режим: ${mine() ? 'свои' : `чужие (uid=${$UID})`}`);

    // Шапка поднимается первой и сама достаёт владельца: своего из
    // OAuth, чужого — с Shikimori
    const owner = await PageHeader({
        uid: $UID,
        // Кнопка справа открывает сортировку. Выбор применяется сразу,
        // поэтому список перерисовывается по onChange, а не по закрытию
        // Сортировка применяется после закрытия окна, а не на каждое
        // нажатие: перерисовка списка приходится на анимацию подсветки
        // и та захлёбывается
        onfilter: async () => {
            const value = await WCollectionSorting({ value: sort }).catch(() => null);
            if (!value) return;

            sort = value;

            markFilter(customSort(sort));
            redraw();
        },
        onready: (user) => console.log('[collections] - владелец', user),
        search: search.events
    });

    // Порядок мог остаться с прошлого захода — метку ставим сразу,
    // не дожидаясь, пока человек откроет окно
    markFilter(customSort(sort));

    // Чужого профиля нет — дальше идти некуда: коллекции такого
    // пользователя тоже не найдутся
    if (!owner) return console.log('[collections] - владелец не найден');

    if (mine()) {
        // Создавать можно только у себя: на чужой странице кнопке нечего
        // делать, поэтому её и не поднимаем
        // Кнопки две — в панели фильтра и в пустом состоянии. Список
        // после создания перерисует подписка на фасад, так что делать
        // тут больше нечего
        createButton();
        createButton({ dom: '.collection-empty .btn-create' });

        // Дальше всё делают подписки: кэш поднимется — список нарисуется
        return own();
    }

    const result = await foreign($UID);
    if (!result) return;

    redraw();
});
