import { useState } from "react";

import { GalleryRow } from "../components/Gallery";
import { Lightbox } from "../components/Lightbox";
import FadeIn from "../components/Fade Effect";

import type { ExperienceItem, MediaItem } from "../types";

import exo_1 from "../media/exo_1.jpg";
import exo_2 from "../media/exo_2.jpg";
import exo_3 from "../media/exo_3.png";
import robot_1 from "../media/robot_1.jpg";
import robot_2 from "../media/robot_2.jpg";
import robot_3 from "../media/robot_3.jpg";
import robot_4 from "../media/robot_4.jpg";
import robot_5 from "../media/robot_5.jpg";
import robot_6 from "../media/robot_6.jpg";

import "./index.css";

const experiences: ExperienceItem[] = [
    {
        title: "AI/ML Engineer",
        company: "McMaster EcoCAR EV Challenge",
        period: "November 2025 — Present",
        desc: "AI/ML for autonomous EV simulation, diagnostics, and control",
        bullets: [
            "Built and validated MATLAB/Simulink vehicle models to benchmark acceleration, braking, and drive-cycle efficiency (HWFET, UDDS, US06) against the Cadillac LYRIQ baseline",
            "Implemented SAE/ISO-compliant OBD diagnostics (J1979, UDS) over CAN using MATLAB Vehicle Network Toolbox (services $01, $03, $04, $09, $0A)",
            "Tuned EV powertrain and motor models by integrating LYRIQ data dictionaries and calibrating vehicle dynamics in simulation",
            "Developed perception and control modules: YOLO-based object detection, lane-keeping logic, and torque filtering for stable actuation",
        ],
    },
    {
        title: "Embedded Software Engineer",
        company: "McMaster Exoskeleton",
        period: "October 2025 — Present",
        desc: "Built real-time embedded systems for wearable exoskeleton",
        bullets: [
            "Achieved 500 Hz IMU sampling on LSM6DS3TR-C via DMA-based I2C, optimizing STM32 clock configuration (PLL/APB1) for deterministic timing",
            "Designed a multi-node CAN bus system connecting STM32 boards, IMUs, and a Raspberry Pi for distributed real-time control",
            "Built Python UART telemetry tools for live diagnostics, identifying timing bottlenecks prior to CAN integration",
        ],
        media: [
            {
                type: "image",
                src: exo_1,
                caption:
                    "Multi-node test bench with STM32 Nucleo, IMU modules, and Raspberry Pi 5 — upgraded to a 1 Mbps CAN transceiver",
            },
            {
                type: "image",
                src: exo_2,
                caption:
                    "Multi-node test bench: STM32 Nucleo, MPU-9250 and IMU modules, and Raspberry Pi 5 — CAN bus running at 500 kbps during early integration testing",
            },
            {
                type: "image",
                src: exo_3,
                caption:
                    "Live UART telemetry output from the LSM6DS3TR-C IMU used to diagnose clock bottlenecks during firmware development",
            },
        ],
    },
    {
        title: "Lead Software & Mechanical Engineer",
        company: "VEX Robotics Team 3388N Nova",
        period: "September 2022 — June 2025",
        desc: "Co-led all software and mechanical design over three seasons, placing 6th among 200 teams at Canada's largest VEX robotics tournament.",
        bullets: [
            "Developed an autonomous navigation stack (C/C++): PID control, velocity profiling, pure pursuit, and Monte Carlo localization",
            "Built a concurrent real-time control system with mutex-based task scheduling for safe and robust competition operation",
            "Designed and iterated mechanical subsystems in CAD (Onshape) through rapid prototyping cycles",
            "Created a web-based simulator and YouTube channel to visualize and share autonomous algorithms",
        ],
        media: [
            {
                type: "image",
                src: robot_1,
                caption: "Build iteration of 2024-25 season at provincials",
            },
            {
                type: "image",
                src: robot_2,
                caption: "Build iteration of 2024-25 season",
            },
            {
                type: "image",
                src: robot_3,
                caption: "Build iteration of 2024-25 season at provincials",
            },
            {
                type: "image",
                src: robot_4,
                caption: "Build iteration of 2023-24 season at Mecha Mayhem",
            },
            {
                type: "image",
                src: robot_5,
                caption: "Build iteration of 2024-25 season",
            },
            {
                type: "image",
                src: robot_6,
                caption: "Build iteration of 2023-24 season",
            },
        ],
    },
    {
        title: "Robotics Coach",
        company: "Western Mechatronics",
        period: "September 2024 — February 2025",
        desc: "Coached 20+ teams across Calgary in robot design, C++ programming, and competition strategy — teaching not just the technicals, but the engineering mindset behind excellent design.",
    },
    {
        title: "Executive — Math & Robotics Clubs",
        company: "Sir Winston Churchill High School",
        period: "June 2024 — June 2025",
        desc: "Co-led two school clubs, each with ~80 members with weekly sessions.",
        bullets: [
            "Ran weekly Math Club sessions with contest prep and problem-solving activities, helping members compete in the CCC, Euclid, and AMC.",
            "Managed team registration, fundraising events, and technical mentorship for robotics teams competing in regional tournaments.",
        ],
    },
    {
        title: "Deputy Returning Officer",
        company: "Elections Canada — Calgary Skyview",
        period: "April 2025",
        desc: "Managed a federal election polling station end-to-end — processing over 1,000 ballots with strict adherence to ballot secrecy protocol, multi-source voter verification, and chain-of-custody procedures throughout the count.",
    },
];

export function Experience() {
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
            <div className="experience-wrapper">
                <div className="experience-area">
                    {experiences.map((exp, index) => (
                        <FadeIn
                            key={index}
                            delay={`${index * 0.2}s`}
                            className="experience-row"
                        >
                            <div className="content-col">
                                <div className="role-title">{exp.title}</div>
                                <div className="company-name">
                                    {exp.company}
                                </div>
                                <div className="date-col">{exp.period}</div>
                                <p className="description">{exp.desc}</p>

                                {exp.bullets && exp.bullets.length > 0 && (
                                    <ul className="description-bullets">
                                        {exp.bullets.map((b, i) => (
                                            <li key={i}>{b}</li>
                                        ))}
                                    </ul>
                                )}

                                {exp.media && exp.media.length > 0 && (
                                    <GalleryRow
                                        media={exp.media}
                                        onOpen={(idx) =>
                                            openLightbox(
                                                exp.media!,
                                                idx,
                                                exp.company,
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
