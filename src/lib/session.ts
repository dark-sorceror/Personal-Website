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
          timestamp: number;
      };

interface VisitorSessionState {
    // The visit as the Worker counted it, with the token to update it
    visit: { endpoint: string; id: number; token: string } | null;
    messageId: string | null;
    webhookUrl: string | null;
    embedPayload: object | null;
    events: SessionEvent[];
}

export const visitorSession: VisitorSessionState = {
    visit: null,
    messageId: null,
    webhookUrl: null,
    embedPayload: null,
    events: [],
};

type Page = Extract<SessionEvent, { type: "page" }>;

function currentPage() {
    return [...visitorSession.events]
        .reverse()
        .find((e): e is Page => e.type === "page");
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

// "42s", "3m 5s", "1h 12m"
export function formatDuration(ms: number) {
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;

    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

// Each page with its time, for the Worker to count
export function visitPages(now: number) {
    return visitorSession.events.flatMap((e) =>
        e.type === "page"
            ? [{ path: e.path, ms: Math.round(pageTime(e, now)) }]
            : [],
    );
}

export function visitTime(now: number) {
    return visitPages(now).reduce((sum, page) => sum + page.ms, 0);
}

// The session, a line per step, for the field in the Discord post
export function sessionLines(now: number) {
    return visitorSession.events.map((e) => {
        if (e.type === "page")
            return `; ${e.path}  (${formatDuration(pageTime(e, now))})`;

        if (e.type === "gallery")
            return `[ Opened ${e.title} gallery · ${e.seen.length}/${e.total} ]`;

        return `[ Visited ${e.label} ]`;
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

// One line per gallery: when it was first opened, then how much of it was
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
            timestamp: Date.now(),
        });
        return;
    }

    if (!gallery.seen.includes(label)) gallery.seen.push(label);
}

// The galleries opened this visit, for the Worker to count
export function openedGalleries() {
    return visitorSession.events.flatMap((e) =>
        e.type === "gallery" ? [e.topic] : [],
    );
}

// Discord rejects embed fields over 1024 characters, and a rejected patch
// leaves the message stuck as it was. Keep the newest lines that fit.
const FIELD_LIMIT = 1024;

export function sessionField(lines: string[]) {
    const wrap = (body: string) => `\`\`\`ini\n${body}\`\`\``;
    const kept = [...lines];

    while (kept.length && wrap(kept.join("\n")).length > FIELD_LIMIT) {
        kept.shift();
        const dropped = lines.length - kept.length;
        // Room for the note about what was cut
        const note = `; … ${dropped} earlier`;
        if (wrap([note, ...kept].join("\n")).length <= FIELD_LIMIT) {
            return wrap([note, ...kept].join("\n"));
        }
    }

    return wrap(kept.join("\n"));
}
