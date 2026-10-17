import { describe, expect, test } from "vitest";

import {
    RateMeter,
    SHAKE_COOLDOWN_S,
    SHAKE_THRESHOLD,
    ShakeDetector,
    Spring,
    lowPass,
    rotate,
    screenGravity,
} from "./tilt";

describe("screenGravity", () => {
    test("flat on a table has no pull on screen", () => {
        const [x, y] = screenGravity(0, 0);

        expect(x).toBeCloseTo(0);
        expect(y).toBeCloseTo(0);
    });

    test("held upright pulls straight down the screen", () => {
        const [x, y] = screenGravity(90, 0);

        expect(x).toBeCloseTo(0);
        expect(y).toBeCloseTo(1);
    });

    test("tipping the right edge down pulls right", () => {
        const [x, y] = screenGravity(0, 30);

        expect(x).toBeCloseTo(0.5);
        expect(y).toBeCloseTo(0);
    });

    test("landscape turns the pull with the screen", () => {
        // Top edge turned to the left: the phone's right edge is now up
        const [x, y] = rotate(1, 0, 90);

        expect(x).toBeCloseTo(0);
        expect(y).toBeCloseTo(-1);
    });
});

describe("lowPass", () => {
    test("reaches about 63% of a step after one time constant", () => {
        expect(lowPass(0, 1, 0.2, 0.2)).toBeCloseTo(1 - Math.exp(-1));
    });

    test("is the same in one step or many", () => {
        let v = 0;

        for (let i = 0; i < 10; i++) v = lowPass(v, 1, 0.01, 0.1);

        expect(v).toBeCloseTo(lowPass(0, 1, 0.1, 0.1));
    });
});

describe("Spring", () => {
    test("overshoots a step, then settles on it", () => {
        const spring = new Spring();
        let peak = 0;

        for (let i = 0; i < 300; i++) {
            spring.step(1, 0, 1 / 60);
            peak = Math.max(peak, spring.x);
        }

        expect(peak).toBeGreaterThan(1.05);
        expect(spring.x).toBeCloseTo(1, 2);
        expect(spring.y).toBe(0);
    });

    test("stays stable through a long frame", () => {
        const spring = new Spring();

        spring.step(1, 1, 0.1);

        expect(Math.abs(spring.x)).toBeLessThan(2);
    });
});

describe("ShakeDetector", () => {
    test("ignores ordinary handling", () => {
        const shake = new ShakeDetector();

        expect(shake.feed(3, 4, 2, 0)).toBe(false);
    });

    test("fires once per cooldown", () => {
        const shake = new ShakeDetector();
        const hard = SHAKE_THRESHOLD + 1;

        expect(shake.feed(hard, 0, 0, 1)).toBe(true);
        expect(shake.feed(hard, 0, 0, 1.1)).toBe(false);
        expect(shake.feed(0, hard, 0, 1 + SHAKE_COOLDOWN_S)).toBe(true);
    });
});

describe("RateMeter", () => {
    test("measures a steady event rate", () => {
        const meter = new RateMeter();

        for (let i = 0; i <= 60; i++) meter.tick(i / 60);

        expect(meter.hz).toBeCloseTo(60, 0);
    });
});
