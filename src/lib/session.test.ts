import { describe, expect, it } from "vitest";

import {
    openedGalleries,
    sessionField,
    trackGalleryView,
    visitorSession,
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
