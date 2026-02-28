import { Link, useLocation } from "react-router-dom";

import { useState, useRef, useEffect, useCallback } from "react";

import "./index.css";

const tabs = ["About Me", "Experience", "Projects", "Contact"];

export function Navbar() {
    const [indicatorStyle, setIndicatorStyle] = useState({
        left: 0,
        width: 0,
        opacity: 0,
    });
    const tabsRef = useRef<(HTMLAnchorElement | null)[]>([]);
    const location = useLocation();

    const activeIndex = tabs.findIndex((tab, index) => {
        const path =
            index === 0 ? "/" : `/${tab.toLowerCase().replace(/\s+/g, "-")}`;

        return location.pathname === path;
    });

    const updateIndicator = useCallback(() => {
        if (activeIndex === -1) {
            setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));

            return;
        }

        const currentTab = tabsRef.current[activeIndex];

        if (currentTab) {
            setIndicatorStyle({
                left: currentTab.offsetLeft,
                width: currentTab.offsetWidth,
                opacity: 1,
            });
        }
    }, [activeIndex]);

    useEffect(() => {
        updateIndicator();

        const fontTimeout = setTimeout(updateIndicator, 150);

        window.addEventListener("resize", updateIndicator);

        return () => {
            clearTimeout(fontTimeout);
            window.removeEventListener("resize", updateIndicator);
        };
    }, [updateIndicator]);

    return (
        <nav>
            <div className="nav">
                <div
                    className="indicator"
                    style={{
                        left: `${indicatorStyle.left}px`,
                        width: `${indicatorStyle.width}px`,
                        opacity: indicatorStyle.opacity,
                    }}
                />

                {tabs.map((tab, index) => {
                    const path =
                        index !== 0
                            ? `/${tab.toLowerCase().replace(/\s+/g, "-")}`
                            : "/";

                    return (
                        <Link
                            key={tab}
                            ref={(el) => {
                                tabsRef.current[index] = el;
                            }}
                            className={`nav-item ${activeIndex === index ? "active" : ""}`}
                            to={path}
                        >
                            {tab}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
