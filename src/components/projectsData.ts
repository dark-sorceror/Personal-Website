export type Project = {
    title: string;
    href: string;
    description: string;
    // A sentence or two of prose, shown in the featured project's caption
    summary?: string;
    // Key into GALLERIES; its first image is the tile's cover
    topic: string;
    // A prize the project won, shown as a chip on its cover
    award?: { label: string; event: string };
    // Show the KV-cache demo in place of the cover; the gallery opens from
    // a chip on it instead
    demo?: boolean;
};

export const PROJECTS: Project[] = [
    {
        title: "Lumen",
        href: "https://github.com/dark-sorceror/Lumen",
        description: "LLM context debugger: why one edit costs 99× another",
        summary:
            "Edit an LLM's context mid-generation and keep going. Lumen owns the MLX decode loop, so it keeps the cached prefix and re-prefills only the suffix that changed.",
        topic: "lumen-arch",
        demo: true,
    },
    {
        title: "Goosetriever",
        href: "https://github.com/dark-sorceror/hack-the-north-2026",
        description: "Voice fetch robot: lidar mapping, A* nav, safety chain",
        topic: "goosetriever",
        award: { label: "Winner", event: "Hack the North 2026" },
    },
    {
        title: "Neurinese",
        href: "https://github.com/dark-sorceror/Neurinese",
        description: "Grammarly and Copilot for handwritten Chinese",
        topic: "neurinese",
    },
];
