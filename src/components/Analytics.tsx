"use client";

import { useVisitorLog } from "@/hooks/log";
import { usePageTracking } from "@/hooks/page";

export function Analytics() {
    useVisitorLog();
    usePageTracking();

    return null;
}
