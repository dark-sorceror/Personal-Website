// Whatever the page sends is clipped, to longer than any real value
export function text(value: unknown, limit = 1024) {
    return typeof value === "string" && value ? value.slice(0, limit) : null;
}

// A shared link's tag, from ?via=. Only a short plain code counts, so a
// mistyped or doctored link is simply untagged.
export function cleanVia(value: unknown) {
    if (typeof value !== "string") return null;

    const via = value.toLowerCase();

    return /^[a-z0-9-]{1,40}$/.test(via) ? via : null;
}

// The browser's own random id: hex, with or without dashes
export function cleanVisitor(value: unknown) {
    if (typeof value !== "string") return null;

    const id = value.toLowerCase();

    return /^[0-9a-f-]{16,64}$/.test(id) ? id : null;
}

// A step of the visit, as the page reports it
export type Step =
    | { type: "page"; path: string; ms: number }
    | {
          type: "gallery";
          topic: string;
          title: string;
          seen: number;
          total: number;
      }
    | { type: "click"; label: string };

const DAY = 86_400_000;

// Milliseconds on a page, up to a day; a tab left open longer is still a day
function ms(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0
        ? Math.min(Math.round(value), DAY)
        : null;
}

function count(value: unknown) {
    return typeof value === "number" && Number.isInteger(value) && value >= 0
        ? value
        : null;
}

// The visit's steps in order, keeping only what looks like one. No visit
// takes a thousand, so past that it's the newest that count.
export function cleanSteps(value: unknown) {
    if (!Array.isArray(value)) return null;

    const steps = value.slice(-1000).flatMap((raw): Step[] => {
        const step = (raw ?? {}) as Record<string, unknown>;

        if (step.type === "page") {
            const time = ms(step.ms);
            const { path } = step;

            return typeof path === "string" &&
                path.startsWith("/") &&
                path.length <= 200 &&
                time !== null
                ? [{ type: "page", path, ms: time }]
                : [];
        }

        if (step.type === "gallery") {
            const { topic } = step;
            const title = text(step.title, 100);
            const seen = count(step.seen);
            const total = count(step.total);

            return typeof topic === "string" &&
                /^[a-z0-9-]{1,32}$/.test(topic) &&
                title &&
                seen !== null &&
                total !== null
                ? [{ type: "gallery", topic, title, seen, total }]
                : [];
        }

        const label = step.type === "click" ? text(step.label, 100) : null;

        return label ? [{ type: "click", label }] : [];
    });

    return steps.length ? steps : null;
}

// The newest steps, kept to show, and what the stats count from all of
// them: each page and its time, and the galleries opened, by topic. The time
// only grows as the visit goes on, which tells a late beacon from a new one.
export function sessionColumns(steps: Step[]) {
    const pages = steps.flatMap((s) =>
        s.type === "page" ? [{ path: s.path, ms: s.ms }] : [],
    );
    const galleries = [
        ...new Set(
            steps.flatMap((s) => (s.type === "gallery" ? [s.topic] : [])),
        ),
    ];

    return {
        session: JSON.stringify(steps.slice(-100)),
        pages: pages.length ? JSON.stringify(pages) : null,
        galleries: galleries.length ? JSON.stringify(galleries) : null,
        duration_ms: Math.min(
            pages.reduce((sum, p) => sum + p.ms, 0),
            DAY,
        ),
    };
}

// Just the site, to group by, so www.linkedin.com and linkedin.com are one
export function referrerHost(referrer: string | null) {
    if (!referrer) return null;

    try {
        return new URL(referrer).hostname.replace(/^www\./, "") || null;
    } catch {
        return null;
    }
}
