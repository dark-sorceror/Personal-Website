import { useEffect, useRef, useState } from "react";

import { ChevronRight, ChevronLeft } from "lucide-react";

import type { MediaItem } from "../../types";

import "./index.css";

export const GalleryRow = ({
    media,
    onOpen,
}: {
    media: MediaItem[];
    onOpen: (index: number) => void;
}) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);

    const checkScroll = () => {
        if (!rowRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;

        setShowLeft(scrollLeft > 5);
        setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        checkScroll();

        window.addEventListener("resize", checkScroll);

        return () => window.removeEventListener("resize", checkScroll);
    }, [media]);

    const isTouch = useRef(
        typeof window !== "undefined" &&
            !window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    );

    const scroll = (direction: "left" | "right") => {
        if (!rowRef.current) return;

        const scrollAmount = 272;

        rowRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    const maskStyle = {
        WebkitMaskImage:
            showLeft && showRight
                ? "linear-gradient(to right, transparent, black 10%, black 90%, transparent)"
                : showLeft
                  ? "linear-gradient(to right, transparent, black 10%, black 100%)"
                  : showRight
                    ? "linear-gradient(to right, black 0%, black 90%, transparent)"
                    : "none",
        maskImage:
            showLeft && showRight
                ? "linear-gradient(to right, transparent, black 10%, black 90%, transparent)"
                : showLeft
                  ? "linear-gradient(to right, transparent, black 10%, black 100%)"
                  : showRight
                    ? "linear-gradient(to right, black 0%, black 90%, transparent)"
                    : "none",
    };

    return (
        <div className="gallery-wrapper">
            {showLeft && !isTouch.current && (
                <button
                    className="scroll-btn left"
                    onClick={(e) => {
                        scroll("left");
                        e.currentTarget.blur();
                    }}
                >
                    <ChevronLeft size={18} />
                </button>
            )}

            <div
                className="gallery-scroll-container"
                ref={rowRef}
                onScroll={checkScroll}
                style={maskStyle}
            >
                {media.map((item, idx) =>
                    item.fit === "contain" ? (
                        <div
                            key={idx}
                            className="gallery-thumb gallery-thumb--contain"
                            onClick={() => onOpen(idx)}
                        >
                            <img
                                src={item.src}
                                alt={item.caption || "Work thumbnail"}
                                loading="lazy"
                            />
                        </div>
                    ) : (
                        <img
                            key={idx}
                            src={item.src}
                            alt={item.caption || "Work thumbnail"}
                            className="gallery-thumb"
                            onClick={() => onOpen(idx)}
                            loading="lazy"
                        />
                    ),
                )}
            </div>

            {showRight && !isTouch.current && (
                <button
                    className="scroll-btn right"
                    onClick={(e) => {
                        scroll("right");
                        e.currentTarget.blur();
                    }}
                >
                    <ChevronRight size={18} />
                </button>
            )}
        </div>
    );
};
