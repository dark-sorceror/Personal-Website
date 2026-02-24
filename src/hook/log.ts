import { useEffect } from "react";

const WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL as string;

async function getGeo(): Promise<{
    city: string;
    region: string;
    country: string;
    ip: string;
}> {
    try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        return {
            ip: data.ip ?? "unknown",
            city: data.city ?? "?",
            region: data.region ?? "?",
            country: data.country_name ?? "?",
        };
    } catch {
        return { ip: "unknown", city: "?", region: "?", country: "?" };
    }
}

export function useVisitorLog() {
    useEffect(() => {
        if (sessionStorage.getItem("__visited")) return;

        sessionStorage.setItem("__visited", "1");

        if (!WEBHOOK_URL) {
            console.warn(
                "[useVisitorLog] VITE_DISCORD_WEBHOOK_URL is not set.",
            );

            return;
        }

        (async () => {
            const geo = await getGeo();
            const now = new Date();
            const timestamp = now.toISOString();

            const referrer = document.referrer
                ? document.referrer
                : "Direct / unknown";

            const page = window.location.pathname || "/";

            const payload = {
                username: "haoyan.ca",
                avatar_url:
                    "https://avatars.githubusercontent.com/u/dark-sorceror",
                embeds: [
                    {
                        title: "New Visitor",
                        color: 0x1a56db,
                        fields: [
                            {
                                name: "📍 Location",
                                value: `${geo.city}, ${geo.region} — ${geo.country}`,
                                inline: true,
                            },
                            {
                                name: "🌐 IP",
                                value: `\`${geo.ip}\``,
                                inline: true,
                            },
                            {
                                name: "📄 Page",
                                value: `\`${page}\``,
                                inline: true,
                            },
                            {
                                name: "🔗 Referrer",
                                value: referrer,
                                inline: false,
                            },
                            {
                                name: "🖥️ User Agent",
                                value: `\`\`\`${navigator.userAgent}\`\`\``,
                                inline: false,
                            },
                        ],
                        footer: { text: "haoyan.ca visitor log" },
                        timestamp,
                    },
                ],
            };

            try {
                await fetch(WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } catch (err) {
                console.error("[useVisitorLog] webhook failed:", err);
            }
        })();
    }, []);
}
