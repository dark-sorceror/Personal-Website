"use client";

import { useEffect, useRef } from "react";

import { BitLife } from "@/lib/life";

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
        };

        const drawDot = (x: number, y: number, radius: number) => {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawGrid = (levels: Float32Array | null) => {
            ctx.clearRect(0, 0, width, height);

            if (baseLayer) {
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.drawImage(baseLayer, 0, 0);
                ctx.restore();
            }

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

                    ctx.globalAlpha = Math.min(level, 1);
                    ctx.fillStyle = activeColor;
                    drawDot(
                        x,
                        y,
                        BASE_RADIUS + activeBoost * Math.min(level, 1.4),
                    );
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
