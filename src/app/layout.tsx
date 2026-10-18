import type { Metadata, Viewport } from "next";

import { Libre_Baskerville } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { DotCanvas } from "@/components/DotCanvas";

import "./globals.css";
import "./theme-transition.css";

const libreBaskerville = Libre_Baskerville({
    subsets: ["latin"],
    weight: ["400", "700"],
    variable: "--font-serif",
});

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
};

const description = "Hao Yan";

// Link previews (Discord, X, iMessage, Slack, LinkedIn). The card image
// comes from opengraph-image.png and twitter-image.png beside this file;
// metadataBase turns their paths into the absolute URLs crawlers need.
export const metadata: Metadata = {
    metadataBase: new URL("https://haoyan.ca"),
    title: "Hao Yan",
    description,
    alternates: { canonical: "/" },
    openGraph: {
        type: "website",
        url: "/",
        siteName: "Hao Yan",
        title: "Hao Yan",
        description,
        locale: "en_US",
    },
    twitter: {
        card: "summary_large_image",
        title: "Hao Yan",
        description,
        creator: "@darksorceror_",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){var t='dark';try{t=localStorage.getItem('theme')||t;}catch(e){}document.documentElement.setAttribute('data-theme',t);})();`,
                    }}
                />
            </head>
            <body className={`${libreBaskerville.variable} antialiased`}>
                <Analytics />
                <DotCanvas />
                {children}
            </body>
        </html>
    );
}
