export type Project = {
    title: string;
    href: string;
    description: string;
    // Key into GALLERIES; its first image is the tile's cover
    topic: string;
};

export const PROJECTS: Project[] = [
    {
        title: "Lumen",
        href: "https://github.com/dark-sorceror/Lumen",
        description:
            "A debugger for LLM context, measuring from inside the model why one edit can cost 99× another of the same size",
        topic: "lumen-arch",
    },
    {
        title: "Goosetriever",
        href: "https://github.com/dark-sorceror/hack-the-north-2026",
        description:
            "A voice-controlled robot that fetches what you dropped, for people who can't reach the floor; built its lidar mapping, A* navigation and safety chain at Hack the North 2026",
        topic: "goosetriever",
    },
    {
        title: "Neurinese",
        href: "https://github.com/dark-sorceror/Neurinese",
        description: "Grammarly/Copilot for handwritten Chinese",
        topic: "neurinese",
    },
];
