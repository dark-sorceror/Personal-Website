import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import versions from "../../history.json";

// One entry of history.json, the list of past versions /history/ shows.
// scripts/history builds each into /history/<key>/ with its screenshots.
export interface Version {
    key: string;
    sha: string;
    label: string;
    note?: string;
}

export type Theme = "dark" | "light";

export interface TimelineEntry {
    key: string;
    date: string;
    label: string;
    note?: string;
    href: string;
    // One screenshot per theme, so the preview follows the page's theme
    thumbnails: Record<Theme, string>;
    live: boolean;
}

/**
 * The `?v=` for a screenshot's URL. A screenshot that changes gets a new
 * URL, so a browser can never show a copy it cached from before.
 */
export type ThumbnailVersion = (key: string, theme: Theme) => string;

// scripts/history builds the snapshots, screenshots included, before
// this page; the cache it builds into is where to read them
const CACHE =
    process.env.HISTORY_CACHE ?? path.join(process.cwd(), ".history-cache");

// The live site's screenshots are taken from this same build after it's
// made, so this build's own stamp stands for them
const BUILD = Date.now().toString(36);

/** Hashes each screenshot in the cache; the commit stands in if missing. */
export function contentVersion(
    list: Version[],
    cache = CACHE,
): ThumbnailVersion {
    const shas = new Map(list.map((v) => [v.key, v.sha]));

    return (key, theme) => {
        if (key === "live") return BUILD;

        try {
            const file = path.join(cache, key, `thumbnail-${theme}.jpg`);

            return createHash("sha256")
                .update(readFileSync(file))
                .digest("hex")
                .slice(0, 10);
        } catch {
            return (shas.get(key) ?? BUILD).slice(0, 10);
        }
    };
}

// scripts/history saves a version's screenshots beside its snapshot, and
// the live site's in /history/live/
function thumbnailsOf(key: string, version: ThumbnailVersion) {
    const url = (theme: Theme) =>
        `/history/${key}/thumbnail-${theme}.jpg?v=${version(key, theme)}`;

    return { dark: url("dark"), light: url("light") };
}

// Keys are dates ("2026-03-31", or "2026-03-31-2" for a second version
// that day); read them in UTC so no time zone can move a version to the
// day before
export function formatKeyDate(key: string): string {
    const day = key.match(/^(\d{4}-\d{2}-\d{2})(-\d+)?$/)?.[1];

    if (!day) return key;

    return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
}

/** The live site, then every past version, newest first. */
export function timeline(
    list: Version[] = versions,
    version: ThumbnailVersion = contentVersion(list),
): TimelineEntry[] {
    const live: TimelineEntry = {
        key: "live",
        date: "Now",
        label: "The site as it is today",
        href: "/",
        thumbnails: thumbnailsOf("live", version),
        live: true,
    };
    const past = [...list]
        .sort((a, b) => b.key.localeCompare(a.key))
        .map((v) => ({
            key: v.key,
            date: formatKeyDate(v.key),
            label: v.label,
            note: v.note,
            href: `/history/${v.key}/`,
            thumbnails: thumbnailsOf(v.key, version),
            live: false,
        }));

    return [live, ...past];
}
