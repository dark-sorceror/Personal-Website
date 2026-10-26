import { describe, expect, it } from "vitest";

import versions from "../../history.json";
import { formatKeyDate, timeline } from "./history";

describe("formatKeyDate", () => {
    it("reads a date key in UTC", () => {
        expect(formatKeyDate("2026-03-31")).toBe("March 31, 2026");
        expect(formatKeyDate("2026-01-01")).toBe("January 1, 2026");
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

    it("puts the live site first, then versions newest first", () => {
        expect(timeline(list).map((e) => e.key)).toEqual([
            "live",
            "2026-07-18",
            "2025-11-14",
        ]);
    });

    it("links each version to its snapshot folder", () => {
        const [live, newer] = timeline(list);

        expect(live).toMatchObject({ href: "/", live: true });
        expect(newer).toMatchObject({
            date: "July 18, 2026",
            href: "/history/2026-07-18/",
            thumbnail: "/history/2026-07-18/thumbnail.jpg",
            note: "a note",
            live: false,
        });
    });
});

describe("history.json", () => {
    it("has unique date keys and full commit SHAs", () => {
        const keys = versions.map((v) => v.key);

        expect(new Set(keys).size).toBe(keys.length);
        for (const v of versions) {
            expect(v.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(v.sha).toMatch(/^[0-9a-f]{40}$/);
            expect(v.label.length).toBeGreaterThan(0);
        }
    });
});
