"use client";

import { useEffect } from "react";
import { COMPACT_LAYOUT_QUERY } from "@/lib/viewport";

// The dock returns to its resting position near either end
const EDGE_PX = 96;
// How far a scroll must run one way before the dock changes, so a jittery
// thumb doesn't flicker it. Coming back takes a more deliberate pull.
const DOWN_PX = 24;
const UP_PX = 56;

/**
 * Compact layouts: moves the dock toward the bottom edge while reading,
 * then restores it on an upward scroll or near either end. The CSS keeps
 * the links at their full touch-target size.
 */
export function DockScroll() {
    useEffect(() => {
        const phone = matchMedia(COMPACT_LAYOUT_QUERY);
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

            run = Math.sign(delta) === Math.sign(run) ? run + delta : delta;
            const nearEnd =
                y < EDGE_PX || y + innerHeight > root.scrollHeight - EDGE_PX;

            if (nearEnd || run < -UP_PX) condense(false);
            else if (run > DOWN_PX) condense(true);
        };

        const onScroll = () => {
            frame ||= requestAnimationFrame(update);
        };

        // Only phones have the dock, so only they listen for scrolls
        const listen = () => {
            if (phone.matches) {
                last = scrollY;
                run = 0;
                addEventListener("scroll", onScroll, { passive: true });
            } else {
                removeEventListener("scroll", onScroll);
                cancelAnimationFrame(frame);
                frame = 0;
                condense(false);
            }
        };

        listen();
        phone.addEventListener("change", listen);

        return () => {
            removeEventListener("scroll", onScroll);
            phone.removeEventListener("change", listen);
            cancelAnimationFrame(frame);
            condense(false);
        };
    }, []);

    return null;
}
