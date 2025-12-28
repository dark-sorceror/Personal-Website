import { useState, useRef, useEffect } from "react";

import "./Navbar.css";

const tabs = ["About Me", "Experience", "Projects", "Contact"];

export default function Navbar() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    const tabsRef = useRef<(HTMLAnchorElement | null)[]>([]);

    useEffect(() => {
        const currentTab = tabsRef.current[activeIndex];

        if (currentTab) {
            setIndicatorStyle({
                left: currentTab.offsetLeft,
                width: currentTab.offsetWidth,
            });
        }
    }, [activeIndex]);

    return (
        <nav>
            <div className="nav">
                <div
                    className="indicator"
                    style={{
                        left: `${indicatorStyle.left}px`,
                        width: `${indicatorStyle.width}px`,
                    }}
                />

                {tabs.map((tab, index) => (
                    <a
                        key={tab}
                        ref={(el) => {
                            tabsRef.current[index] = el;
                        }}
                        className={`nav-item ${
                            activeIndex === index ? "active" : ""
                        }`}
                        onClick={() => setActiveIndex(index)}
                    >
                        {tab}
                    </a>
                ))}
            </div>
        </nav>
    );
}
