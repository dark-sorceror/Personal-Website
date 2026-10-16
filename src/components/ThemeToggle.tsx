"use client";

import type { MouseEvent } from "react";

import styles from "./ThemeToggle.module.css";

type Theme = "dark" | "light";

const REVEAL_MS = 650;

// One reveal at a time, shared by both toggle instances (header + phone bar)
let activeReveal: (() => void) | null = null;

function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Full-viewport rectangle (clockwise) with a circular hole (counter-
 *  clockwise), so the default nonzero fill rule punches the hole out. */
function ringPath(w: number, h: number, cx: number, cy: number, r: number) {
    const rr = Math.max(r, 0.01);

    return (
        `path("M0 0H${w}V${h}H0Z` +
        `M${cx} ${cy - rr}A${rr} ${rr} 0 1 0 ${cx} ${cy + rr}` +
        `A${rr} ${rr} 0 1 0 ${cx} ${cy - rr}Z")`
    );
}

function applyTheme(next: Theme) {
    document.documentElement.setAttribute("data-theme", next);

    try {
        localStorage.setItem("theme", next);
    } catch {
        // Storage blocked (private mode); the switch still applies
    }
}

const LIFT = "data-theme-lift";
const COUNTER = "data-theme-counter";

/** Photos and brand-coloured SVGs look the same in both themes. */
function isThemeless(el: Element) {
    if (el.tagName.toLowerCase() !== "svg") return true;
    if (el.parentElement?.closest("svg")) return false;

    const mono = '[fill="currentColor"], [stroke="currentColor"]';

    return !el.matches(mono) && !el.querySelector(mono);
}

/** Whether an ancestor forms a stacking context, which would stop the
 *  element from being raised above the (body-level) inverting layer. */
function isTrapped(el: Element) {
    for (
        let p = el.parentElement;
        p && p !== document.body;
        p = p.parentElement
    ) {
        const s = getComputedStyle(p);

        if (
            s.position === "fixed" ||
            s.position === "sticky" ||
            s.zIndex !== "auto" ||
            Number(s.opacity) < 1 ||
            s.transform !== "none" ||
            s.filter !== "none" ||
            (s.backdropFilter ?? "none") !== "none" ||
            s.mixBlendMode !== "normal" ||
            s.isolation === "isolate" ||
            /paint|layout|strict|content/.test(s.contain) ||
            /transform|opacity|filter/.test(s.willChange)
        ) {
            return true;
        }
    }

    return false;
}

/**
 * "Negative" circular reveal: the theme flips instantly, then a white
 * `mix-blend-mode: difference` layer inverts everything *outside* a circle
 * growing from the button. The site's palettes are near-inverses of each
 * other, so the inverted new theme reads as the old one. No snapshots or
 * View Transitions — just a fixed div, a clip-path and requestAnimationFrame.
 *
 * Theme-independent media must not be inverted: it's raised above the
 * layer, or — when an ancestor's stacking context makes that impossible —
 * pre-inverted with a filter (double inversion = original) until the circle
 * reaches it.
 */
function switchTheme(origin: HTMLElement) {
    const root = document.documentElement;
    const next: Theme =
        root.getAttribute("data-theme") === "light" ? "dark" : "light";

    activeReveal?.();

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    root.setAttribute("data-theme-switching", "");

    if (reduceMotion) {
        applyTheme(next);
        // Flush styles with transitions off so the colours snap, then restore
        void getComputedStyle(root).backgroundColor;
        root.removeAttribute("data-theme-switching");

        return;
    }

    const overlay = document.createElement("div");

    overlay.className = "theme-reveal";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);

    // clip-path works in the overlay's own CSS pixels, which differ from
    // client coordinates when the page is zoomed — map between the two.
    const box = overlay.getBoundingClientRect();
    const w = overlay.clientWidth;
    const h = overlay.clientHeight;
    const scale = box.width ? w / box.width : 1;
    const btn = origin.getBoundingClientRect();
    const cx = (btn.left + btn.width / 2 - box.left) * scale;
    const cy = (btn.top + btn.height / 2 - box.top) * scale;
    const radius = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 2;

    const marked: Element[] = [];
    let pending: { el: Element; d: number }[] = [];

    for (const el of document.querySelectorAll("img, video, svg")) {
        if (el === overlay || !isThemeless(el)) continue;

        const r = el.getBoundingClientRect();

        if (
            !r.width ||
            r.bottom < box.top ||
            r.top > box.bottom ||
            r.right < box.left ||
            r.left > box.right
        ) {
            continue;
        }

        marked.push(el);

        if (isTrapped(el)) {
            el.setAttribute(COUNTER, "");
            pending.push({
                el,
                d: Math.hypot(
                    (r.left + r.width / 2 - box.left) * scale - cx,
                    (r.top + r.height / 2 - box.top) * scale - cy,
                ),
            });
            continue;
        }

        el.setAttribute(
            LIFT,
            getComputedStyle(el).position === "static" ? "static" : "",
        );

        // Badges laid over the media (e.g. a photo counter) come along
        for (
            let sib = el.nextElementSibling;
            sib;
            sib = sib.nextElementSibling
        ) {
            if (getComputedStyle(sib).position === "absolute") {
                sib.setAttribute(LIFT, "");
                marked.push(sib);
            }
        }
    }

    overlay.style.clipPath = ringPath(w, h, cx, cy, 0);
    applyTheme(next);

    let frame = 0;
    const start = performance.now();

    const finish = () => {
        cancelAnimationFrame(frame);
        overlay.remove();

        for (const el of marked) {
            el.removeAttribute(LIFT);
            el.removeAttribute(COUNTER);
        }

        root.removeAttribute("data-theme-switching");
        activeReveal = null;
    };

    const tick = (now: number) => {
        const t = Math.min((now - start) / REVEAL_MS, 1);

        if (t >= 1) {
            finish();

            return;
        }

        const r = radius * easeInOutCubic(t);

        overlay.style.clipPath = ringPath(w, h, cx, cy, r);
        pending = pending.filter(({ el, d }) => {
            if (d > r) return true;
            el.removeAttribute(COUNTER);

            return false;
        });
        frame = requestAnimationFrame(tick);
    };

    activeReveal = finish;
    frame = requestAnimationFrame(tick);
}

export function ThemeToggle() {
    const onClick = (e: MouseEvent<HTMLButtonElement>) =>
        switchTheme(e.currentTarget);

    return (
        <button
            className="flex cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--text-muted) opacity-70 transition-opacity duration-200 hover:opacity-100"
            onClick={onClick}
            aria-label="Toggle theme"
        >
            <svg
                className={styles.icon}
                data-theme-icon=""
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
            >
                <circle className={styles.core} cx="12" cy="12" r="5" />
                <g className={styles.rays}>
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                </g>
                <path
                    className={styles.moon}
                    d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                    strokeLinecap="butt"
                    strokeLinejoin="miter"
                />
            </svg>
        </button>
    );
}
