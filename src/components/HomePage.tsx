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

export function HomePage() {
    return (
        <div className="flex min-h-dvh justify-center pt-[150px] max-[640px]:pt-0">
            <div className="relative flex w-full max-w-[1040px] px-[24px] min-[900px]:max-w-[930px] pt-[48px] max-[640px]:mt-[15px] max-[640px]:px-[30px] max-[640px]:pt-0">
                {/* Wide screens centre the content column on its own and hang the
                    link bar in the margin to its left */}
                <div className="shrink-0 min-[900px]:absolute min-[900px]:top-0 min-[900px]:right-[calc(100%-24px)] min-[900px]:bottom-0">
                    <aside className="sidebar sticky top-[198px] mr-[38px] flex w-[72px] shrink-0 flex-col items-center gap-[31px] self-start pt-[5px] pr-[38px] max-[640px]:fixed max-[640px]:top-auto max-[640px]:bottom-[calc(14px+env(safe-area-inset-bottom,0px))] max-[640px]:left-1/2 max-[640px]:z-[100] max-[640px]:m-0 max-[640px]:w-auto max-[640px]:-translate-x-1/2 max-[640px]:flex-row max-[640px]:gap-[4px] max-[640px]:rounded-full max-[640px]:border max-[640px]:border-[color-mix(in_srgb,var(--text-muted)_25%,transparent)] max-[640px]:bg-(--nav-surface) max-[640px]:p-[5px] max-[640px]:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)]">
                        <SidebarLinks />
                        <span className="hidden mx-[4px] h-[18px] w-px shrink-0 bg-(--accent-line) max-[640px]:block" />
                        <span className="hidden size-[40px] max-[379px]:size-[36px] rounded-full bg-[color-mix(in_srgb,var(--text)_8%,transparent)] max-[640px]:flex [&>button]:size-full [&_svg]:size-[18px]">
                            <ThemeToggle />
                        </span>
                    </aside>
                </div>

                <main className="w-full min-w-0 flex-1 font-[family-name:var(--font-serif),Georgia,serif]">
                    <div className="mb-[30px] flex items-center justify-between">
                        <h1 className="m-0 text-[36px] leading-[1.1] font-bold text-(--link-color) max-[640px]:text-[2rem]">
                            Hao Yan
                        </h1>
                        <div className="flex items-center gap-[8px] font-[system-ui] text-sm font-semibold tracking-[0.08em] uppercase text-(--text-muted)">
                            <span className="max-[640px]:hidden">
                                <ThemeToggle />
                            </span>
                            <span className="mb-px ml-[10px]">
                                Curr: Calgary, AB
                            </span>
                        </div>
                    </div>
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
                    <section className="mb-[60px] max-[640px]:mb-[36px]">
                        <SectionLabel>On the shelf</SectionLabel>
                        <Bookshelf />
                    </section>
                    <Quotes />
                    <footer className="pb-[80px] font-[system-ui] text-xs font-semibold tracking-[0.1em] uppercase text-(--text-muted) max-[640px]:pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
                        Last updated{" "}
                        {new Date().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </footer>
                </main>
            </div>
            <DockScroll />
        </div>
    );
}
