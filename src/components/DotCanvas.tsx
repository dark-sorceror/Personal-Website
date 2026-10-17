"use client";

import { useEffect, useRef } from "react";

import { TiltReadout } from "@/components/TiltReadout";
import { BitLife } from "@/lib/life";
import { tilt, tiltSupported } from "@/lib/tilt";

const SPACING = 30;
const BASE_RADIUS = 1.5;
const BOOST_RADIUS = 2.4;

// Game of Life (B3/S23, toroidal)
const TICK_S = 0.28; // seconds per generation
const FADE_IN_RATE = 10; // brightness lerp per second
const FADE_OUT_RATE = 3.5;
const RESEED_EVERY = 10; // seconds between injections
const MIN_POP_FRAC = 0.012; // reseed sooner if population collapses
// Chance each cell's outcome flips per generation — the automaton's
// "sampling temperature". 0 = pure deterministic Conway.
const EPSILON = 0.003;
// Reduced motion: evolve this many generations off-screen, show one frame
const STATIC_GENERATIONS = 60;

// Cursor as a plough: live cells under the pointer are shoved out of its
// way, so moving through the board scrambles whatever pattern was there
const PUSH_RADIUS = 2.5; // cells
const PUSH_SCATTER = 1.5; // extra random cells a shoved cell may fly
// Soft lift on the base dots under the pointer (render only)
const LIFT_RADIUS = 4 * SPACING; // CSS px
const LIFT_ALPHA = 0.9; // of --dot-active, at the pointer
const LIFT_GROW = 0.8; // extra px of radius at the pointer
const POINTER_EASE = 12; // eased position lerp per second
const WAKE_HOLD_S = 0.2; // full strength this long after the last move...
const WAKE_FADE_S = 0.6; // ...then fade out over this long

// Click: a shockwave that blasts the cells around it outward, then a
// glider burst from the cleared centre
// The wave is a ripple: a tall crest at the front with smaller crests and
// troughs trailing behind it, so dots swell well past their live size on
// the crests and shrink to pinpricks in the troughs
const RING_S = 1.3;
const RING_REACH = 13 * SPACING; // how far the front travels, CSS px
const RING_WAVELENGTH = 2.4 * SPACING;
const RING_TRAIL = 1.4 * RING_WAVELENGTH; // how fast the trailing ripples die
const RING_GROW = 7; // extra px of radius on the tallest crest
const RING_SHRINK = 0.8; // fraction of a base dot lost in the deepest trough
const MAX_RINGS = 4;
const BURST_GAP = 2; // cells between the click and each glider
const BURST_CLEAR = 6; // cells blasted outward so the gliders launch clean
const FAST_SPEED = 1400; // CSS px/s; above this a click also fires a ship
const FAST_WINDOW_S = 0.1; // ...measured over this much recent motion
const TAP_SLOP = 8; // CSS px a tap may wander before it counts as a drag

// Click-and-drag paints live cells. Every pointer effect is mouse only:
// on phones the dots answer to tilt instead (below).
const PAINT_EVERY_MS = 24;

// Phones get the motion sensors instead: tilting leans the live dots
// downhill and steers new gliders that way, and a shake fires the ripple
const MAX_LEAN = 9; // CSS px a live dot hangs off its grid point
const DOWNHILL = 0.3; // tilt (sine of the angle) that starts the stream
const DOWNHILL_EVERY = 3; // seconds between downhill gliders while tipped
const SHAKE_OFFSET = 0.25; // of the short side, toward the shake

// Targets that keep their own click behaviour
const INTERACTIVE =
    'a,button,input,textarea,select,label,[role="dialog"],.lightbox';
// Painting starts only on the empty page around these, so text stays selectable
const CONTENT = "main,aside,footer";

