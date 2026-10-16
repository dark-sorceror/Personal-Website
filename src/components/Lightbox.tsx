"use client";

import { useEffect, useRef } from "react";

import type { GalleryImage } from "@/components/galleryData";

function CloseIcon() {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function ChevronIcon({ dir }: { dir: "prev" | "next" }) {
    return (
        <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline
                points={dir === "prev" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"}
            />
        </svg>
    );
}

// Arrow keys and WASD both step the set: left/right for the obvious pair,
// up/down mapped to back/forward so the whole cluster does something.
const PREV_KEYS = new Set(["arrowleft", "a", "arrowup", "w"]);
const NEXT_KEYS = new Set(["arrowright", "d", "arrowdown", "s"]);

// A mostly sideways swipe at least this long steps the set on touch screens
const SWIPE_MIN = 50;

// Presentational overlay. Owns no data — the caller supplies the image set,
// the active index, and the handlers.
export function Lightbox({
    images,
    index,
    onClose,
    onIndexChange,
}: {
    images: GalleryImage[];
    index: number;
    onClose: () => void;
    onIndexChange: (next: number) => void;
}) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const swipeRef = useRef<{ x: number; y: number } | null>(null);
    const image = images[index];
    const many = images.length > 1;

    const step = (delta: number) =>
        onIndexChange((index + delta + images.length) % images.length);

    useEffect(() => {
        const previousFocus = document.activeElement as HTMLElement | null;
        const dialog = dialogRef.current;
        dialog?.querySelector<HTMLButtonElement>("button")?.focus();
        const trapFocus = (event: KeyboardEvent) => {
            if (event.key !== "Tab" || !dialog) return;
            const buttons = Array.from(
                dialog.querySelectorAll<HTMLButtonElement>("button"),
            );
            const first = buttons[0];
            const last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        };
        document.addEventListener("keydown", trapFocus);
        return () => {
            document.removeEventListener("keydown", trapFocus);
            previousFocus?.focus({ preventScroll: true });
        };
    }, []);

    // Esc closes, arrows/WASD step through the set.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            const key = e.key.toLowerCase();
            const move = PREV_KEYS.has(key) ? -1 : NEXT_KEYS.has(key) ? 1 : 0;

            if (e.key === "Escape") onClose();
            else if (move && many) {
                // Arrow keys would otherwise scroll the page behind us
                e.preventDefault();
                onIndexChange((index + move + images.length) % images.length);
            }
        };

        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [index, images.length, many, onClose, onIndexChange]);

    // Lock the page behind the overlay.
    useEffect(() => {
        const prev = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    if (!image) return null;

    const onTouchStart = (e: React.TouchEvent) => {
        const t = e.touches[0];

        swipeRef.current =
            e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        const start = swipeRef.current;
        const t = e.changedTouches[0];

        swipeRef.current = null;
        if (!start || !t || !many) return;

        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;

        // Swipe left for the next photo, right for the previous
        if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) {
            step(dx < 0 ? 1 : -1);
        }
    };

    return (
        <div
            ref={dialogRef}
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={image.alt}
            onClick={onClose}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <button
                type="button"
                className="lightbox-close"
                onClick={onClose}
                aria-label="Close"
            >
                <CloseIcon />
            </button>

            {/* Stop propagation so clicking the image itself doesn't dismiss */}
            <figure
                className="lightbox-figure"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="lightbox-frame">
                    <img
                        className="lightbox-image"
                        src={image.src}
                        alt={image.alt}
                    />

                    {many && (
                        <>
                            <button
                                type="button"
                                className="lightbox-nav lightbox-nav--prev"
                                aria-label="Previous image"
                                onClick={() => step(-1)}
                            >
                                <span className="lightbox-nav-scrim">
                                    <ChevronIcon dir="prev" />
                                </span>
                            </button>
                            <button
                                type="button"
                                className="lightbox-nav lightbox-nav--next"
                                aria-label="Next image"
                                onClick={() => step(1)}
                            >
                                <span className="lightbox-nav-scrim">
                                    <ChevronIcon dir="next" />
                                </span>
                            </button>
                        </>
                    )}
                </div>

                {many && (
                    <div className="lightbox-dots">
                        {images.map((item, i) => (
                            <button
                                key={item.src}
                                type="button"
                                className="lightbox-dot"
                                aria-label={`Image ${i + 1} of ${images.length}`}
                                aria-current={i === index}
                                onClick={() => onIndexChange(i)}
                            >
                                <span />
                            </button>
                        ))}
                    </div>
                )}

                <figcaption className="lightbox-caption">
                    {image.caption}
                </figcaption>
            </figure>
        </div>
    );
}
