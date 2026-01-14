import { useState, useRef, useEffect } from "react";

import "./index.css";

const tabs = ["About Me", "Experience", "Projects", "Contact"];

export default function Navbar() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    const tabsRef = useRef<(HTMLAnchorElement | null)[]>([]);

    const handleScroll = (
        e: React.MouseEvent<HTMLAnchorElement>,
        index: number,
        tab: string
    ) => {
        e.preventDefault();
        setActiveIndex(index);

        const targetId = tab.toLowerCase().replace(/\s+/g, "-");
        const element = document.getElementById(targetId);

        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

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
                        onClick={(e) => handleScroll(e, index, tab)}
                        href={`#${tab.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                        {tab}
                    </a>
                ))}
            </div>
        </nav>
    );
}
