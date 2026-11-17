import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarLinks } from "@/components/SidebarLinks";
import { Bookshelf } from "@/components/Bookshelf";
import { Projects } from "@/components/Projects";
import { Quotes } from "@/components/Quotes";
import { DockScroll } from "@/components/DockScroll";
import { ExperienceList } from "@/components/Experience";
import { CURRENTLY, PREVIOUSLY } from "@/components/experienceData";

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="section-label mb-[15px] flex items-center gap-[10px] font-[system-ui] text-sm font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
            {children}
        </p>
    );
}

export function HomePage({
    backgroundArt,
    appearanceClassName = "",
}: {
    backgroundArt?: React.ReactNode;
    appearanceClassName?: string;
} = {}) {
    // The gap above the page grows with the window's height, so a short
    // window doesn't spend a quarter of itself on it. It stays between 60px
    // and 150px, the original, which a full-height window on a 1440p
    // screen reaches.
    return (
        <div className="flex min-h-dvh justify-center pt-(--top-gap) [--top-gap:clamp(60px,11.5vh,150px)] phone:pt-0">
            <div
                data-page-shell
                className="relative flex w-full max-w-[1040px] px-[24px] pt-[48px] phone:mt-[15px] phone:px-[30px] phone:pt-0"
            >
                {/* Wide screens centre the content column on its own and hang the
                    link bar in the margin to its left */}
                <div className="shrink-0 min-[960px]:absolute min-[960px]:top-0 min-[960px]:right-[calc(100%-24px)] min-[960px]:bottom-0">
                    <aside className="sidebar sticky top-[calc(var(--top-gap)+48px)] mr-[38px] flex w-[72px] shrink-0 flex-col items-center gap-[31px] self-start pt-[5px] pr-[38px] phone:fixed phone:top-auto phone:bottom-[calc(14px+env(safe-area-inset-bottom,0px))] phone:left-1/2 phone:z-[100] phone:m-0 phone:w-auto phone:-translate-x-1/2 phone:flex-row phone:gap-[4px] phone:rounded-full phone:border phone:border-[color-mix(in_srgb,var(--text-muted)_25%,transparent)] phone:bg-(--nav-surface) phone:p-[5px] phone:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)]">
                        <SidebarLinks />
                        <span className="hidden mx-[4px] h-[18px] w-px shrink-0 bg-(--accent-line) phone:block" />
                        <span className="hidden size-[44px] rounded-full bg-[color-mix(in_srgb,var(--text)_8%,transparent)] phone:flex [&>button]:size-full [&_svg]:size-[18px]">
                            <ThemeToggle />
                        </span>
                    </aside>
                </div>

                <main className="w-full min-w-0 flex-1 font-[family-name:var(--font-serif),Georgia,serif]">
                    <header data-home-header className="mb-[30px]">
                        <div
                            data-home-identity
                            className="flex items-center justify-between"
                        >
                            <h1 className="m-0 text-[36px] leading-[1.1] font-bold text-(--link-color) phone:text-[2rem]">
                                Hao Yan
                            </h1>
                            <div
                                className={`flex items-center gap-[8px] font-[system-ui] text-sm font-semibold tracking-[0.08em] uppercase text-(--text-muted) ${appearanceClassName}`}
                            >
                                <span className="phone:hidden">
                                    <ThemeToggle />
                                </span>
                                <span
                                    data-appearance-location
                                    className="mb-px ml-[10px]"
                                >
                                    Hamilton, ON
                                </span>
                            </div>
                        </div>
                        {backgroundArt && (
                            <div data-background-art aria-hidden="true">
                                {backgroundArt}
                            </div>
                        )}
                    </header>
                    <section className="mb-[28px]">
                        <SectionLabel>Currently</SectionLabel>
                        <ExperienceList entries={CURRENTLY} />
                    </section>
                    <section className="mb-[28px]">
                        <SectionLabel>Previously</SectionLabel>
                        <ExperienceList entries={PREVIOUSLY} />
                    </section>
                    <section className="mb-[28px]">
                        <SectionLabel>Projects</SectionLabel>
                        <Projects />
                    </section>
                    <section className="mb-[60px] phone:mb-[36px]">
                        <SectionLabel>On the shelf</SectionLabel>
                        <Bookshelf />
                    </section>
                    <footer className="flex items-center justify-between gap-[32px] pb-[80px] phone:flex-col phone:items-start phone:gap-[16px] phone:pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
                        <p className="m-0 shrink-0 font-[system-ui] text-xs font-semibold tracking-[0.1em] uppercase text-(--text-muted)">
                            Last updated{" "}
                            {new Date().toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                        <Quotes />
                    </footer>
                </main>
            </div>
            <DockScroll />
        </div>
    );
}
