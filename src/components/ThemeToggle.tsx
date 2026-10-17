"use client";

import styles from "./ThemeToggle.module.css";

type Theme = "dark" | "light";

// Long enough to read as a fade, short enough to feel immediate
const FADE_MS = 350;

let fadeTimer: ReturnType<typeof setTimeout> | undefined;

const CURSOR_HOLD = "data-theme-cursor";

/**
 * Safari re-picks the cursor when the whole page restyles under a still
 * mouse, and drops the hand for the arrow until the mouse moves again.
 * Pin the hand on everything until the pointer actually leaves the
 * button, so whatever Safari checks shows the hand.
 */
function holdCursor(button: HTMLElement) {
    const root = document.documentElement;

    if (root.hasAttribute(CURSOR_HOLD)) return;

    root.setAttribute(CURSOR_HOLD, "");

    const release = () => {
        root.removeAttribute(CURSOR_HOLD);
        button.removeEventListener("pointerleave", release);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("blur", release);
    };

    // Fallback in case the leave is missed: any move off the button
    const onMove = (e: PointerEvent) => {
        if (!(e.target instanceof Node) || !button.contains(e.target)) {
            release();
        }
    };

    button.addEventListener("pointerleave", release);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("blur", release);
}

function applyTheme(next: Theme) {
    document.documentElement.setAttribute("data-theme", next);

    try {
        localStorage.setItem("theme", next);
    } catch {
        // Storage blocked (private mode); the switch still applies
    }
}

/**
 * The whole page flips at once and every colour fades to the new theme
 * together. `data-theme-fading` turns on one shared colour transition for
 * the duration, so nothing lags behind or races ahead; plain CSS, so it
 * behaves the same in every browser.
 */
function switchTheme(e: React.MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement;

    // Mouse clicks only: a keyboard press leaves the pointer elsewhere, and
    // a tap leaves :hover stuck after its pointerleave has already fired,
    // so either would keep the hold until some later move
    if (
        e.detail > 0 &&
        window.matchMedia("(hover: hover)").matches &&
        e.currentTarget.matches(":hover")
    ) {
        holdCursor(e.currentTarget);
    }
    const next: Theme =
        root.getAttribute("data-theme") === "light" ? "dark" : "light";

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    clearTimeout(fadeTimer);
    root.toggleAttribute("data-theme-fading", !reduceMotion);
    applyTheme(next);

    if (!reduceMotion) {
        fadeTimer = setTimeout(
            () => root.removeAttribute("data-theme-fading"),
            FADE_MS + 50,
        );
    }
}

export function ThemeToggle() {
    return (
        <button
            className="flex cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--text-muted) opacity-70 transition-opacity duration-200 hover:opacity-100"
            onClick={switchTheme}
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
