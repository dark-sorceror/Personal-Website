"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { QUOTES } from "@/components/quotesData";
import styles from "./Quotes.module.css";

// Long enough to read and forget about before the next one turns up
const SHOW_MS = 120_000;
const FADE_MS = 700;

// Where in the right-hand margin the quote lands, as fractions of the
// free space across and down
type Spot = { x: number; y: number };

const randomSpot = (): Spot => ({ x: Math.random(), y: Math.random() });

// A fresh order each visit, walked through so no quote comes back before
// the rest have had a turn
function shuffledOrder() {
    const order = QUOTES.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
}

// Drawn once per page load. The server can't know it, so its markup
// keeps the quote hidden rather than show one that's about to be swapped
const ORDER = typeof window === "undefined" ? [] : shuffledOrder();
const subscribe = () => () => {};

/**
 * One quote at a time, in a random order. On wide screens each quote
 * surfaces at a random spot in the empty margin right of the content,
 * fades out, and the next turns up somewhere else; narrower screens keep
 * it in the page flow above the footer. Hovering holds the current quote.
 */
export function Quotes() {
    const order = useSyncExternalStore(
        subscribe,
        () => ORDER,
        () => null,
    );
    const [index, setIndex] = useState(0);
    // Fixed first spot, so server and client render the same markup
    const [spot, setSpot] = useState<Spot>({ x: 0.5, y: 0.2 });
    const [shown, setShown] = useState(true);
    const [held, setHeld] = useState(false);
    // A quote already fading out still brings the next one in, even if a
    // hover arrives mid-fade; a hold only stops the next fade starting
    const swap = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => () => clearTimeout(swap.current), []);

    useEffect(() => {
        if (held) return;

        const timer = setInterval(() => {
            if (document.visibilityState !== "visible") return;

            setShown(false);
            swap.current = setTimeout(() => {
                setIndex((i) => (i + 1) % QUOTES.length);
                setSpot(randomSpot());
                setShown(true);
            }, FADE_MS);
        }, SHOW_MS);

        return () => clearInterval(timer);
    }, [held]);

    const quote = QUOTES[order?.[index] ?? 0];

    return (
        <figure
            className={styles.quote}
            data-shown={(order && shown) || undefined}
            style={
                {
                    "--x": spot.x,
                    "--y": spot.y,
                } as React.CSSProperties
            }
            aria-live="off"
            onPointerEnter={(e) => e.pointerType === "mouse" && setHeld(true)}
            onPointerLeave={() => setHeld(false)}
        >
            <blockquote className={styles.text}>
                &ldquo;{quote.text}&rdquo;
            </blockquote>
            <figcaption className={styles.author}>
                &ndash; {quote.author}
            </figcaption>
        </figure>
    );
}
