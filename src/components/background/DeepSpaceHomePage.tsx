"use client";

import { useEffect } from "react";
import { HomePage } from "@/components/HomePage";
import { DeepSpaceCanvas } from "./DeepSpaceCanvas";
import styles from "./deepSpace.module.css";

export function DeepSpaceHomePage() {
    useEffect(() => {
        document.documentElement.dataset.backdrop = "space";
        return () => {
            delete document.documentElement.dataset.backdrop;
        };
    }, []);

    return (
        <div className={styles.root}>
            <div className={styles.content} data-background-content>
                <HomePage
                    backgroundArt={<DeepSpaceCanvas />}
                    appearanceClassName={styles.appearance}
                />
            </div>
        </div>
    );
}
