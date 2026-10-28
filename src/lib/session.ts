export type SessionEvent =
    | { type: "page"; path: string; enteredAt: number; engaged: boolean }
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
