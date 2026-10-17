"use client";

import { linkClassName } from "@/components/linkStyle";
import { trackLinkClick } from "@/lib/session";

// A link that opens off-site pages in a new tab and logs the click. Styled
// as the site's underlined link unless given a class of its own.
export function InlineLink({
    href,
    className = linkClassName,
    children,
}: {
    href: string;
    className?: string;
    children: React.ReactNode;
}) {
    const isExternal = href.startsWith("http");
    const label = typeof children === "string" ? children : href;

    return (
        <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className={className}
            onClick={() => trackLinkClick(label, href)}
        >
            {children}
        </a>
    );
}
