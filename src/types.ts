export type MediaItem = {
    type: "image";
    src: string;
    caption?: string;
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
};

export type ContactLink = {
    label: string;
    value: string;
    href: string;
    icon: React.ReactNode;
};
