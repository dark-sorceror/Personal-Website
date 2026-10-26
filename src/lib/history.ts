import versions from "../../history.json";

// One entry of history.json, the list of past versions /history/ shows.
// scripts/history builds each into /history/<key>/ with a thumbnail.
export interface Version {
    key: string;
    sha: string;
    label: string;
    note?: string;
}

export interface TimelineEntry {
    key: string;
    date: string;
    label: string;
    note?: string;
    href: string;
    thumbnail: string;
    live: boolean;
}

// Keys are dates ("2026-03-31"); read them in UTC so no time zone can move
// a version to the day before
export function formatKeyDate(key: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;

    return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
}

const LIVE: TimelineEntry = {
    key: "live",
    date: "Now",
    label: "The site as it is today",
    href: "/",
    // The link preview card stands in for a screenshot of the live site
    thumbnail: "/opengraph-image.png",
    live: true,
};

/** The live site, then every past version, newest first. */
export function timeline(list: Version[] = versions): TimelineEntry[] {
    const past = [...list]
        .sort((a, b) => b.key.localeCompare(a.key))
        .map((v) => ({
            key: v.key,
            date: formatKeyDate(v.key),
            label: v.label,
            note: v.note,
            href: `/history/${v.key}/`,
            thumbnail: `/history/${v.key}/thumbnail.jpg`,
            live: false,
        }));

    return [LIVE, ...past];
}
