"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { sessionField, visitorSession, type SessionEvent } from "@/lib/session";

export function usePageTracking() {
    const pathname = usePathname();
    const firedRef = useRef(false);

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

        if (prev?.path === pathname) return;

        visitorSession.events.push({
            type: "page",
            path: pathname,
            enteredAt: now,
            engaged: false,
        });
    }, [pathname]);

    useEffect(() => {
        const patch = (final: boolean) => {
            if (firedRef.current) return;
            if (final) firedRef.current = true;

            const { visit, messageId, webhookUrl, embedPayload, events } =
                visitorSession;
            // Nowhere to send it until the visit itself has been logged
            if (!visit && !messageId) return;
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

            const lines = events.map((e: SessionEvent) => {
                if (e.type === "page")
                    return e.engaged ? `; ${e.path} (20s+)` : `; ${e.path}`;

                if (e.type === "photo")
                    return `[ Viewed ${e.topic}: ${e.label} ]`;

                return `[ Visited ${e.label} ]`;
            });

            // The Worker edits the message itself. A beacon outlives the
            // page, and as text it needs no CORS preflight.
            if (visit) {
                navigator.sendBeacon(
                    `${visit.endpoint}/visit/${visit.id}/session`,
                    JSON.stringify({
                        token: visit.token,
                        session: sessionField(lines),
                    }),
                );
                return;
            }
            if (!messageId || !webhookUrl || !embedPayload) return;

            const patched = structuredClone(embedPayload) as {
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

            fields[idx].value = sessionField(lines);

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

        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") patch(false);
        };

        window.addEventListener("beforeunload", onBeforeUnload);
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
            document.removeEventListener(
                "visibilitychange",
                onVisibilityChange,
            );
        };
    }, []);
}
