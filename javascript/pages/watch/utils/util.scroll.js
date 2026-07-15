import { animate } from "../../../library/anime.esm.min.js";

function scrollToSelected(axis) {
    const isX = axis === 'horizontal';
    const $container = $(`.episode-scroll-wrapper[data-scroll="${axis}"]`);
    const $selected = $container.find('.episode.-select');
    const $menu = $container.find('.btn-win-episode');
    const hasMenu = $menu.length > 0;

    if (!$selected.length) return;

    const scrollProp = isX ? 'scrollLeft' : 'scrollTop';
    const offsetProp = isX ? 'left' : 'top';

    const targetScroll =
        $selected.offset()[offsetProp] -
        $container.offset()[offsetProp] +
        $container[scrollProp]() +
        (hasMenu ? -15 : 0);

    animate($container[0], {
        [scrollProp]: targetScroll,
        duration: 300,
        ease: 'outQuad',
        onComplete: hasMenu ? () => $menu.removeClass('-show') : undefined,
    });
}

export function AutoScrollEpisodes() {
    const angle = document.body.getAttribute('angle');
    const isColumn = $PARAMETERS.watch.episrevers !== 'top' && ['90', '270'].includes(angle);
    const axis = isColumn ? 'vertical' : 'horizontal';

    requestAnimationFrame(() => scrollToSelected(axis));
}