import { FIELD_LIMIT } from "./embed";

// Whatever the page sends is clipped to what an embed field can show
export function text(value: unknown) {
    return typeof value === "string" && value
        ? value.slice(0, FIELD_LIMIT)
        : null;
}

// A shared link's tag, from ?via=. Only a short plain code counts, so a
// mistyped or doctored link is simply untagged.
export function cleanVia(value: unknown) {
    if (typeof value !== "string") return null;

    const via = value.toLowerCase();

    return /^[a-z0-9-]{1,40}$/.test(via) ? via : null;
}

// The galleries a visit opened, by topic. Kept as JSON so they can be
// counted later; anything that isn't a plain topic is dropped.
export function cleanGalleries(value: unknown) {
    if (!Array.isArray(value)) return null;

    const topics = [
        ...new Set(
            value.filter(
                (t): t is string =>
                    typeof t === "string" && /^[a-z0-9-]{1,32}$/.test(t),
            ),
        ),
    ].slice(0, 20);

    return topics.length ? JSON.stringify(topics) : null;
}

// The browser's own random id: hex, with or without dashes
export function cleanVisitor(value: unknown) {
    if (typeof value !== "string") return null;

    const id = value.toLowerCase();

    return /^[0-9a-f-]{16,64}$/.test(id) ? id : null;
}

const DAY = 86_400_000;

// Milliseconds on the site, up to a day; a tab left open longer is still
// a day
export function cleanDuration(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0
        ? Math.min(Math.round(value), DAY)
        : null;
}

// Each page and its time, as JSON, keeping only what looks like one
export function cleanPages(value: unknown) {
    if (!Array.isArray(value)) return null;

    const pages = value
        .flatMap((p) => {
            const path = (p as { path?: unknown })?.path;
            const ms = cleanDuration((p as { ms?: unknown })?.ms);

            return typeof path === "string" &&
                path.startsWith("/") &&
                path.length <= 200 &&
                ms !== null
                ? [{ path, ms }]
                : [];
        })
        .slice(0, 50);

    return pages.length ? JSON.stringify(pages) : null;
}

export function referrerHost(referrer: string | null) {
    if (!referrer) return null;

    try {
        return new URL(referrer).hostname || null;
    } catch {
        return null;
    }
}
