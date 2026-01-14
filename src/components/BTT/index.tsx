import { useState, useEffect } from "react";

import "./index.css";

export default function BTT() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);

        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <button className={`btt ${isVisible ? "v" : ""}`} onClick={scrollToTop}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                id="Bold"
                viewBox="0 0 24 24"
                width="24"
                height="24"
            >
                <path d="M19.061,13.439,14.475,8.854a3.583,3.583,0,0,0-4.95,0L4.939,13.439a1.5,1.5,0,0,0,2.122,2.122l4.586-4.586a.5.5,0,0,1,.707,0l4.585,4.586a1.5,1.5,0,0,0,2.122-2.122Z" />
            </svg>
        </button>
    );
}
