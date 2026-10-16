export type Role = {
    title: string;
    start: string; // "Sep 2026"
    end?: string; // omitted while ongoing
    note?: string; // "Part-time", "Internship"
};

export type Entry = {
    // Newest first; roles[0] is the headline position
    roles: Role[];
    company: string;
    href?: string;
    logo: string;
    // Small trailing badge, e.g. the YC batch
    badge?: { logo: string; alt: string; text: string };
    location?: string;
    description?: string;
};

export const CURRENTLY: Entry[] = [
    {
        roles: [
            {
                title: "Founding Engineer",
                start: "Sep 2026",
                note: "Part-time",
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
        location: "San Francisco, CA",
        description:
            "building infrastructure that lets AI agents debug and fix themselves",
    },
    {
        roles: [
            {
                title: "Embedded Systems & Controls Software Lead",
                start: "Sep 2026",
            },
            {
                title: "Embedded Systems Software Engineer",
                start: "Oct 2025",
                end: "Sep 2026",
            },
        ],
        company: "McMaster Exoskeleton",
        logo: "/media/mcmaster_exoskeleton_logo.png",
        location: "Hamilton, ON",
        description:
            "500 Hz IMU acquisition and a distributed CAN network for a powered exoskeleton",
    },
    {
        roles: [{ title: "AI/ML", start: "Nov 2025" }],
        company: "McMaster EcoCAR",
        logo: "/media/mcmaster_ecocar_logo.jpg",
        location: "Hamilton, ON",
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
        location: "Hamilton, ON",
    },
];

export const PREVIOUSLY: Entry[] = [
    {
        roles: [
            {
                title: "Autonomous & Mechanical Engineer",
                start: "Sep 2022",
                end: "Jun 2025",
            },
        ],
        company: "VEX Robotics Team 3388N",
        href: "https://github.com/dark-sorceror/Nova_High-Stakes-2024-25",
        logo: "/media/nova_robotics_logo.png",
        location: "Calgary, AB",
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
        location: "Calgary, AB",
    },
];

const year = (d: string) => d.split(" ")[1];

// "May – Aug 2026" within a year, "Oct 2025 – Sep 2026" across years,
// "Sep 2026 – Present" while ongoing. Empty when the start is unknown.
export function formatRange(start: string, end?: string) {
    if (!start) return "";
    if (!end) return `${start} – Present`;
    if (year(start) === year(end)) return `${start.split(" ")[0]} – ${end}`;
    return `${start} – ${end}`;
}
