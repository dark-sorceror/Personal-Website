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
            className="relative -top-[2px] mr-[5px] inline h-[27px] w-[27px] object-contain align-middle phone:top-0 phone:mr-[4px] phone:h-[1.2em] phone:w-[1.2em] phone:align-[-0.22em]"
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

// A role's dates, and the place when it's worth naming. On desktop this is
// the right-hand column, with the place on a line of its own; phones have no
// room for the column, so it becomes one line under the role instead.
function Meta({ role }: { role: Role }) {
    const dates = formatDates(role);
    if (!dates && !role.location) return null;

    return (
        <p
            className={`${metaClassName} whitespace-nowrap leading-[1.6] phone:mt-[4px] phone:whitespace-normal phone:leading-[1.4]`}
        >
            {dates}
            {role.location && (
                <span className="block font-normal phone:inline phone:font-semibold phone:before:content-['_·_']">
                    {role.location}
                </span>
            )}
        </p>
    );
}

// ---- Ledger: résumé rows. Headline and blurb on the left; dates in a
// fixed right-hand column, flush left so every range starts at the same
// edge, on the baseline of each row's first line. Earlier roles at the same
// place hang underneath on a rule, each with its own dates in the same
// column. On phones the grid falls away and the dates sit under each role,
// so the text can use the full width.
function LedgerItem({ entry }: { entry: Entry }) {
    const [current, ...earlier] = entry.roles;

    return (
        <li className="pl-[6px] phone:pl-0">
            <div className="grid grid-cols-[minmax(0,1fr)_152px] items-baseline gap-x-[32px] phone:block">
                <div>
                    <p>
                        <Headline entry={entry} />
                        {entry.description && <> — {entry.description}</>}
                    </p>
                </div>
                <Meta role={current} />
                {earlier.map((role) => (
                    <Fragment key={role.title}>
                        <div className="mt-[6px] border-l border-(--accent-line) pl-[16px] text-base text-(--text-muted) phone:mt-[8px] phone:border-0 phone:pl-0">
                            <p>
                                <span className="italic">prev.</span>{" "}
                                {role.title}
                            </p>
                        </div>
                        <Meta role={role} />
                    </Fragment>
                ))}
            </div>
        </li>
    );
}

// Phones drop the bullets so entries sit flush with the section label
const listClassName =
    "list-disc pl-[18px] ml-[16px] flex flex-col gap-[16px] text-lg leading-relaxed phone:ml-0 phone:list-none phone:gap-[20px] phone:pl-0";

export function ExperienceList({ entries }: { entries: Entry[] }) {
    return (
        <ul className={listClassName}>
            {entries.map((e) => (
                <LedgerItem key={e.company} entry={e} />
            ))}
        </ul>
    );
}
