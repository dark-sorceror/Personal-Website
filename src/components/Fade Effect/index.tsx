import { useRef, useEffect, useState, type ReactNode } from "react";

import "./index.css";

interface FadeInProps {
    children: ReactNode;
    delay?: string;
    className?: string;
}

export default function FadeIn({
    children,
    delay = "0s",
    className = "",
}: FadeInProps) {
    const domRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);

                        if (domRef.current) observer.unobserve(domRef.current);
                    }
                });
            },
            { threshold: 0.15 },
        );

        const currentRef = domRef.current;

        if (currentRef) observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, []);

    return (
        <div
            ref={domRef}
            className={`fade-item ${isVisible ? "in-view" : ""} ${className}`}
            style={{ transitionDelay: delay }}
        >
            {children}
        </div>
    );
}
