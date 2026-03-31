import { useState } from "react";

import { trackLinkClick } from "../hook/session";

import { GalleryRow } from "../components/Gallery";
import { Lightbox } from "../components/Lightbox";
import FadeIn from "../components/Fade Effect";

import type { MediaItem, ProjectItem } from "../types";

import neurinese_1 from "../media/neurinese_1.gif";
import neurinese_2 from "../media/neurinese_2.png";
import neurinese_3 from "../media/neurinese_3.png";
import neurinese_4 from "../media/neurinese_4.png";
import neurinese_5 from "../media/neurinese_5.png";
import neurinese_6 from "../media/neurinese_6.png";
import verifai_1 from "../media/verifai_1.png";
import verifai_2 from "../media/verifai_2.png";
import verifai_3 from "../media/verifai_3.png";
import spongebob_1 from "../media/spongebob_1.png";

import "./index.css";

const projects: ProjectItem[] = [
    {
        title: "Neurinese",
        tags: [
            "Deep Learning",
            "Generative AI",
            "PyTorch",
            "CVAE",
            "MDN",
            "LSTM",
            "CNN",
            "Python",
        ],
        period: "December 2025 — Present",
        link: "https://github.com/dark-sorceror/Neurinese",
        desc: "Grammarly/Copilot for Handwritten Chinese",
        bullets: [
            "Built a recurrent CVAE (BiLSTM encoder → autoregressive decoder) to encode pen trajectories into a continuous user-specific style embedding",
            "Discovered that standard MSE regression collapsed multimodal stroke paths into their mathematical mean — migrating decoder output to a Mixture Density Network (MDN) for stochastic Gaussian Mixture sampling to preserve expressive variability",
            "Reduced stroke noise using Ramer–Douglas–Peucker simplification, improving training stability",
            "Designed an end-to-end pipeline: CNN → CVAE → n-gram LM → MDN decoder for style-conditioned character generation",
        ],
        media: [
            {
                type: "image",
                src: neurinese_1,
                caption:
                    "Working demo of autocompletion with consistent handwriting style",
                fit: "contain",
            },
            {
                type: "image",
                src: neurinese_2,
                caption: "Cross character style transfer",
            },
            {
                type: "image",
                src: neurinese_3,
                caption: "High level pipeline architecture",
            },
            { type: "image", src: neurinese_4, caption: "VAE architecture" },
            {
                type: "image",
                src: neurinese_5,
                caption: "Graphs comparing two loss functions during training",
            },
            {
                type: "image",
                src: neurinese_6,
                caption: "t-SNE of different handwriting styles",
            },
        ],
        featured: true,
    },
    {
        title: "Latent Guesser",
        tags: ["Transformers", "Deep Learning"],
        period: "April 2025 — Present (Planned)",
        desc: "Can a model guess without context?",
        bullets: [
            "Exploring how transformers “guess” by analyzing entropy, priors, and uncertainty under zero context.",
        ],
    },
    {
        title: "ClaudeOps",
        tags: ["Agentic AI", "DevOps", "Claude API", "FastAPI", "Python"],
        period: "March 2026 — Present",
        link: "https://github.com/dark-sorceror/ClaudeOps",
        desc: "An orchestrated team of Claude-powered AI agents that takes a GitLab issue and autonomously produces a complete, ready-to-review MR — with code, tests, and a security scan",
    },
    {
        title: "VerifAI",
        tags: [
            "Computer Vision",
            "LLM",
            "Inference Optimization",
            "Gemini API",
            "FastAPI",
            "Python",
        ],
        period: "February 2026 — March 2026",
        link: "https://github.com/dark-sorceror/VerifAI",
        desc: "Multimodal misinformation detection across text, video, and images",
        bullets: [
            "Designed a dual-backend system: FastAPI for media routing + Flask service for LLM-based credibility analysis",
            "Built a video analysis pipeline using yt-dlp + OpenCV, feeding frames into multimodal LLM evaluation",
            "Implemented Redis caching and structured scoring models for efficient repeated analysis",
        ],
        media: [
            { type: "image", src: verifai_1, caption: "Analysis of tweet" },
            { type: "image", src: verifai_2, caption: "Analysis of tweet" },
            {
                type: "image",
                src: verifai_3,
                caption: "High level pipeline architecture",
            },
        ],
    },
    {
        title: "Syntra",
        tags: [
            "Behavioral AI",
            "LSTM",
            "Next.js",
            "Electron",
            "FastAPI",
            "PostgreSQL",
            "Python",
        ],
        period: "November 2025 — Present",
        link: "https://github.com/dark-sorceror/Syntra",
        desc: "An AI-native calendar that learns how you actually schedule — not just what you put in, but when, how often, and how your habits shift over time",
        bullets: [
            "Built an LSTM-based model to learn user scheduling patterns and predict optimal event time slots",
            "Developed a full-stack system (Next.js, Electron, FastAPI, PostgreSQL) with Dockerized deployment",
            "Designed a passive behavioral modeling system that improves recommendations over time without manual input",
        ],
    },
    {
        title: "Spongebob",
        tags: ["Node.js", "MongoDB", "Discord.js", "REST API"],
        period: "February 2022 — September 2022",
        link: "https://github.com/dark-sorceror/Spongebob",
        desc: "A scalable Discord bot for automated giveaway management — one of my first real engineering projects.",
        bullets: [
            "Scaled to 50,000+ users across Discord servers with persistent MongoDB-backed state management",
            "Implemented rate-limited API handling to operate reliably within Discord constraints",
            "Built when I was first learning JavaScript — marks the start of the engineering habits (APIs, databases, async systems) that carried into everything after",
        ],
        media: [
            {
                type: "image",
                src: spongebob_1,
                caption: "Screenshot of giveaway embed",
            },
        ],
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
    const [activeMedia, setActiveMedia] = useState<MediaItem[]>([]);
    const [activeTitle, setActiveTitle] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openLightbox = (media: MediaItem[], index: number, title: string) => {
        setActiveMedia(media);
        setCurrentIndex(index);
        setActiveTitle(title);
        setIsOpen(true);
    };

    return (
        <>
            <div className="projects-wrapper">
                <div className="projects-area">
                    {projects.map((prj, index) => (
                        <FadeIn
                            key={index}
                            delay={`${index * 0.2}s`}
                            className={`projects-row${prj.featured ? " featured" : ""}`}
                        >
                            <div className="content-col">
                                <div className="project-header">
                                    <div className="project-title">
                                        {prj.title}
                                        {prj.featured && (
                                            <span className="featured-pill">
                                                Featured
                                            </span>
                                        )}
                                    </div>

                                    {prj.link && (
                                        <a
                                            className="project-goto"
                                            href={prj.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() =>
                                                trackLinkClick(
                                                    `GitHub — ${prj.title}`,
                                                    prj.link!,
                                                )
                                            }
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
                isOpen={isOpen}
                media={activeMedia}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
                onClose={() => setIsOpen(false)}
                contextTitle={activeTitle}
            />
        </>
    );
}