// Classic patterns, as [col, row] offsets
const GLIDER = [
    [1, 0],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
]; // travels +col, +row
const R_PENTOMINO = [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [1, 2],
];
const LWSS = [
    [1, 0],
    [4, 0],
    [0, 1],
    [0, 2],
    [4, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
]; // travels -col
// Lands a lightweight spaceship clear of the four diagonal gliders
const LWSS_GAP = 12;
// Launched ships fly through calm air: random flips are vetoed around each
// ship's predicted position for a while, so the burst stays legible
const CALM_GENS = 48;
const CALM_RADIUS = 3.5; // cells

type Ring = { x: number; y: number; t0: number };
// A ship's centre at launch and velocity, in cells and cells per generation
type Lane = { c: number; r: number; vc: number; vr: number; g0: number };

export function DotCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");

        if (!canvas || !ctx) return;

        let width = 0;
        let height = 0;
        let cols = 0;
        let rows = 0;
        let baseColor = "rgba(255, 255, 255, 0.06)";
        let activeColor = "rgba(255, 255, 255, 0.26)";
        let bgColor = "#0d0d0d";
        // Desktop shrinks the whole page via `zoom`; phones don't, so the
        // live dots balloon. Trim their expansion back on small screens.
        let activeBoost = BOOST_RADIUS;
        let baseLayer: HTMLCanvasElement | null = null;
        let deviceScale = 1;
        // Client px -> canvas CSS px. Under root `zoom` the two differ, so
        // measure rather than assume.
        let pointerScale = 1;
        let lastMs = 0;
        let lastColorRead = 0;
        let raf = 0;

        let life = new BitLife(1, 1);
        let brightness = new Float32Array(0);
        let lastTick = 0;
        let lastReseed = 0;
        let generation = 0;

        // Pointer state, in canvas CSS px
        let px = 0;
        let py = 0;
        let easedX = 0;
        let easedY = 0;
        // Recent pointer samples, for the throw velocity at click time
        const trail: { x: number; y: number; t: number }[] = [];
        let lastMoveAt = -Infinity;
        let pushFrom = -Infinity; // a click pauses the plough until the next move
        let lastPushC = NaN;
        let lastPushR = NaN;
        let lift = 0;
        let hovering = false;

        // Press state for taps and painting
        let pressId = -1;
        let pressX = 0;
        let pressY = 0;
        let pressVx = 0;
        let pressVy = 0;
        let pressFast = false;
        let dragged = false;
        let painting = false;
        let paintC = 0;
        let paintR = 0;
        let lastPaintMs = 0;
        let lastPointerType = "";

        const rings: Ring[] = [];
        let lanes: Lane[] = [];

        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const finePointer = window.matchMedia(
            "(hover: hover) and (pointer: fine)",
        );
        const motion = tiltSupported() ? tilt : null;
        let leanX = 0;
        let leanY = 0;
        let lastDownhill = 0;

        const readColors = () => {
            const styles = getComputedStyle(document.documentElement);
            const nextBase =
                styles.getPropertyValue("--dot-base").trim() || baseColor;

            activeColor =
                styles.getPropertyValue("--dot-active").trim() || activeColor;
            bgColor = styles.getPropertyValue("--bg").trim() || bgColor;

            if (nextBase !== baseColor) {
                baseColor = nextBase;
                renderBaseLayer();
            }

            if (reduceMotion) drawGrid(brightness);
        };

        // The base grid never moves, so draw it once per resize/theme and
        // blit it each frame instead of re-tracing ~3k arcs
        const renderBaseLayer = () => {
            const layer = document.createElement("canvas");

            layer.width = canvas.width;
            layer.height = canvas.height;

            const layerCtx = layer.getContext("2d");

            if (!layerCtx) {
                baseLayer = null;

                return;
            }

            layerCtx.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
            layerCtx.fillStyle = baseColor;

            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    layerCtx.beginPath();
                    layerCtx.arc(
                        c * SPACING + SPACING / 2,
                        r * SPACING + SPACING / 2,
                        BASE_RADIUS,
                        0,
                        Math.PI * 2,
                    );
                    layerCtx.fill();
                }
            }

            baseLayer = layer;
        };

        const setWrapped = (c: number, r: number, alive = 1) =>
            life.set(
                ((c % cols) + cols) % cols,
                ((r % rows) + rows) % rows,
                alive,
            );

        // Stamp with mirroring (sc, sr) and optional transpose. A glider
        // mirrored by (sc, sr) travels toward (sc, sr); see GLIDER / LWSS.
        const stampAt = (
            pattern: number[][],
            c0: number,
            r0: number,
            sc: number,
            sr: number,
            swap: boolean,
        ) => {
            for (const [pc, pr] of pattern) {
                setWrapped(
                    c0 + sc * (swap ? pr : pc),
                    r0 + sr * (swap ? pc : pr),
                );
            }
        };

        // A heading of (sc, sr) aims a glider that way
        const stampPattern = (pattern: number[][], heading?: number[]) => {
            const c0 = 2 + Math.floor(Math.random() * Math.max(cols - 6, 1));
            const r0 = 2 + Math.floor(Math.random() * Math.max(rows - 6, 1));
            const flipC = heading?.[0] ?? (Math.random() < 0.5 ? -1 : 1);
            const flipR = heading?.[1] ?? (Math.random() < 0.5 ? -1 : 1);

            stampAt(pattern, c0, r0, flipC, flipR, Math.random() < 0.5);
        };

        const stampSoup = () => {
            const cc = Math.floor(Math.random() * cols);
            const cr = Math.floor(Math.random() * rows);
            const radius = 3 + Math.floor(Math.random() * 3);

            for (let dc = -radius; dc <= radius; dc++) {
                for (let dr = -radius; dr <= radius; dr++) {
                    if (dc * dc + dr * dr > radius * radius) continue;
                    if (Math.random() < 0.35) setWrapped(cc + dc, cr + dr);
                }
            }
        };

        // The diagonal closest to downhill, while the phone is tipped
        const downhill = () => {
            if (!motion || Math.hypot(motion.gx, motion.gy) < DOWNHILL) {
                return undefined;
            }

            return [Math.sign(motion.gx) || 1, Math.sign(motion.gy) || 1];
        };

        const inject = () => {
            const roll = Math.random();

            if (roll < 0.45) stampPattern(GLIDER, downhill());
            else if (roll < 0.7) stampPattern(R_PENTOMINO);
            else stampSoup();
        };

        const seed = () => {
            life.clear();
            for (let i = 0; i < 3; i++) stampSoup();
            stampPattern(GLIDER);
            stampPattern(R_PENTOMINO);
        };

        // Reduced motion gets one frozen frame of a lived-in board instead
        // of an empty grid
        const settleStatic = () => {
            const reseedGens = Math.round(RESEED_EVERY / TICK_S);

            for (let g = 1; g <= STATIC_GENERATIONS; g++) {
                life.step(EPSILON);
                if (g % reseedGens === 0) inject();
            }

            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    brightness[c * rows + r] = life.get(c, r);
                }
            }
        };

        const resize = () => {
            // Scale the backing store by devicePixelRatio and root zoom to stay crisp
            const zoom =
                Number(getComputedStyle(document.documentElement).zoom) || 1;
            const scale = (window.devicePixelRatio || 1) * zoom;

            activeBoost = window.matchMedia("(max-width: 640px)").matches
                ? 1.5
                : BOOST_RADIUS;

            width = canvas.clientWidth;
            height = canvas.clientHeight;
            deviceScale = scale;
            canvas.width = Math.round(width * scale);
            canvas.height = Math.round(height * scale);
            ctx.setTransform(scale, 0, 0, scale, 0, 0);

            // The canvas fills the viewport and clientX is in viewport px,
            // so undo the root zoom. Not measured from getBoundingClientRect,
            // which older Safari reports without the zoom applied.
            pointerScale = 1 / zoom;

            cols = Math.ceil(width / SPACING);
            rows = Math.ceil(height / SPACING);

            life = new BitLife(cols, rows);
            brightness = new Float32Array(cols * rows);
            seed();
            renderBaseLayer();

            if (reduceMotion) {
                settleStatic();
                drawGrid(brightness);
            }
        };

        const drawDot = (x: number, y: number, radius: number) => {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        };

        // Calls `visit` for every grid dot within `reach` of (x, y), so the
        // effects cost their footprint, not the whole grid
        const forDotsNear = (
            x: number,
            y: number,
            reach: number,
            visit: (dx: number, dy: number, d: number) => void,
        ) => {
            const c0 = Math.max(0, Math.floor((x - reach) / SPACING));
            const c1 = Math.min(cols - 1, Math.floor((x + reach) / SPACING));
            const r0 = Math.max(0, Math.floor((y - reach) / SPACING));
            const r1 = Math.min(rows - 1, Math.floor((y + reach) / SPACING));

            for (let c = c0; c <= c1; c++) {
                for (let r = r0; r <= r1; r++) {
                    const dx = c * SPACING + SPACING / 2;
                    const dy = r * SPACING + SPACING / 2;
                    const d = Math.hypot(dx - x, dy - y);

                    if (d <= reach) visit(dx, dy, d);
                }
            }
        };

        const drawEffects = (t: number) => {
            ctx.fillStyle = activeColor;

            if (lift > 0.01) {
                forDotsNear(easedX, easedY, LIFT_RADIUS, (x, y, d) => {
                    const f = (1 - d / LIFT_RADIUS) ** 1.5 * lift;

                    ctx.globalAlpha = LIFT_ALPHA * f;
                    drawDot(x, y, BASE_RADIUS + LIFT_GROW * f);
                });
            }

            for (let i = rings.length - 1; i >= 0; i--) {
                const p = (t - rings[i].t0) / RING_S;

                if (p >= 1) {
                    rings.splice(i, 1);
                    continue;
                }

                // Ease out: fast launch, slowing as it spreads and fades
                const front = RING_REACH * (1 - (1 - p) ** 2);
                const fade = 1 - p;
                const lead = RING_WAVELENGTH / 4;

                forDotsNear(rings[i].x, rings[i].y, front + lead, (x, y, d) => {
                    // Distance behind the front; the wave hasn't reached
                    // dots ahead of it, apart from a short rise
                    const u = front - d;
                    const rise = u >= 0 ? 1 : Math.max(0, 1 + u / lead) ** 2;
                    // Spreading thins the wave, like a real ripple
                    const spread = 1 / (1 + d / (10 * SPACING));
                    const a =
                        Math.cos(
                            (2 * Math.PI * Math.max(u, 0)) / RING_WAVELENGTH,
                        ) *
                        Math.exp(-Math.max(u, 0) / RING_TRAIL) *
                        rise *
                        spread *
                        fade;

                    if (Math.abs(a) < 0.02) return;

                    if (a > 0) {
                        ctx.fillStyle = activeColor;
                        ctx.globalAlpha = Math.min(1, a * 2.5);
                        drawDot(x, y, BASE_RADIUS + RING_GROW * a);

                        return;
                    }

                    // Trough: hide the base dot, then draw it smaller
                    ctx.globalAlpha = 1;
                    ctx.fillStyle = bgColor;
                    drawDot(x, y, BASE_RADIUS + 0.5);
                    ctx.fillStyle = baseColor;
                    drawDot(x, y, BASE_RADIUS * (1 + RING_SHRINK * a));
                });
            }

            ctx.globalAlpha = 1;
        };

        const drawGrid = (levels: Float32Array | null, t = 0) => {
            ctx.clearRect(0, 0, width, height);

            if (baseLayer) {
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.drawImage(baseLayer, 0, 0);
                ctx.restore();
            }

            // Under the live dots, so a live cell's cover hides its lift
            if (!reduceMotion) drawEffects(t);

            if (!levels) return;

            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    const level = levels[c * rows + r];

                    if (level <= 0.03) continue;

                    const x = c * SPACING + SPACING / 2;
                    const y = r * SPACING + SPACING / 2;

                    // Cover the static base dot as the active dot fades in
                    ctx.globalAlpha = Math.min(1, level * 2);
                    ctx.fillStyle = bgColor;
                    drawDot(x, y, BASE_RADIUS + 0.5);

                    // Brighter dots hang further off their point on a tilt
                    const hang = Math.min(level, 1);

                    ctx.globalAlpha = Math.min(level, 1);
                    ctx.fillStyle = activeColor;
                    drawDot(
                        x + leanX * hang,
                        y + leanY * hang,
                        BASE_RADIUS + activeBoost * Math.min(level, 1.4),
                    );
                }
            }

            ctx.globalAlpha = 1;
        };

        // 1 while the pointer is moving, easing to 0 shortly after it stops
        const wake = (t: number, since: number) => {
            const idle = t - Math.max(lastMoveAt, since) - WAKE_HOLD_S;

            if (idle <= 0) return 1;

            const k = Math.max(0, 1 - idle / WAKE_FADE_S);

            return k * k * (3 - 2 * k);
        };

        // Move every live cell within `radius` of (x, y) out to just past
        // it, along the line from the centre, carrying its glow with it.
        // Cells landing on each other merge, so the shove destroys as well
        // as displaces. Cells on a glider's calm lane are left alone.
        const shove = (x: number, y: number, radius: number) => {
            // Dots sit at cell centres
            const fc = x / SPACING - 0.5;
            const fr = y / SPACING - 0.5;
            const reach = Math.ceil(radius);
            const c0 = Math.round(fc);
            const r0 = Math.round(fr);
            const moved: [number, number, number][] = [];

            for (let dc = -reach; dc <= reach; dc++) {
                for (let dr = -reach; dr <= reach; dr++) {
                    const c = (((c0 + dc) % cols) + cols) % cols;
                    const r = (((r0 + dr) % rows) + rows) % rows;
                    const ox = c0 + dc - fc;
                    const oy = r0 + dr - fr;
                    const d = Math.hypot(ox, oy);

                    if (d > radius || !life.get(c, r)) continue;
                    if (!isCalm(c0 + dc, r0 + dr)) continue;

                    const i = c * rows + r;
                    const angle =
                        d > 0.01
                            ? Math.atan2(oy, ox)
                            : Math.random() * Math.PI * 2;
                    const to = radius + 0.5 + Math.random() * PUSH_SCATTER;

                    life.set(c, r, 0);
                    moved.push([
                        Math.round(fc + Math.cos(angle) * to),
                        Math.round(fr + Math.sin(angle) * to),
                        brightness[i],
                    ]);
                    brightness[i] = 0;
                }
            }

            for (const [c, r, glow] of moved) {
                if (!isCalm(c, r)) continue;

                const wc = ((c % cols) + cols) % cols;
                const wr = ((r % rows) + rows) % rows;
                const i = wc * rows + wr;

                life.set(wc, wr, 1);
                brightness[i] = Math.max(brightness[i], glow);
            }
        };

        // Plough along the pointer's path, once per cell it enters
        const plough = (t: number) => {
            if (!hovering || t < pushFrom) return;

            const c = Math.floor(px / SPACING);
            const r = Math.floor(py / SPACING);

            if (c === lastPushC && r === lastPushR) return;

            lastPushC = c;
            lastPushR = r;
            shove(px, py, PUSH_RADIUS);
        };

        // Shortest toroidal offset along one axis
        const wrapDelta = (d: number, size: number) =>
            d - size * Math.round(d / size);

        const isCalm = (c: number, r: number) => {
            for (const lane of lanes) {
                const g = generation - lane.g0;
                const dc = wrapDelta(c - lane.c - lane.vc * g, cols);
                const dr = wrapDelta(r - lane.r - lane.vr * g, rows);

                if (dc * dc + dr * dr <= CALM_RADIUS * CALM_RADIUS) {
                    return false;
                }
            }

            return true;
        };

        const drawLife = (t: number, dt: number) => {
            if (t - lastTick >= TICK_S) {
                lanes = lanes.filter((l) => generation - l.g0 < CALM_GENS);
                life.step(
                    EPSILON,
                    Math.random,
                    lanes.length ? isCalm : undefined,
                );
                generation++;
                lastTick = t;
            }

            if (
                t - lastReseed >= RESEED_EVERY ||
                life.population() < cols * rows * MIN_POP_FRAC
            ) {
                inject();
                lastReseed = t;
            }

            plough(t);

            if (motion) {
                const heading = downhill();

                if (heading && t - lastDownhill >= DOWNHILL_EVERY) {
                    stampPattern(GLIDER, heading);
                    lastDownhill = t;
                }

                const [lx, ly] = motion.lean(dt);

                leanX = lx * MAX_LEAN;
                leanY = ly * MAX_LEAN;
            }

            const fadeIn = Math.min(1, FADE_IN_RATE * dt);
            const fadeOut = Math.min(1, FADE_OUT_RATE * dt);

            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    const i = c * rows + r;
                    const target = life.get(c, r);

                    brightness[i] +=
                        (target - brightness[i]) * (target ? fadeIn : fadeOut);
                }
            }

            // Ease the lift toward the pointer and in/out with the wake
            const ease = Math.min(1, POINTER_EASE * dt);
            const liftTarget = hovering ? wake(t, -Infinity) : 0;

            if (lift <= 0.01) {
                easedX = px;
                easedY = py;
            } else {
                easedX += (px - easedX) * ease;
                easedY += (py - easedY) * ease;
            }

            lift += (liftTarget - lift) * Math.min(1, 6 * dt);

            drawGrid(brightness, t);
        };

        const draw = (nowMs: number) => {
            const t = nowMs / 1000;
            const dt = lastMs ? Math.min((nowMs - lastMs) / 1000, 0.1) : 0;

            lastMs = nowMs;

            // Guard against any missed layout change
            if (
                canvas.clientWidth !== width ||
                canvas.clientHeight !== height
            ) {
                resize();
            }

            // Re-read theme colors so CSS variable changes apply without a reload
            if (t - lastColorRead >= 1) {
                readColors();
                lastColorRead = t;
            }

            drawLife(t, dt);

            raf = requestAnimationFrame(draw);
        };

        // Interaction

        const now = () => performance.now() / 1000;

        const toCanvas = (e: PointerEvent): [number, number] => [
            e.clientX * pointerScale,
            e.clientY * pointerScale,
        ];

        const isInteractive = (target: EventTarget | null) =>
            !(target instanceof Element) || !!target.closest(INTERACTIVE);

        // Ships are stamped after the blast, but their lanes are claimed
        // first so the blast leaves their paths clear
        let stamps: (() => void)[] = [];

        // A glider mirrored by (sc, sr) flies toward (sc, sr) at c/4
        const launchGlider = (
            c0: number,
            r0: number,
            sc: number,
            sr: number,
        ) => {
            stamps.push(() => stampAt(GLIDER, c0, r0, sc, sr, false));
            lanes.push({
                c: c0 + sc,
                r: r0 + sr,
                vc: sc / 4,
                vr: sr / 4,
                g0: generation,
            });
        };

        // Four gliders out along the diagonals, plus a ship along the
        // pointer's heading if it was flung in
        const burst = (x: number, y: number, vxAt: number, vyAt: number) => {
            const cc = Math.floor(x / SPACING);
            const cr = Math.floor(y / SPACING);

            stamps = [];
            for (const sc of [-1, 1]) {
                for (const sr of [-1, 1]) {
                    launchGlider(
                        cc + sc * BURST_GAP,
                        cr + sr * BURST_GAP,
                        sc,
                        sr,
                    );
                }
            }

            if (Math.hypot(vxAt, vyAt) >= FAST_SPEED) {
                launchShip(cc, cr, vxAt, vyAt);
            }

            blast(cc, cr);
            for (const stamp of stamps) stamp();
        };

        // Shove everything near the click outward, then wipe what's left
        // on the ships' lanes so they launch onto an empty board
        const blast = (cc: number, cr: number) => {
            shove((cc + 0.5) * SPACING, (cr + 0.5) * SPACING, BURST_CLEAR);

            for (let dc = -BURST_CLEAR; dc <= BURST_CLEAR; dc++) {
                for (let dr = -BURST_CLEAR; dr <= BURST_CLEAR; dr++) {
                    if (dc * dc + dr * dr <= BURST_CLEAR * BURST_CLEAR) {
                        setWrapped(cc + dc, cr + dr, 0);
                    }
                }
            }
        };

        // A fifth ship along the pointer's heading when it was flung in
        const launchShip = (
            cc: number,
            cr: number,
            vxAt: number,
            vyAt: number,
        ) => {
            // Gliders only fly diagonally and the LWSS only orthogonally;
            // pick whichever heading is closest to the throw
            const angle = Math.atan2(vyAt, vxAt);
            const octant = Math.round(angle / (Math.PI / 4));
            const hc = Math.round(Math.cos((octant * Math.PI) / 4));
            const hr = Math.round(Math.sin((octant * Math.PI) / 4));

            if (hc && hr) {
                launchGlider(
                    cc + hc * (BURST_GAP + 6),
                    cr + hr * (BURST_GAP + 6),
                    hc,
                    hr,
                );
            } else if (hc) {
                const c0 = cc + hc * LWSS_GAP;

                stamps.push(() => stampAt(LWSS, c0, cr - 2, -hc, 1, false));
                lanes.push({
                    c: c0 - hc * 2,
                    r: cr - 0.5,
                    vc: hc / 2,
                    vr: 0,
                    g0: generation,
                });
            } else {
                const r0 = cr + hr * LWSS_GAP;

                stamps.push(() => stampAt(LWSS, cc - 2, r0, 1, -hr, true));
                lanes.push({
                    c: cc - 0.5,
                    r: r0 - hr * 2,
                    vc: 0,
                    vr: hr / 2,
                    g0: generation,
                });
            }
        };

        const fire = (x: number, y: number, vxAt: number, vyAt: number) => {
            rings.push({ x, y, t0: now() });
            if (rings.length > MAX_RINGS) rings.shift();
            burst(x, y, vxAt, vyAt);
            pushFrom = Infinity; // don't plough into the gliders at launch
        };

        // Bresenham between samples so a fast drag leaves no gaps
        const paintTo = (c1: number, r1: number) => {
            let c = paintC;
            let r = paintR;
            const dc = Math.abs(c1 - c);
            const dr = -Math.abs(r1 - r);
            const stepC = c < c1 ? 1 : -1;
            const stepR = r < r1 ? 1 : -1;
            let err = dc + dr;

            for (;;) {
                setWrapped(c, r);
                if (c === c1 && r === r1) break;

                const e2 = 2 * err;

                if (e2 >= dr) {
                    err += dr;
                    c += stepC;
                }
                if (e2 <= dc) {
                    err += dc;
                    r += stepR;
                }
            }

            paintC = c1;
            paintR = r1;
        };

        const onPointerMove = (e: PointerEvent) => {
            const [x, y] = toCanvas(e);
            const t = now();

            if (e.pointerType === "mouse" && finePointer.matches) {
                trail.push({ x, y, t });
                if (trail.length > 16) trail.shift();

                hovering = true;
                lastMoveAt = t;
                if (pushFrom === Infinity) pushFrom = t;
            }

            px = x;
            py = y;

            if (e.pointerId !== pressId) return;

            if (Math.hypot(x - pressX, y - pressY) > TAP_SLOP) dragged = true;

            if (painting && e.timeStamp - lastPaintMs >= PAINT_EVERY_MS) {
                lastPaintMs = e.timeStamp;
                paintTo(Math.floor(x / SPACING), Math.floor(y / SPACING));
            }
        };

        const onPointerDown = (e: PointerEvent) => {
            lastPointerType = e.pointerType;

            if (e.pointerType !== "mouse" || !finePointer.matches) return;
            if (!e.isPrimary || e.button !== 0) return;
            if (isInteractive(e.target)) return;

            const [x, y] = toCanvas(e);
            const t = now();
            // Oldest sample inside the window; moves are often coalesced
            // per frame, so measure across the window, not between events
            const from = trail.find((s) => t - s.t <= FAST_WINDOW_S);
            const span = from ? t - from.t : 0;

            pressId = e.pointerId;
            pressX = x;
            pressY = y;
            pressVx = from && span > 0.01 ? (x - from.x) / span : 0;
            pressVy = from && span > 0.01 ? (y - from.y) / span : 0;
            pressFast = Math.hypot(pressVx, pressVy) >= FAST_SPEED;
            dragged = false;
            painting =
                e.pointerType === "mouse" &&
                !(e.target as Element).closest(CONTENT);

            if (painting) {
                paintC = Math.floor(x / SPACING);
                paintR = Math.floor(y / SPACING);
                lastPaintMs = e.timeStamp;
                setWrapped(paintC, paintR);
            }
        };

        const endPress = () => {
            pressId = -1;
            painting = false;
        };

        const onPointerUp = (e: PointerEvent) => {
            if (e.pointerId !== pressId) return;

            if (painting) {
                const [x, y] = toCanvas(e);

                paintTo(Math.floor(x / SPACING), Math.floor(y / SPACING));
            }

            const wasTap = !dragged;
            const selecting = !!window.getSelection()?.toString();

            endPress();

            // A drag painted (or selected); only a clean tap fires
            if (!wasTap || selecting) return;

            fire(
                pressX,
                pressY,
                pressFast ? pressVx : 0,
                pressFast ? pressVy : 0,
            );
        };

        // Stop the browser from starting a text selection when a paint
        // stroke begins on the empty margin and crosses into the copy
        const onMouseDown = (e: MouseEvent) => {
            // Touch emits compatibility mouse events; never block those
            if (lastPointerType !== "mouse") return;
            if (e.button !== 0 || isInteractive(e.target)) return;
            if ((e.target as Element).closest(CONTENT)) return;

            e.preventDefault();
            window.getSelection()?.removeAllRanges();
        };

        const onPointerLeave = () => {
            // Pointer left the window: let the lift fade and the heat stop
            hovering = false;
        };

        // Ripple from the side the phone was flung toward, and send a ship
        // on that way
        const onShake = (dx: number, dy: number) => {
            const reach = SHAKE_OFFSET * Math.min(width, height);

            fire(
                width / 2 + dx * reach,
                height / 2 + dy * reach,
                dx * FAST_SPEED,
                dy * FAST_SPEED,
            );
        };

        const onVisibility = () => {
            cancelAnimationFrame(raf);

            if (document.visibilityState === "visible") {
                lastMs = 0;
                raf = requestAnimationFrame(draw);
            }
        };

        readColors();
        resize();

        const listeners: [string, EventListener, AddEventListenerOptions][] =
            [];
        const listen = <K extends keyof WindowEventMap>(
            type: K,
            handler: (e: WindowEventMap[K]) => void,
            options: AddEventListenerOptions = { passive: true },
        ) => {
            window.addEventListener(type, handler as EventListener, options);
            listeners.push([type, handler as EventListener, options]);
        };

        const releaseTilt = motion?.acquire();
        const offShake = motion?.onShake(onShake);

        if (!reduceMotion) {
            raf = requestAnimationFrame(draw);

            listen("pointermove", onPointerMove);
            listen("pointerdown", onPointerDown);
            listen("pointerup", onPointerUp);
            listen("pointercancel", endPress); // e.g. a touch became a scroll
            listen("blur", endPress);
            listen("mousedown", onMouseDown, { passive: false });
            document.documentElement.addEventListener(
                "pointerleave",
                onPointerLeave,
            );
            document.addEventListener("visibilitychange", onVisibility);
        }

        const observer = new MutationObserver(readColors);

        observer.observe(document.documentElement, {
            attributes: true,
            // The palette fades after a switch; re-read once it settles
            attributeFilter: ["data-theme", "data-theme-fading"],
        });
        window.addEventListener("resize", resize);

        const resizeObserver = new ResizeObserver(resize);

        resizeObserver.observe(canvas);

        return () => {
            cancelAnimationFrame(raf);
            offShake?.();
            releaseTilt?.();
            observer.disconnect();
            resizeObserver.disconnect();
            window.removeEventListener("resize", resize);

            for (const [type, handler, options] of listeners) {
                window.removeEventListener(type, handler, options);
            }

            document.documentElement.removeEventListener(
                "pointerleave",
                onPointerLeave,
            );
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10 size-full"
            />
            <TiltReadout />
        </>
    );
}
