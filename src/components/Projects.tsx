"use client";

import { useState } from "react";

import { GALLERIES, type GalleryTopic } from "@/components/galleryData";
import { InlineLink } from "@/components/InlineLink";
import { Lightbox } from "@/components/Lightbox";
import { LumenDemo } from "@/components/LumenDemo";
import { PROJECTS } from "@/components/projectsData";
import { GithubIcon } from "@/components/SidebarLinks";
import { trackGalleryView } from "@/lib/session";
import styles from "./Projects.module.css";

// Project tiles, captioned like the bookshelf: a cover photo, then the name
// and one line under it, then where its code lives. The first project is
// featured across the row. The cover opens that project's gallery.
export function Projects() {
    const [open, setOpen] = useState<{
        topic: GalleryTopic;
        index: number;
    } | null>(null);

    const show = (topic: GalleryTopic, index: number) => {
        const images = GALLERIES[topic];
        const title = PROJECTS.find((p) => p.topic === topic)?.title ?? topic;

        setOpen({ topic, index });
        trackGalleryView(topic, title, images[index].alt, images.length);
    };

    return (
        <>
            <ul className={styles.grid}>
                {PROJECTS.map((project, i) => {
                    const images = GALLERIES[project.topic];
                    const cover = images[0];

                    return (
                        <li
                            key={project.title}
                            className={`${styles.tile} ${i === 0 ? styles.featured : ""}`}
                        >
                            {project.demo ? (
                                <LumenDemo
                                    onOpenGallery={() => show(project.topic, 0)}
                                    held={open !== null}
                                />
                            ) : (
                                cover && (
                                    <button
                                        type="button"
                                        className={styles.cover}
                                        onClick={() => show(project.topic, 0)}
                                        aria-label={`View ${project.title} photos${
                                            project.award
                                                ? ` (${[project.award.label, project.award.prize, project.award.event].filter(Boolean).join(", ")})`
                                                : ""
                                        }`}
                                    >
                                        <img
                                            src={cover.src}
                                            alt=""
                                            width={cover.width}
                                            height={cover.height}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        {project.award && (
                                            <span
                                                className={styles.award}
                                                title={project.award.prize}
                                            >
                                                {project.award.label} ·{" "}
                                                {project.award.event}
                                            </span>
                                        )}
                                        {images.length > 1 && (
                                            <span className={styles.count}>
                                                1 / {images.length}
                                            </span>
                                        )}
                                    </button>
                                )
                            )}
                            <span className={styles.title}>
                                {project.title}
                            </span>
                            <span className={styles.description}>
                                {project.description}
                            </span>
                            {project.summary && (
                                <p className={styles.summary}>
                                    {project.summary}
                                </p>
                            )}
                            <InlineLink
                                href={project.href}
                                className={styles.source}
                            >
                                <GithubIcon />
                                <span className="sr-only">GitHub: </span>
                                {new URL(project.href).pathname.slice(1)}
                            </InlineLink>
                        </li>
                    );
                })}
            </ul>

            {open && (
                <Lightbox
                    images={GALLERIES[open.topic]}
                    index={open.index}
                    onClose={() => setOpen(null)}
                    onIndexChange={(i) => show(open.topic, i)}
                />
            )}
        </>
    );
}
