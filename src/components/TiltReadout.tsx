"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { tilt, tiltNeedsPermission, tiltSupported } from "@/lib/tilt";
import styles from "./TiltReadout.module.css";

// Telemetry refresh; the sensors run faster, but text this small blurs
const REFRESH_MS = 125;
const KICK_MS = 400; // how long the LED flares after a shake

type Mode = "off" | "arm" | "live";

const subscribe = (onChange: () => void) => {
    if (!tiltSupported()) return () => {};

    const release = tilt.acquire();
    const off = tilt.onChange(onChange);

    return () => {
        off();
        release();
    };
};

// Phones only. iOS shows a button to grant access; elsewhere the readout
// appears once readings arrive, and nothing shows if they never do.
const getMode = (): Mode => {
    if (!tiltSupported()) return "off";
    if (tilt.live) return "live";
    if (tilt.waiting && !tilt.unavailable && tiltNeedsPermission()) {
        return "arm";
    }

    return "off";
};

const angle = (deg: number) =>
    `${deg < 0 ? "−" : "+"}${Math.abs(deg).toFixed(1)}°`.padStart(6);

/** A live roll / pitch / rate readout of the phone's motion sensors */
export function TiltReadout() {
    const mode = useSyncExternalStore(subscribe, getMode, () => "off");
    const rootRef = useRef<HTMLDivElement>(null);
    const rollRef = useRef<HTMLSpanElement>(null);
    const pitchRef = useRef<HTMLSpanElement>(null);
    const hzRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (mode !== "live") return;

        let kick = 0;

        const update = () => {
            if (rollRef.current) rollRef.current.textContent = angle(tilt.roll);
            if (pitchRef.current) {
                pitchRef.current.textContent = angle(tilt.pitch);
            }
            if (hzRef.current) {
                hzRef.current.textContent = String(
                    Math.round(tilt.rate.hz),
                ).padStart(3);
            }
        };

        const offShake = tilt.onShake(() => {
            const root = rootRef.current;

            if (!root) return;

            root.dataset.kick = "";
            clearTimeout(kick);
            kick = window.setTimeout(() => delete root.dataset.kick, KICK_MS);
        });

        update();

        const timer = setInterval(update, REFRESH_MS);

        return () => {
            clearInterval(timer);
            clearTimeout(kick);
            offShake();
        };
    }, [mode]);

    if (mode === "arm") {
        return (
            <button
                type="button"
                className={`${styles.readout} ${styles.arm}`}
                aria-label="Use the motion sensors: tilt the phone to move the dots"
                onClick={() => void tilt.requestPermission()}
            >
                <span className={styles.row}>
                    <span className={styles.led} />
                    IMU off
                </span>
                <span className={styles.row}>tap to arm</span>
            </button>
        );
    }

    if (mode !== "live") return null;

    return (
        <div ref={rootRef} className={styles.readout} aria-hidden>
            <span className={styles.row}>
                <span className={`${styles.led} ${styles.on}`} />
                IMU
                <span className={styles.value}>
                    <span ref={hzRef}>{"  0"}</span> Hz
                </span>
            </span>
            <span className={styles.row}>
                roll
                <span ref={rollRef} className={styles.value} />
            </span>
            <span className={styles.row}>
                pitch
                <span ref={pitchRef} className={styles.value} />
            </span>
        </div>
    );
}
