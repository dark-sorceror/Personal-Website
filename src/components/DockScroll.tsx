"use client";

import { useEffect } from "react";

// The dock stays full size this close to the top or the bottom
const EDGE_PX = 96;
// How far a scroll must run one way before the dock changes, so a jittery
// thumb doesn't flicker it. Coming back takes a more deliberate pull.
const DOWN_PX = 24;
const UP_PX = 56;

/**
 * Phones: condenses the link dock while reading down the page, the way
 * Safari's address bar does, and brings it back on a scroll up or at either
 * end. Sets `data-dock-condensed` on <html>; the CSS does the rest.
 */
export function DockScroll() {
    useEffect(() => {
        const phone = matchMedia("(max-width: 640px)");
        const root = document.documentElement;
        let last = scrollY;
        // Distance scrolled in the current direction
        let run = 0;
        let frame = 0;

        const condense = (on: boolean) =>
            root.toggleAttribute("data-dock-condensed", on);

        const update = () => {
            frame = 0;
            const y = scrollY;
            const delta = y - last;
            last = y;

            if (!phone.matches) return condense(false);

            run = Math.sign(delta) === Math.sign(run) ? run + delta : delta;
            const nearEnd =
                y < EDGE_PX || y + innerHeight > root.scrollHeight - EDGE_PX;

            if (nearEnd || run < -UP_PX) condense(false);
            else if (run > DOWN_PX) condense(true);
        };

        const onScroll = () => {
            frame ||= requestAnimationFrame(update);
        };

        addEventListener("scroll", onScroll, { passive: true });
        phone.addEventListener("change", onScroll);

        return () => {
            removeEventListener("scroll", onScroll);
            phone.removeEventListener("change", onScroll);
            cancelAnimationFrame(frame);
            condense(false);
        };
    }, []);

    return null;
}
