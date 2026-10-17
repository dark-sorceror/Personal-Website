"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./LumenDemo.module.css";

// A replay of the live experiment in Lumen's log: a real Claude Code
// session read off the lumen-cache mod's pane. Each request's context is
// split into what came from cache (held) and what the model had to process
// again. The figures are the log's own; nothing here is estimated.
type Step = {
    prompt: string;
    held: number;
    reprocessed: number;
    reused: number;
    // Cached prefix the request failed to reuse, drawn as it collapses
    lost?: number;
};

const STEPS: Step[] = [
    { prompt: "read a file", held: 47_300, reprocessed: 6_007, reused: 89 },
    { prompt: "2 follow-ups", held: 53_300, reprocessed: 971, reused: 98 },
    {
        prompt: "/compact",
        held: 27_300,
        reprocessed: 12_300,
        reused: 69,
        lost: 26_971,
    },
];

// Every bar shares one scale, a little over the largest window
const SCALE = 56_000;

// The timeline, in ms. Each request types its prompt, then its bar fills;
// the third first shows the cache it had, then loses most of it.
const STARTS = [300, 2300, 4600];
const TYPE_MS = 450;
const FILL_MS = 650;
const COLLAPSE_MS = 900;
const FADE_AT = 11_200;
const LOOP_MS = 11_800;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const ease = (t: number) => 1 - (1 - t) ** 3;
const pct = (n: number) => `${(n / SCALE) * 100}%`;
const fmt = (n: number) =>
    n >= 10_000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString("en-US");

