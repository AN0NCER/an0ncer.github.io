import { OnUser } from "../user.js";

export function Stats() {
    OnUser(data => {
        const stat = data.stats.full_statuses.anime;
        let count = 0;
        let watching = 0;
        let completed = 0;
        let planned = 0;
        let dropped = 0;

        for (let i = 0; i < stat.length; i++) {
            const e = stat[i];
            count += e.size;
            if (e.name === "watching" || e.name === "rewatching")
                watching += e.size;
            else if (e.name === "completed")
                completed += e.size;
            else if (e.name === "planned")
                planned += e.size;
            else
                dropped += e.size;
        }

        $(`.status-data > .count#counts > .val`).text(count);

        $(`.status-data > .count#watching > .val`).text(watching);
        $(`.status-data > .count#watching > .prcnt`).text(`${((watching * 100) / count).toFixed()}%`);
        $(`.status-data > .count#completed > .val`).text(completed);
        $(`.status-data > .count#completed > .prcnt`).text(`${((completed * 100) / count).toFixed()}%`);
        $(`.status-data > .count#planned > .val`).text(planned);
        $(`.status-data > .count#planned > .prcnt`).text(`${((planned * 100) / count).toFixed()}%`);
        $(`.status-data > .count#dropped > .val`).text(dropped);
        $(`.status-data > .count#dropped > .prcnt`).text(`${((dropped * 100) / count).toFixed()}%`);
    });
}