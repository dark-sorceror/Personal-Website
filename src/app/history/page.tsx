import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { linkClassName } from "@/components/linkStyle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { timeline, type TimelineEntry } from "@/lib/history";

// Unlisted: nothing links here and search engines are asked to stay out
export const metadata: Metadata = {
    title: "History · Hao Yan",
    robots: { index: false, follow: false },
    alternates: { canonical: "/history/" },
};

// The screenshot inside a preview is a picture, not a page: nothing in it
// can be selected, dragged or hovered, so the whole box acts as the link.
// Both themes' shots sit on top of each other and crossfade over the same
// 350ms as the theme switch's colours (FADE_MS in ThemeToggle); with
// reduced motion, which skips that fade, they swap at once.
const shotClassName =
    "pointer-events-none absolute inset-0 block size-full object-cover object-[left_top] select-none [transition:opacity_350ms_ease] motion-reduce:transition-none";

/**
 * A version's screenshot as one big link, showing the shot for the current
 * <html data-theme>. A cover over the box keeps the pointer a link cursor
 * everywhere on it.
 */
function Preview({ entry }: { entry: TimelineEntry }) {
    return (
        <a
            href={entry.href}
            aria-label={
                entry.live
                    ? "Open the live site"
                    : `Open the version from ${entry.date}`
            }
            // The 16:10 box holds the screenshot's place, and stays a plain
            // empty frame until it loads
            className="relative block aspect-[16/10] overflow-hidden rounded-[8px] border border-(--accent-line) bg-[color-mix(in_srgb,var(--text)_6%,transparent)] transition-[border-color] duration-300 select-none after:absolute after:inset-0 after:content-[''] hover:border-(--text-muted) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--link-color)"
        >
            <Image
                src={entry.thumbnails.dark}
                alt=""
                width={1280}
                height={800}
                loading="eager"
                draggable={false}
                data-theme-follow=""
                className={`${shotClassName} [[data-theme=light]_&]:opacity-0`}
            />
            <Image
                src={entry.thumbnails.light}
                alt=""
                width={1280}
                height={800}
                loading="eager"
                draggable={false}
                data-theme-follow=""
                className={`${shotClassName} opacity-0 [[data-theme=light]_&]:opacity-100`}
            />
        </a>
    );
}

export default function History() {
    const entries = timeline();

    return (
        <div className="flex min-h-dvh justify-center pt-(--top-gap) [--top-gap:clamp(60px,11.5vh,150px)] phone:pt-0">
            <main className="w-full max-w-[1040px] px-[24px] pt-[48px] font-[family-name:var(--font-serif),Georgia,serif] phone:mt-[15px] phone:px-[30px]">
                <div className="mb-[14px] flex items-center justify-between">
                    <h1 className="m-0 text-[36px] leading-[1.1] font-bold text-(--link-color) phone:text-[2rem]">
                        History
                    </h1>
                    <ThemeToggle />
                </div>
                <p className="mt-0 mb-[48px] text-lg leading-relaxed text-(--text-muted)">
                    Every version of this site I was happy with, kept as it was.
                    They all still work.
                </p>

                {/* The spine: one line down through every dot, fading out
                    into the oldest version */}
                <ol className="relative m-0 list-none p-0 before:absolute before:top-[10px] before:bottom-0 before:left-[4px] before:border-l before:border-(--accent-line) before:content-[''] before:[mask-image:linear-gradient(to_bottom,#000_85%,transparent)]">
                    {entries.map((entry) => (
                        <li
                            key={entry.key}
                            className="relative pt-[44px] pb-[72px] pl-[76px] phone:pb-[52px] phone:pl-[48px]"
                        >
                            <span
                                aria-hidden
                                className={`absolute top-[6px] left-0 size-[9px] rounded-full border ${
                                    entry.live
                                        ? "border-(--link-color) bg-(--link-color)"
                                        : "border-(--text-muted) bg-(--bg)"
                                }`}
                            />
                            <p className="absolute top-0 left-[22px] m-0 font-[system-ui] text-sm leading-[20px] font-semibold whitespace-nowrap uppercase tracking-[0.12em] text-(--text-muted) phone:left-[18px]">
                                {entry.date}
                            </p>
                            {/* The leg, an L: down from under the date, then a
                                rounded turn right into the entry, level with
                                the first line of its label. Borders, not 1px
                                fills, so the desktop zoom can't round them
                                away. */}
                            <span
                                aria-hidden
                                className="absolute top-[28px] left-[26px] h-[31px] w-[38px] rounded-bl-[10px] border-b border-l border-(--accent-line) phone:left-[22px] phone:h-[26px] phone:w-[18px] phone:rounded-bl-[8px]"
                            />

                            <div className="grid grid-cols-[minmax(0,1fr)_58%] items-start gap-x-[40px] phone:grid-cols-1 phone:gap-y-[18px]">
                                <div>
                                    <p className="m-0 text-lg leading-relaxed text-(--link-color)">
                                        {entry.label}
                                    </p>
                                    {entry.note && (
                                        <p className="mt-[2px] mb-0 text-base italic text-(--text-muted)">
                                            {entry.note}
                                        </p>
                                    )}
                                    {/* A plain link, not next/link: each version
                                        is its own build, not a route of this one */}
                                    <a
                                        href={entry.href}
                                        className={`mt-[14px] inline-block text-lg ${linkClassName}`}
                                    >
                                        {entry.live
                                            ? "Open the live site"
                                            : "Open this version"}
                                    </a>
                                </div>
                                <Preview entry={entry} />
                            </div>
                        </li>
                    ))}
                </ol>

                <footer className="pt-[8px] pb-[80px] phone:pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
                    <Link href="/" className={`text-lg ${linkClassName}`}>
                        Back to Hao Yan
                    </Link>
                </footer>
            </main>
        </div>
    );
}
