import { useEffect, useRef, useState } from "react";

import { GalleryRow } from "../components/Gallery";
import { Lightbox } from "../components/Lightbox";
import FadeIn from "../components/Fade Effect";

import i8 from "../media/8.png";
import i9 from "../media/9.png";
import i10 from "../media/10.png";
import i11 from "../media/11.png";

import "./index.css";

type MediaItem = {
    type: "image";
    src: string;
    caption?: string;
};

type ProjectItem = {
    title: string;
    tags: string[];
    period: string;
    link?: string;
    desc: string;
    bullets?: string[];
    media?: MediaItem[];
};

const projects: ProjectItem[] = [
    {
        title: "Neurinese",
        tags: ["PyTorch", "VAE", "MDN", "CNN", "Python"],
        period: "December 2025 — Present",
        link: "https://github.com/dark-sorceror/Neurinese",
        desc: "A real-time handwriting intelligence engine for Chinese — Grammarly and Copilot in one, but for pen strokes. Instead of recognizing pixels, the system models the motion of writing itself.",
        bullets: [
            "Built a recurrent VAE architecture (bidirectional LSTM encoder → autoregressive LSTM decoder) that compresses raw pen-trajectory sequences (dx, dy, pen state) into a continuous latent style embedding per user.",
            "Discovered that standard MSE regression collapsed multimodal stroke paths into their mathematical mean — migrating decoder output to a Mixture Density Network (MDN) for stochastic Gaussian Mixture sampling to preserve expressive variability.",
            "Applied the Ramer–Douglas–Peucker algorithm during preprocessing to simplify stroke geometry and reduce noise before training.",
            "Designed a full pipeline: CNN for character recognition → VAE for style encoding → NLP n-gram model for next-character prediction → MDN decoder to synthesize the predicted character in the user's handwriting style.",
        ],
        media: [
            { type: "image", src: i9, caption: "Caption" },
            { type: "image", src: i8, caption: "Caption" },
        ],
    },
    {
        title: "VerifAI",
        tags: [
            "FastAPI",
            "React",
            "Electron",
            "Gemini API",
            "Python",
            "OpenCV",
        ],
        period: "October 2025 — Present",
        link: "https://github.com/dark-sorceror/VerifAI",
        desc: "A multimodal misinformation detection toolkit that analyzes screenshots, videos, and text.",
        bullets: [
            "Designed a dual-backend architecture: a FastAPI service handling media routing and analysis logic, and a Flask auxiliary server wrapping Google GenAI (Gemini) for LLM-based credibility analysis.",
            "Video processing pipeline uses yt-dlp for content retrieval and OpenCV for frame extraction, feeding into the Gemini vision analysis layer.",
            "Implemented Redis-backed caching for repeated analysis requests and structured response models for credibility scores.",
        ],
        media: [{ type: "image", src: i10, caption: "Caption" }],
    },
    {
        title: "Syntra",
        tags: ["Next.js", "Electron", "FastAPI", "Python", "LSTM", "Docker"],
        period: "2024 — Present",
        link: "https://github.com/dark-sorceror/Syntra",
        desc: "An AI-native calendar that learns how you actually schedule — not just what you put in, but when, how often, and how your habits shift over time.",
        bullets: [
            "Python backend uses an LSTM/FNN model to learn temporal scheduling patterns from a user's calendar history and predict optimal time slots for new events.",
            "Full-stack architecture: Next.js web frontend, Electron desktop app, FastAPI backend, and Dockerized deployment for consistent dev and prod environments.",
            "Designed to passively build a behavioral model over time, surfacing schedule suggestions without requiring manual input from the user.",
        ],
    },
    {
        title: "Spongebob",
        tags: ["Node.js", "MongoDB", "Discord.js", "REST API"],
        period: "September 2022 — February 2023",
        link: "https://github.com/dark-sorceror/Spongebob",
        desc: "A scalable Discord bot for automated giveaway management — one of my first real engineering projects.",
        bullets: [
            "Served over 50,000 peak users across multiple Discord servers with persistent MongoDB storage for giveaway state and winner tracking.",
            "Implemented rate-limited REST API request handling to stay within Discord's API constraints at scale.",
            "Built when I was first learning JavaScript — marks the start of the engineering habits (APIs, databases, async systems) that carried into everything after.",
        ],
        media: [{ type: "image", src: i11, caption: "Caption" }],
    },
];

const ArrowUpRight = () => (
    <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M2 8L8 2M8 2H3M8 2V7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export function Projects() {
    const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [activeMedia, setActiveMedia] = useState<MediaItem[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeTitle, setActiveTitle] = useState("");

    const openLightbox = (media: MediaItem[], index: number, title: string) => {
        setActiveMedia(media);
        setActiveIndex(index);
        setActiveTitle(title);
        setLightboxOpen(true);
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("in-view");

                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 },
        );

        itemsRef.current.forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <div className="projects-wrapper">
                <div className="projects-area">
                    {projects.map((prj, index) => (
                        <FadeIn
                            key={index}
                            delay={`${index * 0.1}s`}
                            className="projects-row"
                        >
                            <div className="content-col">
                                <div className="project-header">
                                    <div className="project-title">
                                        {prj.title}
                                    </div>
                                    {prj.link && (
                                        <a
                                            className="project-goto"
                                            href={prj.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            GitHub <ArrowUpRight />
                                        </a>
                                    )}
                                </div>

                                <div className="date-col">{prj.period}</div>

                                {prj.tags && prj.tags.length > 0 && (
                                    <div className="tag-row">
                                        {prj.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="tag"
                                                data-tag={tag}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <p className="description">{prj.desc}</p>
                                {prj.bullets && prj.bullets.length > 0 && (
                                    <ul className="description-bullets">
                                        {prj.bullets.map((b, i) => (
                                            <li key={i}>{b}</li>
                                        ))}
                                    </ul>
                                )}

                                {prj.media && prj.media.length > 0 && (
                                    <GalleryRow
                                        media={prj.media}
                                        onOpen={(idx) =>
                                            openLightbox(
                                                prj.media!,
                                                idx,
                                                prj.title,
                                            )
                                        }
                                    />
                                )}
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>

            <Lightbox
                isOpen={lightboxOpen}
                media={activeMedia}
                initialIndex={activeIndex}
                contextTitle={activeTitle}
                onClose={() => setLightboxOpen(false)}
            />
        </>
    );
}
