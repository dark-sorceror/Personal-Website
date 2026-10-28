import { describe, expect, it } from "vitest";

import { buildEmbed, FIELD_LIMIT, visitorTitle, type Visit } from "./embed";

const visit: Visit = {
    id: 1234,
    created_at: "2026-10-27T08:00:00.000Z",
    country: "CA",
    region: "Ontario",
    city: "Toronto",
    timezone: "America/Toronto",
    asn: 812,
    org: "Rogers Communications Canada Inc.",
    ip_hash: null,
    device: "Desktop",
    browser: "Chrome 141",
    os: "macOS 10.15.7",
    language: "en-CA",
    entry: "/",
    referrer: "https://github.com/dark-sorceror",
    referrer_host: "github.com",
    via: null,
    message_id: null,
    edit_token: "token",
    session: null,
    updated_at: "2026-10-27T08:00:00.000Z",
};

const field = (embed: ReturnType<typeof buildEmbed>, name: string) =>
    embed.fields.find((f) => f.name === name)?.value;

describe("visitorTitle", () => {
    it("numbers visitors with US thousands separators", () => {
        expect(visitorTitle(1, false)).toBe("Visitor #1");
        expect(visitorTitle(1234, false)).toBe("Visitor #1,234");
        expect(visitorTitle(1234567, false)).toBe("Visitor #1,234,567");
    });

    it("marks visits from development", () => {
        expect(visitorTitle(1234, true)).toBe("[dev] Visitor #1,234");
    });
});

describe("buildEmbed", () => {
    it("keeps the fields the browser used to send", () => {
        const embed = buildEmbed(visit, "203.0.113.7", false);

        expect(embed.title).toBe("Visitor #1,234");
        expect(embed.fields.map((f) => f.name)).toEqual([
            "📍 Location",
            "🌐 Network",
            "🖥 Device",
            "🌍 Language",
            "📄 Entry",
            "🔗 Referrer",
            "📊 Session",
        ]);
        expect(field(embed, "📍 Location")).toBe(
            "Toronto, Ontario\nCanada\n`Tue 04:00 AM`",
        );
        expect(field(embed, "🖥 Device")).toBe("Chrome 141\nmacOS 10.15.7");
        expect(field(embed, "🔗 Referrer")).toBe(
            "[github.com](https://github.com/dark-sorceror)",
        );
        expect(field(embed, "📊 Session")).toContain("has not left");
        expect(embed.timestamp).toBe(visit.created_at);
    });

    it("marks development visits by title, colour and footer", () => {
        const live = buildEmbed(visit, null, false);
        const dev = buildEmbed(visit, null, true);

        expect(live.footer.text).toBe("haoyan.ca analytics");
        expect(dev.title).toBe("[dev] Visitor #1,234");
        expect(dev.color).not.toBe(live.color);
        expect(dev.footer.text).toBe("haoyan.ca analytics · dev");
    });

    it("shows the IP on desktops only", () => {
        const desktop = buildEmbed(visit, "203.0.113.7", false);
        const phone = buildEmbed(
            { ...visit, device: "Mobile" },
            "203.0.113.7",
            false,
        );

        expect(field(desktop, "🌐 Network")).toBe(
            "`203.0.113.7`\nRogers Communications Canada Inc. (AS812)",
        );
        expect(field(phone, "🌐 Network")).toBe(
            "Rogers Communications Canada Inc. (AS812)",
        );
    });

    it("fills in what the request didn't say", () => {
        const embed = buildEmbed(
            {
                ...visit,
                country: null,
                region: null,
                city: null,
                timezone: null,
                asn: null,
                org: null,
                referrer: null,
                referrer_host: null,
            },
            null,
            false,
        );

        expect(field(embed, "📍 Location")).toBe("?, ?\n?\n`?`");
        expect(field(embed, "🌐 Network")).toBe("`unknown`\n?");
        expect(field(embed, "🔗 Referrer")).toBe("Direct");
    });

    it("tags and colours a visit from a shared link", () => {
        const plain = buildEmbed(visit, null, false);
        const tagged = buildEmbed({ ...visit, via: "linkedin" }, null, false);

        expect(field(plain, "🎯 Link")).toBeUndefined();
        expect(field(tagged, "🎯 Link")).toBe("`linkedin`");
        expect(tagged.color).not.toBe(plain.color);
        // Before the session, which spans the whole width
        expect(tagged.fields.at(-1)?.name).toBe("📊 Session");
    });

    it("keeps dev's marks on a tagged dev visit", () => {
        const dev = buildEmbed({ ...visit, via: "linkedin" }, null, true);

        expect(dev.title).toBe("[dev] Visitor #1,234");
        expect(dev.color).toBe(buildEmbed(visit, null, true).color);
        expect(dev.color).not.toBe(
            buildEmbed({ ...visit, via: "linkedin" }, null, false).color,
        );
        expect(field(dev, "🎯 Link")).toBe("`linkedin`");
    });

    it("shows the latest session", () => {
        const session = "```ini\n; /\n[ Visited GitHub ]```";
        const embed = buildEmbed({ ...visit, session }, null, false);

        expect(field(embed, "📊 Session")).toBe(session);
    });

    it("keeps every field under Discord's limit", () => {
        const long = "x".repeat(5000);
        const embed = buildEmbed(
            { ...visit, entry: `/${long}`, session: long },
            null,
            false,
        );

        for (const f of embed.fields) {
            expect(f.value.length).toBeLessThanOrEqual(FIELD_LIMIT);
        }
        expect(field(embed, "📄 Entry")).toMatch(/^`\/x+…$/);
    });
});
