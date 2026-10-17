export type Role = {
    title: string;
    start: string; // "Sep 2026"
    end?: string; // omitted while ongoing
    // Shown under the dates. Left off where the name already says it,
    // like McMaster University in Hamilton.
    location?: string;
};

export type Entry = {
    // Newest first; roles[0] is the headline position
    roles: Role[];
    company: string;
    href?: string;
    logo: string;
    // Small trailing badge, e.g. the YC batch
    badge?: { logo: string; alt: string; text: string };
    description?: string;
};

export const CURRENTLY: Entry[] = [
    {
        roles: [
            {
                title: "Founding Engineer",
                start: "Sep 2026",
                location: "San Francisco, CA",
            },
            {
                title: "Software Engineer Intern",
                start: "May 2026",
                end: "Aug 2026",
            },
        ],
        company: "TraceRoot.AI",
        href: "https://traceroot.ai",
        logo: "/media/traceroot_ai_logo.png",
        badge: {
            logo: "/media/ycombinator_logo.png",
            alt: "Y Combinator",
            text: "YC S25",
        },
        description:
            "building infrastructure that lets AI agents debug and fix themselves",
    },
    {
        roles: [
            {
                title: "Embedded Systems & Controls Software Lead",
                start: "Sep 2026",
                location: "Hamilton, ON",
            },
            {
                title: "Embedded Systems Software Engineer",
                start: "Oct 2025",
                end: "Sep 2026",
            },
        ],
        company: "McMaster Exoskeleton",
        href: "https://www.macexo.com",
        logo: "/media/mcmaster_exoskeleton_logo.png",
        description:
            "500 Hz IMU acquisition and a distributed CAN network for a powered exoskeleton",
    },
    {
        roles: [{ title: "AI/ML", start: "Nov 2025" }],
        company: "McMaster EcoCAR",
        href: "https://www.macecocar.ca",
        logo: "/media/mcmaster_ecocar_logo.jpg",
        description:
            "model-based controls, diagnostics and perception for an autonomous EV",
    },
    {
        roles: [
            {
                title: "Software Engineering",
                start: "Sep 2025",
                end: "Apr 2029",
            },
        ],
        company: "McMaster University",
        logo: "/media/mcmaster_logo.png",
    },
];

export const PREVIOUSLY: Entry[] = [
    {
        roles: [
            {
                title: "Autonomous & Mechanical Engineer",
                start: "Sep 2022",
                end: "Jun 2025",
                location: "Calgary, AB",
            },
        ],
        company: "VEX Robotics Team 3388N",
        href: "https://github.com/dark-sorceror/Nova_High-Stakes-2024-25",
        logo: "/media/nova_robotics_logo.png",
        description:
            "6th of 200 teams at Canada's largest VEX tournament; built the full autonomous nav stack in C/C++",
    },
    {
        roles: [{ title: "Robotics Coach", start: "" }],
        company: "Western Mechatronics",
        href: "https://www.westernmech.ca/",
        logo: "/media/western_mechatronics_logo.png",
    },
    {
        roles: [
            { title: "Diploma Programme", start: "Sep 2022", end: "May 2025" },
        ],
        company: "International Baccalaureate",
        logo: "/media/ib_logo.png",
    },
];

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

const parse = (d: string) => {
    const [month, year] = d.split(" ");
    return { month, year, index: Number(year) * 12 + MONTHS.indexOf(month) };
};

// As much detail as the stint needs. Current and short roles keep their
// months ("Sep 2026 – Now", "May – Aug 2026", "Oct 2025 – Sep 2026"),
// where a bare year would hide a summer internship. Finished stints of a
// year or more read as years ("2022 – 2025"). Empty when the start is
// unknown.
export function formatDates({ start, end }: Role) {
    if (!start) return "";
    if (!end) return `${start} – Now`;

    const from = parse(start);
    const to = parse(end);
    if (to.index - from.index >= 12) return `${from.year} – ${to.year}`;
    if (from.year === to.year) return `${from.month} – ${end}`;
    return `${start} – ${end}`;
}
