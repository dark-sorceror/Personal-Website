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

export function referrerHost(referrer: string | null) {
    if (!referrer) return null;

    try {
        return new URL(referrer).hostname || null;
    } catch {
        return null;
    }
}
