import { describe, expect, it } from "vitest";

import { cleanVia, referrerHost, text } from "./input";

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
