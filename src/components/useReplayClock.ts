"use client";

import {
    useEffect,
    useRef,
    useState,
    type FocusEvent,
    type PointerEvent,
} from "react";

export type Timing = {
    // When the replay starts to fade out, and when it starts over, in ms
    fadeAt: number;
    loop: number;
    // From here until the fade nothing moves, so those frames are skipped
    still: number;
};

const clamp = (x: number) => Math.min(1, Math.max(0, x));

// The clock dt ms on. While someone is pointing at the card or tabbing
// through it, the replay plays on to its end and holds there instead of
// fading out and starting over; a fade already under way finishes first.
// Stopping wherever it happened to be left it frozen mid-word.
export function advance(
    t: number,
    dt: number,
    watched: boolean,
    { fadeAt, loop }: Timing,
) {
    const end = fadeAt - 1;
    if (watched && t <= end && t + dt >= end) return end;
    return (t + dt) % loop;
}

export type ReplayClock = ReturnType<typeof useReplayClock>;

/**
 * One clock for a looping replay card. Its frame loop only runs while the
 * card is on screen, uncovered (`held` is false), and not holding its end
 * for someone reading it, so it costs nothing otherwise; reduced motion
 * parks it on the final frame. Spread `card` on the card's element.
 */
export function useReplayClock(timing: Timing, held: boolean) {
    const [t, setT] = useState(0);
    // The card, through a callback ref so the clock starts once it mounts
    const [el, ref] = useState<HTMLDivElement | null>(null);
    const clock = useRef({
        t: 0,
        visible: false,
        hovered: false,
        focused: false,
        held: false,
        // Starts or stops the frame loop to match the flags above
        sync: () => {},
    });

    useEffect(() => {
        if (!el) return;
        const c = clock.current;
        const end = timing.fadeAt - 1;
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
            const frame = requestAnimationFrame(() => setT(end));
            return () => cancelAnimationFrame(frame);
        }

        const still = (x: number) => x >= timing.still && x < timing.fadeAt;
        let frame = 0;
        let last = 0;
        const watched = () => c.hovered || c.focused;
        const holding = () => watched() && c.t === end;
        const tick = (now: number) => {
            if (last) {
                const next = advance(c.t, now - last, watched(), timing);

                // Only render frames that look different
                if (!(still(c.t) && still(next))) setT(next);
                c.t = next;
            }
            last = now;
            frame = holding() ? 0 : requestAnimationFrame(tick);
        };
        c.sync = () => {
            const run = c.visible && !c.held && !holding();
            if (run && !frame) {
                last = 0;
                frame = requestAnimationFrame(tick);
            } else if (!run && frame) {
                cancelAnimationFrame(frame);
                frame = 0;
            }
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                c.visible = entry.isIntersecting;
                c.sync();
            },
            { threshold: 0.5 },
        );
        observer.observe(el);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
            c.sync = () => {};
        };
    }, [el, timing]);

    useEffect(() => {
        clock.current.held = held;
        clock.current.sync();
    }, [held]);

    const hold = (flag: "hovered" | "focused", on: boolean) => {
        clock.current[flag] = on;
        clock.current.sync();
    };

    const card = {
        ref,
        onPointerEnter: (e: PointerEvent<HTMLDivElement>) =>
            e.pointerType === "mouse" && hold("hovered", true),
        onPointerLeave: () => hold("hovered", false),
        // Tabbing in holds it; focus handed back after a click (say, by the
        // closing lightbox) doesn't
        onFocus: (e: FocusEvent<HTMLDivElement>) =>
            e.target.matches(":focus-visible") && hold("focused", true),
        onBlur: (e: FocusEvent<HTMLDivElement>) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
                hold("focused", false);
            }
        },
    };

    // 1 until the fade, then down to 0 just before the loop starts over
    const fade =
        1 - clamp((t - timing.fadeAt) / (timing.loop - timing.fadeAt - 100));

    return { t, fade, card };
}
