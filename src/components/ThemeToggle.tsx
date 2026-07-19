"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "dark" | "light";

const THEME_EVENT = "site-theme-change";

function SunIcon() {
    return (
        <svg
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>("dark");
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const stored = localStorage.getItem("theme") as Theme | null;
        const t = stored ?? "dark";

        // Hydrate from localStorage after mount; SSR always renders dark
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTheme(t);

        document.documentElement.setAttribute("data-theme", t);

        const onThemeChange = (e: Event) =>
            setTheme((e as CustomEvent<Theme>).detail);

        window.addEventListener(THEME_EVENT, onThemeChange);

        return () => window.removeEventListener(THEME_EVENT, onThemeChange);
    }, []);

    const toggle = () => {
        const next: Theme = theme === "dark" ? "light" : "dark";

        const apply = () => {
            setTheme(next);

            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem("theme", next);
            window.dispatchEvent(
                new CustomEvent<Theme>(THEME_EVENT, { detail: next }),
            );
        };

        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        // On phones the circular reveal can't drag the browser chrome
        // (address/tool bars) along, so they snap while the page wipes —
        // fall back to the plain CSS background/color fade instead.
        const isMobile = window.matchMedia("(max-width: 640px)").matches;

        if (!document.startViewTransition || reduceMotion || isMobile) {
            apply();

            return;
        }

        // Circular reveal from the button. Percentages resolve against the
        // pseudo-element's own box, so the math holds in every browser
        // regardless of how it scales the view transition layer.
        const rect = buttonRef.current?.getBoundingClientRect();
        const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
        const cy = rect ? rect.top + rect.height / 2 : 0;
        const spread = Math.hypot(
            Math.max(cx, window.innerWidth - cx),
            Math.max(cy, window.innerHeight - cy),
        );
        const x = (cx / window.innerWidth) * 100;
        const y = (cy / window.innerHeight) * 100;
        // A circle() percentage radius resolves against diagonal / sqrt(2)
        const radius =
            (spread /
                (Math.hypot(window.innerWidth, window.innerHeight) /
                    Math.SQRT2)) *
            100;

        document
            .startViewTransition(apply)
            .ready.then(() => {
                document.documentElement.animate(
                    {
                        clipPath: [
                            `circle(0% at ${x}% ${y}%)`,
                            `circle(${radius}% at ${x}% ${y}%)`,
                        ],
                    },
                    {
                        duration: 500,
                        easing: "ease-in-out",
                        pseudoElement: "::view-transition-new(root)",
                    },
                );
            })
            .catch(() => {
                // A re-toggle aborted the transition; the theme already applied
            });
    };

    return (
        <button
            ref={buttonRef}
            className="flex cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--text-muted) opacity-70 transition-opacity duration-200 hover:opacity-100"
            onClick={toggle}
            aria-label="Toggle theme"
        >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
    );
}
