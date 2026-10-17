"use client";

import { useState } from "react";

import styles from "./LumenDemo.module.css";

// The question below as Qwen3-8B tokenizes it. Precomputed so the page
// doesn't ship a tokenizer; a leading space is part of its token.
const TOKENS = [
    "Why",
    " does",
    " editing",
    " the",
    " first",
    " word",
    " cost",
    " more",
    " than",
    " the",
    " last",
    "?",
];

// Start on " first" so the cached prefix and the stale suffix both show
const START = 4;

// Lumen's KV-cache demo, in place of the project's cover. Picking a token
// as the edit point keeps the cache before it and marks it and everything
// after it for re-prefill: T − a tokens, the same price Lumen's
// preview_edit quotes. An edit to the last token costs 1, so the suffix
// length doubles as the multiple of that cheapest edit.
export function LumenDemo({ onOpenGallery }: { onOpenGallery: () => void }) {
    const [edit, setEdit] = useState(START);
    const total = TOKENS.length;
    const cost = total - edit;

    const onKeyDown = (e: React.KeyboardEvent) => {
        const next = {
            ArrowLeft: edit - 1,
            ArrowDown: edit - 1,
            ArrowRight: edit + 1,
            ArrowUp: edit + 1,
            Home: 0,
            End: total - 1,
        }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        setEdit(Math.min(total - 1, Math.max(0, next)));
    };

    return (
        <div className={styles.demo}>
            <div className={styles.header}>
                <span className={styles.label}>Pick a word to edit</span>
                <button
                    type="button"
                    className={styles.gallery}
                    onClick={onOpenGallery}
                    aria-label="View Lumen diagrams"
                >
                    Diagrams
                </button>
            </div>

            <div
                role="slider"
                tabIndex={0}
                className={styles.tokens}
                aria-label="Edit point in the context"
                aria-valuemin={1}
                aria-valuemax={total}
                aria-valuenow={edit + 1}
                aria-valuetext={`Editing "${TOKENS[edit].trim()}": ${edit} tokens stay cached, ${cost} of ${total} re-prefill, ${cost}× an edit to the last token`}
                onKeyDown={onKeyDown}
            >
                {TOKENS.map((token, i) => (
                    <span
                        key={i}
                        className={[
                            styles.token,
                            token.startsWith(" ") && styles.spaced,
                            i >= edit && styles.stale,
                            i === edit && styles.edit,
                        ]
                            .filter(Boolean)
                            .join(" ")}
                        onPointerEnter={(e) => {
                            if (e.pointerType === "mouse") setEdit(i);
                        }}
                        onClick={() => setEdit(i)}
                    >
                        {token.trim()}
                    </span>
                ))}
            </div>

            <p className={styles.readout} aria-hidden="true">
                <span className={styles.multiple}>{cost}×</span>
                <span className={styles.detail}>
                    re-prefill {cost} of {total} · {edit} cached
                </span>
            </p>
        </div>
    );
}
