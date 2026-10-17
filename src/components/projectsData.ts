import type { GalleryTopic } from "@/components/galleryData";

export type Project = {
    title: string;
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
    // Show the KV-cache demo in place of the cover; the gallery opens from
    // a chip on it instead
    demo?: boolean;
};

export const PROJECTS: Project[] = [
    {
        title: "Lumen",
        href: "https://github.com/dark-sorceror/Lumen",
        description: "What did my agent forget? Context loss, made visible",
        summary:
            "Context fills to 100%, and every compaction or backtrack quietly throws away something the agent knew. Lumen makes that loss visible: what was kept, what was dropped, and what rebuilding it cost, measured on every request inside Claude Code.",
        topic: "lumen-arch",
        demo: true,
    },
    {
        title: "Goosetriever",
        href: "https://github.com/dark-sorceror/hack-the-north-2026",
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
