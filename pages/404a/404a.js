import { TMenu } from "/javascript/core/menu.core.js";
import { TScrollbar } from "/javascript/modules/tun.scrollbar.js";
import { sUrl } from "/javascript/core/main.core.js";
import { Animes } from "/javascript/modules/api.shiki.js";

/**
 * Страница «не найдено»: 404a.html?id=59977 — тайтл не нашёлся (из watch.html),
 * без id — любая другая пропавшая страница (например, профиль из user.html).
 *
 * Состояния (body[data-state]): none — нигде нет; check — проверяем зеркало;
 * rip — нашли в зеркале. Проверки зеркала shikimori.rip пока нет — разметка и стили
 * готовы, показать найденное можно через showRip(anime).
 */

TMenu.init();
// Свой тонкий скроллбар на ПК — если страница не влезла по высоте (на телефоне ничего не делает)
TScrollbar();

const params = new URLSearchParams(location.search);
const ID = (params.get('id') || '').replace(/\D/g, '');
const KIND = ID ? 'anime' : 'page';

const $ = (s) => document.querySelector(s);

/* ---------- тексты ---------- */

function fill() {
    document.body.dataset.kind = KIND;

    const now = new Date();
    $('.nf-when').textContent = `${now.toLocaleDateString('ru-RU')} ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

    if (KIND === 'anime') {
        document.title = 'Tunime - Аниме не найдено';
        $('.page-title-wrapper .page').textContent = 'Аниме не найдено';
        $('.nf-eyebrow-kind').textContent = 'аниме';
        $('#nf-title').textContent = 'Такого аниме здесь нет';
        $('.nf-id').textContent = ID;
        $('.nf-lead').innerHTML = `Ссылка ведёт на тайтл <code>id ${ID}</code>, но в каталоге Shikimori.io его не нашлось. Скорее всего, тайтл скрыт или ссылка устарела.`;
        $('.nf-why-link').textContent = 'Проверьте id в адресе или найдите тайтл по названию.';
        $('.nf-err').textContent = `ANIME_NOT_FOUND · id ${ID}`;
    } else {
        $('.nf-lead').textContent = 'Ссылка устарела или в ней ошибка. Найдите аниме по названию или вернитесь на главную.';
        $('.nf-err').textContent = 'PAGE_NOT_FOUND';
    }
}

/* ---------- помехи в пустом слоте ---------- */

function noise() {
    const cv = $('.nf-noise');
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(cv.width, cv.height);
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const frame = () => {
        for (let i = 0; i < img.data.length; i += 4) {
            const v = Math.random() * 255;
            img.data[i] = v * 0.7;
            img.data[i + 1] = v * 0.85;
            img.data[i + 2] = v;
            img.data[i + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
        // ~14 кадров в секунду; в скрытой вкладке requestAnimationFrame сам встаёт на паузу
        if (!still) setTimeout(() => requestAnimationFrame(frame), 70);
    };
    frame();
}

/* ---------- постеры вокруг пустого места: популярные онгоинги ---------- */

function posters() {
    // Берём с запасом: у части онгоингов Shikimori отдаёт заглушку missing_original.jpg
    Animes.list({ status: 'ongoing', order: 'popularity', limit: 12, censored: true }, (res) => {
        if (!Array.isArray(res)) return; // сеть или лимит — остаются цветные заглушки
        const slots = document.querySelectorAll('.nf-poster');
        const srcs = res.map((a) => a?.image?.original).filter((src) => src && !src.includes('missing'));
        srcs.slice(0, slots.length).forEach((src, i) => {
            const url = `${sUrl}${src}`;
            const img = new Image();
            img.onload = () => {
                slots[i].style.backgroundImage = `url("${url}")`;
                slots[i].classList.add('-img');
            };
            img.src = url;
        });
    }).GET();
}

/* ---------- зеркало shikimori.rip (пока не вызывается) ---------- */

/** @param {'none'|'check'|'rip'} state */
export function setState(state) {
    document.body.dataset.state = state;
}

/**
 * Показать тайтл, найденный в зеркале.
 * @param {{russian?: string, name?: string, kind?: string, aired_on?: string, image?: {preview?: string}}} anime
 * @param {string} href - куда ведёт «Открыть»
 */
export function showRip(anime, href) {
    $('.nf-found-title').textContent = anime.russian || anime.name || 'Тайтл из зеркала';
    $('.nf-found-meta').textContent = [anime.kind?.toUpperCase(), anime.aired_on?.slice(0, 4), 'скрыт в Shikimori.io']
        .filter(Boolean).join(' · ');
    if (anime.image?.preview) $('.nf-found .ps').style.backgroundImage = `url("https://shikimori.rip${anime.image.preview}")`;
    $('.nf-found-open').href = href;
    setState('rip');
}

/* ---------- действия ---------- */

function back() {
    const fromHere = document.referrer && new URL(document.referrer).origin === location.origin;
    if (fromHere && history.length > 1) history.back();
    else location.href = '/index.html';
}

document.querySelectorAll('.nf-back').forEach((el) => {
    el.addEventListener('click', back);
    el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') back();
    });
});

$('.nf-search').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = e.currentTarget.q.value.trim();
    if (!q) return e.currentTarget.q.focus();
    location.href = `/search.html?q=${encodeURIComponent(q)}`;
});

$('.nf-random').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const label = btn.querySelector('.label');
    btn.disabled = true;
    label.textContent = 'Подбираем…';

    Animes.list({ order: 'random', limit: 1, kind: 'tv', score: 7, censored: true }, (res) => {
        const id = Array.isArray(res) ? res[0]?.id : null;
        if (id) return (location.href = `/watch.html?id=${id}`);
        btn.disabled = false;
        label.textContent = 'Не вышло, ещё раз';
    }).GET();
});

$('.nf-copy').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const text = `${$('.nf-err').textContent} · ${$('.nf-when').textContent} · ${location.href}`;
    const done = () => {
        btn.textContent = 'Скопировано';
        setTimeout(() => (btn.textContent = 'Скопировать для отчёта'), 1800);
    };
    const select = () => window.getSelection().selectAllChildren($('.nf-err'));
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, select);
    else select();
});

fill();
noise();
posters();
