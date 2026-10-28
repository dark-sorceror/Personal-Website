"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
    enterPage,
    pausePage,
    resumePage,
    sessionSteps,
    visitorSession,
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

            const { visit } = visitorSession;
            // Nowhere to send it until the visit itself has been logged
            if (!visit) return;

            // The Worker edits the message. A beacon outlives the page, and
            // as text it needs no CORS preflight.
            navigator.sendBeacon(
                `${visit.endpoint}/visit/${visit.id}/session`,
                JSON.stringify({
                    token: visit.token,
                    steps: sessionSteps(Date.now()),
                }),
            );
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
