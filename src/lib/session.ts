export type SessionEvent =
    | {
          type: "page";
          path: string;
          // Time the page was actually showing: a tab left in the background
          // doesn't count. since is when the current stretch on it began.
          ms: number;
          since: number | null;
      }
    | { type: "click"; label: string; href: string; timestamp: number }
    | {
          type: "gallery";
          topic: string;
          title: string;
          // The photos looked at, each once
          seen: string[];
          total: number;
      };

interface VisitorSessionState {
    // The visit as the Worker counted it, with the token to update it
    visit: { endpoint: string; id: number; token: string } | null;
    events: SessionEvent[];
}

export const visitorSession: VisitorSessionState = {
    visit: null,
    events: [],
};

type Page = Extract<SessionEvent, { type: "page" }>;

function currentPage() {
    return visitorSession.events.findLast((e): e is Page => e.type === "page");
}

// Stops the clock on the current page, as the tab hides or the page changes
export function pausePage(now: number) {
    const page = currentPage();
    if (!page || page.since === null) return;

    page.ms += now - page.since;
    page.since = null;
}

export function resumePage(now: number) {
    const page = currentPage();
    if (page && page.since === null) page.since = now;
}

// A new page starts its own clock; the same one again, as on a re-render,
// carries on
export function enterPage(path: string, now: number, showing: boolean) {
    if (currentPage()?.path === path) return;

    pausePage(now);
    visitorSession.events.push({
        type: "page",
        path,
        ms: 0,
        since: showing ? now : null,
    });
}

function pageTime(page: Page, now: number) {
    return page.ms + (page.since === null ? 0 : now - page.since);
}

// The visit so far, step by step, for the Worker to keep and show
export function sessionSteps(now: number) {
    return visitorSession.events.map((e) => {
        if (e.type === "page")
            return {
                type: e.type,
                path: e.path,
                ms: Math.round(pageTime(e, now)),
            };

        if (e.type === "gallery")
            return {
                type: e.type,
                topic: e.topic,
                title: e.title,
                seen: e.seen.length,
                total: e.total,
            };

        return { type: e.type, label: e.label };
    });
}

export function trackLinkClick(label: string, href: string) {
    visitorSession.events.push({
        type: "click",
        label,
        href,
        timestamp: Date.now(),
    });
}

// One step per gallery, where it was first opened, then how much of it was
// seen. Paging back and forth, or holding an arrow key, only fills it in.
export function trackGalleryView(
    topic: string,
    title: string,
    label: string,
    total: number,
) {
    const gallery = visitorSession.events.find(
        (e): e is Extract<SessionEvent, { type: "gallery" }> =>
            e.type === "gallery" && e.topic === topic,
    );

    if (!gallery) {
        visitorSession.events.push({
            type: "gallery",
            topic,
            title,
            seen: [label],
            total,
        });
        return;
    }

    if (!gallery.seen.includes(label)) gallery.seen.push(label);
}
