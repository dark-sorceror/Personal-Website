import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import versions from "../../history.json";
import { contentVersion, formatKeyDate, timeline } from "./history";

describe("formatKeyDate", () => {
    it("reads a date key in UTC", () => {
        expect(formatKeyDate("2026-03-31")).toBe("March 31, 2026");
        expect(formatKeyDate("2026-01-01")).toBe("January 1, 2026");
    });

    it("reads a second version's key as the same day", () => {
        expect(formatKeyDate("2026-07-05-2")).toBe("July 5, 2026");
    });

    it("leaves other keys alone", () => {
        expect(formatKeyDate("first-draft")).toBe("first-draft");
    });
});

describe("timeline", () => {
    const list = [
        { key: "2025-11-14", sha: "aaaaaaa", label: "Old" },
        { key: "2026-07-18", sha: "bbbbbbb", label: "Newer", note: "a note" },
    ];
    const stamp = (key: string, theme: string) => `${key}.${theme}`;

    it("puts the live site first, then versions newest first", () => {
        expect(timeline(list, stamp).map((e) => e.key)).toEqual([
            "live",
            "2026-07-18",
            "2025-11-14",
        ]);
    });

    it("links each version to its snapshot and versioned screenshots", () => {
        const [, newer] = timeline(list, stamp);

        expect(newer).toEqual({
            key: "2026-07-18",
            date: "July 18, 2026",
            label: "Newer",
            note: "a note",
            href: "/history/2026-07-18/",
            thumbnails: {
                dark: "/history/2026-07-18/thumbnail-dark.jpg?v=2026-07-18.dark",
                light: "/history/2026-07-18/thumbnail-light.jpg?v=2026-07-18.light",
            },
            live: false,
        });
    });

    it("shows the live site's own screenshots and nothing else", () => {
        const [live] = timeline(list, stamp);

        expect(live).toEqual({
            key: "live",
            date: "Now",
            label: "The site as it is today",
            href: "/",
            thumbnails: {
                dark: "/history/live/thumbnail-dark.jpg?v=live.dark",
                light: "/history/live/thumbnail-light.jpg?v=live.light",
            },
            live: true,
        });
    });
});

describe("contentVersion", () => {
    const list = [{ key: "2026-07-18", sha: "b0a3eaad15", label: "x" }];

    it("hashes the screenshot, so a new one gets a new URL", () => {
        const cache = fs.mkdtempSync(path.join(os.tmpdir(), "history-test-"));
        const file = path.join(cache, "2026-07-18", "thumbnail-dark.jpg");

        fs.mkdirSync(path.dirname(file));
        fs.writeFileSync(file, "first");
        const first = contentVersion(list, cache)("2026-07-18", "dark");

        fs.writeFileSync(file, "second");
        const second = contentVersion(list, cache)("2026-07-18", "dark");

        expect(first).toMatch(/^[0-9a-f]{10}$/);
        expect(second).not.toBe(first);
        fs.rmSync(cache, { recursive: true });
    });

    it("falls back to the commit when the screenshot isn't cached", () => {
        expect(
            contentVersion(list, "/nonexistent")("2026-07-18", "light"),
        ).toBe("b0a3eaad15");
    });
});

describe("history.json", () => {
    it("has unique date keys and full commit SHAs", () => {
        const keys = versions.map((v) => v.key);

        expect(new Set(keys).size).toBe(keys.length);
        for (const v of versions) {
            expect(v.key).toMatch(/^\d{4}-\d{2}-\d{2}(-\d+)?$/);
            expect(v.sha).toMatch(/^[0-9a-f]{40}$/);
            expect(v.label.length).toBeGreaterThan(0);
        }
    });
});
