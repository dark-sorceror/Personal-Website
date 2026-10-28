import { describe, expect, it } from "vitest";

import {
    cleanSteps,
    cleanVia,
    cleanVisitor,
    referrerHost,
    sessionColumns,
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

describe("cleanSteps", () => {
    const gallery = {
        type: "gallery",
        topic: "lumen",
        title: "Lumen",
        seen: 2,
        total: 3,
    };

    it("keeps each step that looks like one, in order", () => {
        expect(
            cleanSteps([
                { type: "page", path: "/", ms: 35_000.4 },
                gallery,
                { type: "click", label: "GitHub" },
            ]),
        ).toEqual([
            { type: "page", path: "/", ms: 35_000 },
            gallery,
            { type: "click", label: "GitHub" },
        ]);
    });

    it("holds a forgotten tab to a day", () => {
        expect(cleanSteps([{ type: "page", path: "/", ms: 9e9 }])).toEqual([
            { type: "page", path: "/", ms: 86_400_000 },
        ]);
    });

    it("drops anything else", () => {
        expect(
            cleanSteps([
                { type: "page", path: "https://elsewhere", ms: 1 },
                { type: "page", path: "/history" },
                { type: "page", path: "/", ms: -1 },
                { ...gallery, topic: "<b>" },
                { ...gallery, seen: 1.5 },
                { type: "click", label: "" },
                { type: "photo", label: "Old" },
                null,
                7,
            ]),
        ).toBeNull();
        expect(cleanSteps([])).toBeNull();
        expect(cleanSteps("/")).toBeNull();
    });
});

describe("sessionColumns", () => {
    it("stores the steps, and the pages, time and galleries from them", () => {
        const columns = sessionColumns([
            { type: "page", path: "/", ms: 35_000 },
            {
                type: "gallery",
                topic: "lumen",
                title: "Lumen",
                seen: 1,
                total: 2,
            },
            { type: "page", path: "/history", ms: 60_000 },
            {
                type: "gallery",
                topic: "lumen",
                title: "Lumen",
                seen: 2,
                total: 2,
            },
        ]);

        expect(JSON.parse(columns.session)).toHaveLength(4);
        expect(columns.pages).toBe(
            '[{"path":"/","ms":35000},{"path":"/history","ms":60000}]',
        );
        expect(columns.galleries).toBe('["lumen"]');
        expect(columns.duration_ms).toBe(95_000);
    });

    it("shows a long visit's newest steps but counts all its time", () => {
        const steps = Array.from({ length: 130 }, (_, i) => ({
            type: "page" as const,
            path: `/${i}`,
            ms: 1_000,
        }));
        const columns = sessionColumns(steps);
        const kept = JSON.parse(columns.session);

        expect(kept).toHaveLength(100);
        expect(kept.at(-1).path).toBe("/129");
        expect(kept[0].path).toBe("/30");
        expect(columns.duration_ms).toBe(130_000);
        expect(JSON.parse(columns.pages!)).toHaveLength(130);
    });

    it("has no pages or galleries to count from a bare click", () => {
        const columns = sessionColumns([{ type: "click", label: "GitHub" }]);

        expect(columns.pages).toBeNull();
        expect(columns.galleries).toBeNull();
        expect(columns.duration_ms).toBe(0);
    });
});

describe("referrerHost", () => {
    it("keeps just the site", () => {
        expect(referrerHost("https://www.linkedin.com/feed/?x=1")).toBe(
            "linkedin.com",
        );
        expect(referrerHost("https://github.com/dark-sorceror")).toBe(
            "github.com",
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
