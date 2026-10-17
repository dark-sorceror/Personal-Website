export type SessionEvent =
    | { type: "page"; path: string; enteredAt: number; engaged: boolean }
    | { type: "click"; label: string; href: string; timestamp: number }
    | { type: "photo"; topic: string; label: string; timestamp: number };

interface VisitorSessionState {
    messageId: string | null;
    webhookUrl: string | null;
    embedPayload: object | null;
    events: SessionEvent[];
}

export const visitorSession: VisitorSessionState = {
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

// Each photo once per visit: paging back and forth, or holding an arrow
// key, would otherwise log the same views over and over
export function trackLightboxView(topic: string, label: string) {
    const seen = visitorSession.events.some(
        (e) => e.type === "photo" && e.topic === topic && e.label === label,
    );
    if (seen) return;

    visitorSession.events.push({
        type: "photo",
        topic,
        label,
        timestamp: Date.now(),
    });
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
