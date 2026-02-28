import { useEffect } from "react";
import { visitorSession } from "./session";

const WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL as string;

async function getGeo() {
    try {
        const d = await (await fetch("https://ipapi.co/json/")).json();

        return {
            ip: (d.ip ?? "unknown") as string,
            city: (d.city ?? "?") as string,
            region: (d.region ?? "?") as string,
            country: (d.country_name ?? "?") as string,
            org: (d.org ?? "?") as string,
            tz: (d.timezone ?? "?") as string,
        };
    } catch {
        return {
            ip: "unknown",
            city: "?",
            region: "?",
            country: "?",
            org: "?",
            tz: "?",
        };
    }
}

function parseUA() {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";

    if (/Edg\//.test(ua))
        browser = `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1] ?? ""}`;
    else if (/OPR\//.test(ua))
        browser = `Opera ${ua.match(/OPR\/([\d.]+)/)?.[1] ?? ""}`;
    else if (/Chrome\//.test(ua) && !/Chromium\//.test(ua))
        browser = `Chrome ${ua.match(/Chrome\/([\d]+)/)?.[1] ?? ""}`;
    else if (/Firefox\//.test(ua))
        browser = `Firefox ${ua.match(/Firefox\/([\d]+)/)?.[1] ?? ""}`;
    else if (/Safari\//.test(ua) && !/Chrome\//.test(ua))
        browser = `Safari ${ua.match(/Version\/([\d.]+)/)?.[1] ?? ""}`;
    else if (/MSIE |Trident\//.test(ua)) browser = "Internet Explorer";

    let os = "Unknown OS";

    if (/iPhone/.test(ua)) {
        const v = ua.match(/iPhone OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "";
        os = `iOS ${v} (iPhone)`;
    } else if (/iPad/.test(ua)) {
        const v = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "";
        os = `iPadOS ${v}`;
    } else if (/Android/.test(ua)) {
        const v = ua.match(/Android ([\d.]+)/)?.[1] ?? "";
        const model =
            ua.match(/Android [\d.]+;\s*([^)]+)\)/)?.[1]?.trim() ?? "";
        os = `Android ${v}${model ? ` · ${model}` : ""}`;
    } else if (/Windows NT 10.0/.test(ua)) os = "Windows 10/11";
    else if (/Windows NT/.test(ua)) os = "Windows (older)";
    else if (/Mac OS X/.test(ua)) {
        const v = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "";
        os = `macOS ${v}`;
    } else if (/CrOS/.test(ua)) os = "ChromeOS";
    else if (/Linux/.test(ua)) os = "Linux";

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    const deviceType = /iPad/.test(ua)
        ? "Tablet"
        : isMobile
          ? "Mobile"
          : "Desktop";

    return { browser, os, deviceType };
}

function localTime(tz: string): string {
    try {
        return new Date().toLocaleString("en-US", {
            timeZone: tz,
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return "?";
    }
}

function formatOrg(org: string): string {
    const m = org.match(/^(AS\d+)\s+(.+)$/);

    return m ? `${m[2]} (${m[1]})` : org;
}

export function useVisitorLog() {
    useEffect(() => {
        if (sessionStorage.getItem("__visited")) return;

        sessionStorage.setItem("__visited", "1");

        if (!WEBHOOK_URL) return;

        (async () => {
            const geo = await getGeo();
            const { browser, os, deviceType } = parseUA();
            const isp = formatOrg(geo.org);
            const visitorTime = localTime(geo.tz);
            const referrer = document.referrer || "Direct / None";
            const page = window.location.pathname || "/";

            let referrerDisplay = "Direct";

            try {
                if (referrer !== "Direct / None")
                    referrerDisplay = `[${new URL(referrer).hostname}](${referrer})`;
            } catch {}

            const color = 0x393a41;

            const embed = {
                title: "Visitor",
                color,
                fields: [
                    {
                        name: "📍 Location",
                        value: `${geo.city}, ${geo.region}\n${geo.country}\n\`${visitorTime}\``,
                        inline: true,
                    },
                    {
                        name: "🌐 Network",
                        value:
                            deviceType === "Desktop"
                                ? `\`${geo.ip}\`\n${isp}`
                                : isp,
                        inline: true,
                    },
                    {
                        name: "🖥 Device",
                        value: `${browser}\n${os}`,
                        inline: true,
                    },
                    {
                        name: "🌍 Language",
                        value: `\`${navigator.language}\``,
                        inline: true,
                    },
                    { name: "📄 Entry", value: `\`${page}\``, inline: true },
                    {
                        name: "🔗 Referrer",
                        value: referrerDisplay,
                        inline: true,
                    },
                    {
                        name: "📊 Session",
                        value: "```Tracking (has not left website yet)...```",
                        inline: false,
                    },
                ],
                footer: { text: "haoyan.ca analytics" },
                timestamp: new Date().toISOString(),
            };

            const payload = {
                username: "haoyan.ca",
                avatar_url:
                    "https://avatars.githubusercontent.com/u/dark-sorceror",
                embeds: [embed],
            };

            try {
                const res = await fetch(`${WEBHOOK_URL}?wait=true`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    const msg = await res.json();
                    visitorSession.messageId = msg.id;
                    visitorSession.webhookUrl = WEBHOOK_URL;
                    visitorSession.embedPayload = payload;
                }
            } catch (err) {
                console.error("[useVisitorLog] webhook failed:", err);
            }
        })();
    }, []);
}
