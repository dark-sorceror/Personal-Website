"use client";

import { useEffect, useRef } from "react";
import { COMPACT_LAYOUT_QUERY } from "@/lib/viewport";
import {
    createSpaceField,
    GLYPHS,
    LOOP_SECONDS,
    PALETTES,
    TAU,
} from "./deepSpace";
import styles from "./deepSpace.module.css";

export function DeepSpaceCanvas() {
    const dustRef = useRef<HTMLCanvasElement>(null);
    const starsRef = useRef<HTMLCanvasElement>(null);
    const clock = useRef(0);

    useEffect(() => {
        const canvas = dustRef.current,
            starsCanvas = starsRef.current;
        const ctx = canvas?.getContext("2d"),
            starsCtx = starsCanvas?.getContext("2d");
        if (!canvas || !ctx || !starsCanvas || !starsCtx) return;
        const compact = matchMedia(COMPACT_LAYOUT_QUERY);
        const reduced = matchMedia("(prefers-reduced-motion: reduce)");
        let mode: keyof typeof PALETTES = "dark";
        let width = 0,
            height = 0,
            dpr = 1,
            frame = 0,
            previous = 0,
            painted = 0;
        let onScreen = true,
            clear = true,
            animated = false;
        let field: ReturnType<typeof createSpaceField>;
        let previousCells = new Uint32Array(0);
        let atlas: HTMLCanvasElement,
            tileWidth = 0,
            tileHeight = 0;

        const makeAtlas = () => {
            tileWidth = Math.ceil(field.cellWidth * dpr);
            tileHeight = Math.ceil(field.cellHeight * dpr);
            atlas = document.createElement("canvas");
            atlas.width = tileWidth * GLYPHS.length;
            atlas.height = tileHeight;
            const a = atlas.getContext("2d")!;
            a.font = `${Math.round(field.cellHeight * 1.03 * dpr)}px ui-monospace, "SFMono-Regular", Consolas, monospace`;
            a.textAlign = "center";
            a.textBaseline = "middle";
            a.fillStyle = PALETTES[mode].dust;
            for (let i = 1; i < GLYPHS.length; i++)
                a.fillText(GLYPHS[i], (i + 0.5) * tileWidth, tileHeight * 0.52);
        };

        const draw = () => {
            if (!width || !height) return;
            const phase = clock.current / LOOP_SECONDS;
            const sine = Math.sin(phase * TAU),
                cosine = Math.cos(phase * TAU);
            ctx.globalAlpha = 1;
            if (clear) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                previousCells.fill(0);
            }
            field.cells.forEach((cell, i) => {
                const light =
                    cell.base *
                    (0.9 + 0.1 * (cosine * cell.cosine - sine * cell.sine));
                const luminance =
                    mode === "dark"
                        ? light
                        : Math.max(0, (light - 0.08) / 0.92);
                const level =
                    luminance < (mode === "dark" ? 0.024 : 0.06)
                        ? 0
                        : Math.min(
                              GLYPHS.length - 1,
                              Math.floor(
                                  Math.pow(luminance, 0.72) *
                                      (GLYPHS.length - 1) +
                                      cell.grain * 0.7,
                              ),
                          );
                const alpha = level
                    ? Math.round(
                          255 *
                              (mode === "dark" ? 0.92 : 0.8) *
                              cell.opacity *
                              Math.min(
                                  1,
                                  mode === "dark"
                                      ? 0.23 + luminance * 1.7
                                      : 0.5 + luminance * 0.8,
                              ),
                      )
                    : 0;
                const key = alpha ? level | (alpha << 8) : 0;
                if (key === previousCells[i]) return;
                if (!clear)
                    ctx.clearRect(cell.x, cell.y, cell.width, cell.height);
                previousCells[i] = key;
                if (!key) return;
                ctx.globalAlpha = alpha / 255;
                ctx.drawImage(
                    atlas,
                    level * tileWidth,
                    0,
                    tileWidth,
                    tileHeight,
                    cell.x,
                    cell.y,
                    cell.width,
                    cell.height,
                );
            });
            clear = false;
            ctx.globalAlpha = 1;
            starsCtx.clearRect(0, 0, width, height);
            for (const star of field.stars) {
                // Keep stars anchored; only a small, slow change in light remains.
                const breathing =
                    0.85 + 0.15 * Math.sin(phase * TAU + star.seed * TAU);
                starsCtx.globalAlpha =
                    (star.big ? 0.78 : 0.19 + star.seed * 0.3) *
                    (mode === "dark" ? 0.88 : 0.8) *
                    breathing *
                    star.opacity;
                starsCtx.fillStyle =
                    star.seed > 0.7 ? PALETTES[mode].warm : PALETTES[mode].cool;
                starsCtx.fillText(
                    star.big ? "+" : star.seed > 0.77 ? "*" : ".",
                    star.x,
                    star.y,
                );
                if (star.big) {
                    starsCtx.globalAlpha *= 0.35;
                    starsCtx.fillText("-", star.x - field.cellWidth, star.y);
                    starsCtx.fillText("-", star.x + field.cellWidth, star.y);
                    starsCtx.fillText("|", star.x, star.y - field.cellHeight);
                    starsCtx.fillText("|", star.x, star.y + field.cellHeight);
                }
            }
            starsCtx.globalAlpha = 1;
            canvas.dataset.phase = phase.toFixed(5);
            canvas.dataset.ready = "true";
            canvas.dataset.palette = mode;
        };

        const resize = () => {
            const bounds = canvas.getBoundingClientRect();
            const nextDpr = Math.min(2, devicePixelRatio || 1);
            if (
                width === bounds.width &&
                height === bounds.height &&
                dpr === nextDpr
            )
                return;
            width = bounds.width;
            height = bounds.height;
            dpr = nextDpr;
            canvas.width = starsCanvas.width = Math.round(width * dpr);
            canvas.height = starsCanvas.height = Math.round(height * dpr);
            const reading = canvas
                .closest("[data-background-content]")
                ?.querySelector("main")
                ?.getBoundingClientRect();
            field = createSpaceField(
                width,
                height,
                dpr,
                compact.matches,
                reading,
            );
            previousCells = new Uint32Array(field.cells.length);
            starsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
            starsCtx.font = `${field.cellHeight}px ui-monospace, "SFMono-Regular", Consolas, monospace`;
            starsCtx.textAlign = "center";
            starsCtx.textBaseline = "middle";
            makeAtlas();
            clear = true;
            draw();
        };

        const tick = (now: number) => {
            frame = 0;
            if (!animated || document.hidden || !onScreen) return;
            const interval = 1000 / 18;
            if (now - painted >= interval) {
                if (previous)
                    clock.current =
                        (clock.current +
                            Math.min((now - previous) / 1000, 0.15)) %
                        LOOP_SECONDS;
                previous = now;
                painted = now - ((now - painted) % interval);
                draw();
            }
            frame = requestAnimationFrame(tick);
        };
        const visibility = () => {
            cancelAnimationFrame(frame);
            frame = 0;
            previous = 0;
            animated = !compact.matches && !reduced.matches;
            canvas.dataset.animated = String(animated);
            if (animated && !document.hidden && onScreen)
                frame = requestAnimationFrame(tick);
        };
        const mediaChange = () => {
            // A pointer/media change can keep the same bounds but change the grid.
            width = 0;
            resize();
            visibility();
        };
        const theme = () => {
            mode =
                document.documentElement.dataset.theme === "light"
                    ? "light"
                    : "dark";
            if (field) {
                makeAtlas();
                clear = true;
                draw();
            }
        };
        theme();
        resize();
        visibility();
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        const intersection = new IntersectionObserver(([entry]) => {
            onScreen = entry.isIntersecting;
            visibility();
        });
        intersection.observe(canvas);
        const mutation = new MutationObserver(theme);
        mutation.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });
        compact.addEventListener("change", mediaChange);
        reduced.addEventListener("change", visibility);
        window.addEventListener("resize", resize);
        document.addEventListener("visibilitychange", visibility);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            intersection.disconnect();
            mutation.disconnect();
            compact.removeEventListener("change", mediaChange);
            reduced.removeEventListener("change", visibility);
            window.removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", visibility);
        };
    }, []);

    return (
        <>
            <canvas
                ref={dustRef}
                className={styles.canvas}
                aria-hidden="true"
                data-space-layer="dust"
                data-scene="stars"
            />
            <canvas
                ref={starsRef}
                className={styles.canvas}
                aria-hidden="true"
                data-space-layer="stars"
            />
        </>
    );
}
