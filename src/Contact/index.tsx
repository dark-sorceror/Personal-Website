import { trackLinkClick } from "../hook/session";

import FadeIn from "../components/Fade Effect";

import type { ContactLink } from "../types";

import "./index.css";
import { CalendarDays } from "lucide-react";

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
            stroke="grey"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const links: ContactLink[] = [
    {
        label: "Email",
        value: "haoyan160@gmail.com",
        href: "mailto:haoyan160@gmail.com",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="18"
                viewBox="52 42 88 66"
            >
                <path
                    fill="#4285f4"
                    d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6"
                />
                <path
                    fill="#34a853"
                    d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15"
                />
                <path
                    fill="#fbbc04"
                    d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2"
                />
                <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
                <path
                    fill="#c5221f"
                    d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2"
                />
            </svg>
        ),
    },
    {
        label: "LinkedIn",
        value: "hao-yan-212921274",
        href: "https://www.linkedin.com/in/hao-yan-212921274/",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="18"
                viewBox="0 0 72 72"
            >
                <g fill="none" fillRule="evenodd">
                    <path
                        d="M8,72 L64,72 C68.42,72 72,68.42 72,64 L72,8 C72,3.58 68.42,0 64,0 L8,0 C3.58,0 0,3.58 0,8 L0,64 C0,68.42 3.58,72 8,72 Z"
                        fill="#007EBB"
                    />
                    <path
                        d="M62,62 L51.32,62 L51.32,43.8 C51.32,38.81 49.42,36.02 45.47,36.02 C41.17,36.02 38.93,38.93 38.93,43.8 L38.93,62 L28.63,62 L28.63,27.33 L38.93,27.33 L38.93,32 C38.93,32 42.03,26.27 49.38,26.27 C56.74,26.27 62,30.76 62,40.05 L62,62 Z M16.35,22.79 C12.84,22.79 10,19.93 10,16.4 C10,12.86 12.84,10 16.35,10 C19.86,10 22.7,12.86 22.7,16.4 C22.7,19.93 19.86,22.79 16.35,22.79 Z M11.03,62 L21.77,62 L21.77,27.33 L11.03,27.33 L11.03,62 Z"
                        fill="#FFF"
                    />
                </g>
            </svg>
        ),
    },
    {
        label: "GitHub",
        value: "dark-sorceror",
        href: "https://github.com/dark-sorceror",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 1024 1024"
                fill="none"
            >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
                    transform="scale(64)"
                    fill="currentColor"
                />
            </svg>
        ),
    },
    {
        label: "X / Twitter",
        value: "@darksorceror_",
        href: "https://x.com/darksorceror_",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="16"
                viewBox="0 0 300 272"
            >
                <path
                    fill="currentColor"
                    d="m236 0h46l-101 115 118 156h-92.6l-72.5-94.8-83 94.8h-46l107-123-113-148h94.9l65.5 86.6zm-16.1 244h25.5l-165-218h-27.4z"
                />
            </svg>
        ),
    },
    {
        label: "Cal",
        value: "Book a meeting with me",
        href: "https://cal.com/hao-yan",
        icon: (
            <CalendarDays strokeWidth={1.5} />
        ),
    },
];

export function Contact() {
    return (
        <div className="contact-wrapper">
            <div className="contact-area">
                <FadeIn delay="0.2s">
                    <div className="contact-heading">Get in touch</div>
                </FadeIn>

                <FadeIn delay="0.4s">
                    <p className="contact-sub">
                        Whether it's a role, a project, or just a conversation —
                        I'm always open. Best reached by email.
                    </p>
                </FadeIn>

                <div className="contact-links">
                    {links.map((link, i) => (
                        <FadeIn key={link.label} delay={`${0.4 + i * 0.2}s`}>
                            <a
                                className="contact-row"
                                href={link.href}
                                target={
                                    link.href.startsWith("mailto")
                                        ? undefined
                                        : "_blank"
                                }
                                rel="noopener noreferrer"
                                onClick={() => {
                                    trackLinkClick(link.label, link.href);
                                }}
                            >
                                <span className="contact-icon">
                                    {link.icon}
                                </span>
                                <span className="contact-meta">
                                    <span className="contact-label">
                                        {link.label}
                                    </span>
                                    <span className="contact-value">
                                        {link.value}
                                    </span>
                                </span>
                                <ArrowUpRight />
                            </a>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </div>
    );
}
