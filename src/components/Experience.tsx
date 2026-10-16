import { InlineLink } from "@/components/InlineLink";
import {
    formatRange,
    formatYears,
    type Entry,
} from "@/components/experienceData";

// Small-caps sans for dates and places, matching the section labels
const metaClassName =
    "font-[system-ui] text-xs font-semibold uppercase tracking-[0.08em] text-(--text-muted)";

function Logo({ src, alt }: { src: string; alt: string }) {
    return (
        <img
            src={src}
            alt={alt}
            className="relative -top-[2px] mr-[5px] inline h-[27px] w-[27px] object-contain align-middle"
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

// Right-hand metadata: the full range (and place) and a compact year form,
// stacked in one cell. The ledger rules in globals.css pick which one shows;
// the year form is visual only, so screen readers always hear the full text.
function Meta({
    full,
    short,
    className = "",
}: {
    full: React.ReactNode;
    short: string;
    className?: string;
}) {
    return (
        <span className={`ledger-meta ${metaClassName} ${className}`}>
            <span className="ledger-full">{full}</span>
            <span className="ledger-short" aria-hidden="true">
                {short}
            </span>
        </span>
    );
}

// ---- Ledger: résumé rows. Headline and blurb on the left; dates with the
// place under them in a right-hand column. Earlier roles at the same place
// hang underneath on a ruled list, each with its own dates.
function LedgerItem({ entry }: { entry: Entry }) {
    const [current, ...earlier] = entry.roles;
    const dates = formatRange(current.start, current.end);

    return (
        <li>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-[56px] max-[640px]:grid-cols-1">
                <p>
                    <Headline entry={entry} />
                    {entry.description && <> — {entry.description}</>}
                </p>
                {(dates || entry.location) && (
                    <Meta
                        className="ledger-meta--main justify-items-end text-right leading-[1.6] whitespace-nowrap max-[640px]:justify-items-start max-[640px]:text-left"
                        short={formatYears(current.start, current.end)}
                        full={
                            <>
                                {dates}
                                {dates && entry.location && <br />}
                                <span className="font-normal">
                                    {entry.location}
                                </span>
                            </>
                        }
                    />
                )}
            </div>
            {earlier.length > 0 && (
                <ul className="mt-[6px] flex flex-col gap-[2px] border-l border-(--accent-line) pl-[16px]">
                    {earlier.map((role) => (
                        <li
                            key={role.title}
                            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-[24px] text-base text-(--text-muted) min-[641px]:gap-x-[56px]"
                        >
                            <span>
                                <span className="italic">prev.</span>{" "}
                                {role.title}
                            </span>
                            <Meta
                                className="ledger-meta--sub justify-items-end whitespace-nowrap"
                                short={formatYears(role.start, role.end)}
                                full={formatRange(role.start, role.end)}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}

const listClassName =
    "ledger list-disc pl-[18px] ml-[16px] flex flex-col gap-[12px] text-lg leading-relaxed";

export function ExperienceList({ entries }: { entries: Entry[] }) {
    return (
        <ul className={listClassName}>
            {entries.map((e) => (
                <LedgerItem key={e.company} entry={e} />
            ))}
        </ul>
    );
}
