"use client";

import { trackLinkClick } from "../hooks/session";

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
            className="link"
            onClick={() => trackLinkClick(label, href)}
        >
            {children}
        </a>
    );
}
