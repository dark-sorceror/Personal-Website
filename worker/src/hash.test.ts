import { describe, expect, it } from "vitest";

import { hashIp } from "./hash";

const IP = "203.0.113.7";
const morning = new Date("2026-10-27T08:00:00Z");
const evening = new Date("2026-10-27T23:59:00Z");
const nextDay = new Date("2026-10-28T00:01:00Z");

describe("hashIp", () => {
    it("is the SHA-256 of the IP, the UTC date and the salt", async () => {
        expect(await hashIp(IP, "pepper", morning)).toBe(
            "96748239267f1f3dabed5c580bad1b482af470ce5cae478b9fffe3431a430ed9",
        );
    });

    it("stays the same all day, so a visitor counts once a day", async () => {
        expect(await hashIp(IP, "pepper", evening)).toBe(
            await hashIp(IP, "pepper", morning),
        );
    });

    it("changes the next day, and with another salt", async () => {
        const today = await hashIp(IP, "pepper", morning);

        expect(await hashIp(IP, "pepper", nextDay)).not.toBe(today);
        expect(await hashIp(IP, "salt", morning)).not.toBe(today);
    });
});
