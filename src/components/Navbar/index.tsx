import { Link, useLocation } from "react-router-dom";

import { useState, useRef, useEffect } from "react";

import "./index.css";

const tabs = ["About Me", "Experience", "Projects", "Contact"];

export function Navbar() {
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    const tabsRef = useRef<(HTMLAnchorElement | null)[]>([]);

    const location = useLocation();

    const activeIndex = tabs.findIndex((tab, index) => {
        const path =
            index === 0 ? "/" : `/${tab.toLowerCase().replace(/\s+/g, "-")}`;
        return location.pathname === path;
    });

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
                    <Link
                        key={tab}
                        ref={(el) => {
                            tabsRef.current[index] = el;
                        }}
                        className={`nav-item ${
                            activeIndex === index ? "active" : ""
                        }`}
                        to={
                            index != 0
                                ? `/${tab.toLowerCase().replace(/\s+/g, "-")}`
                                : "/"
                        }
                    >
                        {tab}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
