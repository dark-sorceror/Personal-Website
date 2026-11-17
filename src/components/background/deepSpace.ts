export const TAU = Math.PI * 2;
export const GLYPHS = " .,:;i!+*tfLCOG08#%@";
export const LOOP_SECONDS = 12;

export const PALETTES = {
    dark: { dust: "#6e8fb2", cool: "#9fc3e8", warm: "#edc593" },
    light: { dust: "#667686", cool: "#23384f", warm: "#23384f" },
};

export function hash(x: number, y: number) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
}

function smooth(t: number) {
    return t * t * (3 - 2 * t);
}

function noise(x: number, y: number) {
    const ix = Math.floor(x),
        iy = Math.floor(y);
    const u = smooth(x - ix),
        v = smooth(y - iy);
    const a = hash(ix, iy),
        b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1),
        d = hash(ix + 1, iy + 1);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}

export function dustAt(x: number, y: number) {
    const lane = Math.exp(-Math.pow((y + x * 0.65 - 0.2) * 3.3, 2));
    return lane * noise(x * 25 + 60, y * 25 + 60) * 0.16;
}

export function vignette(x: number, y: number, width: number, height: number) {
    const bottom = Math.max(
        0,
        Math.min(1, (y - height * 0.65) / (height * 0.35)),
    );
    const top = Math.max(0, Math.min(1, y / (height * 0.12)));
    const side = Math.max(
        0,
        Math.min(1, x / (width * 0.035), (width - x) / (width * 0.035)),
    );
    return side * top * (1 - smooth(bottom));
}

export function createSpaceField(
    width: number,
    height: number,
    dpr: number,
    compact: boolean,
    readingBounds?: { left: number; right: number },
) {
    const cellWidth = compact ? 5.95 : 7;
    const cellHeight = cellWidth * 1.45;
    const scale = compact
        ? width * 0.36
        : Math.min(width * 0.25, height * 0.48);
    const centerX = width * (compact ? 0.5 : 0.205);
    const centerY = height * (compact ? 0.44 : 0.48);
    const left = readingBounds?.left ?? width * 0.3;
    const right = readingBounds?.right ?? width * 0.8;
    const cells = [];
    for (let y = 0; y < height; y += cellHeight) {
        for (let x = 0; x < width; x += cellWidth) {
            const u = (x - centerX) / scale,
                v = (y - centerY) / scale;
            const fadeIn = Math.max(0, Math.min(1, (x - left + 110) / 110));
            const fadeOut = Math.max(0, Math.min(1, (right + 90 - x) / 90));
            cells.push({
                base: dustAt(u, v),
                sine: Math.sin(u * 3),
                cosine: Math.cos(u * 3),
                grain: hash(x / cellWidth, y / cellHeight),
                opacity: compact
                    ? vignette(x, y, width, height)
                    : 1 - Math.min(fadeIn, fadeOut) * 0.68,
                x: Math.round(x * dpr),
                y: Math.round(y * dpr),
                width: Math.round((x + cellWidth) * dpr) - Math.round(x * dpr),
                height:
                    Math.round((y + cellHeight) * dpr) - Math.round(y * dpr),
            });
        }
    }
    const stars = Array.from({ length: 430 }, (_, i) => {
        const x = hash(i, 91) * width,
            y = hash(i, 213) * height,
            seed = hash(i, 47);
        return {
            x,
            y,
            seed,
            big: seed > 0.965,
            opacity: compact
                ? vignette(x, y, width, height)
                : x > left && x < right
                  ? 0.22
                  : 1,
        };
    });
    return { cells, stars, cellWidth, cellHeight };
}
