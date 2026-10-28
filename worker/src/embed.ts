import type { Step } from "./input";

// A row of the visits table
export interface Visit {
    id: number;
    created_at: string;
    country: string | null;
    region: string | null;
    city: string | null;
    timezone: string | null;
    asn: number | null;
    org: string | null;
    ip_hash: string | null;
    device: string | null;
    browser: string | null;
    os: string | null;
    language: string | null;
    entry: string | null;
    referrer: string | null;
    referrer_host: string | null;
    via: string | null;
    message_id: string | null;
    edit_token: string;
    // Its steps, as JSON
    session: string | null;
    galleries: string | null;
    visitor: string | null;
    duration_ms: number | null;
    pages: string | null;
    updated_at: string;
}

export type Embed = ReturnType<typeof buildEmbed>;

// Discord rejects a field over 1024 characters, and the whole message with it
export const FIELD_LIMIT = 1024;

// Visits from wrangler dev post to the same channel as live ones, so
// they're marked three ways: the title, this colour and the footer
const COLOR = 0x393a41;
const DEV_COLOR = 0xf0b232;
// A visit from a tagged link gets its own colour, except in dev, where the
// dev colour always shows
const VIA_COLOR = 0x57f287;

const WAITING = "Tracking (has not left website yet)...";

export function visitorTitle(id: number, dev: boolean) {
    const title = `Visitor #${id.toLocaleString("en-US")}`;

    return dev ? `[dev] ${title}` : title;
}

// The raw IP isn't stored, so it's passed in from the request
export function buildEmbed(visit: Visit, ip: string | null, dev: boolean) {
    const isp = visit.asn
        ? `${visit.org ?? "?"} (AS${visit.asn})`
        : (visit.org ?? "?");

    const fields = [
        {
            name: "📍 Location",
            value: `${visit.city ?? "?"}, ${visit.region ?? "?"}\n${countryName(visit.country)}\n\`${localTime(visit.created_at, visit.timezone)}\``,
            inline: true,
        },
        {
            name: "🌐 Network",
            value:
                visit.device === "Desktop"
                    ? `\`${ip ?? "unknown"}\`\n${isp}`
                    : isp,
            inline: true,
        },
        {
            name: "🖥 Device",
            value: `${visit.browser ?? "?"}\n${visit.os ?? "?"}`,
            inline: true,
        },
        {
            name: "🌍 Language",
            value: `\`${visit.language ?? "?"}\``,
            inline: true,
        },
        { name: "📄 Entry", value: `\`${visit.entry ?? "/"}\``, inline: true },
        {
            name: "🔗 Referrer",
            value:
                visit.referrer && visit.referrer_host
                    ? `[${visit.referrer_host}](${visit.referrer})`
                    : "Direct",
            inline: true,
        },
        ...(visit.via
            ? [{ name: "🎯 Link", value: `\`${visit.via}\``, inline: true }]
            : []),
        {
            name:
                visit.duration_ms === null
                    ? "📊 Session"
                    : `📊 Session · ${duration(visit.duration_ms)}`,
            value: sessionField(steps(visit.session)),
            inline: false,
        },
    ];

    return {
        title: visitorTitle(visit.id, dev),
        color: dev ? DEV_COLOR : visit.via ? VIA_COLOR : COLOR,
        fields: fields.map((field) => ({
            ...field,
            value: clip(field.value),
        })),
        footer: {
            text: dev ? "haoyan.ca analytics · dev" : "haoyan.ca analytics",
        },
        timestamp: visit.created_at,
    };
}

// "42s", "3m 5s", "1h 12m"
export function duration(ms: number) {
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;

    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

// The stored steps; none until the page first sends them
function steps(session: string | null): Step[] {
    try {
        const parsed: unknown = JSON.parse(session ?? "[]");

        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function stepLine(step: Step) {
    if (step.type === "page") return `; ${step.path}  (${duration(step.ms)})`;
    if (step.type === "gallery")
        return `[ Opened ${step.title} gallery · ${step.seen}/${step.total} ]`;

    return `[ Visited ${step.label} ]`;
}

// A line per step in an ini block, which colours them. A field over the
// limit would leave the message stuck as it was, so a long visit keeps its
// newest lines and notes how many came before.
export function sessionField(visitSteps: Step[]) {
    const wrap = (lines: string[]) => `\`\`\`ini\n${lines.join("\n")}\`\`\``;
    const lines = visitSteps.map(stepLine);
    if (!lines.length) return wrap([WAITING]);

    const kept = [...lines];

    while (kept.length && wrap(kept).length > FIELD_LIMIT) {
        kept.shift();
        const note = `; … ${lines.length - kept.length} earlier`;
        if (wrap([note, ...kept]).length <= FIELD_LIMIT)
            return wrap([note, ...kept]);
    }

    return wrap(kept);
}

function clip(value: string) {
    return value.length > FIELD_LIMIT
        ? `${value.slice(0, FIELD_LIMIT - 1)}…`
        : value;
}

const REGIONS = new Intl.DisplayNames(["en"], { type: "region" });

// D1 keeps the two-letter code, for stats; the embed spells it out
function countryName(code: string | null) {
    if (!code) return "?";

    try {
        return REGIONS.of(code) ?? code;
    } catch {
        return code;
    }
}

// The visitor's own clock when they arrived
function localTime(at: string, timeZone: string | null) {
    if (!timeZone) return "?";

    try {
        return new Date(at).toLocaleString("en-US", {
            timeZone,
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return "?";
    }
}
