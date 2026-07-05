import type { Metadata, Viewport } from "next";

import { Inter, Libre_Baskerville } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { DotCanvas } from "@/components/DotCanvas";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["200", "300"] });
const libreBaskerville = Libre_Baskerville({
    subsets: ["latin"],
    weight: ["400", "700"],
    variable: "--font-serif",
});

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    title: "Hao Yan",
    description:
        "Hao Yan — Software Engineer — TraceRoot.AI (YC S25) · McMaster University",
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
                        __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();`,
                    }}
                />
            </head>
            <body
                className={`${inter.className} ${libreBaskerville.variable} antialiased`}
            >
                <Analytics />
                <DotCanvas />
                {children}
            </body>
        </html>
    );
}
