import { describe, expect, it } from "vitest";

import {
    enterPage,
    formatDuration,
    openedGalleries,
    pausePage,
    resumePage,
    sessionField,
    sessionLines,
    trackGalleryView,
    visitorSession,
    visitPages,
    visitTime,
} from "./session";

const LIMIT = 1024;

describe("sessionField", () => {
    it("keeps every line when they fit", () => {
        const field = sessionField(["; /", "[ Visited GitHub ]"]);

        expect(field).toBe("```ini\n; /\n[ Visited GitHub ]```");
    });

    it("keeps the newest lines under Discord's limit and notes the rest", () => {
        const lines = Array.from(
            { length: 80 },
            (_, i) => `[ Visited link number ${i} ]`,
        );
        const field = sessionField(lines);

        expect(field.length).toBeLessThanOrEqual(LIMIT);
        expect(field).toContain("link number 79 ]```");
        expect(field).not.toContain("link number 0 ]");
        expect(field).toMatch(/; … \d+ earlier/);
    });
});

describe("trackGalleryView", () => {
    it("logs each gallery once and counts the photos seen in it", () => {
        visitorSession.events = [];
        trackGalleryView("lumen", "Lumen", "Decode loop", 2);
        trackGalleryView("lumen", "Lumen", "Decode loop", 2);
        trackGalleryView("lumen", "Lumen", "Cache bench", 2);
        trackGalleryView("neurinese", "Neurinese", "Canvas", 4);

        expect(visitorSession.events).toHaveLength(2);
        expect(visitorSession.events[0]).toMatchObject({
            type: "gallery",
            seen: ["Decode loop", "Cache bench"],
            total: 2,
        });
        expect(openedGalleries()).toEqual(["lumen", "neurinese"]);
    });
});

describe("page time", () => {
    it("counts only the time a page was showing", () => {
        visitorSession.events = [];
        enterPage("/", 0, true);
        // Hidden at 30s, back a minute later, then 5s more before moving on
        pausePage(30_000);
        resumePage(90_000);
        enterPage("/history", 95_000, true);

        expect(visitPages(155_000)).toEqual([
            { path: "/", ms: 35_000 },
            { path: "/history", ms: 60_000 },
        ]);
        expect(visitTime(155_000)).toBe(95_000);
        expect(sessionLines(155_000)).toEqual([
            "; /  (35s)",
            "; /history  (1m 0s)",
        ]);
    });

    it("waits for a page opened in a background tab to show", () => {
        visitorSession.events = [];
        enterPage("/", 0, false);
        expect(visitTime(10_000)).toBe(0);

        resumePage(10_000);
        expect(visitTime(25_000)).toBe(15_000);
    });

    it("keeps one clock for the same page across renders", () => {
        visitorSession.events = [];
        enterPage("/", 0, true);
        enterPage("/", 5_000, true);

        expect(visitPages(10_000)).toEqual([{ path: "/", ms: 10_000 }]);
    });
});

describe("formatDuration", () => {
    it("reads like a stopwatch", () => {
        expect(formatDuration(42_400)).toBe("42s");
        expect(formatDuration(185_000)).toBe("3m 5s");
        expect(formatDuration(4_320_000)).toBe("1h 12m");
    });
});
