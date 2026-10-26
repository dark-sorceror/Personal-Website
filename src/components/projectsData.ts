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
    // Show the KV-cache demo in place of the cover; the gallery opens from
    // a chip on it instead
    demo?: boolean;
};

export const PROJECTS: Project[] = [
    {
        title: "Lumen",
        href: "https://github.com/dark-sorceror/Lumen",
        description: "See what your agent sees",
        summary:
            "Most AI chats show you the answer, not the context behind it. Lumen puts local models, your own keys, Claude Code and Codex in one place, and shows what each reply had to work with: what compaction dropped, and the files, commands and quotes it drew on.",
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
