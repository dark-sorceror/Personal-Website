import { useEffect, useState } from "react";

import "./index.css";

export default function StarBackground() {
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX - window.innerWidth / 2) / 50;
            const y = (e.clientY - window.innerHeight / 2) / 50;

            setOffset({ x, y });
        };

        window.addEventListener("mousemove", handleMouseMove);

        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div className="star-container">
            <div
                className="stars small"
                style={{
                    transform: `translate(${offset.x * -0.5}px, ${
                        offset.y * -0.5
                    }px)`,
                }}
            />
            <div
                className="stars medium"
                style={{
                    transform: `translate(${offset.x * -1}px, ${
                        offset.y * -1
                    }px)`,
                }}
            />
            <div
                className="stars large"
                style={{
                    transform: `translate(${offset.x * -2}px, ${
                        offset.y * -2
                    }px)`,
                }}
            />
        </div>
    );
}
