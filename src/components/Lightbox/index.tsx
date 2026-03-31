import React, { useEffect } from "react";

import { ChevronRight, ChevronLeft, X } from "lucide-react";

import type { LightboxProps } from "../../types";

import "./index.css";

export const Lightbox = ({
    isOpen,
    media,
    currentIndex,
    setCurrentIndex,
    onClose,
    contextTitle,
}: LightboxProps) => {
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
        setCurrentIndex((currentIndex + 1) % media.length);
    };

    const prev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((currentIndex - 1 + media.length) % media.length);
    };

    const safeIndex = Math.min(currentIndex, media.length - 1);
    const currentItem = media[safeIndex];

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-close" onClick={onClose}>
                <X size={24} />
            </div>

            <div
                className="lightbox-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="lightbox-image-wrapper">
                    <div className="lightbox-nav prev" onClick={prev}>
                        <ChevronLeft className="lightbox-nav-icon" />
                    </div>
                    <div className="lightbox-nav next" onClick={next}>
                        <ChevronRight className="lightbox-nav-icon" />
                    </div>
                    <img
                        key={currentIndex}
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

                {media.length > 1 && (
                    <div className="lightbox-dots">
                        {media.map((_, i) => (
                            <button
                                key={i}
                                className={`lightbox-dot${i === safeIndex ? " active" : ""}`}
                                onClick={() => setCurrentIndex(i)}
                                aria-label={`Go to image ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
