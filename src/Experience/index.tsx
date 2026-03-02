import { useEffect, useRef, useState } from "react";

import { GalleryRow } from "../components/Gallery";
import { Lightbox } from "../components/Lightbox";
import FadeIn from "../components/Fade Effect";

import type { ExperienceItem, MediaItem } from "../types";

import i1 from "../media/1.jpg";
import i2 from "../media/2.jpg";
import i3 from "../media/3.jpg";
import i4 from "../media/4.jpg";
import i5 from "../media/5.jpg";
import i6 from "../media/6.jpg";
import i7 from "../media/7.jpg";
import i8 from "../media/8.png";

import "./index.css";

const experiences: ExperienceItem[] = [
    {
        title: "AI/ML Engineer",
        company: "McMaster EcoCAR EV Challenge",
        period: "November 2025 — Present",
        desc: "Designing the diagnostic and control architecture for a competition-grade automated EV — working across simulation, perception, and vehicle networking layers.",
        bullets: [
            "Built and validated MATLAB/Simulink models for a connected automated vehicle stack, benchmarking 0–60 acceleration, 60–0 stopping distance, and HWFET/UDDS/US06 drive-cycle efficiency against the target LYRIQ platform.",
            "Engineered a SAE/ISO-compliant onboard diagnostic (OBD) system, implementing DTC services $01, $03, $04, $09, and $0A per J1979 and ISO 14229-1 (UDS) standards using CAN pack/unpack/receive/send blocks from MATLAB's Vehicle Network Toolbox.",
            "Tuning the EV 2EM powertrain controller and electric motor plant model in Simulink by migrating LYRIQ-specific data dictionaries and adapting motor characteristics for accurate vehicle dynamics simulation.",
            "Developing perception and control modules including YOLO-based object detection, lane-keeping algorithms, and low-pass torque filtering to smooth commands at constant accelerator pedal positions.",
        ],
    },
    {
        title: "Embedded Software Engineer",
        company: "McMaster Exoskeleton",
        period: "October 2025 — Present",
        desc: "Built the real-time embedded firmware stack for a wearable exoskeleton from the ground up — from register-level sensor drivers to a distributed CAN bus network.",
        bullets: [
            "Achieved stable 500 Hz IMU sampling on the LSM6DS3TR-C 6-axis sensor by implementing DMA-based I2C transfers with Block Data Update (BDU) and optimizing the APB1/PLL clock tree on the STM32 Nucleo-F446RE.",
            "Designed and commissioned a multi-node CAN bus network linking STM32 Nucleo boards, IMU modules, and a Raspberry Pi 5 for distributed real-time control with transceiver wiring.",
            "Developed Python UART telemetry scripts for live sensor readout and timing diagnostics, used to identify and resolve clock bottlenecks before CAN integration.",
        ],
        media: [
            {
                type: "image",
                src: i7,
                caption: "Caption",
            },
            {
                type: "image",
                src: i8,
                caption: "Caption",
            },
        ],
    },
    {
        title: "Lead Software & Mechanical Engineer",
        company: "VEX Robotics Team 3388N Nova",
        period: "September 2022 — June 2025",
        desc: "Co-led all software and mechanical design over three seasons, placing 6th among 200 teams at Canada's largest VEX robotics tournament.",
        bullets: [
            "Developed a full autonomous navigation stack in C/C++: 1D/2D PID control, velocity profiling, pure pursuit path tracking, and Monte Carlo localization using wheel odometry.",
            "Built a concurrent real-time control system with mutex-protected task scheduling, handling motor burnout recovery, operator input filtering, and safe interaction with field elements under competition conditions.",
            "Designed and iterated mechanical subsystems in Onshape CAD through prototyping cycles documented in a formal engineering notebook.",
            "Created a web-based motion algorithm simulator and YouTube channel to visualize and share autonomous routines.",
        ],
        media: [
            {
                type: "image",
                src: i1,
                caption: "Caption",
            },
            {
                type: "image",
                src: i2,
                caption: "Caption",
            },
            {
                type: "image",
                src: i3,
                caption: "Caption",
            },
            {
                type: "image",
                src: i4,
                caption: "Caption",
            },
            {
                type: "image",
                src: i5,
                caption: "Caption",
            },
            {
                type: "image",
                src: i6,
                caption: "Caption",
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
                isOpen={lightboxOpen}
                media={activeMedia}
                initialIndex={activeIndex}
                contextTitle={activeTitle}
                onClose={() => setLightboxOpen(false)}
            />
        </>
    );
}
