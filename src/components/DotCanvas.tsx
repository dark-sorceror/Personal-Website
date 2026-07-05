"use client";

import { useEffect, useRef } from "react";

import { BitLife } from "../lib/life";

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

// Classic patterns, as [col, row] offsets
const GLIDER = [
    [1, 0],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
];
const R_PENTOMINO = [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [1, 2],
];

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
        let lastMs = 0;
        let lastColorRead = 0;
        let raf = 0;

        let life = new BitLife(1, 1);
        let brightness = new Float32Array(0);
        let lastTick = 0;
        let lastReseed = 0;

        const readColors = () => {
            const styles = getComputedStyle(document.documentElement);

            baseColor =
                styles.getPropertyValue("--dot-base").trim() || baseColor;
            activeColor =
                styles.getPropertyValue("--dot-active").trim() || activeColor;
        };

        const setWrapped = (c: number, r: number) =>
            life.set(((c % cols) + cols) % cols, ((r % rows) + rows) % rows, 1);

        const stampPattern = (pattern: number[][]) => {
            const c0 = 2 + Math.floor(Math.random() * Math.max(cols - 6, 1));
            const r0 = 2 + Math.floor(Math.random() * Math.max(rows - 6, 1));
            const flipC = Math.random() < 0.5 ? -1 : 1;
            const flipR = Math.random() < 0.5 ? -1 : 1;
            const swap = Math.random() < 0.5;

            for (const [pc, pr] of pattern) {
                const a = flipC * (swap ? pr : pc);
                const b = flipR * (swap ? pc : pr);

                setWrapped(c0 + a, r0 + b);
            }
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

        const inject = () => {
            const roll = Math.random();

            if (roll < 0.45) stampPattern(GLIDER);
            else if (roll < 0.7) stampPattern(R_PENTOMINO);
            else stampSoup();
        };

        const seed = () => {
            life.clear();
            for (let i = 0; i < 3; i++) stampSoup();
            stampPattern(GLIDER);
            stampPattern(R_PENTOMINO);
        };

        const resize = () => {
            // Scale the backing store by devicePixelRatio and root zoom to stay crisp
            const zoom =
                Number(getComputedStyle(document.documentElement).zoom) || 1;
            const scale = (window.devicePixelRatio || 1) * zoom;

            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = Math.round(width * scale);
            canvas.height = Math.round(height * scale);
            ctx.setTransform(scale, 0, 0, scale, 0, 0);

            cols = Math.ceil(width / SPACING);
            rows = Math.ceil(height / SPACING);

            life = new BitLife(cols, rows);
            brightness = new Float32Array(cols * rows);
            seed();
        };

        const drawDot = (x: number, y: number, radius: number) => {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawGrid = (levels: Float32Array | null) => {
            ctx.clearRect(0, 0, width, height);

            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    const x = c * SPACING + SPACING / 2;
                    const y = r * SPACING + SPACING / 2;
                    const level = levels ? levels[c * rows + r] : 0;

                    // Crossfade the base dot out as the active dot fades in
                    const baseFade = Math.max(0, 1 - level * 2);

                    if (baseFade > 0.02) {
                        ctx.globalAlpha = baseFade;
                        ctx.fillStyle = baseColor;
                        drawDot(x, y, BASE_RADIUS);
                    }

                    if (level > 0.03) {
                        ctx.globalAlpha = Math.min(level, 1);
                        ctx.fillStyle = activeColor;
                        drawDot(
                            x,
                            y,
                            BASE_RADIUS + BOOST_RADIUS * Math.min(level, 1.4),
                        );
                    }
                }
            }

            ctx.globalAlpha = 1;
        };

        const drawLife = (t: number, dt: number) => {
            if (t - lastTick >= TICK_S) {
                life.step(EPSILON);
                lastTick = t;
            }

            if (
                t - lastReseed >= RESEED_EVERY ||
                life.population() < cols * rows * MIN_POP_FRAC
            ) {
                inject();
                lastReseed = t;
            }

            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    const i = c * rows + r;
                    const target = life.get(c, r);
                    const rate = target ? FADE_IN_RATE : FADE_OUT_RATE;

                    brightness[i] +=
                        (target - brightness[i]) * Math.min(1, rate * dt);
                }
            }

            drawGrid(brightness);
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

        readColors();
        resize();

        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        if (reduceMotion) {
            drawGrid(null);
        } else {
            raf = requestAnimationFrame(draw);
        }

        const observer = new MutationObserver(readColors);

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });
        window.addEventListener("resize", resize);

        const resizeObserver = new ResizeObserver(resize);

        resizeObserver.observe(canvas);

        return () => {
            cancelAnimationFrame(raf);
            observer.disconnect();
            resizeObserver.disconnect();
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 size-full"
        />
    );
}
