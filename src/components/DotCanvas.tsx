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

// A shake on phones fires a shockwave that blasts the cells around it
// outward, then a glider burst from the cleared centre. The wave is a
// ripple: a tall crest at
// the front with smaller crests and troughs trailing behind it, so dots
// swell well past their live size on the crests and shrink to pinpricks in
// the troughs
const RING_S = 1.3;
const RING_REACH = 13 * SPACING; // how far the front travels, CSS px
const RING_WAVELENGTH = 2.4 * SPACING;
const RING_TRAIL = 1.4 * RING_WAVELENGTH; // how fast the trailing ripples die
const RING_GROW = 7; // extra px of radius on the tallest crest
const RING_SHRINK = 0.8; // fraction of a base dot lost in the deepest trough
const MAX_RINGS = 4;
const BURST_GAP = 2; // cells between the centre and each glider
const BURST_CLEAR = 6; // cells blasted outward so the gliders launch clean
const BLAST_SCATTER = 1.5; // extra random cells a blasted cell may fly
const FAST_SPEED = 1400; // CSS px/s; a burst this fast also fires a ship

// Phones get the motion sensors: tilting leans the live dots
// downhill and steers new gliders that way, and a shake fires the ripple
const MAX_LEAN = 9; // CSS px a live dot hangs off its grid point
const DOWNHILL = 0.3; // tilt (sine of the angle) that starts the stream
const DOWNHILL_EVERY = 3; // seconds between downhill gliders while tipped
const SHAKE_OFFSET = 0.25; // of the short side, toward the shake

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
        let lastMs = 0;
        let lastColorRead = 0;
        let raf = 0;

        let life = new BitLife(1, 1);
        let brightness = new Float32Array(0);
        let lastTick = 0;
        let lastReseed = 0;
        let generation = 0;

        const rings: Ring[] = [];
        let lanes: Lane[] = [];

        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
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

            // Under the live dots, which cover the ripple where they sit
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
                    const to = radius + 0.5 + Math.random() * BLAST_SCATTER;

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
        // burst's heading if it was flung
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

        // Shove everything near the centre outward, then wipe what's left
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

        // A fifth ship along the burst's heading when it was flung
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

        const releaseTilt = motion?.acquire();
        const offShake = motion?.onShake(onShake);

        if (!reduceMotion) {
            raf = requestAnimationFrame(draw);
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
