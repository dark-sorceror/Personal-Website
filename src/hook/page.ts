import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { visitorSession, type SessionEvent } from "./session";

export function usePageTracking() {
    const location = useLocation();
    const firedRef = useRef(false);
    const enteredAt = useRef(Date.now());

    useEffect(() => {
        const now = Date.now();
        const prev = [...visitorSession.events]
            .reverse()
            .find(
                (e): e is Extract<SessionEvent, { type: "page" }> =>
                    e.type === "page",
            );

        if (prev && !prev.engaged) {
            prev.engaged = now - prev.enteredAt >= 10_000;
        }

        if (prev?.path === location.pathname) {
            enteredAt.current = now;

            return;
        }

        visitorSession.events.push({
            type: "page",
            path: location.pathname,
            enteredAt: now,
            engaged: false,
        });

        enteredAt.current = now;
    }, [location.pathname]);

    useEffect(() => {
        const patch = (final: boolean) => {
            if (firedRef.current) return;
            if (final) firedRef.current = true;

            const { messageId, webhookUrl, embedPayload, events } =
                visitorSession;

            if (!messageId || !webhookUrl || !embedPayload) return;
            if (events.length === 0) return;

            const last = [...events]
                .reverse()
                .find(
                    (e): e is Extract<SessionEvent, { type: "page" }> =>
                        e.type === "page",
                );
            if (last && !last.engaged) {
                last.engaged = Date.now() - last.enteredAt >= 10_000;
            }

            const lines = events.map((e) => {
                if (e.type === "page") {
                    return e.engaged ? `${e.path} (20s+)` : e.path;
                } else {
                    return `-> ${e.label}`;
                }
            });

            const value = lines.join("\n");

            const patched = JSON.parse(JSON.stringify(embedPayload)) as {
                embeds: Array<{
                    fields: Array<{
                        name: string;
                        value: string;
                        inline: boolean;
                    }>;
                }>;
            };

            const fields = patched.embeds[0].fields;
            const idx = fields.findIndex((f) => f.name === "📊 Session");

            fields[idx].value = `\`\`\`${value}\`\`\``;

            const parts = webhookUrl.replace(/\?.*$/, "").split("/");
            const token = parts.pop();
            const webhookId = parts.pop();
            const editUrl = `https://discord.com/api/webhooks/${webhookId}/${token}/messages/${messageId}`;

            fetch(editUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ embeds: patched.embeds }),
                keepalive: true,
            }).catch(() => {});
        };

        const onBeforeUnload = () => {
            patch(true);

            setTimeout(() => {
                firedRef.current = false;
            }, 500);
        };

        window.addEventListener("beforeunload", onBeforeUnload);
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") patch(false);
        });

        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, []);
}
