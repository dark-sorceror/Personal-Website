import { ThemeToggle } from "../components/ThemeToggle";
import { InlineLink } from "../components/InlineLink";
import { SidebarLinks } from "../components/SidebarLinks";

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p
            className="section-label"
            style={{
                fontFamily: "system-ui",
                fontSize: "14px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "15px",
                fontWeight: 600,
            }}
        >
            {children}
        </p>
    );
}

function Logo({ src, alt }: { src: string; alt: string }) {
    return (
        <img
            src={src}
            alt={alt}
            style={{
                width: "27px",
                height: "27px",
                objectFit: "contain",
                verticalAlign: "middle",
                display: "inline",
                marginRight: "5px",
                position: "relative",
                top: "-2px",
            }}
        />
    );
}

const listStyle: React.CSSProperties = {
    listStyleType: "disc",
    paddingLeft: "18px",
    marginLeft: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    fontSize: "1.125rem",
    lineHeight: 1.625,
};

export default function Home() {
    return (
        <div className="page-outer">
            <div className="page-inner">
                <aside className="sidebar">
                    <SidebarLinks />
                    <span className="sidebar-divider" />
                    <span className="sidebar-theme-toggle">
                        <ThemeToggle />
                    </span>
                </aside>

                <main
                    style={{
                        flex: 1,
                        width: "100%",
                        fontFamily: "var(--font-serif), Georgia, serif",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "30px",
                        }}
                    >
                        <h1
                            className="name"
                            style={{
                                fontWeight: 700,
                                margin: 0,
                                lineHeight: 1.1,
                            }}
                        >
                            Hao Yan
                        </h1>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px",
                                color: "var(--text-muted)",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                fontWeight: "600",
                                fontFamily: "system-ui",
                            }}
                        >
                            <span className="theme-toggle-header">
                                <ThemeToggle />
                            </span>
                            <span
                                style={{
                                    marginBottom: "1px",
                                    marginLeft: "10px",
                                }}
                            >
                                Curr: Calgary, AB
                            </span>
                        </div>
                    </div>
                    <section style={{ marginBottom: "28px" }}>
                        <SectionLabel>Currently</SectionLabel>
                        <ul style={listStyle}>
                            <li>
                                SWE @{" "}
                                <Logo
                                    src="/media/traceroot_ai_logo.png"
                                    alt="TraceRoot.AI"
                                />
                                <InlineLink href="https://traceroot.ai">
                                    TraceRoot.AI
                                </InlineLink>{" "}
                                ({" "}
                                <Logo
                                    src="/media/ycombinator_logo.png"
                                    alt="Y Combinator"
                                />
                                YC S25)
                            </li>
                            <li>
                                AI @{" "}
                                <Logo
                                    src="/media/corall_co_logo.png"
                                    alt="Corall"
                                />
                                <InlineLink href="https://corall.co">
                                    Corall
                                </InlineLink>
                            </li>
                            <li>
                                Software Engineering @{" "}
                                <Logo
                                    src="/media/mcmaster_logo.png"
                                    alt="McMaster University"
                                />
                                McMaster University
                            </li>
                            <li>AI/ML at McMaster EcoCAR</li>
                            <li>Embedded Software at McMaster Exoskeleton</li>
                            <li>
                                Exploring how transformers &quot;guess&quot; —
                                probing entropy, priors, and zero-context
                                inference
                            </li>
                            <li>
                                Reading{" "}
                                <em>
                                    Neural Networks and Computing Learning
                                    Algorithms and Applications
                                </em>{" "}
                                by Chow, Tommy W. S.
                            </li>
                        </ul>
                    </section>
                    <section style={{ paddingBottom: "80px" }}>
                        <SectionLabel>Previously</SectionLabel>
                        <ul style={listStyle}>
                            <li>
                                Autonomous &amp; Mechanical Engineer —{" "}
                                <Logo
                                    src="/media/nova_robotics_logo.png"
                                    alt="VEX Robotics Team 3388N"
                                />
                                <span className="link">
                                    VEX Robotics Team 3388N
                                </span>
                                <ul
                                    style={{
                                        listStyleType: "circle",
                                        paddingLeft: "28px",
                                        marginTop: "5px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "3px",
                                    }}
                                >
                                    <li>
                                        6th of 200 teams at Canada&apos;s
                                        largest VEX tournament; built full
                                        autonomous nav stack in C/C++
                                    </li>
                                </ul>
                            </li>
                            <li>
                                Robotics Coach at{" "}
                                <Logo
                                    src="/media/western_mechatronics_logo.png"
                                    alt="Western Mechatronics"
                                />
                                <InlineLink href="https://www.westernmech.ca/">
                                    Western Mechatronics
                                </InlineLink>
                            </li>
                            <li>
                                Created{" "}
                                <InlineLink href="https://github.com/dark-sorceror/Neurinese">
                                    Neurinese
                                </InlineLink>{" "}
                                — Grammarly/Copilot for handwritten Chinese
                            </li>
                            <li>
                                <Logo
                                    src="/media/ib_logo.png"
                                    alt="International Baccalaureate"
                                />
                                IB Diploma Graduate
                            </li>
                        </ul>
                    </section>
                </main>
            </div>
        </div>
    );
}
