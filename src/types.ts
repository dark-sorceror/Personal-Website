export type MediaItem = {
    type: "image" | "video";
    src: string;
    caption?: string;
    fit?: "cover" | "contain";
};

export type ExperienceItem = {
    title: string;
    company: string;
    period: string;
    desc: string;
    bullets?: string[];
    media?: MediaItem[];
};

export type ProjectItem = {
    title: string;
    tags: string[];
    period: string;
    link?: string;
    desc: string;
    bullets?: string[];
    media?: MediaItem[];
    featured?: boolean;
};

export type ContactLink = {
    label: string;
    value: string;
    href: string;
    icon: React.ReactNode;
};
