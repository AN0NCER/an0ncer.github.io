import { TMenu } from "/javascript/core/menu.core.js";
import { TScrollbar } from "/javascript/modules/tun.scrollbar.js";
import { stickySide } from "/javascript/modules/dubs/dubs.sticky.js";
import { getStudio } from "/javascript/modules/dubs/api.dubs.js";
import { toggleFav } from "/javascript/modules/dubs/dubs.favorites.js";
import { KIND_NAME } from "/javascript/modules/dubs/dubs.format.js";
import { markBranch, markFav, profileSkeleton, renderBranches, renderGenres, renderHero, renderKinds, renderKpis, renderStates, renderTop, renderYears } from "./modules/mod.profile.js";
import { focusSearch, initTitles, renderFresh, showBranch, showState } from "./modules/mod.titles.js";
import { esc } from "./modules/mod.ui.js";

/**
 * Страница студии озвучки: studio.html?id=610
 * id — студия из каталога (dubs.html) или translation.id любой её ветки.
 */

TMenu.init();
TScrollbar();
// Профиль слева на ПК выше окна — едет со страницей и прилипает низом
stickySide(document.querySelector('.profile'));

const ID = new URLSearchParams(location.search).get('id');

const $page = document.querySelector('.page-title-wrapper .page');
const $headSub = document.querySelector('.head-sub');

/** Вся страница вместо профиля — когда показывать нечего */
function fail(title, text) {
    $headSub.textContent = '';
    document.querySelector('.studio-layout').innerHTML = `
        <div class="studios-empty page-state">
            <b>${esc(title)}</b>
            <p>${esc(text)}</p>
            <a class="chip" href="/dubs.html">Ко всем студиям</a>
        </div>`;
}

async function load() {
    if (!ID) {
        fail('Студия не выбрана', 'Откройте студию из каталога озвучек.');
        return;
    }

    profileSkeleton();

    let s;
    try {
        s = await getStudio(ID);
    } catch (err) {
        console.error('[studio] профиль не загрузился', err);
        if (err.status === 404) fail('Студия не найдена', 'Возможно, её больше нет в базе или ссылка устарела.');
        else fail('Не удалось загрузить студию', 'Сервер озвучек не ответил. Проверьте подключение и обновите страницу.');
        return;
    }

    document.title = `${s.name} — озвучка · Tunime`;
    $page.textContent = s.name;
    $headSub.textContent = `Студия озвучки · ${KIND_NAME[s.kind] || s.kind}`;

    renderHero(s);
    renderKpis(s);
    renderStates(s);
    renderBranches(s);
    renderGenres(s);
    renderYears(s);
    renderKinds(s);
    renderTop(s);

    initTitles(s, { branchChange: markBranch });
    renderFresh(s.id);
}

/* ---------- обработчики ---------- */

// Шапка студии: избранное и «Искать в озвучке»
document.querySelector('.hero').addEventListener('click', (e) => {
    const fav = e.target.closest('.fav-btn');
    if (fav) {
        markFav(fav, toggleFav(Number(fav.dataset.id)));
        return;
    }
    if (e.target.closest('[data-act="search"]')) focusSearch();
});

// Клик по ветке — в «Все тайтлы» только её аниме (повторный клик — сброс)
document.querySelector('.branches').addEventListener('click', (e) => {
    const branch = e.target.closest('.branch[data-branch]');
    if (branch) showBranch(Number(branch.dataset.branch));
});

// Клик по состоянию в полосе — фильтр тайтлов
document.querySelector('.states').addEventListener('click', (e) => {
    const item = e.target.closest('[data-state]');
    if (item) showState(item.dataset.state);
});

/** Кнопки-иконки в шапке — div с role="button": Enter и пробел тоже нажимают */
function onPress(el, run) {
    el.addEventListener('click', run);
    el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            run();
        }
    });
}

onPress(document.querySelector('.back-btn'), () => {
    const fromHere = document.referrer && new URL(document.referrer).origin === location.origin;
    if (fromHere && history.length > 1) history.back();
    else location.href = '/dubs.html';
});

// Поделиться: системное меню, где оно есть, иначе — копия ссылки
const $share = document.querySelector('.share-btn');
onPress($share, async () => {
    const url = new URL(location.href);
    url.searchParams.delete('state');
    url.searchParams.delete('sort');
    url.searchParams.delete('branch');
    url.searchParams.delete('g');
    url.searchParams.delete('xg');

    try {
        if (navigator.share) {
            await navigator.share({ title: document.title, url: url.href });
            return;
        }
        await navigator.clipboard.writeText(url.href);
        $share.classList.add('-done');
        $share.title = 'Ссылка скопирована';
        setTimeout(() => {
            $share.classList.remove('-done');
            $share.title = 'Поделиться';
        }, 1600);
    } catch {
        // Закрыли системное меню или нет доступа к буферу — ничего страшного
    }
});

load();
