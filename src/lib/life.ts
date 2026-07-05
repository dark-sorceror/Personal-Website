// Conway's Game of Life engines (B3/S23) on a toroidal grid.

/** Index into a flat [col * rows + row] grid with toroidal wrapping. */
export function lifeIndex(c: number, r: number, cols: number, rows: number) {
    return ((c + cols) % cols) * rows + ((r + rows) % rows);
}

/**
 * Reference engine: per-cell neighbor scan. `epsilon` flips each cell's
 * computed outcome with that probability; 0 is pure deterministic Conway.
 */
export function stepLife(
    cells: Uint8Array,
    next: Uint8Array,
    cols: number,
    rows: number,
    epsilon = 0,
    rand: () => number = Math.random,
) {
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            let n = 0;

            for (let dc = -1; dc <= 1; dc++) {
                for (let dr = -1; dr <= 1; dr++) {
                    if (!dc && !dr) continue;
                    n += cells[lifeIndex(c + dc, r + dr, cols, rows)];
                }
            }

            const alive = cells[c * rows + r];

            let out = n === 3 || (alive && n === 2) ? 1 : 0;

            if (epsilon > 0 && rand() < epsilon) out = out ? 0 : 1;

            next[c * rows + r] = out;
        }
    }
}

/**
 * Bit-parallel engine: 32 cells per word, neighbor counts computed with
 * bitwise carry-save adders, stochastic flips applied in O(expected flips).
 */
export class BitLife {
    readonly cols: number;
    readonly rows: number;

    private readonly wordsPerRow: number;
    private readonly lastMask: number;
    private grid: Uint32Array;
    private next: Uint32Array;
    private readonly shiftHi: Uint32Array; // col c takes bit from c-1
    private readonly shiftLo: Uint32Array; // col c takes bit from c+1

    constructor(cols: number, rows: number) {
        this.cols = cols;
        this.rows = rows;
        this.wordsPerRow = Math.ceil(cols / 32);
        this.lastMask = cols % 32 ? (1 << cols % 32) - 1 : -1;
        this.grid = new Uint32Array(rows * this.wordsPerRow);
        this.next = new Uint32Array(rows * this.wordsPerRow);
        this.shiftHi = new Uint32Array(rows * this.wordsPerRow);
        this.shiftLo = new Uint32Array(rows * this.wordsPerRow);
    }

    get(c: number, r: number): 0 | 1 {
        const w = this.grid[r * this.wordsPerRow + (c >> 5)];

        return ((w >>> (c & 31)) & 1) as 0 | 1;
    }

    set(c: number, r: number, alive: number) {
        const i = r * this.wordsPerRow + (c >> 5);
        const bit = 1 << (c & 31);

        if (alive) this.grid[i] |= bit;
        else this.grid[i] &= ~bit;
    }

    clear() {
        this.grid.fill(0);
    }

    population(): number {
        let total = 0;

        for (let i = 0; i < this.grid.length; i++) {
            let v = this.grid[i];

            v -= (v >>> 1) & 0x55555555;
            v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
            v = (v + (v >>> 4)) & 0x0f0f0f0f;
            total += (v * 0x01010101) >>> 24;
        }

        return total;
    }

    // Toroidal column shifts for every row, done once per generation
    private computeShifts() {
        const { grid, shiftHi, shiftLo, rows, wordsPerRow: W, cols } = this;
        const lastBit = (cols - 1) & 31;

        for (let r = 0; r < rows; r++) {
            const o = r * W;
            const wrapHi = (grid[o + W - 1] >>> lastBit) & 1;
            const wrapLo = grid[o] & 1;

            for (let w = 0; w < W; w++) {
                const carryHi =
                    w > 0 ? grid[o + w - 1] >>> 31 : wrapHi;

                shiftHi[o + w] = ((grid[o + w] << 1) | carryHi) >>> 0;

                const carryLo =
                    w < W - 1 ? (grid[o + w + 1] & 1) << 31 : 0;

                shiftLo[o + w] = (grid[o + w] >>> 1) | carryLo;
            }

            shiftHi[o + W - 1] &= this.lastMask;
            shiftLo[o + W - 1] |= wrapLo << lastBit;
        }
    }

    step(epsilon = 0, rand: () => number = Math.random) {
        const { grid, next, shiftHi, shiftLo, rows, wordsPerRow: W } = this;

        this.computeShifts();

        for (let r = 0; r < rows; r++) {
            const o = r * W;
            const up = ((r - 1 + rows) % rows) * W;
            const dn = ((r + 1) % rows) * W;

            for (let w = 0; w < W; w++) {
                const la = shiftHi[up + w];
                const ca = grid[up + w];
                const ra = shiftLo[up + w];
                const ls = shiftHi[o + w];
                const rs = shiftLo[o + w];
                const lb = shiftHi[dn + w];
                const cb = grid[dn + w];
                const rb = shiftLo[dn + w];
                const self = grid[o + w];

                // Carry-save adders sum the 8 neighbor boards into count bit-planes b0-b3
                const t1 = la ^ ca;
                const s1 = t1 ^ ra;
                const c1 = (la & ca) | (ra & t1);
                const t2 = ls ^ rs;
                const s2 = t2 ^ lb;
                const c2 = (ls & rs) | (lb & t2);
                const s3 = cb ^ rb;
                const c3 = cb & rb;

                const t4 = s1 ^ s2;
                const b0 = t4 ^ s3;
                const c4 = (s1 & s2) | (s3 & t4);

                const t5 = c1 ^ c2;
                const s5 = t5 ^ c3;
                const c5 = (c1 & c2) | (c3 & t5);

                const b1 = s5 ^ c4;
                const c6 = s5 & c4;
                const b2 = c5 ^ c6;
                const b3 = c5 & c6;

                // B3/S23: born on 3, survive on 2 or 3
                const eq3 = b0 & b1 & ~b2 & ~b3;
                const eq2 = ~b0 & b1 & ~b2 & ~b3;
                let out = eq3 | (self & eq2);

                if (w === W - 1) out &= this.lastMask;

                next[o + w] = out >>> 0;
            }
        }

        [this.grid, this.next] = [this.next, this.grid];

        // Geometric skip sampling visits only the ~N*epsilon cells that flip
        if (epsilon > 0) {
            const total = this.cols * this.rows;
            const logOneMinusEps = Math.log(1 - Math.min(epsilon, 0.999999));
            let i = -1;

            for (;;) {
                const u = rand();
                const skip =
                    u > 0 ? Math.floor(Math.log(u) / logOneMinusEps) : 0;

                i += 1 + skip;
                if (i >= total) break;

                const r = Math.floor(i / this.cols);
                const c = i % this.cols;

                this.grid[r * this.wordsPerRow + (c >> 5)] ^= 1 << (c & 31);
            }
        }
    }
}
