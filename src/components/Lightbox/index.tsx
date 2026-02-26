import React, { useEffect, useState } from "react";

import { ChevronRight, ChevronLeft, X } from "lucide-react";

import type { MediaItem } from "../../types";

export const Lightbox = ({
    isOpen,
    media,
    initialIndex,
    onClose,
    contextTitle,
}: {
    isOpen: boolean;
    media: MediaItem[];
    initialIndex: number;
    onClose: () => void;
    contextTitle: string;
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
        };

        window.addEventListener("keydown", handleKeyDown);

        if (isOpen) document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", handleKeyDown);

            document.body.style.overflow = "unset";
        };
    }, [isOpen, currentIndex]);

    if (!isOpen || media.length === 0) return null;

    const next = (e?: React.MouseEvent) => {
        e?.stopPropagation();

        setCurrentIndex((prev) => (prev + 1) % media.length);
    };
    const prev = (e?: React.MouseEvent) => {
        e?.stopPropagation();

        setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    };

    const currentItem = media[currentIndex];

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-close" onClick={onClose}>
                <X size={24} />
            </div>
            <div
                className="lightbox-image-wrapper"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="lightbox-nav prev" onClick={prev}>
                    <ChevronLeft className="lightbox-nav-icon" />
                </div>
                <div className="lightbox-nav next" onClick={next}>
                    <ChevronRight className="lightbox-nav-icon" />
                </div>
                <img
                    src={currentItem.src}
                    alt={currentItem.caption || "Full screen view"}
                    className="lightbox-image"
                />
                <div className="lightbox-caption-overlay">
                    <div className="caption-title">{contextTitle}</div>
                    {currentItem.caption && (
                        <div className="caption-text">
                            {currentItem.caption}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
