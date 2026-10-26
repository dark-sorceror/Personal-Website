"use client";

import type { CSSProperties, ReactNode } from "react";

import type { ReplayClock } from "@/components/useReplayClock";
import styles from "./LumenFrame.module.css";

// The card a Lumen replay plays in: a box the size of a project cover, a
// caption saying what the replay is, and the chip that opens the diagrams.
// A replay that needs more room than a cover's 16:10 can ask for a taller
// `aspect`, like "4 / 3", or set `--aspect` from its own `className` to
// vary it by screen.
export function LumenFrame({
    clock,
    caption,
    onOpenGallery,
    aspect,
    className,
    children,
}: {
    clock: ReplayClock;
    caption: string;
    onOpenGallery: () => void;
    aspect?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            className={className ? `${styles.demo} ${className}` : styles.demo}
            style={
                aspect ? ({ "--aspect": aspect } as CSSProperties) : undefined
            }
            {...clock.card}
        >
            <div className={styles.inner}>
                <div className={styles.header}>
                    <span className={styles.caption}>{caption}</span>
                    <button
                        type="button"
                        className={styles.chip}
                        onClick={onOpenGallery}
                        aria-label="View Lumen diagrams"
                    >
                        Diagrams
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
