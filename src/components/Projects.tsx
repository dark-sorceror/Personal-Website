"use client";

import { useState } from "react";

import { GALLERIES } from "@/components/galleryData";
import { Lightbox } from "@/components/Lightbox";
import { PROJECTS } from "@/components/projectsData";
import { trackLightboxView, trackLinkClick } from "@/lib/session";
import styles from "./Projects.module.css";

// A row of project tiles, laid out like the bookshelf: a cover photo, then
// the name and one line under it. The cover opens that project's gallery.
export function Projects() {
    const [open, setOpen] = useState<{ topic: string; index: number } | null>(
        null,
    );

    const show = (topic: string, index: number) => {
        setOpen({ topic, index });
        trackLightboxView(topic, GALLERIES[topic][index].alt);
    };

    return (
        <>
            <div className={styles.scroller}>
                <ul className={styles.grid}>
                    {PROJECTS.map((project) => {
                        const images = GALLERIES[project.topic] ?? [];
                        const cover = images[0];

                        return (
                            <li key={project.title} className={styles.tile}>
                                {cover && (
                                    <button
                                        type="button"
                                        className={styles.cover}
                                        onClick={() => show(project.topic, 0)}
                                        aria-label={`View ${project.title} photos${
                                            project.award
                                                ? ` (${project.award.label}, ${project.award.event})`
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
                                            <span className={styles.award}>
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
                                )}
                                <a
                                    href={project.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.title}
                                    onClick={() =>
                                        trackLinkClick(
                                            project.title,
                                            project.href,
                                        )
                                    }
                                >
                                    {project.title}
                                </a>
                                <span className={styles.description}>
                                    {project.description}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>

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
