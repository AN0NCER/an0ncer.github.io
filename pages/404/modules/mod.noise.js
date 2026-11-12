const FRAME_EVERY = 70;

/** Шум на canvas поверх фона. При prefers-reduced-motion рисуется один кадр */
export function initNoise() {
    const canvas = document.querySelector('.noise');
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(canvas.width, canvas.height);
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
        if (!still) setTimeout(() => requestAnimationFrame(frame), FRAME_EVERY);
    };
    frame();
}
