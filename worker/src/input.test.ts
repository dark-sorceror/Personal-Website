import { describe, expect, it } from "vitest";

import {
    cleanDuration,
    cleanGalleries,
    cleanPages,
    cleanVia,
    cleanVisitor,
    referrerHost,
    text,
} from "./input";

describe("cleanVia", () => {
    it("keeps a short plain code, lowercased", () => {
        expect(cleanVia("linkedin")).toBe("linkedin");
        expect(cleanVia("Resume-2026")).toBe("resume-2026");
        expect(cleanVia("a".repeat(40))).toBe("a".repeat(40));
    });

    it("drops anything else rather than fixing it", () => {
        expect(cleanVia("a".repeat(41))).toBeNull();
        expect(cleanVia("job_board")).toBeNull();
        expect(cleanVia("two words")).toBeNull();
        expect(cleanVia("<b>hi</b>")).toBeNull();
        expect(cleanVia("café")).toBeNull();
        expect(cleanVia("")).toBeNull();
        expect(cleanVia(null)).toBeNull();
        expect(cleanVia(42)).toBeNull();
    });
});

describe("cleanGalleries", () => {
    it("keeps each plain topic once", () => {
        expect(cleanGalleries(["lumen", "goosetriever", "lumen"])).toBe(
            '["lumen","goosetriever"]',
        );
    });

    it("drops anything else", () => {
        expect(cleanGalleries(["lumen", "<b>", 7, "a".repeat(33)])).toBe(
            '["lumen"]',
        );
        expect(cleanGalleries([])).toBeNull();
        expect(cleanGalleries("lumen")).toBeNull();
        expect(cleanGalleries(null)).toBeNull();
    });
});

describe("cleanVisitor", () => {
    it("keeps a random id and nothing else", () => {
        expect(cleanVisitor("0F8FAD5B-D9CB-469F-A165-70867728950E")).toBe(
            "0f8fad5b-d9cb-469f-a165-70867728950e",
        );
        expect(cleanVisitor("a1b2c3d4e5f60718")).toBe("a1b2c3d4e5f60718");
        expect(cleanVisitor("short")).toBeNull();
        expect(cleanVisitor("not hex at all!!")).toBeNull();
        expect(cleanVisitor(7)).toBeNull();
    });
});

describe("cleanDuration", () => {
    it("rounds, and holds a forgotten tab to a day", () => {
        expect(cleanDuration(1234.6)).toBe(1235);
        expect(cleanDuration(9e9)).toBe(86_400_000);
        expect(cleanDuration(-1)).toBeNull();
        expect(cleanDuration(NaN)).toBeNull();
        expect(cleanDuration("5")).toBeNull();
    });
});

describe("cleanPages", () => {
    it("keeps each page that has a path and a time", () => {
        expect(
            cleanPages([
                { path: "/", ms: 35_000 },
                { path: "https://elsewhere", ms: 1 },
                { path: "/history" },
                null,
            ]),
        ).toBe('[{"path":"/","ms":35000}]');
        expect(cleanPages([])).toBeNull();
        expect(cleanPages("/")).toBeNull();
    });
});

describe("referrerHost", () => {
    it("keeps just the site", () => {
        expect(referrerHost("https://www.linkedin.com/feed/?x=1")).toBe(
            "www.linkedin.com",
        );
    });

    it("is null without a usable referrer", () => {
        expect(referrerHost(null)).toBeNull();
        expect(referrerHost("not a url")).toBeNull();
    });
});

describe("text", () => {
    it("clips long values and drops empty ones", () => {
        expect(text("x".repeat(5000))).toHaveLength(1024);
        expect(text("")).toBeNull();
        expect(text(7)).toBeNull();
    });
});
