import { animate } from "../../library/anime.esm.min.js";

export const UIStats = ({ stats } = {}) => {
    const stat = stats.full_statuses.anime;

    const _size = (id) => stat.find(x => x.grouped_id === id).size;

    const statistics = [
        [_size("watching"), '#stat-watch', '#stat-watch-pr'],
        [_size("completed"), '#stat-complete', '#stat-complete-pr'],
        [_size("planned"), '#stat-planned', '#stat-planned-pr'],
        [_size("dropped"), '#stat-dropped', '#stat-dropped-pr']
    ]

    const full = statistics.reduce((sum, x) => sum + x[0], 0);

    $('#stat-all').text(full);

    for (const [count, $e_num, $e_perc] of statistics) {
        $($e_num).text(count);
        $($e_perc).text(`${(count * 100 / full).toFixed(0)}%`)
    }

    const $main = $('.main-stats-wrapper');
    const transforms = {
        rotate: '0deg',
        scroll: 0
    }

    animate(transforms, {
        rotate: '360deg',
        loop: true,
        duration: 3000,
        ease: 'linear',
        onUpdate: self => {
            $main.css('--rotate', transforms.rotate);
        }
    })

    document.querySelector('.user-stats-wrapper').addEventListener('scroll', function (e) {
        $main.css('--scroll', `${e.target.scrollLeft * -1}px`);
    });
}