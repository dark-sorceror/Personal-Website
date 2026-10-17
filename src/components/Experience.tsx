import { Fragment } from "react";

import { InlineLink } from "@/components/InlineLink";
import {
    formatDates,
    type Entry,
    type Role,
} from "@/components/experienceData";

// Small-caps sans for dates and places, matching the section labels
const metaClassName =
    "font-[system-ui] text-xs font-semibold uppercase tracking-[0.08em] text-(--text-muted) tabular-nums";

// On phones the logo shrinks to the text's cap height and sits on the
// baseline, so lines with a logo are no taller than lines without
function Logo({ src, alt }: { src: string; alt: string }) {
    return (
        <img
            src={src}
            alt={alt}
            className="relative -top-[2px] mr-[5px] inline h-[27px] w-[27px] object-contain align-middle max-[640px]:top-0 max-[640px]:mr-[4px] max-[640px]:h-[1.2em] max-[640px]:w-[1.2em] max-[640px]:align-[-0.22em]"
        />
    );
}

// "Position @ [logo] Company (badge)"
function Headline({ entry }: { entry: Entry }) {
    return (
        <>
            {entry.roles[0].title} @{" "}
            <Logo src={entry.logo} alt={entry.company} />
            {entry.href ? (
                <InlineLink href={entry.href}>{entry.company}</InlineLink>
            ) : (
                entry.company
            )}
            {entry.badge && (
                <>
                    {" "}
                    ( <Logo src={entry.badge.logo} alt={entry.badge.alt} />
                    {entry.badge.text})
                </>
            )}
        </>
    );
}

// The date column: the dates, and under them the place when it's worth
// naming. Phones show the byline instead.
function Meta({ role }: { role: Role }) {
    const dates = formatDates(role);

    return (
        <span
            className={`ledger-meta ${metaClassName} whitespace-nowrap leading-[1.6]`}
        >
            {dates}
            {role.location && (
                <span className="block font-normal">{role.location}</span>
            )}
        </span>
    );
}

// ---- Ledger: résumé rows. Headline and blurb on the left; dates in a
// fixed right-hand column, flush left so every range starts at the same
// edge, on the baseline of each row's first line. Earlier roles at the same
// place hang underneath on a rule, each with its own dates in the same
// column. Phones drop the column for a small byline under each role, so
// the text can use the full width.
function LedgerItem({ entry }: { entry: Entry }) {
    const [current, ...earlier] = entry.roles;

    return (
        <li>
            <div className="grid grid-cols-[minmax(0,1fr)_152px] items-baseline gap-x-[32px] max-[640px]:block">
                <div>
                    <p>
                        <Headline entry={entry} />
                        {entry.description && <> — {entry.description}</>}
                    </p>
                    <Byline role={current} />
                </div>
                <Meta role={current} />
                {earlier.map((role) => (
                    <Fragment key={role.title}>
                        <div className="mt-[6px] border-l border-(--accent-line) pl-[16px] text-base text-(--text-muted) max-[640px]:mt-[8px] max-[640px]:border-0 max-[640px]:pl-0">
                            <p>
                                <span className="italic">prev.</span>{" "}
                                {role.title}
                            </p>
                            <Byline role={role} />
                        </div>
                        <Meta role={role} />
                    </Fragment>
                ))}
            </div>
        </li>
    );
}

// The phone's copy of the date column, on one line under the role. Screen
// readers already hear the column, so this one is hidden from them.
function Byline({ role }: { role: Role }) {
    const text = [formatDates(role), role.location].filter(Boolean).join(" · ");
    if (!text) return null;

    return (
        <p
            className={`ledger-byline mt-[4px] leading-[1.4] ${metaClassName}`}
            aria-hidden="true"
        >
            {text}
        </p>
    );
}

// Phones drop the bullets so entries sit flush with the section label
const listClassName =
    "ledger list-disc pl-[18px] ml-[16px] flex flex-col gap-[16px] text-lg leading-relaxed max-[640px]:ml-0 max-[640px]:list-none max-[640px]:gap-[20px] max-[640px]:pl-0";

export function ExperienceList({ entries }: { entries: Entry[] }) {
    return (
        <ul className={listClassName}>
            {entries.map((e) => (
                <LedgerItem key={e.company} entry={e} />
            ))}
        </ul>
    );
}
