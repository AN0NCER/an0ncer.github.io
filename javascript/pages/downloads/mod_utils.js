export const formatBytes = (x) => {
    const units = ['б', 'Кб', 'Мб', 'Гб'];
    let n = parseInt(x, 10) || 0, l = 0;
    while (n >= 1024 && ++l) n /= 1024;
    return `${n.toFixed(n < 5 && l > 0 ? 1 : 0)} ${units[l]}`;
};

export const formatDuration = (seconds) => {
    // Ensure seconds is a non-negative integer
    seconds = Math.max(0, Math.floor(seconds));

    // Calculate hours, minutes, and seconds
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Format the string
    const formattedHours = hours > 0 ? `${hours}:` : "";
    const formattedMinutes = hours > 0 ? String(minutes).padStart(2, "0") : minutes;
    const formattedSeconds = String(secs).padStart(2, "0");

    return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
}

export const countVideo = (video = {}) => {
    return Object.values(video).reduce((count, { episodes }) => count + episodes.length, 0);
}

export const parseVID = (input) => {
    const regex = /^(\d+)-(\d+)-(\d+)$/;
    const match = input.match(regex);

    if (match) {
        return {
            animeId: parseInt(match[1], 10),
            episodeId: parseInt(match[2], 10),
            voiceId: parseInt(match[3], 10)
        };
    } else {
        throw new Error("Неверный формат строки");
    }
}