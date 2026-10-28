"use client";

import { useEffect } from "react";
import { visitorSession } from "@/lib/session";
import { takeVia } from "@/lib/via";

// The visit counter Worker, set for the deploy. In development the dev
// server (history:dev) passes /__visits/ on to it, so it's the page's own
// origin, from localhost or a phone on the LAN alike.
function visitEndpoint() {
    if (process.env.NEXT_PUBLIC_VISIT_ENDPOINT)
        return process.env.NEXT_PUBLIC_VISIT_ENDPOINT;
    if (process.env.NODE_ENV === "development")
        return `${location.origin}/__visits`;

    return null;
}

// Reads the shared link's tag and takes it off the address bar
function readVia() {
    const { via, href } = takeVia(window.location.href);

    // Next wraps replaceState in an effect that runs after this one. Going
    // through its wrapper tells the router about the new address, where the
    // bare one would leave it to put the tag back on its next render.
    if (via !== null)
        setTimeout(() => window.history.replaceState(null, "", href));

    return via;
}

// A random id this browser keeps, so someone who comes back is one visitor
// on many visits. There's nothing else in it.
const VISITOR_KEY = "haoyan.visitor";

function visitorId() {
    try {
        let id = localStorage.getItem(VISITOR_KEY);

        if (!id) {
            // randomUUID needs a secure context, which a plain-http address
            // on the local network isn't
            id = crypto.randomUUID
                ? crypto.randomUUID()
                : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
                      b.toString(16).padStart(2, "0"),
                  ).join("");
            localStorage.setItem(VISITOR_KEY, id);
        }

        return id;
    } catch {
        return null;
    }
}

// The Worker reads the location and device from the request itself
async function logVisit(endpoint: string, via: string | null) {
    try {
        const res = await fetch(`${endpoint}/visit`, {
            method: "POST",
            // As text it's a simple request, with no CORS preflight
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
                entry: window.location.pathname || "/",
                referrer: document.referrer,
                language: navigator.language,
                via,
                visitor: visitorId(),
            }),
        });

        if (res.ok) {
            const { id, token } = await res.json();

            visitorSession.visit = { endpoint, id, token };
        }
    } catch (err) {
        console.error("[useVisitorLog] visit failed:", err);
    }
}

// React runs effects twice in development; this keeps it to one visit
let logged = false;

export function useVisitorLog() {
    useEffect(() => {
        if (logged) return;
        logged = true;

        // Taken off on every load, even one that isn't counted
        const via = readVia();

        // Development logs every load, so a reload is a new visit to test
        if (process.env.NODE_ENV !== "development") {
            // Storage access throws when site data is blocked; an uncaught
            // throw here would take the whole page down with it
            try {
                if (sessionStorage.getItem("__visited")) return;

                sessionStorage.setItem("__visited", "1");
            } catch {
                return;
            }
        }

        const endpoint = visitEndpoint();
        if (endpoint) logVisit(endpoint, via);
    }, []);
}
