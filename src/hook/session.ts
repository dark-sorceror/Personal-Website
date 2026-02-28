export type SessionEvent =
    | { type: "page"; path: string; enteredAt: number; engaged: boolean }
    | { type: "click"; label: string; href: string; timestamp: number };

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
