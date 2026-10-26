import { describe, expect, it } from "vitest";

import { advance, FADE_AT, LOOP_MS } from "@/components/LumenDemo";

describe("advance", () => {
    it("keeps playing while the card is watched", () => {
        expect(advance(2450, 16, true)).toBe(2466);
    });

    it("holds the finished replay instead of fading out while watched", () => {
        expect(advance(FADE_AT - 10, 50, true)).toBe(FADE_AT - 1);
        expect(advance(FADE_AT - 1, 1000, true)).toBe(FADE_AT - 1);
        expect(advance(1000, 50_000, true)).toBe(FADE_AT - 1);
    });

    it("lets a fade that already started finish and loop", () => {
        expect(advance(FADE_AT + 100, 50, true)).toBe(FADE_AT + 150);
        expect(advance(LOOP_MS - 10, 50, true)).toBe(40);
    });

    it("fades and loops when no one is watching", () => {
        expect(advance(FADE_AT - 10, 50, false)).toBe(FADE_AT + 40);
        expect(advance(LOOP_MS - 10, 50, false)).toBe(40);
    });
});
