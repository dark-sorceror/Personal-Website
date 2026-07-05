import { ThemeToggle } from "@/components/ThemeToggle";
import { InlineLink, linkClassName } from "@/components/InlineLink";
import { SidebarLinks } from "@/components/SidebarLinks";

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="section-label mb-[15px] flex items-center gap-[10px] font-[system-ui] text-sm font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
            {children}
        </p>
    );
}

function Logo({ src, alt }: { src: string; alt: string }) {
    return (
        <img
            src={src}
            alt={alt}
            className="relative -top-[2px] mr-[5px] inline h-[27px] w-[27px] object-contain align-middle"
        />
    );
}

const listClassName =
    "list-disc pl-[18px] ml-[16px] flex flex-col gap-[10px] text-lg leading-relaxed";

export default function Home() {
    return (
        <div className="flex min-h-dvh justify-center pt-[150px] max-[640px]:pt-0">
            <div className="flex w-full max-w-[900px] px-[24px] pt-[48px] max-[640px]:mt-[15px] max-[640px]:px-[30px] max-[640px]:pt-0">
                <aside className="sidebar sticky top-0 mr-[38px] flex w-[72px] shrink-0 flex-col items-center gap-[31px] self-start pt-[5px] pr-[38px] [transition:background_0.3s_ease,border-color_0.3s_ease] max-[640px]:fixed max-[640px]:top-auto max-[640px]:bottom-[calc(5px+env(safe-area-inset-bottom,0px))] max-[640px]:left-1/2 max-[640px]:z-[100] max-[640px]:m-0 max-[640px]:w-auto max-[640px]:-translate-x-1/2 max-[640px]:flex-row max-[640px]:gap-[28px] max-[640px]:rounded-[50px] max-[640px]:border max-[640px]:border-(--accent-line) max-[640px]:bg-[color-mix(in_srgb,var(--bg)_75%,transparent)] max-[640px]:px-[24px] max-[640px]:py-[10px] max-[640px]:backdrop-blur-[8px]">
                    <SidebarLinks />
                    <span className="hidden h-[16px] w-px shrink-0 bg-(--accent-line) max-[640px]:block" />
                    <span className="hidden max-[640px]:flex">
                        <ThemeToggle />
                    </span>
                </aside>

                <main className="w-full flex-1 font-[family-name:var(--font-serif),Georgia,serif]">
                    <div className="mb-[30px] flex items-center justify-between">
                        <h1 className="m-0 text-[36px] leading-[1.1] font-bold text-(--link-color) max-[640px]:text-[2rem]">
                            Hao Yan
                        </h1>
                        <div className="flex items-center gap-[8px] font-[system-ui] text-sm font-semibold tracking-[0.08em] uppercase text-(--text-muted)">
                            <span className="max-[640px]:hidden">
                                <ThemeToggle />
                            </span>
                            <span className="mb-px ml-[10px]">
                                Curr: San Francisco, CA
                            </span>
                        </div>
                    </div>
                    <section className="mb-[28px]">
                        <SectionLabel>Currently</SectionLabel>
                        <ul className={listClassName}>
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
                                Software Engineering @{" "}
                                <Logo
                                    src="/media/mcmaster_logo.png"
                                    alt="McMaster University"
                                />
                                McMaster University (&apos;29)
                            </li>
                            <li>
                                Embedded & Controls Software Lead @ McMaster
                                Exoskeleton
                            </li>
                            <li>AI/ML @ McMaster EcoCAR</li>
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
                                by Tommy W. S. Chow
                            </li>
                        </ul>
                    </section>
                    <section className="mb-[60px]">
                        <SectionLabel>Previously</SectionLabel>
                        <ul className={listClassName}>
                            <li>
                                Autonomous &amp; Mechanical Engineer @{" "}
                                <Logo
                                    src="/media/nova_robotics_logo.png"
                                    alt="VEX Robotics Team 3388N"
                                />
                                <span className={linkClassName}>
                                    VEX Robotics Team 3388N
                                </span>
                                <ul className="mt-[5px] flex list-[circle] flex-col gap-[3px] pl-[28px]">
                                    <li>
                                        6th of 200 teams at Canada&apos;s
                                        largest VEX tournament; built full
                                        autonomous nav stack in C/C++
                                    </li>
                                </ul>
                            </li>
                            <li>
                                Robotics Coach @{" "}
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
                    <footer className="flex items-center justify-between gap-[16px] pb-[80px] font-[system-ui] text-xs font-semibold tracking-[0.1em] uppercase text-(--text-muted)">
                        <span>
                            Last updated{" "}
                            {new Date().toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                        <span className="underline decoration-(--text-muted)/50 decoration-1 underline-offset-4 transition-colors duration-200 hover:text-(--link-color) hover:decoration-(--link-color)">
                            what are these dots?
                        </span>
                    </footer>
                </main>
            </div>
        </div>
    );
}
