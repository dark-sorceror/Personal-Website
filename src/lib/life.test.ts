import { describe, expect, test } from "vitest";

import { BitLife, lifeIndex, stepLife } from "./life";

const COLS = 20;
const ROWS = 20;

function makeGrid(alive: [number, number][]) {
    const g = new Uint8Array(COLS * ROWS);

    for (const [c, r] of alive) g[lifeIndex(c, r, COLS, ROWS)] = 1;

    return g;
}

function step(g: Uint8Array) {
    const next = new Uint8Array(COLS * ROWS);

    stepLife(g, next, COLS, ROWS);

    return next;
}

const GLIDER: [number, number][] = [
    [1, 0],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
];

describe("stepLife rules (B3/S23)", () => {
    test("block still life stays fixed", () => {
        let g = makeGrid([
            [5, 5],
            [6, 5],
            [5, 6],
            [6, 6],
        ]);
        const original = g.slice();

        for (let i = 0; i < 10; i++) g = step(g);

        expect(g).toEqual(original);
    });

    test("blinker oscillates with period 2", () => {
        const horizontal = makeGrid([
            [4, 5],
            [5, 5],
            [6, 5],
        ]);
        const vertical = makeGrid([
            [5, 4],
            [5, 5],
            [5, 6],
        ]);

        expect(step(horizontal)).toEqual(vertical);
        expect(step(step(horizontal))).toEqual(horizontal);
    });

    test("underpopulation kills lone cells and pairs", () => {
        expect(step(makeGrid([[5, 5]]))).toEqual(makeGrid([]));
        expect(
            step(
                makeGrid([
                    [5, 5],
                    [6, 5],
                ]),
            ),
        ).toEqual(makeGrid([]));
    });

    test("overpopulation kills a cell with 4 neighbors", () => {
        const plus = makeGrid([
            [5, 5],
            [4, 5],
            [6, 5],
            [5, 4],
            [5, 6],
        ]);

        expect(step(plus)[lifeIndex(5, 5, COLS, ROWS)]).toBe(0);
    });

    test("birth on exactly 3 neighbors", () => {
        const l = makeGrid([
            [4, 5],
            [5, 5],
            [5, 4],
        ]);

        expect(step(l)[lifeIndex(4, 4, COLS, ROWS)]).toBe(1);
    });

    test("glider translates (+1,+1) every 4 generations", () => {
        let g = makeGrid(GLIDER);

        for (let i = 0; i < 4; i++) g = step(g);

        expect(g).toEqual(makeGrid(GLIDER.map(([c, r]) => [c + 1, r + 1])));
    });

    test("glider laps the torus back to its start", () => {
        const start: [number, number][] = GLIDER.map(([c, r]) => [
            c + 17,
            r + 17,
        ]);
        let g = makeGrid(start);

        for (let i = 0; i < 4 * COLS; i++) g = step(g);

        expect(g).toEqual(makeGrid(start));
    });
});

describe("BitLife bit-parallel engine", () => {
    test.each([
        [50, 37],
        [32, 20],
        [33, 11],
        [64, 64],
        [7, 5],
    ])("matches the reference engine on %ix%i", (cols, rows) => {
        const bit = new BitLife(cols, rows);
        let cells = new Uint8Array(cols * rows);
        let next = new Uint8Array(cols * rows);

        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                if (Math.random() < 0.3) {
                    cells[c * rows + r] = 1;
                    bit.set(c, r, 1);
                }
            }
        }

        for (let gen = 0; gen < 150; gen++) {
            stepLife(cells, next, cols, rows);
            [cells, next] = [next, cells];
            bit.step();

            let firstMismatch = -1;

            for (let c = 0; c < cols && firstMismatch < 0; c++) {
                for (let r = 0; r < rows; r++) {
                    if (bit.get(c, r) !== cells[c * rows + r]) {
                        firstMismatch = c * rows + r;
                        break;
                    }
                }
            }

            expect(firstMismatch, `generation ${gen}`).toBe(-1);
        }

        let population = 0;

        for (let i = 0; i < cells.length; i++) population += cells[i];

        expect(bit.population()).toBe(population);
    });

    test("epsilon flips roughly N*epsilon cells", () => {
        const bit = new BitLife(100, 100);
        const trials = 50;
        let total = 0;

        for (let i = 0; i < trials; i++) {
            bit.clear();
            bit.step(0.01);
            total += bit.population();
        }

        const mean = total / trials;

        expect(mean).toBeGreaterThan(60);
        expect(mean).toBeLessThan(140);
    });
});
