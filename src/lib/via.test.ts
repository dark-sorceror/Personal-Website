import { describe, expect, it } from "vitest";

import { takeVia } from "./via";

describe("takeVia", () => {
    it("takes the tag and keeps the rest of the address", () => {
        expect(
            takeVia("https://haoyan.ca/history/?via=linkedin&x=1#top"),
        ).toEqual({
            via: "linkedin",
            href: "https://haoyan.ca/history/?x=1#top",
        });
    });

    it("leaves no stray question mark behind", () => {
        expect(takeVia("https://haoyan.ca/?via=resume").href).toBe(
            "https://haoyan.ca/",
        );
    });

    it("leaves an untagged address alone", () => {
        expect(takeVia("https://haoyan.ca/?x=1")).toEqual({
            via: null,
            href: "https://haoyan.ca/?x=1",
        });
    });
});