export function LumenDemo({ onOpenGallery }: { onOpenGallery: () => void }) {
    const [t, setT] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const clock = useRef({ t: 0, visible: false, paused: false, still: false });

    // One clock drives the replay. It only runs while the card is on screen
    // and nobody is hovering or focused in it; reduced motion parks it on
    // the final frame.
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const c = clock.current;
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
            c.still = true;
            const frame = requestAnimationFrame(() => setT(FADE_AT - 1));
            return () => cancelAnimationFrame(frame);
        }

        let frame = 0;
        let last = 0;
        const tick = (now: number) => {
            if (last && c.visible && !c.paused) {
                c.t = (c.t + now - last) % LOOP_MS;
                setT(c.t);
            }
            last = now;
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);

        const observer = new IntersectionObserver(
            ([entry]) => {
                c.visible = entry.isIntersecting;
            },
            { threshold: 0.5 },
        );
        observer.observe(el);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, []);

    const pause = (paused: boolean) => {
        clock.current.paused = paused;
    };

    const replay = () => {
        if (clock.current.still) return;
        clock.current.t = 0;
        setT(0);
    };

    // Where the replay is: how many requests have landed, and how far the
    // compaction has got
    const shown = STARTS.filter((s) => t >= s).length;
    const filled = (i: number) =>
        ease(clamp((t - STARTS[i] - TYPE_MS) / FILL_MS));
    const collapse = clamp((t - STARTS[2] - TYPE_MS) / COLLAPSE_MS);
    const landed = STARTS.filter((s) => t >= s + TYPE_MS).length;
    const current = landed ? STEPS[landed - 1] : null;
    const collapsed = landed === 3 && collapse > 0.35;
    const fade = 1 - clamp((t - FADE_AT) / (LOOP_MS - FADE_AT - 100));

    return (
        <div
            ref={ref}
            className={styles.demo}
            onPointerEnter={(e) => e.pointerType === "mouse" && pause(true)}
            onPointerLeave={() => pause(false)}
            onFocus={() => pause(true)}
            onBlur={() => pause(false)}
        >
            <div className={styles.inner}>
                <div className={styles.header}>
                    <span className={styles.caption}>
                        Real Claude Code session
                    </span>
                    <span className={styles.controls}>
                        <button
                            type="button"
                            className={styles.chip}
                            onClick={replay}
                            aria-label="Replay the session"
                        >
                            Replay
                        </button>
                        <button
                            type="button"
                            className={styles.chip}
                            onClick={onOpenGallery}
                            aria-label="View Lumen diagrams"
                        >
                            Diagrams
                        </button>
                    </span>
                </div>

                <p className={styles.srOnly}>
                    A real Claude Code session measured by Lumen&apos;s
                    lumen-cache mod. After reading a file, 89% of the context
                    came from cache and 6,007 tokens were processed again. Two
                    follow-up messages pushed reuse to 98%, with only 971 tokens
                    processed again. Then one /compact command destroyed 26,971
                    tokens of cached prefix, dropping reuse to 69%.
                </p>

                <ol
                    className={styles.rows}
                    style={{ opacity: fade }}
                    aria-hidden="true"
                >
                    <li className={styles.row}>
                        <span />
                        <span className={styles.legend}>
                            <span className={styles.keyHeld}>from cache</span>
                            <span className={styles.keyHot}>reprocessed</span>
                        </span>
                    </li>
                    {STEPS.map((step, i) => {
                        const visible = i < shown;
                        const typed = clamp((t - STARTS[i]) / TYPE_MS);
                        const text = `› ${step.prompt}`;
                        const p = filled(i);
                        // Before the compaction lands, its bar starts as
                        // the cache the previous request left behind
                        const lost = step.lost ?? 0;
                        const reprocessedShare =
                            step.lost === undefined
                                ? p
                                : ease(clamp((collapse - 0.45) / 0.55));
                        return (
                            <li
                                key={step.prompt}
                                className={styles.row}
                                style={{
                                    visibility: visible ? "visible" : "hidden",
                                }}
                            >
                                <span className={styles.prompt}>
                                    {text.slice(
                                        0,
                                        Math.ceil(typed * text.length),
                                    )}
                                </span>
                                <span className={styles.bar}>
                                    <span
                                        className={styles.held}
                                        style={{
                                            width: pct(
                                                step.lost === undefined
                                                    ? step.held * p
                                                    : collapse > 0
                                                      ? step.held
                                                      : 0,
                                            ),
                                        }}
                                    />
                                    {step.lost !== undefined && (
                                        <span
                                            className={`${styles.lost} ${collapse < 0.15 ? styles.intact : ""}`}
                                            style={{
                                                width: pct(lost),
                                                opacity: collapse > 0 ? 1 : 0,
                                                ["--crumble" as string]: clamp(
                                                    (collapse - 0.15) / 0.5,
                                                ),
                                            }}
                                        />
                                    )}
                                    <span
                                        className={styles.reprocessed}
                                        style={{
                                            left: pct(step.held),
                                            width: pct(
                                                step.reprocessed *
                                                    reprocessedShare,
                                            ),
                                        }}
                                    />
                                </span>
                                <span className={styles.count}>
                                    {p > 0 ? fmt(step.reprocessed) : ""}
                                </span>
                            </li>
                        );
                    })}
                </ol>

                <div
                    className={styles.story}
                    style={{ opacity: fade }}
                    aria-hidden="true"
                >
                    {collapsed ? (
                        <>
                            <span className={styles.alarm}>
                                26,971 cached tokens destroyed
                            </span>
                            <span className={styles.plain}>
                                One /compact, which adds almost nothing, threw
                                away half the cache.
                            </span>
                        </>
                    ) : landed >= 2 ? (
                        <>
                            <span className={styles.calm}>
                                Appending is nearly free
                            </span>
                            <span className={styles.plain}>
                                Two follow-ups: 98% of the context came straight
                                from cache.
                            </span>
                        </>
                    ) : null}
                </div>

                <div
                    className={styles.status}
                    style={{ opacity: fade }}
                    aria-hidden="true"
                >
                    {current ? (
                        <>
                            cache {current.reused}% ·{" "}
                            <span className={styles.statusHot}>
                                {current.reprocessed.toLocaleString("en-US")}{" "}
                                reprocessed
                            </span>
                        </>
                    ) : (
                        "cache —"
                    )}
                </div>
            </div>
        </div>
    );
}
