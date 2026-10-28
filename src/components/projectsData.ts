import type { GalleryTopic } from "@/components/galleryData";

export type Project = {
    title: string;
    // The GitHub repo, linked under the caption by its path
    href: string;
    description: string;
    // A sentence or two of prose, shown in the featured project's caption
    summary?: string;
    // Key into GALLERIES; its first image is the tile's cover
    topic: GalleryTopic;
    // A prize the project won, shown as a chip on its cover
    award?: {
        label: string;
        event: string;
        // The prize in full, for the tooltip and screen readers; the chip
        // itself stays short
        prize?: string;
    };
    // Show the Drew on demo in place of the cover; the gallery opens from
    // a chip on it instead
    demo?: boolean;
};

export const PROJECTS: Project[] = [
    {
        title: "Lumen",
        href: "https://github.com/dark-sorceror/Lumen",
        description: "See what your agent sees",
        summary:
            "Agents answer from context you never get to see. Lumen shows it, reply by reply: the files, commands and messages each answer drew on, and what got cut when the context ran out. So when an agent goes wrong, you can see why. It works with local models, your own API keys, Claude Code and Codex.",
        topic: "lumen",
        demo: true,
    },
    {
        title: "Goosetriever",
        href: "https://github.com/dark-sorceror/Goosetriever",
        description:
            "Voice-controlled assistive robot that fetches dropped items",
        topic: "goosetriever",
        award: {
            label: "Winner",
            event: "Hack the North 2026",
            prize: "Best use of Huawei's Real-Time Multimodal AI",
        },
    },
    {
        title: "Neurinese",
        href: "https://github.com/dark-sorceror/Neurinese",
        description: "Grammarly and Copilot for handwritten Chinese",
        topic: "neurinese",
    },
];
