import { describe, expect, it } from "vitest";

import { sessionField, trackLightboxView, visitorSession } from "./session";

const LIMIT = 1024;

describe("sessionField", () => {
    it("keeps every line when they fit", () => {
        const field = sessionField(["; /", "[ Visited GitHub ]"]);

        expect(field).toBe("```ini\n; /\n[ Visited GitHub ]```");
    });

    it("keeps the newest lines under Discord's limit and notes the rest", () => {
        const lines = Array.from(
            { length: 80 },
            (_, i) => `[ Viewed goosetriever: photo number ${i} ]`,
        );
        const field = sessionField(lines);

        expect(field.length).toBeLessThanOrEqual(LIMIT);
        expect(field).toContain("photo number 79 ]```");
        expect(field).not.toContain("photo number 0 ]");
        expect(field).toMatch(/; … \d+ earlier/);
    });
});

describe("trackLightboxView", () => {
    it("logs each photo once however often it's shown", () => {
        visitorSession.events = [];
        trackLightboxView("lumen", "Decode loop");
        trackLightboxView("lumen", "Decode loop");
        trackLightboxView("lumen", "Cache bench");

        expect(visitorSession.events).toHaveLength(2);
    });
});
