"use client";

import { trackLinkClick } from "../hooks/session";

export const linkClassName =
    "text-(--link-color) font-medium underline decoration-[3px] underline-offset-[6px] decoration-(--link-color)/40 transition-[text-decoration-color] duration-300 hover:decoration-(--link-color)";

export function InlineLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    const isExternal = href.startsWith("http");
    const label = typeof children === "string" ? children : href;

    return (
        <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className={linkClassName}
            onClick={() => trackLinkClick(label, href)}
        >
            {children}
        </a>
    );
}
