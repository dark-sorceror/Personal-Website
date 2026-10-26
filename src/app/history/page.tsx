import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { linkClassName } from "@/components/linkStyle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { timeline } from "@/lib/history";

// Unlisted: nothing links here and search engines are asked to stay out
export const metadata: Metadata = {
    title: "History · Hao Yan",
    robots: { index: false, follow: false },
    alternates: { canonical: "/history/" },
};

const labelClassName =
    "m-0 font-[system-ui] text-sm font-semibold uppercase tracking-[0.12em] text-(--text-muted)";

export default function History() {
    const entries = timeline();

    return (
        <div className="flex min-h-dvh justify-center pt-(--top-gap) [--top-gap:clamp(60px,11.5vh,150px)] phone:pt-0">
            <main className="w-full max-w-[760px] px-[24px] pt-[48px] font-[family-name:var(--font-serif),Georgia,serif] phone:mt-[15px] phone:px-[30px]">
                <div className="mb-[14px] flex items-center justify-between">
                    <h1 className="m-0 text-[36px] leading-[1.1] font-bold text-(--link-color) phone:text-[2rem]">
                        History
                    </h1>
                    <ThemeToggle />
                </div>
                <p className="mt-0 mb-[44px] text-lg leading-relaxed text-(--text-muted)">
                    Every version of this site I was happy with, kept as it was.
                    They all still work.
                </p>

                {/* One line runs down through every dot and fades out
                    into the oldest version */}
                <ol className="relative m-0 list-none p-0 before:absolute before:top-[8px] before:bottom-0 before:left-[4px] before:border-l before:border-(--accent-line) before:content-[''] before:[mask-image:linear-gradient(to_bottom,#000_80%,transparent)]">
                    {entries.map((entry) => (
                        <li
                            key={entry.key}
                            className="relative grid grid-cols-[minmax(0,1fr)_260px] items-start gap-x-[32px] pb-[52px] pl-[36px] phone:grid-cols-1 phone:gap-y-[16px] phone:pb-[44px] phone:pl-[28px]"
                        >
                            <span
                                aria-hidden
                                className={`absolute top-[4px] left-0 size-[9px] rounded-full border ${
                                    entry.live
                                        ? "border-(--link-color) bg-(--link-color)"
                                        : "border-(--text-muted) bg-(--bg)"
                                }`}
                            />
                            <div>
                                <p className={labelClassName}>{entry.date}</p>
                                <p className="mt-[10px] mb-0 text-lg leading-relaxed text-(--link-color)">
                                    {entry.label}
                                </p>
                                {entry.note && (
                                    <p className="mt-[2px] mb-0 text-base italic text-(--text-muted)">
                                        {entry.note}
                                    </p>
                                )}
                                {/* A plain link, not next/link: each version is
                                    its own build, not a route of this one */}
                                <a
                                    href={entry.href}
                                    className={`mt-[14px] inline-block text-lg ${linkClassName}`}
                                >
                                    {entry.live
                                        ? "Open the live site"
                                        : "Open this version"}
                                </a>
                            </div>
                            <a
                                href={entry.href}
                                tabIndex={-1}
                                aria-hidden
                                className="block aspect-[16/10] overflow-hidden rounded-[8px] border border-(--accent-line) bg-[color-mix(in_srgb,var(--text)_6%,transparent)] transition-[border-color] duration-300 hover:border-(--text-muted)"
                            >
                                <Image
                                    src={entry.thumbnail}
                                    alt=""
                                    width={1280}
                                    height={800}
                                    loading="lazy"
                                    className="block size-full object-cover object-[left_top]"
                                />
                            </a>
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
