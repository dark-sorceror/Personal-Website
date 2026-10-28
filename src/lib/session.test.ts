import { describe, expect, it } from "vitest";

import {
    enterPage,
    pausePage,
    resumePage,
    sessionSteps,
    trackGalleryView,
    trackLinkClick,
    visitorSession,
} from "./session";

describe("sessionSteps", () => {
    it("reports each step in order, as the Worker reads it", () => {
        visitorSession.events = [];
        enterPage("/", 0, true);
        trackGalleryView("lumen", "Lumen", "Decode loop", 2);
        trackLinkClick("GitHub", "https://github.com/dark-sorceror");

        expect(sessionSteps(35_000)).toEqual([
            { type: "page", path: "/", ms: 35_000 },
            {
                type: "gallery",
                topic: "lumen",
                title: "Lumen",
                seen: 1,
                total: 2,
            },
            { type: "click", label: "GitHub" },
        ]);
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
    });
});

describe("page time", () => {
    const pages = (now: number) =>
        sessionSteps(now).filter((s) => s.type === "page");

    it("counts only the time a page was showing", () => {
        visitorSession.events = [];
        enterPage("/", 0, true);
        // Hidden at 30s, back a minute later, then 5s more before moving on
        pausePage(30_000);
        resumePage(90_000);
        enterPage("/history", 95_000, true);

        expect(pages(155_000)).toEqual([
            { type: "page", path: "/", ms: 35_000 },
            { type: "page", path: "/history", ms: 60_000 },
        ]);
    });

    it("waits for a page opened in a background tab to show", () => {
        visitorSession.events = [];
        enterPage("/", 0, false);
        expect(pages(10_000)[0].ms).toBe(0);

        resumePage(10_000);
        expect(pages(25_000)[0].ms).toBe(15_000);
    });

    it("keeps one clock for the same page across renders", () => {
        visitorSession.events = [];
        enterPage("/", 0, true);
        enterPage("/", 5_000, true);

        expect(pages(10_000)).toEqual([
            { type: "page", path: "/", ms: 10_000 },
        ]);
    });
});
