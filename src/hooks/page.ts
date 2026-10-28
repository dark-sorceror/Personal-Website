"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
    enterPage,
    formatDuration,
    openedGalleries,
    pausePage,
    resumePage,
    sessionField,
    sessionLines,
    visitorSession,
    visitPages,
    visitTime,
} from "@/lib/session";

export function usePageTracking() {
    const pathname = usePathname();
    const firedRef = useRef(false);

    useEffect(() => {
        enterPage(pathname, Date.now(), document.visibilityState === "visible");
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

            const now = Date.now();
            const lines = sessionLines(now);
            const time = visitTime(now);

            // The Worker edits the message itself. A beacon outlives the
            // page, and as text it needs no CORS preflight.
            if (visit) {
                navigator.sendBeacon(
                    `${visit.endpoint}/visit/${visit.id}/session`,
                    JSON.stringify({
                        token: visit.token,
                        session: sessionField(lines),
                        galleries: openedGalleries(),
                        duration: time,
                        pages: visitPages(now),
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

            fields[idx].name = `📊 Session · ${formatDuration(time)}`;
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
            pausePage(Date.now());
            patch(true);
            // Still here: the leave was called off
            setTimeout(() => {
                firedRef.current = false;
                if (document.visibilityState === "visible")
                    resumePage(Date.now());
            }, 500);
        };

        // The clock only runs while the page is showing
        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                pausePage(Date.now());
                patch(false);
            } else {
                resumePage(Date.now());
            }
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
