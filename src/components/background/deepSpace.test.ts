import { describe, expect, it } from "vitest";
import { createSpaceField, dustAt, TAU, vignette } from "./deepSpace";

describe("deep-space field", () => {
    it("keeps the original star positions stable across redraws", () => {
        const first = createSpaceField(1440, 1000, 1, false);
        expect(createSpaceField(1440, 1000, 1, false)).toEqual(first);
        expect(first.stars).toHaveLength(430);
        expect(
            first.stars.every(
                (star) =>
                    star.x >= 0 &&
                    star.x < 1440 &&
                    star.y >= 0 &&
                    star.y < 1000,
            ),
        ).toBe(true);
    });

    it("partitions backing pixels without gaps between glyphs", () => {
        const { cells } = createSpaceField(390, 172, 2, true);
        for (let i = 1; i < cells.length; i++) {
            if (cells[i].y === cells[i - 1].y)
                expect(cells[i - 1].x + cells[i - 1].width).toBe(cells[i].x);
        }
    });

    it("subdues the field behind the reading column", () => {
        const { cells } = createSpaceField(1440, 1000, 1, false, {
            left: 400,
            right: 1000,
        });
        expect(cells.find((cell) => cell.x === 700)!.opacity).toBeCloseTo(0.32);
        expect(cells[0].opacity).toBe(1);
    });

    it("fades the mobile vignette at its edges", () => {
        expect(vignette(195, 86, 390, 172)).toBe(1);
        expect(vignette(195, 172, 390, 172)).toBe(0);
        expect(vignette(0, 86, 390, 172)).toBe(0);
        expect(vignette(195, 0, 390, 172)).toBe(0);
    });

    it("keeps dust bounded and the slow loop seamless", () => {
        for (let x = -2; x < 2; x += 0.13) {
            const base = dustAt(x, x * 0.3);
            expect(base).toBeGreaterThanOrEqual(0);
            expect(base).toBeLessThanOrEqual(0.16);
            expect(base * (0.9 + 0.1 * Math.cos(x * 3))).toBeCloseTo(
                base * (0.9 + 0.1 * Math.cos(TAU + x * 3)),
                12,
            );
        }
    });
});
